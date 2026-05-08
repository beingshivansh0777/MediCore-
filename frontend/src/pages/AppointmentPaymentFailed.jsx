import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/public/logo.png";

const AppointmentPaymentFailed = () => {
  const navigate = useNavigate();

  // Auto redirect after 20 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 20000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 via-white to-orange-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center border border-red-100">

        {/* Logo */}
        <div className="flex flex-col items-center mb-4">
          <img src={logo} alt="Logo" className="w-14 h-14 mb-2" />
          <h1 className="text-2xl font-bold text-red-500">MediCore</h1>
          <p className="text-sm text-gray-500">Healthcare Solutions</p>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-red-500 mt-4">
          Payment Failed ❌
        </h2>

        {/* Message */}
        <p className="text-gray-600 mt-2">
          Your appointment payment could not be completed.
        </p>

        {/* Warning Box */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-red-600">
            ⚠ No amount has been deducted from your account.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-6">
          <Link
            to="/appointments"
            className="w-full px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-md"
          >
            Try Booking Again
          </Link>

          <Link
            to="/"
            className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition"
          >
            Go to Home Page
          </Link>
        </div>

        {/* Auto Redirect Info */}
        <p className="mt-6 text-sm text-orange-500 animate-pulse">
          ⏳ You will be redirected to the home page in 20 seconds.
        </p>
      </div>
    </div>
  );
};

export default AppointmentPaymentFailed;