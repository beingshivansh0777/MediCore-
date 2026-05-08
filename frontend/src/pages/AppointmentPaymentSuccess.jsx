import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import logo from "../assets/public/logo.png";

export default function AppointmentPaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract IDs from URL
  const sessionId = searchParams.get("session_id");
  const appointmentId = searchParams.get("appointment_id"); 

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    const timer = setTimeout(() => navigate("/"), 20000); 
    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    // If no ID is present, we can't show anything
    if (!sessionId && !appointmentId) {
      setLoading(false);
      setError("No valid appointment reference found.");
      return;
    }

    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        let endpoint = "";

        if (sessionId) {
          // Stripe Flow: Verification endpoint
          endpoint = `${API_BASE}/api/appointments/payment/confirm?session_id=${sessionId}`;
        } else {
          // Cash Flow: Fetch existing record by ID
          endpoint = `${API_BASE}/api/appointments/${appointmentId}`;
        }
        
        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (data.success) {
          setAppointment(data.appointment);
        } else {
          setError(data.message || "Failed to retrieve appointment details.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [sessionId, appointmentId, API_BASE]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 via-white to-green-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center border border-green-100">
        
        <div className="flex flex-col items-center mb-4">
          <img src={logo} alt="MediCore Logo" className="w-14 h-14 mb-2" />
          <h1 className="text-2xl font-bold text-green-600">MediCore</h1>
          <p className="text-sm text-gray-500">Healthcare Solutions</p>
        </div>

        <h2 className="text-xl font-semibold text-green-600 mt-4">
          {loading ? "Processing..." : error ? "Oops!" : "Appointment Confirmed! 🎉"}
        </h2>

        <p className="text-gray-600 mb-2">
          {error ? error : "Your doctor's appointment has been successfully secured."}
        </p>

        {sessionId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4 break-all text-left">
            <p className="text-xs text-gray-700 font-semibold">Stripe Ref:</p>
            <p className="text-[10px] text-gray-500">{sessionId}</p>
          </div>
        )}

        <div className="mt-4 text-left bg-gray-50 p-4 rounded-lg border">
          <h2 className="text-md font-semibold text-gray-800 mb-2 border-b pb-1">Appointment Summary</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4 justify-center">
              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              Loading details...
            </div>
          ) : appointment ? (
            <ul className="text-sm text-gray-600 space-y-2 mt-2">
              <li className="flex justify-between">
                <span className="font-semibold text-gray-700">Patient:</span> 
                <span>{appointment.patientName}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-semibold text-gray-700">Doctor:</span> 
                <span>Dr. {appointment.doctorName}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-semibold text-gray-700">Date:</span> 
                <span>{new Date(appointment.date).toLocaleDateString()}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-semibold text-gray-700">Time:</span> 
                <span>{appointment.time}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-semibold text-gray-700">Payment:</span> 
                <span className="text-emerald-600 font-medium">
                  {appointment.payment?.method} ({appointment.payment?.status})
                </span>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-red-500 text-center py-4">Data unavailable.</p>
          )}
        </div>

        {!error && (
          <p className="mt-6 text-[11px] text-orange-500 animate-pulse uppercase tracking-wider font-bold">
            Redirecting to home page...
          </p>
        )}

        <Link to="/" className="mt-4 block w-full py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition shadow-md font-medium">
          Back to Home
        </Link>
      </div>
    </div>
  );
}