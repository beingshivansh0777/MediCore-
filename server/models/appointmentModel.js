import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
    },
    createdBy: {
      type: String,
      default: null,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid mobile number"],
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    doctorName: {
      type: String,
      default: "",
    },
    speciality: {
      type: String,
      default: "",
    },
    doctorImage: {
      url: { type: String },
      publicId: { type: String },
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    fees: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled", "Rescheduled"],
      default: "Pending",
    },
    rescheduledTo: {
      date: { type: Date },
      time: { type: String },
    },
    payment: {
      method: {
        type: String,
        enum: ["Cash", "Online"],
        required: true,
      },
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        required: true,
      },
      amount: {
        type: Number,
        min: 0,
        required: true,
      },
      providerId: {
        type: String,
        default: "",
      },
      meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    email : {
      type : String,
      default : ""
    }
  },
  {
    timestamps: true,
  },
);
appointmentSchema.index({ doctorId: 1, date: 1, time: 1, createdBy: 1 }, { unique: true });

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);

export default Appointment;
