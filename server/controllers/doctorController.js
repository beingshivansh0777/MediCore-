import Doctor from "../models/doctorModel.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//helper fn.
const parseTimeToMinutes = (t = "") => {
  const [time = "0:00", ampm = ""] = (t || "").split(" ");
  const [hh = 0, mm = 0] = time.split(":").map(Number);
  let h = hh % 12;
  if ((ampm || "").toUpperCase() === "PM") h += 12;
  return h * 60 + (mm || 0);
};

function dedupeAndSortSchedule(schedule = {}) {
  const out = {};
  Object.entries(schedule).forEach(([date, slots]) => {
    if (!Array.isArray(slots)) return;
    const uniq = Array.from(new Set(slots));
    uniq.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
    out[date] = uniq;
  });
  return out;
}

const parseScheduleInput = (s) => {
  if (!s) return {};

  if (typeof s === "string") {
    try {
      s = JSON.parse(s);
    } catch {
      return {};
    }
  }

  return dedupeAndSortSchedule(s);
};

function normalizeDocForClient(raw = {}) {
  const doc = { ...raw };

  // convert Mongoose Map to plain object
  if (doc.schedule && typeof doc.schedule.forEach === "function") {
    const obj = {};
    doc.schedule.forEach((val, key) => {
      obj[key] = Array.isArray(val) ? val : [];
    });
    doc.schedule = obj;
  } else if (!doc.schedule || typeof doc.schedule !== "object") {
    doc.schedule = {};
  }

  doc.availability =
    doc.availability === undefined ? "Available" : doc.availability;
  doc.patients = doc.patients ?? "";
  doc.rating = doc.rating ?? 0;
  doc.fee = doc.fee ?? doc.fees ?? 0;

  return doc;
}

//Create a doctor profile
export async function createDoctor(req, res) {
  try {
    const body = req.body || {};
    if (!body.email || !body.password || !body.name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }
    const emailLC = (body.email || "").toLowerCase();
    if (await Doctor.findOne({ email: emailLC })) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }
    let imageUrl = body.imageUrl || null;
    let imagePublicId = body.imagePublicId || null;
    if (req.file?.path) {
      try {
        const upload = await uploadToCloudinary(req.file.path, "Doctor");
        imageUrl = upload?.secure_url;
        imagePublicId = upload?.public_id;
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }
    }
    const schedule = parseScheduleInput(body.schedule);

    // hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const doc = new Doctor({
      email: emailLC,
      password: hashedPassword,
      name: body.name,
      specialization: body.specialization || "",
      imageUrl,
      imagePublicId,
      availability: body.availability || "Available",
      experience: body.experience || "",
      qualifications: body.qualifications || "",
      location: body.location || "",
      about: body.about || "",
      fee: body.fee !== undefined && !isNaN(body.fee) ? Number(body.fee) : 0,
      schedule,
      success: body.success || "",
      patients: body.patients || "",
      rating:
        body.rating !== undefined && !isNaN(body.rating)
          ? Number(body.rating)
          : 0,
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn("JWT Secret is not found");
      return res.status(500).json({
        success: false,
        message: "Server misconfigured",
      });
    }

    await doc.save();
    const token = jwt.sign(
      {
        id: doc._id.toString(),
        email: doc.email,
        role: "doctor",
      },
      secret,
      { expiresIn: "7d" },
    );
    const out = normalizeDocForClient(doc.toObject());
    delete out.password;

    return res.status(201).json({
      success: true,
      data: out,
      token,
    });
  } catch (error) {
    console.error("Error in createDoctor:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating doctor profile",
    });
  }
}

// to get all doctors
export const getDoctors = async (req, res) => {
  try {
    const { q = "", limit: limitRaw = 200, page: pageRaw = 1 } = req.query;
    const limit = Math.min(500, Math.max(1, parseInt(limitRaw, 10) || 200));
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const skip = (page - 1) * limit;

    const match = {};
    if (q && typeof q === "string" && q.trim()) {
      const re = new RegExp(q.trim(), "i");
      match.$or = [
        { name: re },
        { specialization: re },
        { speciality: re },
        { email: re },
      ];
    }

    const docs = await Doctor.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "appointments",
          let: { doctorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$doctorId", "$$doctorId"] },
              },
            },
            {
              $project: { status: 1, fee: 1 },
            },
          ],
          as: "appointments",
        },
      },
      {
        $addFields: {
          appointmentsTotal: { $size: "$appointments" },
          appointmentsCompleted: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "a",
                cond: { $in: ["$$a.status", ["Confirmed", "Completed"]] },
              },
            },
          },
          appointmentsCanceled: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "a",
                cond: { $eq: ["$$a.status", "Canceled"] },
              },
            },
          },
          earnings: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$appointments",
                    as: "a",
                    cond: { $in: ["$$a.status", ["Confirmed", "Completed"]] },
                  },
                },
                as: "p",
                in: { $ifNull: ["$$p.fee", 0] },
              },
            },
          },
        },
      },
      { $project: { appointments: 0 } },
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const normalized = docs.map((d) => ({
      _id: d._id,
      id: d._id,
      name: d.name || "",
      specialization: d.specialization || d.speciality || "",
      fee: d.fee ?? d.fees ?? d.consultationFee ?? 0,
      imageUrl: d.imageUrl || d.image || d.avatar || null,
      appointmentsTotal: d.appointmentsTotal || 0,
      appointmentsCompleted: d.appointmentsCompleted || 0,
      appointmentsCanceled: d.appointmentsCanceled || 0,
      earnings: d.earnings || 0,
      availability: d.availability ?? "Available",
      schedule: d.schedule && typeof d.schedule === "object" ? d.schedule : {},
      patients: d.patients ?? "",
      rating: d.rating ?? 0,
      about: d.about ?? "",
      experience: d.experience ?? "",
      qualifications: d.qualifications ?? "",
      location: d.location ?? "",
      success: d.success ?? "",
    }));

    const total = await Doctor.countDocuments(match);
    return res.json({
      success: true,
      data: normalized,
      meta: { page, limit, total },
    });
  } catch (err) {
    console.error("getDoctors:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while getting all the doctors!",
    });
  }
};

// to get doctor by id to fetch one doctor
export async function getDoctorById(req, res) {
  try {
    const { id } = req.params;
    const doc = await Doctor.findById(id).select("-password").lean();
    if (!doc)
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });

    return res.json({
      success: true,
      data: normalizeDocForClient(doc),
    });
  } catch (error) {
    console.error("getDoctorById:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching doctor",
    });
  }
}

// to update a doctor
export async function updateDoctor(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!req.doctor || String(req.doctor._id) !== String(id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this profile.",
      });
    }

    const existing = await Doctor.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          "Doctor profile not found. It may have been removed or does not exist.",
      });
    }

    // Image upload
    if (req.file?.path) {
      try {
        const uploaded = await uploadToCloudinary(req.file.path, "doctors");
        if (uploaded) {
          const previousPublicId = existing.imagePublicId;

          existing.imageUrl =
            uploaded.secure_url || uploaded.url || existing.imageUrl;
          existing.imagePublicId =
            uploaded.public_id || uploaded.publicId || existing.imagePublicId;

          if (previousPublicId && previousPublicId !== existing.imagePublicId) {
            deleteFromCloudinary(previousPublicId).catch((e) =>
              console.warn("deleteFromCloudinary warning:", e?.message || e),
            );
          }
        }
      } catch (error) {
        console.error("Image upload failed. Please try again later:", error);
      }
    } else if (body.imageUrl) {
      existing.imageUrl = body.imageUrl;
    }

    // Schedule
    if (body.schedule) {
      existing.schedule = parseScheduleInput(body.schedule);
    }

    // Fields update
    const updatable = [
      "name",
      "specialization",
      "experience",
      "qualifications",
      "location",
      "about",
      "fee",
      "availability",
      "success",
      "patients",
      "rating",
    ];

    updatable.forEach((k) => {
      if (body[k] !== undefined) {
        if (k === "fee" || k === "rating") {
          existing[k] = isNaN(body[k]) ? existing[k] : Number(body[k]);
        } else {
          existing[k] = body[k];
        }
      }
    });

    // Email update
    if (body.email) {
      const newEmail = body.email.toLowerCase();
      if (newEmail !== existing.email) {
        const other = await Doctor.findOne({ email: newEmail });
        if (other && other._id.toString() !== id) {
          return res.status(409).json({
            success: false,
            message: "This Email  already exist.Please use a different email",
          });
        }
        existing.email = newEmail;
      }
    }

    // Password update (hashed)
    if (body.password) {
      existing.password = await bcrypt.hash(body.password, 10);
    }

    await existing.save();

    const out = normalizeDocForClient(existing.toObject());
    delete out.password;

    return res.json({
      success: true,
      message: "Doctor profile update successfully!",
      data: out,
    });
  } catch (err) {
    console.error("updateDoctor error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while update the doctor details!",
    });
  }
}

// to delete a doctor
export async function deleteDoctor(req, res) {
  try {
    const { id } = req.params;
    const existing = await Doctor.findById(id);
    if (!existing)
      return res.status(404).json({
        success: false,
        message: "Doctor not found!",
      });

    if (existing.imagePublicId) {
      try {
        await deleteFromCloudinary(existing.imagePublicId);
      } catch (e) {
        console.warn(
          "Warning : Picture delete from cloudinary",
          e?.message || e,
        );
      }
    }
    await Doctor.findByIdAndDelete(id);
    return res.json({
      success: true,
      message: "Doctor profile deleted successfully!",
    });
  } catch (error) {
    console.error("Error while deleting doctor profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting the doctor profile",
    });
  }
}

// to toggle Availabilty
export async function toggleAvailability(req, res) {
  try {
    const { id } = req.params;

    // ✅ Authorization check
    if (!req.doctor || String(req.doctor._id) !== String(id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update doctor availability.",
      });
    }

    // ✅ Fetch doctor
    const doc = await Doctor.findById(id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // ✅ Toggle logic
    doc.availability =
      doc.availability === "Available" ? "Unavailable" : "Available";

    await doc.save();

    const out = normalizeDocForClient(doc.toObject());
    delete out.password;

    return res.json({
      success: true,
      message: "Availability updated successfully",
      data: out,
    });
  } catch (error) {
    console.error("toggleAvailability error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

//toLogin the doctor
export async function doctorLogin(req, res) {
  try {
    const { email, password } = req.body || {};

    console.log("===== DOCTOR LOGIN ATTEMPT =====");
    console.log("Request Body:", req.body);
    console.log("Email:", email);
    console.log("Password Received:", password ? "YES" : "NO");

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find doctor
    const doc = await Doctor.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    console.log("Doctor Found:", doc ? "YES" : "NO");

    if (!doc) {
      console.log("Doctor not found in database");

      return res.status(401).json({
        success: false,
        message: "Doctor account not found.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, doc.password);

    console.log("Password Match:", isMatch);

    if (!isMatch) {
      console.log("Incorrect password entered");

      return res.status(401).json({
        success: false,
        message: "Password is incorrect.",
      });
    }

    // JWT Secret check
    const secret = process.env.JWT_SECRET;
    console.log("JWT Secret Exists:", !!secret);
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "JWT secret not configured on server.",
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: doc._id.toString(),
        email: doc.email,
        role: "doctor",
      },
      secret,
      { expiresIn: "7d" },
    );

    // Remove password
    const out = doc.toObject();
    delete out.password;

    console.log("Doctor login successful");
    console.log("Doctor ID:", doc._id.toString());

    return res.json({
      success: true,
      token,
      data: out,
    });
  } catch (error) {
    console.error("Doctor Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
