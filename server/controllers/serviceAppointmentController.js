import ServiceAppointment from "../models/serviceAppointmet.js";
import Service from "../models/serviceModel.js";
import Stripe from "stripe";
import { getAuth } from "@clerk/express";

const stripeKey = process.env.STRIPE_SECRET_KEY || null;
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2024-06-20" })
  : null;

// Helper function
const safeNumber = (val) => {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const t = timeStr.trim();
  const m = t.match(/([0-9]{1,2}):?([0-9]{0,2})\s*(AM|PM|am|pm)?/);
  if (!m) return null;

  let hh = parseInt(m[1], 10);
  let mm = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = (m[3] || "").toUpperCase();

  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  if (ampm) {
    if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
    return { hour: hh, minute: mm, ampm };
  }

  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  if (hh === 0) return { hour: 12, minute: mm, ampm: "AM" };
  if (hh === 12) return { hour: 12, minute: mm, ampm: "PM" };
  if (hh > 12) return { hour: hh - 12, minute: mm, ampm: "PM" };

  return { hour: hh, minute: mm, ampm: "AM" };
}

const buildFrontendBase = (req) => {
  const env = process.env.FRONTEND_URL;
  if (env) return env.replace(/\/$/, "");
  const origin = req.get("origin") || req.get("referer") || null;
  return origin ? origin.replace(/\/$/, "") : null;
};

function resolveClerkUserId(req) {
  try {
    const auth = req.auth || {};
    const candidate =
      auth?.userId || auth?.user_id || auth?.user?.id || req.user?.id || null;

    if (candidate) return candidate;

    try {
      const serverAuth = getAuth ? getAuth(req) : null;
      return serverAuth?.userId || null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

// Create service appointment
export const createServiceAppointmet = async (req, res) => {
  try {
    const body = req.body || {};
    const clerkUserId = resolveClerkUserId(req);

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      serviceId,
      serviceName: serviceNameFromBody,
      patientName,
      mobile,
      age,
      gender,
      date,
      time,
      hour,
      minute,
      ampm,
      paymentMethod = "Online",
      amount: amountFromBody,
      fees: feesFromBody,
      email,
      notes = "",
    } = body;

    // ---------------- VALIDATION ----------------
    if (!serviceId || !patientName || !mobile || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const numericAmount = safeNumber(amountFromBody ?? feesFromBody);

    if (numericAmount === null) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing amount",
      });
    }

    // ---------------- TIME PARSING ----------------
    let finalHour = hour !== undefined ? safeNumber(hour) : null;
    let finalMinute = minute !== undefined ? safeNumber(minute) : null;
    let finalAmpm = ampm || null;

    if (time && finalHour === null) {
      const parsed = parseTimeString(time);
      if (parsed) {
        finalHour = parsed.hour;
        finalMinute = parsed.minute;
        finalAmpm = parsed.ampm;
      }
    }

    // ---------------- TIME VALIDATION ----------------
    if (finalHour === null || finalMinute === null || !finalAmpm) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing time",
      });
    }

    // ---------------- DUPLICATE SLOT CHECK ----------------
    const existing = await ServiceAppointment.findOne({
      serviceId,
      date,
      hour: Number(finalHour),
      minute: Number(finalMinute),
      ampm: finalAmpm,
      status: { $ne: "Cancelled" },
    }).lean();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Slot already booked",
      });
    }

    // ---------------- NORMALIZE PAYMENT METHOD ----------------
    const normalizedPaymentMethod = String(paymentMethod).toLowerCase();

    // ---------------- BASE DATA ----------------
    const baseData = {
      serviceId: String(serviceId),
      serviceName: String(serviceNameFromBody || "Service"),
      patientName: String(patientName).trim(),
      mobile: String(mobile).trim(),
      age: String(age || ""),
      gender: String(gender || ""),
      date: String(date),

      hour: String(finalHour),
      minute: String(finalMinute),
      ampm: String(finalAmpm),

      fees: String(numericAmount),
      clerkUserId: String(clerkUserId),
      notes: String(notes).substring(0, 400),
    };

    // ---------------- CASE A: CASH / FREE ----------------
    if (numericAmount === 0 || normalizedPaymentMethod === "cash") {
      const created = await ServiceAppointment.create({
        ...baseData,
        age: age ? Number(age) : undefined,
        hour: Number(finalHour),
        minute: Number(finalMinute),
        fees: numericAmount,
        status: "Pending",
        payment: {
          method: paymentMethod,
          status: "Pending",
          amount: numericAmount,
        },
      });

      return res.status(201).json({
        success: true,
        appointment: created,
      });
    }

    // ---------------- CASE B: STRIPE ----------------
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Service: ${baseData.serviceName}`,
            },
            unit_amount: Math.round(numericAmount * 100),
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/service-appointment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,

      // ---------------- SAFE METADATA ----------------
      metadata: {
        serviceId: baseData.serviceId,
        serviceName: baseData.serviceName,
        patientName: baseData.patientName,
        mobile: baseData.mobile,
        age: baseData.age,
        gender: baseData.gender,
        date: baseData.date,

        hour: baseData.hour,
        minute: baseData.minute,
        ampm: baseData.ampm,

        fees: baseData.fees,
        clerkUserId: baseData.clerkUserId,
        notes: baseData.notes,
      },
    });

    return res.status(200).json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (err) {
    console.error("createServiceAppointmet error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET BOOKING BY SESSION ID (for success page)
export const getBookingBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // ✅ Match Schema: Search the nested path
    const booking = await ServiceAppointment.findOne({ "payment.sessionId": sessionId });

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found. If you just paid, please refresh in a few seconds." 
      });
    }

    return res.json({ success: true, data: booking });
  } catch (err) {
    console.error("getBookingBySessionId error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

//Confirm Service PAyment
export const confirmPayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ success: false, message: "Session ID is required" });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const isPaid = session?.payment_status === "paid" || session?.status === "complete";

    if (!session || !isPaid) {
      return res.status(400).json({ success: false, message: "Payment not verified" });
    }

    // ✅ Match Schema: Look for sessionId inside payment object
    const alreadyCreated = await ServiceAppointment.findOne({ "payment.sessionId": session_id });
    if (alreadyCreated) {
      return res.json({ success: true, data: alreadyCreated });
    }

    const data = session.metadata;

    const newAppointment = await ServiceAppointment.create({
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      patientName: data.patientName,
      mobile: data.mobile,
      age: data.age ? Number(data.age) : null,
      gender: data.gender,
      date: data.date,
      hour: Number(data.hour),
      minute: Number(data.minute),
      ampm: data.ampm,
      fees: Number(data.fees),
      notes: data.notes || "",
      createdBy: data.clerkUserId, // Ensure this matches your schema field name
      status: "Confirmed",
      
      // ✅ Match Schema Structure
      payment: {
        method: "Online",
        status: "Paid",
        amount: Number(data.fees),
        sessionId: session_id, // Nested correctly
        paidAt: new Date(),
      },
    });

    return res.json({ success: true, data: newAppointment });
  } catch (error) {
    console.error("confirmPayment Error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// to getSterviceAppointments
const escapeRegex = (text = "") => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getServiceAppointments = async (req, res) => {
  try {
    const {
      serviceId,
      mobile,
      status,
      page: pageRaw = 1,
      limit: limitRaw = 50,
      search = "",
    } = req.query;

    const limit = Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50));
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const skip = (page - 1) * limit;

    const filter = {};

    if (serviceId) filter.serviceId = serviceId;
    if (mobile) filter.mobile = mobile;
    if (status) filter.status = status;

    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ patientName: re }, { mobile: re }, { notes: re }];
    }

    const appointments = await ServiceAppointment.find(filter)
      .populate("serviceId", "name image imageUrl imageSmall")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ServiceAppointment.countDocuments(filter);

    return res.json({
      success: true,
      appointments,
      meta: {
        page,
        limit,
        total,
        count: appointments.length,
      },
    });
  } catch (error) {
    console.error("getServiceAppointments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

//to getServiceAppointmentsById =
export const getServiceAppointmentsById = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await ServiceAppointment.findById(id).lean();

    if (!appt) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }
    return res.json({
      success: true,
      data: appt,
    });
  } catch (error) {
    console.error("Error in get serviceAppointment by Id", error);
    return res.json({
      success: false,
      message: "Server Error",
    });
  }
};

// to update an appointment
export const updateServiceAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const updates = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;

    // safer payment update
    if (body.payment !== undefined) {
      updates.payment = { ...body.payment };
    }

    if (body["payment.status"] !== undefined) {
      updates["payment.status"] = body["payment.status"];
    }
    if (body.rescheduledTo) {
      const { date, time } = body.rescheduledTo || {};
      updates.rescheduledTo = {};

      if (date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return res.status(400).json({
            success: false,
            message: "rescheduledTo.date must be YYYY-MM-DD",
          });
        }
        updates.rescheduledTo.date = date;
        updates.date = date;
      }

      if (time) {
        const parsed = parseTimeString(String(time));
        if (!parsed) {
          return res.status(400).json({
            success: false,
            message: "rescheduledTo.time couldn't be parsed",
          });
        }

        updates.rescheduledTo.time = String(time);
        updates.hour = parsed.hour;
        updates.minute = parsed.minute;
        updates.ampm = parsed.ampm;

        updates.time = `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")} ${parsed.ampm}`;
      }

      if (!body.status) updates.status = "Rescheduled";
    }
    if (updates.payment) {
      const method = updates.payment.method;

      if (method && String(method).toLowerCase() === "online") {
        updates.status = updates.status || "Confirmed";
      }

      if (updates.payment.status === "Paid") {
        updates.status = "Confirmed";

        if (!updates.payment.paidAt) {
          updates.payment.paidAt = new Date();
        }
      }
    }

    const updated = await ServiceAppointment.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }
    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error while updating service Appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

//to cancel the service appointment
export const cancelServiceAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await ServiceAppointment.findById(id);
    if (!appt) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }
    if (appt.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed appointment",
      });
    }

    if (appt.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment already cancelled",
      });
    }
    appt.status = "Cancelled";
    if (appt.payment) {
      if (appt.payment.status === "Paid") {
        appt.payment.status = "Refunded";
      } else {
        appt.payment.status = "Pending";
      }
    }

    await appt.save();

    return res.json({
      success: true,
      data: appt,
    });
  } catch (error) {
    console.error("Error while canceling the appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// to get the stats
export const getServiceAppointmentStats = async (req, res) => {
  try {
    const services = await Service.aggregate([
      {
        $lookup: {
          from: "serviceappointments", // ensure this matches your DB collection
          localField: "_id",
          foreignField: "serviceId",
          as: "appointments",
        },
      },
      {
        $addFields: {
          totalAppointments: { $size: "$appointments" },

          completed: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "a",
                cond: { $eq: ["$$a.status", "Completed"] },
              },
            },
          },

          cancelled: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "a",
                cond: { $eq: ["$$a.status", "Cancelled"] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          earning: {
            $multiply: [
              "$price",
              {
                $size: {
                  $filter: {
                    input: "$appointments",
                    as: "a",
                    cond: { $eq: ["$$a.status", "Completed"] },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          image: "$imageUrl",
          totalAppointments: 1,
          completed: 1,
          cancelled: 1,
          earning: 1,
        },
      },
      {
        $sort: { totalAppointments: -1 }, // safer sorting
      },
    ]);

    return res.json({
      success: true,
      services,
      totalServices: services.length,
    });
  } catch (error) {
    console.error("Error while getting the stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

//to get appointment for the paitent
export const getServiceAppointmentsByPatient = async (req, res) => {
  try {
    const clerkUserId = resolveClerkUserId(req);
    const { createdBy, mobile } = req.query;

    const resolvedCreatedBy = createdBy || clerkUserId || null;

    if (!resolvedCreatedBy && !mobile) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const filter = {};

    if (resolvedCreatedBy) {
      filter.createdBy = resolvedCreatedBy;
    }

    if (mobile) {
      filter.mobile = mobile;
    }

    const list = await ServiceAppointment.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error while get appointment by patient:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export default {
  createServiceAppointmet,
  confirmPayment,
  getServiceAppointments,
  getServiceAppointmentsById,
  updateServiceAppointment,
  cancelServiceAppointment,
  getServiceAppointmentStats,
  getServiceAppointmentsByPatient,
  getBookingBySessionId,
};
