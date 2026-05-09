import Appointment from "../models/appointmentModel.js";
import Doctor from "../models/doctorModel.js";
import { sendAppointmentConfirmationEmail } from '../utils/sendEmail.js';
import dotenv from "dotenv";
import Stripe from "stripe";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";

dotenv.config();

// ================= CONFIG =================
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;
const MAJOR_ADMIN_ID = process.env.MAJOR_ADMIN_ID;

if (!STRIPE_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: "2024-06-20",
});

// ================= HELPERS =================
const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const escapeRegex = (text = "") => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveClerkUserId = (req) => {
  try {
    return req.auth?.userId || getAuth(req)?.userId || null;
  } catch {
    return null;
  }
};

// ================= GET ALL APPOINTMENTS =================
export const getAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      mobile,
      status,
      search = "",
      limit: limitRaw = 50,
      page: pageRaw = 1,
      createdBy,
    } = req.query;

    const limit = Math.min(200, Math.max(1, parseInt(limitRaw) || 2000));
    const page = Math.max(1, parseInt(pageRaw) || 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (doctorId) filter.doctorId = doctorId;
    if (mobile) filter.mobile = mobile;
    if (status) filter.status = status;
    if (createdBy) filter.createdBy = createdBy;

    if (search.trim()) {
      const re = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ patientName: re }, { mobile: re }, { notes: re }];
    }

    const [items, total] = await Promise.all([
      Appointment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("doctorId", "name specialization imageUrl")
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      appointments: items,
      meta: {
        page,
        limit,
        total,
        count: items.length,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET APPOINTMENT BY ID

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if ID is missing or the string "undefined"
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Appointment ID is required" });
    }

    // 2. Validate if the string is a proper MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const appointment = await Appointment.findById(id)
      .populate("doctor")
      .populate("patient");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    // This now only runs for actual server failures (e.g., Database connection lost)
    console.error("Database Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ================= GET BY PATIENT =================
export const getAppointmentByPatient = async (req, res) => {
  try {
    const userId = resolveClerkUserId(req);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const appointments = await Appointment.find({ createdBy: userId })
      .sort({ date: 1, time: 1 })
      .lean();

    return res.json({ success: true, appointments });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    return res.status(500).json({ success: false });
  }
};

// ================= CREATE =================
export const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      patientName,
      mobile,
      age,
      gender,
      date,
      time,
      fees,
      paymentMethod,
      notes = "",
      email,
    } = req.body;

    const userId = resolveClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Login required" });
    }

    // 1. Basic Validation
    if (!doctorId || !patientName || !mobile || !date || !time) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // 2. Fetch Doctor Details
    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const numericFee = safeNumber(fees ?? 0);
    const ownerId = doctor.owner || MAJOR_ADMIN_ID || userId;

    // 3. Duplicate Slot Check (Pre-flight)
    const slotExists = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $ne: "Cancelled" }
    });

    if (slotExists) {
      return res.status(409).json({
        success: false,
        message: "This time slot has already been booked. Please select another."
      });
    }

    // 4. Base Data for Metadata & Cash Booking
    const baseData = {
      doctorId: String(doctorId),
      doctorName: String(doctor.name),
      speciality: String(doctor.specialization || ""),
      patientName: String(patientName).trim(),
      mobile: String(mobile).trim(),
      age: String(age || ""),
      gender: String(gender || "Other"),
      date: String(date),
      time: String(time),
      fees: String(numericFee),
      notes: String(notes || "").substring(0, 400),
      email: String(email || ""),
      createdBy: String(userId),
      owner: String(ownerId),
    };

    // ================= CASE A: CASH / FREE =================
    if (numericFee === 0 || paymentMethod === "Cash") {
      const created = await Appointment.create({
        ...baseData,
        age: age ? Number(age) : null,
        fees: numericFee,
        date: new Date(date),
        status: "Confirmed",
        payment: {
          method: paymentMethod,
          status: numericFee === 0 ? "Paid" : "Pending",
          amount: numericFee,
        },
      });

      // Send confirmation email (non-blocking)
      sendAppointmentConfirmationEmail({
        to: email,
        patientName,
        doctorName: doctor.name,
        speciality: doctor.specialization || "",
        date,
        time,
        fees: numericFee,
        appointmentId: created._id,
      }).catch(err => console.error("Appointment email failed:", err));

      return res.status(201).json({
        success: true,
        appointment: created,
        message: "Appointment booked successfully (Cash/Free)"
      });
    }

    // ================= CASE B: ONLINE PAYMENT (STRIPE) =================
    if (!stripe) {
      return res.status(500).json({ success: false, message: "Payment gateway not configured" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `${doctor.name} - Appointment`,
              description: `Date: ${date} | Time: ${time}`,
            },
            unit_amount: Math.round(numericFee * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
      metadata: baseData,
    });

    // Email for online payment is handled in confirmPayment after Stripe confirms
    return res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error("Create appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your booking."
    });
  }
};

// ================= CONFIRM PAYMENT =================
export const confirmPayment = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res
        .status(400)
        .json({ success: false, message: "Session ID is required" });
    }

    // 1. Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // 2. Verify payment success
    const isPaid =
      session?.payment_status === "paid" || session?.status === "complete";

    if (!session || !isPaid) {
      return res.status(400).json({
        success: false,
        message: "Payment not verified or incomplete",
      });
    }

    // 3. Prevent duplicate creation (Idempotency)
    const alreadyCreated = await Appointment.findOne({
      "payment.sessionId": session_id,
    });
    if (alreadyCreated) {
      return res.json({ success: true, appointment: alreadyCreated });
    }

    // 4. Extract data from metadata
    const data = session.metadata;

    // 5. Create the Appointment record
    const newAppointment = await Appointment.create({
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      patientName: data.patientName,
      mobile: data.mobile,
      age: data.age ? Number(data.age) : null,
      gender: data.gender,
      date: data.date,
      time: data.time,
      fees: Number(data.fees),
      notes: data.notes,
      createdBy: data.createdBy,
      owner: data.owner,
      email: data.email,        // ← added
      status: "Confirmed",
      sessionId: session_id,
      paidAt: new Date(),
      payment: {
        method: "Online",
        status: "Paid",
        amount: Number(data.fees),
      },
    });

    console.log("Doctor Appointment created after payment:", newAppointment._id);

    // 6. Send confirmation email (non-blocking)
    sendAppointmentConfirmationEmail({
      to: data.email,
      patientName: data.patientName,
      doctorName: data.doctorName,
      speciality: data.speciality,
      date: data.date,
      time: data.time,
      fees: data.fees,
      appointmentId: newAppointment._id,
    }).catch(err => console.error("Appointment email failed:", err));

    return res.json({
      success: true,
      appointment: newAppointment,
    });
  } catch (error) {
    console.error("confirmPayment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during confirmation",
      error: error.message,
    });
  }
};

// ================= UPDATE =================
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const appt = await Appointment.findById(id);
    if (!appt) {
      return res.status(404).json({ success: false });
    }

    if (["Completed", "Cancelled"].includes(appt.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify completed/cancelled appointment",
      });
    }

    const update = {};
    if (body.status) update.status = body.status;
    if (body.notes !== undefined) update.notes = body.notes;

    if (body.date && body.time) {
      update.date = body.date;
      update.time = body.time;
      update.status = "Rescheduled";
    }

    const updated = await Appointment.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    return res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ success: false });
  }
};

// ================= CANCEL =================
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await Appointment.findByIdAndUpdate(
      id,
      { status: "Cancelled" },
      { new: true }
    );

    if (!appt) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.json({
      success: true,
      appointment: appt,
    });
  } catch (error) {
    console.error("Cancel error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= STATS =================
export const getStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const [total, paidAgg, recent] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.aggregate([
        { $match: { "payment.status": "Paid" } },
        { $group: { _id: null, total: { $sum: "$fees" } } },
      ]),
      Appointment.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    return res.json({
      success: true,
      stats: {
        total,
        revenue: paidAgg[0]?.total || 0,
        recentLast7days: recent,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return res.status(500).json({ success: false });
  }
};

// ================= DOCTOR APPOINTMENTS =================
export const getAppointmentByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const { search = "", page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { doctorId };

    if (search.trim()) {
      const re = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ patientName: re }, { mobile: re }];
    }

    const [items, total] = await Promise.all([
      Appointment.find(filter)
        .sort({ date: 1, time: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      appointments: items,
      total,
    });
  } catch (error) {
    console.error("Doctor appointments error:", error);
    return res.status(500).json({ success: false });
  }
};

// ================= USER COUNT =================
let cachedCount = null;
let lastFetch = 0;

export const getRegisteredUserCount = async (req, res) => {
  try {
    const now = Date.now();

    if (cachedCount && now - lastFetch < 60000) {
      return res.json({ success: true, totalUsers: cachedCount });
    }

    const totalUsers = await clerkClient.users.getCount();

    cachedCount = totalUsers;
    lastFetch = now;

    return res.json({ success: true, totalUsers });
  } catch (error) {
    console.error("User count error:", error);
    return res.status(500).json({ success: false });
  }
};

export default {
  getAppointment,
  getAppointmentByPatient,
  createAppointment,
  confirmPayment,
  updateAppointment,
  cancelAppointment,
  getStats,
  getAppointmentByDoctor,
  getRegisteredUserCount,
  getAppointmentById,
};
