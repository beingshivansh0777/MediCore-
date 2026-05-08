import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  FileText,
  IndianRupee,
  Send,
  Phone,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";

const DEFAULT_HOST = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isSignedIn, userId, getToken } = useAuth();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Online");

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const isValidMobile = (m) => /^\d{10}$/.test(m);

  const isValidAge = (a) => {
    if (a === "" || a === null || a === undefined) return false;
    const n = Number(a);
    return Number.isInteger(n) && n > 0 && n < 150;
  };

  function getClientMissingFields() {
    const missing = [];
    if (!customerName || !customerName.trim()) missing.push("patientName");
    if (!mobile || !isValidMobile(mobile)) missing.push("mobile (10 digits)");
    if (!selectedDate) missing.push("date");
    if (!selectedTime) missing.push("time");

    if (!isValidAge(age)) missing.push("age (positive integer)");
    if (!gender || !String(gender).trim()) missing.push("gender");
    return missing;
  }

  const isFormValid = () => getClientMissingFields().length === 0;

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const endpoints = [
      `${DEFAULT_HOST}/api/services/${encodeURIComponent(id)}`,
    ];

    async function tryFetch() {
      setLoading(true);
      setFetchError(null);

      let lastError = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          });

          if (res.status === 404) {
            lastError = new Error(`404 ${url}`);
            continue;
          }

          const contentType = res.headers.get("content-type") || "";
          if (!res.ok || !contentType.includes("application/json")) {
            const txt = await res.text().catch(() => "");
            lastError = new Error(
              `Bad response ${res.status} at ${url}: ${String(txt).slice(
                0,
                200,
              )}`,
            );
            continue;
          }

          const json = await res.json().catch(() => null);
          const doc = json?.data ?? json?.service ?? json;

          if (!doc) {
            lastError = new Error(`No service data at ${url}`);
            continue;
          }

          const transformed = transformServiceShape(doc);

          if (!mounted) return;
          setService(transformed);
          if (transformed.dates && transformed.dates.length > 0) {
            setSelectedDate(transformed.dates[0]);
            setSelectedTime("");
          }
          setLoading(false);
          return;
        } catch (err) {
          if (err.name === "AbortError") return;
          lastError = err;
          continue;
        }
      }

      if (!mounted) return;
      console.warn(
        "All endpoints failed, falling back to local servicesData. Last error:",
        lastError,
      );
      const local =
        servicesData && servicesData.find((s) => String(s.id) === String(id));
      if (local) {
        const cloned = JSON.parse(JSON.stringify(local));
        if (
          !cloned.slots ||
          (Array.isArray(cloned.slots) &&
            cloned.dates &&
            cloned.dates.length > 0)
        ) {
          const arrSlots = Array.isArray(cloned.slots) ? cloned.slots : [];
          const slotsMap = {};
          if (cloned.dates && cloned.dates.length > 0) {
            cloned.dates.forEach((d) => (slotsMap[d] = arrSlots.slice()));
          } else {
            const today = new Date().toISOString().split("T")[0];
            slotsMap[today] = arrSlots.slice();
            cloned.dates = [today];
          }
          cloned.slots = slotsMap;
        }
        setService(cloned);
        if (cloned.dates && cloned.dates.length > 0)
          setSelectedDate(cloned.dates[0]);
        setLoading(false);
        return;
      }

      setFetchError("Unable to fetch service details from server.");
      setLoading(false);
    }

    tryFetch();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [id]);

  function normalizeToDateString(d) {
    // Convert anything date-like into YYYY-MM-DD string, or return null if invalid
    const dt = new Date(d);
    if (isNaN(dt)) return null;
    return dt.toISOString().split("T")[0];
  }

  function sortServiceDates(datesArr) {
    // Accepts array of mixed date strings / Date objects, returns array of unique YYYY-MM-DD strings
    if (!Array.isArray(datesArr)) return [];

    const uniq = Array.from(
      new Set(datesArr.map(normalizeToDateString).filter(Boolean)),
    );

    const parsed = uniq.map((ds) => ({ ds, date: new Date(ds) }));

    const dateVal = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

    const today = new Date();
    const todayVal = dateVal(today);

    const past = parsed
      .filter((p) => dateVal(p.date) < todayVal)
      .sort((a, b) => dateVal(b.date) - dateVal(a.date)); // nearest past first

    const future = parsed
      .filter((p) => dateVal(p.date) >= todayVal)
      .sort((a, b) => dateVal(a.date) - dateVal(b.date)); // earliest future first (includes today)

    return [...past, ...future].map((p) => p.ds);
  }

  // Replace your transformServiceShape with this updated version:
  function transformServiceShape(doc) {
    const out = {};
    out.id =
      doc._id ??
      doc.id ??
      doc.slug ??
      String(doc.name).replace(/\s+/g, "-").toLowerCase();
    out.name = doc.name ?? doc.title ?? "Service";
    out.image =
      doc.image || doc.imageUrl || doc.imageURL || doc.image_path || null;
    out.price =
      typeof doc.price === "number" ? doc.price : Number(doc.price) || 0;
    out.about = doc.about ?? doc.description ?? doc.shortDescription ?? "";
    out.instructions = Array.isArray(doc.instructions) ? doc.instructions : [];

    let dates = Array.isArray(doc.dates) ? doc.dates.slice() : [];
    let slotsMap = {};
    if (
      doc.slots &&
      !Array.isArray(doc.slots) &&
      typeof doc.slots === "object"
    ) {
      slotsMap = { ...doc.slots };
      if (dates.length === 0) dates = Object.keys(slotsMap);
    } else if (Array.isArray(doc.slots)) {
      const arr = doc.slots.slice();
      if (dates.length > 0) {
        dates.forEach((d) => (slotsMap[d] = arr.slice()));
      } else {
        const today = new Date().toISOString().split("T")[0];
        slotsMap[today] = arr.slice();
        dates = [today];
      }
    } else {
      if (dates.length > 0) {
        dates.forEach((d) => (slotsMap[d] = []));
      } else {
        const today = new Date().toISOString().split("T")[0];
        dates = [today];
        slotsMap[today] = [];
      }
    }

    // Ensure dates normalized and ordered: past-first (nearest → older), then today+future (earliest → latest)
    out.dates = sortServiceDates(dates);
    out.slots = slotsMap;
    out.imageAlt = doc.imageAlt ?? doc.alt ?? out.name;
    out.raw = doc;
    return out;
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    const missing = getClientMissingFields();
    if (missing.length > 0) {
      setSubmitError(
        `${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} required`,
      );
      return;
    }

    if (!service) {
      setSubmitError("Service details not loaded");
      return;
    }

    if (!isSignedIn) {
      toast.error("Please sign in to create a booking.");
      return;
    }

    setSubmitting(true);
    try {
      // get Clerk token (frontend)
      const token = await getToken().catch(() => null);

      // payload (replace the existing payload in ServiceDetail.jsx)
      const payload = {
        serviceId:
          (service?.raw && (service.raw._id || service.raw.id)) || service?.id,
        serviceName: service?.name || "",
        // NEW: service image snapshot hints (backend will prefer DB but accepts these)
        serviceImageUrl:
          (service?.raw &&
            (service.raw.imageUrl ||
              service.raw.image ||
              service.raw.imageURL ||
              "")) ||
          service?.image ||
          "" ||
          "",
        serviceImagePublicId:
          (service?.raw &&
            (service.raw.imagePublicId ||
              (service.raw.image && service.raw.image.publicId) ||
              "")) ||
          "",
        patientName: customerName.trim(),
        mobile: mobile.trim(),
        age: age ? Number(age) : undefined,
        gender: gender || "",
        date: selectedDate,
        time: selectedTime,
        fee: service?.price ?? 0,
        fees: service?.price ?? 0,
        paymentMethod: paymentMethod === "Cash" ? "Cash" : "Online",
        email: email || undefined,
        meta: {
          client: "frontend",
          serviceName: service?.name,
        },
      };

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        toast.error(
          "Authentication token not available. Please sign in again.",
        );
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${DEFAULT_HOST}/api/service-appointments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = { rawText: text };
      }

      if (!res.ok) {
        const msg =
          (json && (json.message || json.error || json.rawText)) ||
          `Server returned ${res.status}`;
        if (json && json.errors && typeof json.errors === "object") {
          const ve = Array.isArray(json.errors)
            ? json.errors.join(", ")
            : JSON.stringify(json.errors);
          setSubmitError(`${msg} — ${ve}`);
        } else {
          setSubmitError(String(msg));
        }
        setSubmitting(false);
        return;
      }

      const { appointment, checkoutUrl } = json || {};

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      toast.success(
        "Booking created successfully. Redirecting to appointments...",
      );
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 700);

      setCustomerName("");
      setMobile("");
      setAge("");
      setGender("");
      setSelectedDate("");
      setSelectedTime("");
      setEmail("");
    } catch (err) {
      console.error("Booking submit error:", err);
      setSubmitError("Network error while creating booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-semibold">Loading service...</h2>
          <p className="mt-2 text-gray-600">Fetching details from server</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-semibold">Service not found</h2>
          <p className="mt-2 text-gray-600">
            Please go back and select a valid service.
          </p>
          <Link
            to="/services"
            className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-full"
          >
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-serif bg-linear-to-br from-emerald-50 via-white to-green-50 px-4 lg:px-12 pt-20 sm:pt-12 md:pt-8 lg:pt-0">
      <Toaster />
      <div className="backdrop-blur-lg top-0 z-20">
        <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-4">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-full hover:bg-emerald-50"
          >
            <ArrowLeft size={18} />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 mt-6">
        {/* LEFT */}
        <div className="space-y-8">
          <div className="w-full h-56 sm:h-72 md:h-96 lg:h-[65vh] xl:h-[70vh] rounded-3xl overflow-hidden shadow-2xl border border-white/50">
            <img
              src={service.image || "/placeholder-service.png"}
              alt={service.name}
              className="w-full h-full object-cover object-center transition-transform duration-500"
            />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl border border-emerald-100">
            <h3 className="text-lg font-semibold text-emerald-700 flex items-center gap-2 mb-4">
              <Phone size={20} />
              Your Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                type="text"
                placeholder="Full Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-4 py-3 rounded-full border border-emerald-200 focus:ring-2 focus:ring-emerald-300 w-full text-gray-800 placeholder-gray-400 bg-white"
              />

              <input
                type="text"
                required
                placeholder="Mobile (10 digits) *"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                className={
                  mobile && !isValidMobile(mobile)
                    ? "px-4 py-3 rounded-full border border-rose-500 focus:ring-2 focus:ring-emerald-300 w-full text-gray-800 placeholder-gray-400 bg-white"
                    : "px-4 py-3 rounded-full border border-emerald-200 focus:ring-2 focus:ring-emerald-300 w-full text-gray-800 placeholder-gray-400 bg-white"
                }
              />

              <input
                type="number"
                required
                placeholder="Age *"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="px-4 py-3 rounded-full border border-emerald-200 focus:ring-2 focus:ring-emerald-300 w-full text-gray-800 placeholder-gray-400 bg-white"
              />

              <select
                value={gender}
                required
                onChange={(e) => setGender(e.target.value)}
                className="px-4 py-3 rounded-full border border-emerald-200 focus:ring-2 focus:ring-emerald-300 w-full text-gray-800 placeholder-gray-400 bg-white"
              >
                <option value="">Select Gender *</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>

              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-full border border-emerald-200 focus:ring-2 focus:ring-emerald-300 w-full text-gray-800 placeholder-gray-400 bg-white sm:col-span-2"
              />
            </div>

            <div className="mt-4">
              <label className="font-semibold text-emerald-800 block mb-2">
                Payment Method
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
          </div>

          {/* DATE */}
          <div>
            <h2 className="text-xl font-semibold text-emerald-900 mb-2">
              Select Date *
            </h2>
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="inline-flex gap-3 sm:flex sm:flex-wrap">
                {service.dates.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedTime("");
                    }}
                    className={`px-5 py-2 rounded-full cursor-pointer border transition whitespace-nowrap min-w-35 sm:min-w-0 ${
                      selectedDate === d
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TIME */}
          {selectedDate && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-emerald-900 mb-2">
                Select Time *
              </h2>
              <div className="overflow-x-auto -mx-2 px-2">
                <div className="inline-flex gap-3 sm:flex sm:flex-wrap">
                  {(service.slots[selectedDate] || []).map((t) => (
                    <button
                      key={t._id || t.time}
                      onClick={() => setSelectedTime(t.time || t)}
                      className={`px-5 py-2 rounded-full cursor-pointer border transition whitespace-nowrap min-w-35 sm:min-w-0 flex items-center gap-2 ${
                        selectedTime === (t.time || t)
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      <Clock className="w-3 mr-1" />
                      {t.time || t}
                    </button>
                  ))}
                  {(!service.slots[selectedDate] ||
                    service.slots[selectedDate].length === 0) && (
                    <div className="text-emerald-600/80 p-2">
                      No slots available for this date.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            {submitError && (
              <div className="text-rose-600 mb-2">{submitError}</div>
            )}
            {successMessage && (
              <div className="text-emerald-700 mb-2">{successMessage}</div>
            )}
            <button
              disabled={!isFormValid() || submitting}
              onClick={handleSubmit}
              className={`w-full py-4 md:mb-8 rounded-full text-lg font-semibold flex items-center justify-center gap-3 transition ${
                isFormValid() && !submitting
                  ? "bg-linear-to-br from-emerald-500 to-green-500 text-white shadow-lg hover:opacity-90 cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Send />
              {submitting
                ? "Submitting..."
                : `Confirm Booking ${
                    service.price ? `• ₹${service.price}` : ""
                  }`}
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white/80 rounded-3xl shadow-xl p-6 sm:p-8 border border-white/50 h-fit">
          <h1 className="text-2xl lg:text-3xl xl:text-3xl md:text-2xl sm:text-4xl font-bold bg-linear-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            {service.name}
          </h1>

          <div className="mt-6 bg-emerald-50 p-5 rounded-xl border border-emerald-100">
            <h2 className="flex items-center gap-3 text-md md:text-xl lg:text-xl xl:text-xl font-semibold text-emerald-900">
              <FileText /> About This Service
            </h2>
            <p className="text-emerald-800 mt-2">{service.about}</p>
          </div>

          <div className="mt-6 rounded-full flex items-center gap-3 bg-emerald-50 w-fit px-5 py-3 border border-emerald-100">
            <IndianRupee />
            <span className="font-bold text-xl text-emerald-900">
              {service.price}
            </span>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-emerald-900 mb-3">
              Pre-Test Instructions
            </h3>
            <ul className="list-disc pl-6 text-emerald-700 space-y-1">
              {service.instructions.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8 bg-linear-to-r from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100">
            <h3 className="text-lg font-semibold text-emerald-800 mb-4">
              Booking Summary
            </h3>
            <div className="space-y-2 text-emerald-700 text-sm sm:text-base">
              <p>
                <b>Name:</b> {customerName || "Not filled"}
              </p>
              <p>
                <b>Mobile:</b> {mobile || "Not filled"}
              </p>
              <p>
                <b>Age:</b> {age || "Not filled"}
              </p>
              <p>
                <b>Gender:</b> {gender || "Not filled"}
              </p>
              <p>
                <b>Date:</b> {selectedDate || "Not selected"}
              </p>
              <p>
                <b>Time:</b> {selectedTime || "Not selected"}
              </p>
              <p>
                <b>Payment:</b> {paymentMethod}
              </p>
              <p>
                <b>Price:</b> ₹{service.price}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
