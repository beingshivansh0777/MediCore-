import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeftIcon, Eye, EyeOff, Loader2 } from "lucide-react";

const STORAGE_KEY = "doctorToken_v1";

const LoginPage = () => {
  const API_BASE = import.meta.env.VITE_API_BASE;

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((s) => ({
      ...s,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !formData.password) {
      toast.error("All credentials are required", {
        style: {
          borderRadius: "12px",
          background: "#fff",
          color: "#14532d",
          border: "1px solid #86efac",
          boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
        },
      });
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address", {
        style: {
          borderRadius: "12px",
          background: "#fff",
          color: "#14532d",
          border: "1px solid #86efac",
        },
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctors/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: trimmedEmail,
          password: formData.password,
          rememberMe,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.message || "Login failed", { duration: 4000 });
        setBusy(false);
        return;
      }
      const token = json?.token || json?.data?.token;

      if (rememberMe && token) {
        localStorage.setItem(STORAGE_KEY, token);
      } else if (token) {
        sessionStorage.setItem(STORAGE_KEY, token);
      }

      if (!token) {
        toast.error("Authentication token missing");
        setBusy(false);
        return;
      }

      const doctorId =
        json?.data?._id || json?.doctor?._id || json?.data?.doctor?._id;
      if (!doctorId) {
        toast.error("Doctor ID missing from server response");
        setBusy(false);
        return;
      }

      toast.success("Login successful — redirecting...", {
        style: {
          borderRadius: "12px",
          background: "#fff",
          color: "#14532d",
          border: "1px solid #86efac",
        },
      });
      setTimeout(() => {
        navigate(`/doctor-admin/${doctorId}`);
      }, 700);
    } catch (err) {
      console.error("login error", err);
      toast.error("Network error during login");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 via-emerald-100 to-green-200 relative font-serif overflow-hidden">
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <Toaster position="top-right" reverseOrder={false} />
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 cursor-pointer flex items-center gap-2 text-green-800 font-semibold hover:text-green-600 transition-all duration-300"
      >
        <ArrowLeftIcon className="w-5 h-5" /> Back to Home
      </button>

      <div className="relative z-10 bg-white/60 backdrop-blur-xl shadow-2xl rounded-3xl p-8 w-[90%] max-w-md border border-green-200 transition-all duration-500 hover:shadow-green-300/50 animate-[fadeIn_0.5s_ease-in-out]">
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            className="w-28 h-28 object-contain drop-shadow-lg"
            alt="logo"
          />
        </div>
        <h2 className="text-3xl font-bold text-center text-emerald-700 tracking-wide mb-2">
          Doctor Admin
        </h2>
        <p className="text-center text-green-600 mb-6 text-sm">
          Sign In to manage your profile & schedule.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email"
            autoComplete="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-5 py-3 rounded-full text-gray-700 border border-green-300 bg-white/80 outline-none transition-all duration-300 focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 focus:scale-[1.01]"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-5 py-3 rounded-full text-gray-700 border border-green-300 bg-white/80 pr-14 outline-none transition-all duration-300 focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 focus:scale-[1.01]"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-600 transition-all duration-300"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-2 text-sm text-emerald-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-emerald-600 w-4 h-4"
              />
              Remember Me
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className={`w-full py-3 text-white font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
              busy
                ? "bg-emerald-400 cursor-not-allowed opacity-80"
                : "bg-linear-to-r from-emerald-400 to-green-600 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-300/40"
            }`}
          >
            {busy ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Signing In...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
