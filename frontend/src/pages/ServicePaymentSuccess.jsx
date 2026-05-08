import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import logo from "../assets/public/logo.png";

export default function ServicePaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = params.get("session_id");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE;

  // Auto-redirect after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 20000); // 60 seconds to give user time to read
    return () => clearTimeout(timer);
  }, [navigate]);

  const fetchBookingData = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      // STEP 1: Confirm the payment
      // This call triggers the backend to create the MongoDB document from metadata
      const confirmRes = await fetch(
        `${API_BASE}/api/service-appointments/service-payment?session_id=${sessionId}`
      );
      const confirmData = await confirmRes.json();

      if (!confirmData.success) {
        throw new Error(confirmData.message || "Failed to confirm payment");
      }

      // STEP 2: Fetch the actual booking details
      // We wait for the confirmation to finish first to avoid 404 Race Condition
      const res = await fetch(
        `${API_BASE}/api/service-appointments/session/${sessionId}`
      );
      const data = await res.json();

      if (data.success) {
        setBooking(data.data);
      } else {
        // If 404 occurs here, the DB might be slow. We'll show a message.
        setError("Booking created but still processing. Please refresh.");
      }
    } catch (err) {
      console.error("Payment Processing Error:", err);
      setError(err.message || "An error occurred while retrieving your booking.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, API_BASE]);

  useEffect(() => {
    fetchBookingData();
  }, [fetchBookingData]);

  const formatDateTime = (b) => {
    if (!b) return "Not available";
    return `${b.date} at ${b.hour}:${String(b.minute || "00").padStart(2, "0")} ${b.ampm || ""}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 via-white to-emerald-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center border border-green-100">
        
        {/* Branding */}
        <div className="flex flex-col items-center mb-4">
          <img src={logo} alt="Logo" className="w-14 h-14 mb-2" />
          <h1 className="text-2xl font-bold text-green-600">MediCore</h1>
        </div>

        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Payment Successful!</h2>
          <p className="text-gray-500 text-sm">Your appointment has been confirmed.</p>
        </div>

        {/* Details Card */}
        <div className="bg-gray-50 rounded-xl p-5 text-left border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Appointment Info</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-sm text-gray-500">Securing your spot...</span>
            </div>
          ) : booking ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Patient</span>
                <span className="text-gray-800 font-medium text-sm">{booking.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Service</span>
                <span className="text-gray-800 font-medium text-sm">{booking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Schedule</span>
                <span className="text-gray-800 font-medium text-sm">{formatDateTime(booking)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <span className="text-gray-500 text-sm">Amount Paid</span>
                <span className="text-green-600 font-bold">₹{booking.fees}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-500 py-2">{error || "Could not load booking details."}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <Link
            to="/"
            className="block w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition shadow-lg shadow-green-200"
          >
            Go to Dashboard
          </Link>
          
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Redirecting to home automatically in a few moments...
        </p>
      </div>
    </div>
  );
}