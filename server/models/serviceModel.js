import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    about: {
      type: String,
      default: "",
    },
    shortDescription: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    available: {
      type: Boolean,
      default: true,
      index: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    dates: {
      type: [String],
      default: [],
    },
    slots: {
      type: Map,
      of: [
        {
          time: String,
          isBooked: { type: Boolean, default: false },
        },
      ],
      default: {},
    },
    instructions: {
      type: [String],
      default: [],
    },
    totalAppointments: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Number,
      default: 0,
    },
    canceled: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

serviceSchema.index({ name: "text", shortDescription: "text" });

const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);

export default Service;
