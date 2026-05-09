import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import connectDB from "./config/db.js";

import doctorRouter from "./routes/doctorRoutes.js";
import serviceRouter from "./routes/serviceRoutes.js";
import appointmentRouter from "./routes/appointmentRoutes.js";
import serviceAppointmentRouter from "./routes/serviceAppointmentRoutes.js";

const app = express();
const port = process.env.PORT || 4000;

// Normalize origin
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean); 

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked: ${origin}`); // helpful for debugging
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middlewares
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ limit: "20kb", extended: true }));

// DB
connectDB();

// Routes
app.use("/api/doctors", doctorRouter);
app.use("/api/services", serviceRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/service-appointments", serviceAppointmentRouter);

// Test route
app.get("/", (req, res) => {
  res.send("API Working");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
