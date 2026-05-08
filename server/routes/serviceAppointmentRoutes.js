import express from "express";
import { clerkMiddleware } from "@clerk/express";

import {
  cancelServiceAppointment,
  createServiceAppointmet,
  getServiceAppointments,
  getServiceAppointmentsById,
  getServiceAppointmentsByPatient,
  getServiceAppointmentStats,
  updateServiceAppointment,
  confirmPayment,
  getBookingBySessionId,
} from "../controllers/serviceAppointmentController.js";

const serviceAppointmentRouter = express.Router();

// Apply Clerk middleware to protect your routes
serviceAppointmentRouter.use(clerkMiddleware());


serviceAppointmentRouter.get("/", getServiceAppointments);

// Dashboard / Stats
serviceAppointmentRouter.get("/stats", getServiceAppointmentStats);
serviceAppointmentRouter.get("/service-payment", confirmPayment);
serviceAppointmentRouter.get("/session/:sessionId", getBookingBySessionId);

// User-specific appointments
serviceAppointmentRouter.get("/me", getServiceAppointmentsByPatient);

serviceAppointmentRouter.post("/", createServiceAppointmet);
serviceAppointmentRouter.get("/:id", getServiceAppointmentsById);

// Update appointment
serviceAppointmentRouter.put("/:id", updateServiceAppointment);

// Cancel appointment
serviceAppointmentRouter.post("/:id/cancel", cancelServiceAppointment);

export default serviceAppointmentRouter;