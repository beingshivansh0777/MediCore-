import express from "express";
import { clerkMiddleware } from "@clerk/express";
import {
  cancelAppointment,
  confirmPayment,
  createAppointment,
  getAppointmentByDoctor,
  getAppointmentByPatient,
  getAppointment,
  getRegisteredUserCount,
  getStats,
  updateAppointment,
  getAppointmentById
} from "../controllers/appointmentController.js";

const appointmentRouter = express.Router();

appointmentRouter.use(clerkMiddleware());

// 1. PUBLIC / GENERAL 
appointmentRouter.get("/", getAppointment);

// 2. PAYMENT CONFIRMATION (Keep this high up)
// This matches: GET /api/appointments/payment/confirm?session_id=...
appointmentRouter.get("/payment/confirm", confirmPayment);

// 3. ADMIN & ANALYTICS (Move these ABOVE the /:id route)
appointmentRouter.get("/stats/summary", getStats);
appointmentRouter.get("/patients/count", getRegisteredUserCount);

// 4. USER SPECIFIC
appointmentRouter.get("/me", getAppointmentByPatient);
appointmentRouter.post("/", createAppointment);

// 5. DOCTOR SPECIFIC
appointmentRouter.get("/doctor/:doctorId", getAppointmentByDoctor);

// 6. DYNAMIC ID ROUTES (Always keep these at the BOTTOM)
appointmentRouter.get("/:id", getAppointmentById);
appointmentRouter.patch("/:id/cancel", cancelAppointment);
appointmentRouter.put("/:id", updateAppointment);

export default appointmentRouter;