import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Phone,
  BadgeIndianRupee,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE;

function parseDateTime(date, time) {
  if (!date || !time) return new Date(0);
  const safeTime = to24Hour(time);
  return new Date(`${date}T${safeTime}:00`);
}

function formatTimeAMPM(time24) {
  if (!time24) return "";
  const [hh, mm] = time24.split(":");
  let h = parseInt(hh, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mm} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function backendToFrontendStatus(s) {
  if (!s) return "pending";
  const v = String(s).toLowerCase();
  if (v === "pending") return "pending";
  if (v === "confirmed") return "confirmed";
  if (v === "completed") return "complete";
  if (v === "canceled" || v === "cancelled") return "cancelled";
  if (v === "rescheduled") return "rescheduled";
  return v;
}

function frontendToBackendStatus(fs) {
  if (!fs) return "Pending";
  const v = String(fs).toLowerCase();
  if (v === "pending") return "Pending";
  if (v === "confirmed") return "Confirmed";
  if (v === "complete") return "Completed";
  if (v === "cancelled") return "Canceled";
  if (v === "rescheduled") return "Rescheduled";
  return fs;
}

function to24Hour(timeStr) {
  if (!timeStr) return "00:00";
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return timeStr;
  let hh = Number(m[1]);
  const mm = m[2];
  const ampm = m[3];
  if (!ampm) {
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }
  const up = ampm.toUpperCase();
  if (up === "AM") {
    if (hh === 12) hh = 0;
  } else {
    if (hh !== 12) hh += 12;
  }
  return `${String(hh).padStart(2, "0")}:${mm}`;
}

function to12HourFrom24(hhmm) {
  if (!hhmm) return "12:00 AM";
  const [hh, mm] = hhmm.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(h12)}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function normalizeAppointment(a) {
  if (!a) return null;
  const id = a._id || a.id || String(Math.random()).slice(2);
  const patient = a.patientName || a.patient || a.name || "Unknown";
  const age = a.age ?? a.patientAge ?? "";
  const gender = a.gender || "";
  const doctorName =
    (a.doctorId && typeof a.doctorId === "object" && a.doctorId.name) ||
    a.doctorName ||
    a.doctor ||
    "Doctor";

  const doctorImage =
    (a.doctorId && typeof a.doctorId === "object" && a.doctorId.imageUrl) ||
    a.doctorImage ||
    a.doctorImageUrl ||
    "";

  const speciality =
    (a.doctorId && (a.doctorId.specialization || a.doctorId.speciality)) ||
    a.speciality ||
    a.specialization ||
    "";
  const mobile = a.mobile || a.phone || "";
  const fee = Number(a.fees ?? a.fee ?? a.payment?.amount ?? 0) || 0;
  const rawDate = a.date || (a.slot && a.slot.date) || "";
  const date = String(rawDate).slice(0, 10);
  const rawTime =
    a.time ||
    (a.slot && a.slot.time) ||
    (a.hour != null && a.minute != null
      ? `${String(a.hour).padStart(2, "0")}:${String(a.minute).padStart(
          2,
          "0",
        )}`
      : "");
  const time24 = to24Hour(rawTime);
  const status = backendToFrontendStatus(
    a.status || (a.payment && a.payment.status) || "Pending",
  );
  return {
    id,
    patient,
    age,
    gender,
    doctorName,
    doctorImage,
    speciality,
    mobile,
    date,
    time: time24,
    fee,
    status,
    raw: a,
  };
}

export default function DashboardPage({ apiBase }) {
  const params = useParams();
  const location = useLocation();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  location.search;
  const API = apiBase || API_BASE;

  const doctorId = params.id;

  async function fetchAppointments() {
    setLoading(true);
    setError(null);
    try {
      const basePath = `${API}/api/appointments/doctor/${encodeURIComponent(
        doctorId,
      )}`;
      const url = `${basePath}`;
      console.log(url);

      const res = await fetch(url);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Failed to fetch appointments (${res.status})`,
        );
      }
      const body = await res.json();
      const list = Array.isArray(body.appointments)
        ? body.appointments
        : Array.isArray(body)
          ? body
          : (body.items ?? body.data ?? []);

      const normalized = (Array.isArray(list) ? list : [])
        .map(normalizeAppointment)
        .filter(Boolean);

      setAppointments(normalized);
    } catch (err) {
      console.error("fetchAppointments:", err);
      setError(err.message || "Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, [API, doctorId]);

  const sorted = useMemo(() => {
    return [...appointments].sort(
      (a, b) => parseDateTime(b.date, b.time) - parseDateTime(a.date, a.time),
    );
  }, [appointments]);

  const top8 = sorted.slice(0, 12);

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(
    (a) => a.status === "complete",
  ).length;
  const cancelledAppointments = appointments.filter(
    (a) => a.status === "cancelled",
  ).length;
  const totalEarnings = appointments
    .filter((a) => a.status === "complete")
    .reduce((s, a) => s + (Number(a.fee) || 0), 0);

  async function updateStatusRemote(id, newStatusFrontend) {
    const appt = appointments.find((p) => p.id === id);
    if (!appt) return;
    if (appt.status === "complete" || appt.status === "cancelled") return;

    const backendStatus = frontendToBackendStatus(newStatusFrontend);
    setAppointments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatusFrontend } : p)),
    );

    try {
      const res = await fetch(`${API}/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: backendStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Status update failed (${res.status})`,
        );
      }
      const data = await res.json();
      const updated = data.appointment || data;

      setAppointments((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;

          const mergedRaw = { ...(p.raw || {}), ...(updated || {}) };

          const normalized = normalizeAppointment(mergedRaw);
          if (normalized) return normalized;
          return {
            ...p,
            status: backendToFrontendStatus(updated.status || backendStatus),
            raw: mergedRaw,
          };
        }),
      );
    } catch (err) {
      console.error("updateStatusRemote:", err);
      setAppointments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: appt.status } : p)),
      );
      setError(err.message || "Failed to update status");
    }
  }

  async function rescheduleRemote(id, newDate, newTime24) {
    const appt = appointments.find((p) => p.id === id);
    if (!appt) return;
    if (appt.status === "complete" || appt.status === "cancelled") return;

    const hhmm = newTime24;
    const time12 = to12HourFrom24(hhmm);
    setAppointments((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, date: newDate, time: hhmm, status: "rescheduled" }
          : p,
      ),
    );

    try {
      const res = await fetch(`${API}/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, time: time12 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Reschedule failed (${res.status})`);
      }
      const data = await res.json();
      const updated = data.appointment || data;

      setAppointments((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const mergedRaw = { ...(p.raw || {}), ...(updated || {}) };

          const normalized = normalizeAppointment(mergedRaw);
          if (normalized) return normalized;
          return {
            ...p,
            date: newDate,
            time: hhmm,
            status: backendToFrontendStatus(updated.status || "Rescheduled"),
            raw: mergedRaw,
          };
        }),
      );
    } catch (err) {
      console.error("rescheduleRemote:", err);
      setError(err.message || "Failed to reschedule");
      await fetchAppointments();
    }
  }

  function updateStatus(id, newStatus) {
    updateStatusRemote(id, newStatus);
  }

  function updateDateTime(id, newDate, newTime) {
    rescheduleRemote(id, newDate, newTime);
  }

  const doctorNameFromData =
    appointments[0]?.raw?.doctorId?.name ||
    appointments[0]?.raw?.doctorName ||
    null;

  return (
    <div className="min-h-screen font-serif pt-16 lg:pt-20 md:pt-15 p-4 sm:p-6 bg-linear-to-br from-emerald-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl pt-10 xl:pt-0 uppercase lg:pt-0 sm:text-3xl font-extrabold tracking-tight text-emerald-900">
              {doctorNameFromData
                ? `${doctorNameFromData} — Dashboard`
                : doctorId
                  ? `Doctor Dashboard`
                  : "Doctor Dashboard"}
            </h1>
            <p className="text-sm sm:text-base text-emerald-700/70">
              {doctorId
                ? `Showing appointments for doctor ${doctorId}`
                : "Overview of latest appointments & earnings"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600">
              {loading ? "Loading..." : `${appointments.length} total`}
            </div>
            <button
              onClick={() => fetchAppointments()}
              className="text-sm px-3 py-1 rounded-full bg-white text-emerald-600 border border-emerald-200 hover:shadow-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Appointments"
            value={totalAppointments}
            icon={<Calendar className="w-5 h-5" />}
            accentTop="from-emerald-200 to-emerald-300"
            accentBottom="border-emerald-200"
          />

          <StatCard
            title="Total Earnings"
            value={`₹ ${totalEarnings}`}
            icon={<BadgeIndianRupee className="w-5 h-5" />}
            accentTop="from-amber-100 to-amber-200"
            accentBottom="border-amber-200"
          />

          <StatCard
            title="Completed"
            value={completedAppointments}
            icon={<CheckCircle className="w-5 h-5" />}
            accentTop="from-emerald-100 to-emerald-200"
            accentBottom="border-emerald-200"
          />

          <StatCard
            title="Cancelled"
            value={cancelledAppointments}
            icon={<XCircle className="w-5 h-5" />}
            accentTop="from-rose-100 to-rose-200"
            accentBottom="border-rose-200"
          />
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-emerald-900">
              Latest Appointments
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-sm sm:text-base text-emerald-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{totalAppointments} total</span>
              </div>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {top8.map((a) => (
              <div
                key={a.id}
                className="rounded-xl p-4 bg-white shadow-sm border border-emerald-100 flex flex-col justify-between gap-4 hover:shadow-md transition self-start"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    {a.doctorImage ? (
                      <img
                        src={a.doctorImage}
                        alt={a.doctorName}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-emerald-700 font-bold">
                        {(a.doctorName || "D").charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-base sm:text-lg font-bold text-emerald-900">
                      {a.patient}
                    </div>
                    <div className="text-xs sm:text-sm text-emerald-700 mt-1">
                      {a.age} yrs · {a.gender}
                    </div>
                    <div className="mt-2 text-sm sm:text-sm text-emerald-700">
                      <span className="font-semibold text-emerald-900">
                        {a.doctorName}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-emerald-800 font-medium">
                      {a.speciality}
                    </div>
                    <div className="mt-2 text-xs sm:text-sm text-emerald-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{a.mobile}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm sm:text-lg font-bold text-emerald-800">
                    {formatDate(a.date)}
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-emerald-900">
                    {formatTimeAMPM(a.time)}
                  </div>
                </div>

                <div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm sm:text-base text-emerald-800 font-medium">
                      ₹{a.fee}
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      <StatusSelect
                        appointment={a}
                        onChange={(s) => updateStatus(a.id, s)}
                      />
                    </div>

                    <div className="mt-2 w-full">
                      <RescheduleButton
                        appointment={a}
                        onReschedule={(newDate, newTime) =>
                          updateDateTime(a.id, newDate, newTime)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              to={
                doctorId
                  ? `/doctor-admin/${doctorId}/appointments`
                  : "/appointments"
              }
              className="mt-4 flex justify-center"
            >
              Show more
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  accentTop = "from-emerald-100 to-emerald-200",
  accentBottom = "border-emerald-200",
}) {
  return (
    <div className="rounded-full p-4 bg-white/60 backdrop-blur-sm border border-emerald-300 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-emerald-800/80">{title}</div>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold text-emerald-900 tracking-tight">
            {value}
          </div>
        </div>

        <div
          className={`p-3 rounded-full bg-linear-to-br border shadow-md ${accentTop} ${accentBottom}`}
        >
          <div className="w-6 h-6 text-emerald-900">{icon}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const base = "px-3 py-1 rounded-full text-xs font-semibold";
  if (status === "complete")
    return (
      <span
        className={`${base} bg-emerald-100 text-emerald-800 border border-emerald-200`}
      >
        Completed
      </span>
    );
  if (status === "cancelled")
    return (
      <span
        className={`${base} bg-rose-100 text-rose-800 border border-rose-200`}
      >
        Cancelled
      </span>
    );
  if (status === "confirmed")
    return (
      <span
        className={`${base} bg-emerald-200 text-emerald-900 border border-emerald-300`}
      >
        Confirmed
      </span>
    );
  if (status === "rescheduled")
    return (
      <span
        className={`${base} bg-indigo-100 text-indigo-900 border border-indigo-200`}
      >
        Rescheduled
      </span>
    );
  return (
    <span
      className={`${base} bg-yellow-100 text-amber-800 border border-amber-200 animate-pulse`}
    >
      Pending
    </span>
  );
}

function StatusSelect({ appointment, onChange }) {
  const terminal =
    appointment.status === "complete" || appointment.status === "cancelled";

  if (appointment.status === "rescheduled") {
    return (
      <select
        value={appointment.status}
        onChange={(e) => onChange(e.target.value)}
        className={`text-xs sm:text-sm px-3 py-1 rounded-full border focus:outline-none transition ${
          terminal
            ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white text-emerald-800 border-emerald-200 hover:shadow-sm"
        }`}
        title="Change status (only Completed or Cancelled allowed after reschedule)"
      >
        <option value="rescheduled" disabled>
          Rescheduled
        </option>
        <option value="complete">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    );
  }

  const options = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "complete", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <select
      value={appointment.status}
      onChange={(e) => onChange(e.target.value)}
      disabled={terminal}
      className={`text-xs sm:text-sm px-3 py-1 rounded-full border focus:outline-none transition ${
        terminal
          ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
          : "bg-white text-emerald-800 border-emerald-200 hover:shadow-sm"
      }`}
      title={terminal ? "Status cannot be changed" : "Change status"}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="text-sm">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function RescheduleButton({ appointment, onReschedule }) {
  const terminal =
    appointment.status === "complete" ||
    appointment.status === "cancelled";

  const [editing, setEditing] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");

  const minDate = useMemo(() => {
    const d = new Date();

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
  }, []);

  useEffect(() => {
    const apptRaw = appointment.date
      ? String(appointment.date)
      : "";

    const apptDate = apptRaw.slice(0, 10);

    setDate(
      apptDate && apptDate >= minDate
        ? apptDate
        : minDate
    );

    setTime(to24Hour(appointment.time || "09:00"));
  }, [appointment.date, appointment.time, minDate]);

  function save() {
    if (!date || !time) return;

    if (date < minDate) {
      setDate(minDate);
      return;
    }

    onReschedule(date, time);

    setEditing(false);
  }

  function cancel() {
    const apptRaw = appointment.date
      ? String(appointment.date)
      : "";

    const apptDate = apptRaw.slice(0, 10);

    setDate(
      apptDate && apptDate >= minDate
        ? apptDate
        : minDate
    );

    setTime(to24Hour(appointment.time || "09:00"));

    setEditing(false);
  }

  return (
    <div className="w-full">
      {!editing ? (
        <div className="flex justify-end">
          <button
            onClick={() => setEditing(true)}
            disabled={terminal}
            title={
              terminal
                ? "Cannot reschedule completed/cancelled"
                : "Reschedule"
            }
            className={`text-xs px-3 py-1 rounded-full border transition ${
              terminal
                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-emerald-800 border-emerald-200 hover:shadow-sm"
            }`}
          >
            Reschedule
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-2 w-full">
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs px-3 py-2 rounded-full border text-gray-700 border-emerald-200 bg-white w-full md:w-48 lg:w-56"
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="text-xs px-3 py-2 rounded-full border text-gray-700 border-emerald-200 bg-white w-full md:w-48 lg:w-56"
          />

          <div className="flex gap-2">
            <button
              onClick={save}
              className="text-xs px-3 py-2 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
            >
              Save
            </button>

            <button
              onClick={cancel}
              className="text-xs px-3 py-2 rounded-full border border-emerald-200 bg-white text-emerald-800 hover:shadow-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}