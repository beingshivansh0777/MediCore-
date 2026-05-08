import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link,useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  MapPin,
  BadgeInfo,
  GraduationCap,
  Award,
  Clock,
  Star,
  Heart,
  Zap,
  Shield,
  Users,
  Phone,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Clerk client hooks
import { useAuth, useUser } from "@clerk/clerk-react";


const API_BASE = import.meta.env.VITE_API_BASE;

function getScheduleDates(schedule) {
  if (!schedule) return [];

  const keys =
    typeof schedule === "object" && !Array.isArray(schedule)
      ? Object.keys(schedule)
      : [];

  // Parse keys into Date objects (supporting YYYY-MM-DD and ISO)
  const parsed = keys
    .map((k) => {
      const d = new Date(k);
      if (!isNaN(d)) return { key: k, date: d };

      // fallback: try splitting YYYY-MM-DD
      const parts = k.split("-").map((n) => Number(n));
      if (parts.length >= 3) {
        const [y, m, day] = parts;
        const dd = new Date(y, m - 1, day);
        if (!isNaN(dd)) return { key: k, date: dd };
      }
      return null;
    })
    .filter(Boolean);

  // Normalize compare by date-only (use UTC to avoid timezone time-of-day issues)
  const dateOnlyValue = (d) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

  const today = new Date();
  const todayVal = dateOnlyValue(today);

  const past = parsed
    .filter((p) => dateOnlyValue(p.date) < todayVal)
    .sort(
      (a, b) =>
        // most recent past first (descending)
        dateOnlyValue(b.date) - dateOnlyValue(a.date),
    );

  const future = parsed
    .filter((p) => dateOnlyValue(p.date) >= todayVal)
    .sort(
      (a, b) =>
        // earliest first (ascending)
        dateOnlyValue(a.date) - dateOnlyValue(b.date),
    );

  // Return array of Date objects in desired order
  return [...past, ...future].map((p) => p.date);
}

/**
 * Normalize phone string: remove non-digits and return up to last 10 digits.
 * Returns empty string if no digits.
 */
function normalizePhoneTo10(phone) {
  if (!phone) return "";
  const digits = ("" + phone).replace(/\D/g, "");
  if (!digits) return "";
  // prefer last 10 digits (common when country code present)
  return digits.length <= 10 ? digits : digits.slice(-10);
}

export default function DoctorDetail() {
  const { id } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    mobile: "",
    gender: "",
    email: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clerk hooks
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Prefill the form fields quietly if user is available (no UI markup change)
  useEffect(() => {
    if (!userLoaded) return;
    if (user) {
      const fullName =
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "";
      const rawPhone =
        user.primaryPhone ||
        (user.phoneNumbers && user.phoneNumbers.length > 0
          ? user.phoneNumbers[0]
          : "") ||
        "";
      const phone = normalizePhoneTo10(rawPhone);
      const email =
        (user.emailAddresses && user.emailAddresses[0]?.emailAddress) ||
        user.primaryEmailAddress ||
        "";

      setFormData((prev) => ({
        ...prev,
        name: prev.name || fullName,
        mobile: prev.mobile || phone,
        email: prev.email || email,
      }));
    }
  }, [userLoaded, user]);

  useEffect(() => {
    let mounted = true;
    async function fetchDoctor() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/doctors/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.message || `Failed to fetch (status ${res.status})`,
          );
        }
        const payload = await res.json();
        const doc = payload?.data || null;
        if (mounted) setDoctor(doc);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to fetch doctor");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDoctor();
    return () => {
      mounted = false;
    };
  }, [id]);

  const next7 = useMemo(() => getScheduleDates(doctor?.schedule), [doctor]);
  const fee = Number(doctor?.fee ?? doctor?.fees ?? 0);

  const slots = useMemo(() => {
    if (!selectedDate || !doctor?.schedule) return [];
    const key = selectedDate.toISOString().split("T")[0];
    return doctor.schedule && doctor.schedule[key] ? doctor.schedule[key] : [];
  }, [selectedDate, doctor]);

  // Mobile input handlers: only digits, max 10
  const handleMobileChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: digits }));
  };

  const handleMobilePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    const digits = pasted.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: digits }));
  };

  const handleBooking = async () => {
    if (isSubmitting) return;

    // Validate patient details
    if (
      !formData.name ||
      !formData.age ||
      !formData.mobile ||
      !formData.gender
    ) {
      toast.error("Please fill all patient details!", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    // Mobile must be exactly 10 digits
    const mobileDigits = (formData.mobile || "").replace(/\D/g, "");
    if (mobileDigits.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits.", {
        position: "top-center",
        autoClose: 2500,
      });
      return;
    }

    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    if (!authLoaded || !userLoaded) {
      toast.error("Authentication not ready. Please try again in a moment.", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    if (!isSignedIn) {
      toast.error("You must sign in to create an appointment.", {
        position: "top-center",
        autoClose: 2200,
      });
      return;
    }

    setIsSubmitting(true);

    const dateISO = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // prefer fields from doctor object (this is only sent as a hint; backend will use DB)
    const doctorNameValue = doctor?.name || "";
    const specialityValue =
      doctor?.specialization ||
      doctor?.speciality ||
      doctor?.specialityName ||
      "";

    // optional owner from doctor object (backend will prefer doctor.owner)
    const ownerValue = doctor?.owner || undefined;

    const payload = {
      doctorId: doctor._id || doctor.id,
      doctorName: doctorNameValue,
      speciality: specialityValue,
      owner: ownerValue,
      // NEW: send image hints (optional — backend prefers DB but accepts these)
      doctorImageUrl: doctor?.imageUrl || doctor?.image || "",
      doctorImagePublicId:
        doctor?.imagePublicId || doctor?.image?.publicId || "",
      patientName: formData.name,
      mobile: mobileDigits,
      age: formData.age,
      gender: formData.gender,
      date: dateISO,
      time: selectedSlot,
      fee: fee,
      fees: fee,
      paymentMethod: paymentMethod || "Online",
      email: formData.email || undefined,
    };

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to obtain authentication token.");
      }

      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          body?.message || body?.error || `Booking failed (${res.status})`;
        toast.error(message, { position: "top-center" });
        setIsSubmitting(false);
        return;
      }

      // If checkoutUrl is returned -> redirect to Stripe Checkout
      if (body.checkoutUrl) {
        // redirect user to Stripe Checkout
        window.location.href = body.checkoutUrl;
        return;
      }

      // Booking created (Cash or free)
      toast.success("Booking successful", {
        position: "top-center",
        autoClose: 1500,
      });

      // navigate to appointments list (you can change this path)
      setTimeout(() => {
       navigate(`/payment-success?appointment_id=${body.appointment._id}`); 
      }, 700);
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(
        err?.message || "Network error - booking failed (auth or server issue)",
        { position: "top-center" },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading doctor...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error</div>
          <div className="text-gray-700">{error}</div>
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all"
          >
            <ArrowLeft size={20} />
            Back to Doctors
          </Link>
        </div>
      </div>
    );

  if (!doctor)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700">Doctor Not Found</h1>
          <Link to="/doctors" className="size={20}">
            <ArrowLeft size={20} />
            Back to Doctors
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen font-serif bg-linear-to-br from-emerald-50 via-white to-green-50 relative overflow-hidden">
      <ToastContainer />
      {/* Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-emerald-100 top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 px-2 xl:px-4 lg:px-4 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-full hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">Back</span>
            </Link>

            <div className="flex items-center gap-3">
              <h1 className="text-sm md:text-2xl lg:text-xl xl:text-2xl whitespace-nowrap font-bold bg-linear-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Doctor Profile
              </h1>
            </div>

            <div className="flex items-center gap-2 px-2 py-2 bg-white rounded-full shadow-sm border border-amber-100">
              <Star className="text-amber-400 fill-current" size={18} />
              <span className="font-semibold text-amber-600">
                {doctor.rating}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 sm:pt-8 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* profile card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6 sm:p-8">
            <div className="lg:col-span-1 flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="absolute -inset-2 sm:-inset-3 md:-inset-6 bg-linear-to-br from-emerald-400 to-green-400 rounded-full blur-lg opacity-50 animate-pulse"></div>

                <img
                  src={
                    doctor.imageUrl || doctor.image || "/placeholder-doctor.jpg"
                  }
                  alt={doctor.name}
                  className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full object-cover border-4 sm:border-6 md:border-8 border-white shadow-2xl z-10 transition-transform duration-300"
                  style={{ objectPosition: "center" }}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 lg:grid-cols-2 gap-4 w-full max-w-lg px-2">
                <div className="text-center p-3 sm:p-4 bg-white rounded-2xl shadow-lg border border-emerald-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <Heart className={`w-5 h-5 mx-auto mb-2 text-rose-500`} />
                  <div className="text-lg font-bold text-gray-800">
                    {doctor.success}%
                  </div>
                  <div className="text-xs text-gray-500">Success</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-white rounded-2xl shadow-lg border border-emerald-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <Award className={`w-5 h-5 mx-auto mb-2 text-amber-500`} />
                  <div className="text-lg font-bold text-gray-800">
                    {doctor.experience} Years
                  </div>
                  <div className="text-xs text-gray-500">Experience</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-white rounded-2xl shadow-lg border border-emerald-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <Users className={`w-5 h-5 mx-auto mb-2 text-emerald-500`} />
                  <div className="text-lg font-bold text-gray-800">
                    {doctor.patients}
                  </div>
                  <div className="text-xs text-gray-500">Patients</div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <h1 className="text-2xl md:text-2xl lg:text-3xl xl:text-3xl sm:text-4xl font-bold bg-linear-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {doctor.name}
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-400 to-green-500 text-white rounded-full text-sm font-semibold shadow-lg">
                  <Zap className="w-4 h-4" />
                  {doctor.specialization ||
                    doctor.speciality ||
                    doctor.specialization}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-1 gap-4">
                <div className="flex items-start gap-3 md:p-3 p-4 bg-white rounded-full shadow-sm border border-emerald-50">
                  <GraduationCap className="w-5 h-5 text-emerald-500 mt-1" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-600">
                      Qualifications
                    </div>
                    <div className="text-gray-700 font-medium">
                      {doctor.qualifications}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:p-3 p-4 bg-white rounded-full shadow-sm border border-emerald-50">
                  <MapPin className="w-5 h-5 text-emerald-500 mt-1" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-600">
                      Location
                    </div>
                    <div className="text-gray-700 font-medium">
                      {doctor.location}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:p-3 p-4 bg-white rounded-full shadow-sm border border-emerald-50">
                  <Clock className="w-5 h-5 text-emerald-500 mt-1" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-600">
                      Consultation Fee
                    </div>
                    <div className="text-lg font-bold text-rose-600">
                      ₹{fee}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:p-3 p-4 bg-white rounded-full shadow-sm border border-emerald-50">
                  <Shield className="w-5 h-5 text-emerald-500 mt-1" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-600">
                      Availability
                    </div>
                    <div className="text-gray-700 font-medium">
                      {doctor.availability === "Available" || doctor.available
                        ? "Available"
                        : "Available Soon"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-2xl shadow-sm border border-emerald-50">
                <div className="flex items-center gap-2 mb-4">
                  <BadgeInfo className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-semibold text-emerald-700">
                    About Doctor
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {doctor.about || doctor.bio}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* APPOINTMENT */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <CalendarCheck className="w-6 h-6 text-emerald-500" />
              <h2 className="text-md md:text-2xl font-bold bg-linear-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Book Your Appointment
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-semibold text-emerald-700 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5" /> Select Date
                </h3>

                <div className="overflow-x-auto -mx-2 px-2">
                  <div className="inline-grid grid-flow-col auto-cols-max gap-3 sm:grid sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-3 md:grid-cols-7 lg:grid-cols-5 xl:grid-cols-6">
                    {next7.map((date) => {
                      const isSelected =
                        selectedDate?.toDateString() === date.toDateString();
                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => setSelectedDate(date)}
                          className={`p-2 sm:p-3 rounded-full cursor-pointer border-2 transition-all whitespace-nowrap ${
                            isSelected
                              ? "bg-linear-to-br from-emerald-500 to-green-500 text-white border-emerald-500 shadow-lg"
                              : "bg-white text-gray-700 border-emerald-100"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-xs sm:text-sm opacity-80">
                              {date.toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </div>
                            <div className="text-xl sm:text-2xl font-bold">
                              {date.getDate()}
                            </div>
                            <div className="text-xs opacity-80">
                              {date.toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PATIENT FORM */}
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-emerald-700 mb-4">
                    Patient Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="p-3 rounded-full border border-emerald-300 w-full bg-white text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />

                    <input
                      type="number"
                      placeholder="Age"
                      className="p-3 rounded-full border border-emerald-300 w-full bg-white text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                    />

                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="\d{10}"
                      maxLength={10}
                      placeholder="Mobile Number (10 digits)"
                      className="p-3 rounded-full border border-emerald-300 w-full bg-white text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      value={formData.mobile}
                      onChange={(e) => handleMobileChange(e.target.value)}
                      onPaste={handleMobilePaste}
                    />

                    <select
                      className="p-3 rounded-full border border-emerald-300 w-full bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                    >
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>

                    <input
                      type="email"
                      placeholder="Email (optional - for receipts)"
                      className="p-3 rounded-full border border-emerald-300 w-full md:col-span-2 bg-white text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-emerald-700 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Available Time Slots
                </h3>

                <div className="flex gap-3 overflow-x-auto sm:grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3">
                  {slots.length === 0 && (
                    <p className="text-gray-500">
                      No time slots for this date.
                    </p>
                  )}

                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`min-w-35 p-2 rounded-full border-2 ${
                        selectedSlot === slot
                          ? "bg-linear-to-br from-emerald-500 to-green-500 text-white border-emerald-500"
                          : "bg-white text-gray-700 border-emerald-100"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 " />
                        <span>{slot}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* SUMMARY */}
                <div className="bg-linear-to-r from-emerald-50 to-green-50 p-4 sm:p-6 rounded-2xl border border-emerald-100">
                  <div className="space-y-3 mb-4 sm:mb-6">
                    <div className="flex justify-between">
                      <span className="text-md text-gray-600">
                        Selected Doctor:
                      </span>
                      <span className="font-semibold text-emerald-700 text-sm sm:text-base">
                        {doctor?.name || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-md text-gray-600">
                        Doctor Speciality:
                      </span>
                      <span className="font-semibold text-emerald-700 text-sm sm:text-base">
                        {doctor?.specialization || doctor?.speciality || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-md text-gray-600">
                        Selected Date:
                      </span>
                      <span className="font-semibold text-emerald-700 text-sm sm:text-base">
                        {selectedDate
                          ? selectedDate.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Not selected"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-md text-gray-600">
                        Selected Time:
                      </span>
                      <span className="font-semibold text-emerald-700 text-sm sm:text-base">
                        {selectedSlot || "Not selected"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-md text-gray-600">
                        Consultation Fee:
                      </span>
                      <span className="font-bold text-rose-600">₹{fee}</span>
                    </div>
                  </div>

                  {/* PAYMENT METHOD SELECTOR */}
                  <div className="mb-3 flex items-center gap-3">
                    <label className="text-sm font-medium text-emerald-700">
                      Payment:
                    </label>
                    <div className="inline-flex gap-2">
                      <label
                        className={`px-3 py-1 rounded-full cursor-pointer border ${
                          paymentMethod === "Cash"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-emerald-700 border-emerald-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="Cash"
                          checked={paymentMethod === "Cash"}
                          onChange={() => setPaymentMethod("Cash")}
                          className="hidden"
                        />
                        Cash
                      </label>
                      <label
                        className={`px-3 py-1 rounded-full cursor-pointer border ${
                          paymentMethod === "Online"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-emerald-700 border-emerald-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="Online"
                          checked={paymentMethod === "Online"}
                          onChange={() => setPaymentMethod("Online")}
                          className="hidden"
                        />
                        Online
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedSlot || isSubmitting}
                    className={`w-full py-3 sm:py-4 px-4 rounded-full font-semibold text-sm cursor-pointer transition-all ${
                      !selectedDate || !selectedSlot || isSubmitting
                        ? "bg-gray-300 text-gray-500"
                        : "bg-linear-to-r from-emerald-500 to-green-500 text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Phone className="w-5 h-5" />
                      <span>
                        {isSubmitting ? "Booking..." : "Confirm Booking"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
    </div>
  );
}
