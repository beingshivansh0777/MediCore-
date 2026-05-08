import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, Phone, Search, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE;

function parseDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
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
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return "Invalid Date";
  }
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function to24HourFromMaybe12(timeStr) {
  if (!timeStr) return "00:00";
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return timeStr;
  let hh = Number(m[1]);
  const mm = m[2];
  const ampm = m[3];
  if (!ampm) return `${String(hh).padStart(2, "0")}:${mm}`;
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

function backendToFrontendStatus(s) {
  if (!s) return "pending";
  const v = String(s).toLowerCase();
  if (v === "pending") return "pending";
  if (v === "confirmed") return "confirmed";
  if (v === "completed" || v === "complete") return "complete";
  if (v === "cancelled" || v === "cancelled") return "cancelled";
  if (v === "rescheduled") return "rescheduled";
  return v;
}

function frontendToBackendStatus(fs) {
  if (!fs) return "Pending";
  const v = String(fs).toLowerCase();
  if (v === "pending") return "Pending";
  if (v === "confirmed") return "Confirmed";
  if (v === "complete") return "Completed";
  if (v === "cancelled") return "Cancelled";
  if (v === "rescheduled") return "Rescheduled";
  return fs;
}

function normalizeAppointment(a) {
  if (!a) return null;
  const id = a._id || a.id || String(Math.random()).slice(2);
  const patient = a.patientName || a.patient || a.name || "Unknown";
  const age = a.age ?? a.patientAge ?? "";
  const gender = a.gender || "";
  const doctorName =
    (a.doctorId && a.doctorId.name) || a.doctorName || a.doctor || "";
  const doctorImage =
    (a.doctorId && (a.doctorId.imageUrl || a.doctorId.image)) ||
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
  const date = a.date || (a.slot && a.slot.date) || "";
  const rawTime =
    a.time ||
    (a.slot && a.slot.time) ||
    (a.hour != null
      ? `${String(a.hour).padStart(2, "0")}:${String(a.minute || 0).padStart(
          2,
          "0",
        )}`
      : "");
  const time = to24HourFromMaybe12(rawTime);
  const status = backendToFrontendStatus(
    a.status || a.payment?.status || "pending",
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
    time,
    fee,
    status,
    raw: a,
  };
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
        className={`text-sm px-3 py-1 rounded-full border focus:outline-none transition ${
          terminal
            ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white text-emerald-800 border-emerald-200 hover:shadow-sm"
        }`}
        title="After reschedule you can mark Completed or Cancelled"
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
      className={`text-sm px-3 py-1 rounded-full border focus:outline-none transition ${
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
    appointment.status === "complete" || appointment.status === "cancelled";
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(appointment.date || "");
  const [time, setTime] = useState(appointment.time || "09:00");

  const minDate = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  useEffect(() => {
    const apptRaw = appointment.date ? String(appointment.date) : "";
    const apptDate = apptRaw.slice(0, 10);
    setDate(apptDate && apptDate >= minDate ? apptDate : minDate);
    setTime(appointment.time || "09:00");
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
    const apptRaw = appointment.date ? String(appointment.date) : "";
    const apptDate = apptRaw.slice(0, 10);
    setDate(apptDate && apptDate >= minDate ? apptDate : minDate);
    setTime(appointment.time || "09:00");
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
              terminal ? "Cannot reschedule completed/cancelled" : "Reschedule"
            }
            className={`text-sm px-3 py-1 rounded-full border transition${
              terminal
                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-emerald-800 border-emerald-200 hover:shadow-sm"
            }`}
          >
            Reschedule
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-col items-end gap-2 w-full">
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm px-3 py-2 rounded-full border text-gray-700 border-emerald-200 bg-white w-full md:w-40"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="text-sm px-3 py-2 rounded-full border text-gray-700 border-emerald-200 bg-white w-full md:w-36"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              className="text-sm px-3 py-2 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
            >
              Save
            </button>
            <button
              onClick={cancel}
              className="text-sm px-3 py-2 rounded-full border border-emerald-200 bg-white text-emerald-800 hover:shadow-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const List = () => {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const doctorId = params.id;

  //to fetch the appointment using the id...
  async function fetchAppointments() {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/appointments/doctor/${encodeURIComponent(
        doctorId,
      )}`;

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
  }, [doctorId]);

  async function updateStatusRemote(id, newStatus) {
    const appt = appointments.find((p) => p.id === id);
    if (!appt) return;
    if (appt.status === "complete" || appt.status === "cancelled") return;

    const backendStatus = frontendToBackendStatus(newStatus);

    setAppointments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
    );

    try {
      const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
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
      const body = await res.json();
      const updated = body.appointment || body;
      setAppointments((prev) =>
        prev.map((p) =>
          p.id === id
            ? normalizeAppointment(updated) || {
                ...p,
                status: backendToFrontendStatus(
                  updated.status || backendStatus,
                ),
              }
            : p,
        ),
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

    const time12 = to12HourFrom24(newTime24);

    setAppointments((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, date: newDate, time: newTime24, status: "rescheduled" }
          : p,
      ),
    );

    try {
      const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, time: time12 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Reschedule failed (${res.status})`);
      }
      const body = await res.json();
      const updated = body.appointment || body;
      setAppointments((prev) =>
        prev.map((p) =>
          p.id === id
            ? normalizeAppointment(updated) || {
                ...p,
                date: newDate,
                time: newTime24,
                status: backendToFrontendStatus(
                  updated.status || "Rescheduled",
                ),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("rescheduleRemote:", err);
      setError(err.message || "Failed to reschedule — reloading");
      await fetchAppointments();
    }
  }

  function updateStatus(id, newStatus) {
    updateStatusRemote(id, newStatus);
  }

  function updateDateTime(id, newDate, newTime) {
    rescheduleRemote(id, newDate, newTime);
  }

  const filtered = useMemo(() => {
    return [...appointments]
      .filter((a) =>
        search
          ? (a.patient || "").toLowerCase().includes(search.toLowerCase())
          : true,
      )
      .filter((a) => (statusFilter ? a.status === statusFilter : true))
      .sort(
        (a, b) => parseDateTime(b.date, b.time) - parseDateTime(a.date, a.time),
      );
  }, [appointments, search, statusFilter]);

  return (
    <div className="min-h-screen pt-20 md:pt-24 font-serif p-4 sm:p-6 bg-linear-to-br from-emerald-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">
          {/* Left Side */}
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-900">
              All Appointments
            </h1>

            <p className="text-sm text-emerald-700 mt-1">
              Latest at top - search by patient name.
            </p>
          </div>

          {/* Right Side */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-72 md:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Patient Name"
                className="w-full py-2.5 pl-4 pr-12 rounded-full border border-emerald-200 bg-white text-emerald-800 shadow-sm focus:ring-2 focus:ring-emerald-200 outline-none"
              />

              <div className="absolute inset-y-0 right-4 flex items-center">
                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="text-emerald-600 hover:text-emerald-900 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <Search className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2.5 px-4 rounded-full border border-emerald-200 bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-emerald-200 outline-none w-full sm:w-44"
            >
              <option value="">All Status</option>
              <option value="complete">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8 text-emerald-600">
            Loading Appointments....
          </div>
        ) : error ? (
          <div className="text-center py-8 text-rose-600">Error : {error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {filtered.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl p-4 bg-white shadow-sm border border-emerald-100 hover:shadow-md transition flex flex-col justify-between self-start"
              >
                <header className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    {a.doctorImage ? (
                      <img
                        src={a.doctorImage}
                        alt={a.doctorName}
                        className="w-full h-full object-cover"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <div className="text-emerald-700 font-bold">
                        {(a.doctorName || "D").charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm md:text-lg font-bold text-emerald-900 truncate">
                      {a.patient}
                    </div>
                    <div className="text-xs md:text-sm text-emerald-700 mt-1">
                      {a.age} yrs &middot; {a.gender}
                    </div>
                    <div className="mt-2 text-sm text-emerald-700 truncate">
                      <span className="font-semibold text-emerald-900">
                        {a.doctorName}
                      </span>
                    </div>

                    <div className="text-sm text-emerald-800 font-medium truncate">
                      {a.speciality}
                    </div>
                  </div>
                </header>

                <div className="mt-4 flex flex-col items-start gap-3">
                  <div className="text-md md:text-lg text-emerald-800 font-bold flex items-center gap-2 w-full">
                    <Calendar className="w-4 h-4" />
                    <span className="whitespace-nowrap truncate">
                      {formatDate(a.date)}
                    </span>
                    <span className=" sm:inline">:</span>
                    <span>{formatTimeAMPM(a.time)}</span>
                  </div>
                  <div className="text-sm text-emerald-800 font-semibold">
                    ₹{a.fee}
                  </div>

                  <div className="mt-4 flex flex-col items-start gap-3">
                    <div className="text-sm text-emerald-700 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="truncate">{a.mobile}</span>
                    </div>

                    <div className="flex items-center gap-2 w-full mt-2 justify-start">
                      <StatusBadge status={a.status} />
                      <StatusSelect
                        appointment={a}
                        onChange={(s) => updateStatus(a.id, s)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <RescheduleButton
                      appointment={a}
                      onReschedule={(d, t) => updateDateTime(a.id, d, t)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default List;
