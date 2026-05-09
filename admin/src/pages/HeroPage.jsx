import React from "react";
import Navbar from "../components/Navbar.jsx";
import logoImg from "/Users/shivanshmishra/Desktop/MediCore/admin/public/logo.png";

const Hero = ({ role = "admin", userName = "Doctor" }) => {
  const isDoctor = role === "doctor";
  return (
    <div className="min-h-screen font-sans bg-linear-to-b from-emerald-50 to-white">
      <Navbar />
      <main className="flex items-center pt-28 justify-center px-6 py-16">
        <section className="w-full max-w-4xl">
          <div className="relative">
            <div className="absolute -inset-8 -z-10 flex items-center justify-center">
              <div className="w-full h-44 md:h-56 rounded-3xl bg-emerald-100/60 blur-3xl"></div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-emerald-100 rounded-3xl shadow-xl p-8 md:p-12 text-center">
              <div className="mx-auto mb-4 w-24 h-24 flex items-center justify-center">
                <img
                  src={logoImg}
                  alt="logo"
                  className="w-50 h-50 object-contain"
                />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-900 mb-2">
                {isDoctor
                  ? `Welcome ,Fr. ${username}`
                  : "WELCOME TO MEDICORE ADMIN PANEL"}
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed mb-6">
                {isDoctor
                  ? "Access your patient records, manage appointments, and review medical reports securely from your dashboard."
                  : "Manage hospital operations, doctors, staff, patient records, and system settings from a centralized control panel."}
              </p>

              {/* Info cards */}
              <div className="mx-auto max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-left">
                  <h3 className="font-semibold text-emerald-800">
                    Secure Access
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Role-based login with protected medical data.
                  </p>
                </div>
                   <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-left">
                  <h3 className="font-semibold text-emerald-800">
                    Real-time Management
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Monitor hospital activity and patient flow.
                  </p>
                </div>
                   <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-left">
                  <h3 className="font-semibold text-emerald-800">
                    Medical Dashboard
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Clean,fast and dcotor-friendly interface.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Hero;
