import { Calendar, Search,BadgeIndianRupee } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

//helper function
function formatDateISO(iso) {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return iso;
  }
}

function dateTimeFromSlot(slot) {
  try {
    const [y, m, d] = slot.date.split("-");
    const base = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);

    const [time, ampm] = slot.time.split(" ");
    let [hh, mm] = time.split(":").map(Number);
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    base.setHours(hh, mm, 0, 0);
    return base;
  } catch (e) {
    return new Date(slot.date + "T00:00:00");
  }
}

const Appointment = () => {
  const isAdmin = true;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSpeciality, setFilterSpeciality] = useState("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const q = query.trim();
        const url = `${API_BASE}/api/appointments?limit=2000${
          q ? `&search=${encodeURIComponent(q)}` : ""
        }`;
        const res = await fetch(url);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Failed to fetch (${res.status})`);
        }
        const data = await res.json();
        const items = (data?.appointments || []).map((a) => {
          const doctorName =
            (a.doctorId && a.doctorId.name) || a.doctorName || "";
          const speciality =
            (a.doctorId && a.doctorId.specialization) ||
            a.speciality ||
            a.specialization ||
            "General";
          const fee = typeof a.fees === "number" ? a.fees : a.fee || 0;
          return {
            id: a._id || a.id,
            patientName: a.patientName || "",
            age: a.age || "",
            gender: a.gender || "",
            mobile: a.mobile || "",
            doctorName,
            speciality,
            fee,
            slot: {
              date: a.date || (a.slot && a.slot.date) || "",
              time: a.time || (a.slot && a.slot.time) || "00:00 AM",
            },
            status: a.status || (a.payment && a.payment.status) || "Pending",
            raw: a, // keep original in case we need it
          };
        });
        setAppointments(items);
      } catch (err) {
        console.error("Load appointments error:", err);
        setError(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const specialities = useMemo(() => {
    const set = new Set(appointments.map((a) => a.speciality || "General"));
    return ["all", ...Array.from(set)];
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter((a) => {
      if (
        filterSpeciality !== "all" &&
        (a.speciality || "").toLowerCase() !== filterSpeciality.toLowerCase()
      )
        return false;
      if (filterDate && a.slot?.date !== filterDate) return false;
      if (!q) return true;
      return (
        (a.doctorName || "").toLowerCase().includes(q) ||
        (a.speciality || "").toLowerCase().includes(q) ||
        (a.patientName || "").toLowerCase().includes(q) ||
        (a.mobile || "").toLowerCase().includes(q)
      );
    });
  }, [appointments, query, filterDate, filterSpeciality]);

  const sortedFiltered = useMemo(() => {
    return filtered.slice().sort((a, b) => {
      const da = dateTimeFromSlot(a.slot).getTime();
      const db = dateTimeFromSlot(b.slot).getTime();
      return db - da;
    });
  }, [filtered]);

  const displayed = useMemo(
    () => (showAll ? sortedFiltered : sortedFiltered.slice(0, 8)),
    [sortedFiltered, showAll],
  );

  //if admin want to cancel
  async function adminCancelAppointment(id) {
    const appt = appointments.find((x) => x.id === id);
    if (!appt) return;

    const statusLower = (appt.status || "").toLowerCase();
    const isCancelled =
      statusLower === "cancelled" || statusLower === "cancelled";
    const isCompleted = statusLower === "completed";

    if (isCancelled || isCompleted) return;

    const ok = window.confirm(
      `As admin, mark appointment for ${appt.patientName} with ${
        appt.doctorName
      } on ${formatDateISO(appt.slot.date)} at ${appt.slot.time} as CANCELLED?`,
    );
    if (!ok) return;

    try {
      setAppointments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "Cancelled" } : p)),
      );
      setShowAll(true);

      const res = await fetch(`${API_BASE}/api/appointments/${id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Cancel failed (${res.status})`);
      }
      const data = await res.json();
      const updated = data?.appointment || data?.appointments || null;
      if (updated) {
        setAppointments((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: updated.status || "Cancelled",
                  slot: {
                    date: updated.date || p.slot.date,
                    time: updated.time || p.slot.time,
                  },
                  raw: updated,
                }
              : p,
          ),
        );
      }
    } catch (err) {
      console.error("Cancel error:", err);
      setError(err.message || "Failed to cancel appointment");
      try {
        const reload = await fetch(`${API_BASE}/api/appointments?limit=200`);
        if (reload.ok) {
          const body = await reload.json();
          const items = (body?.appointments || []).map((a) => ({
            id: a._id || a.id,
            patientName: a.patientName || "",
            age: a.age || "",
            gender: a.gender || "",
            mobile: a.mobile || "",
            doctorName: (a.doctorId && a.doctorId.name) || a.doctorName || "",
            speciality:
              (a.doctorId && a.doctorId.specialization) ||
              a.speciality ||
              a.specialization ||
              "General",
            fee: typeof a.fees === "number" ? a.fees : a.fee || 0,
            slot: {
              date: a.date || (a.slot && a.slot.date) || "",
              time: a.time || (a.slot && a.slot.time) || "00:00 AM",
            },
            status: a.status || (a.payment && a.payment.status) || "Pending",
            raw: a,
          }));
          setAppointments(items);
        }
      } catch (error) {}
    }
  }

  return (
    <div className="min-h-screen font-serif bg-emerald-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <style>{`
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px) scale(.995); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
`}</style>
      <div className="max-w-350 mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-semibold text-emerald-800">
              Appointments
            </h1>
            <p className="text-xs sm:text-sm text-emerald-600">
              Manage and Search upcoming patient appointments.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <div className="flex flex-col  sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center bg-white rounded-full px-3 py-2 shadow-sm w-full sm:w-72">
                <Search size={16} className="text-emerald-400" />
                <input
                  className="ml-3 w-full outline-none text-emerald-700 placeholder-emerald-400 bg-transparent text-sm"
                  placeholder="Search doctor,patient,speciality or mobile "
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center flex-col md:flex-row lg:flex-row gap-2 w-full sm:w-auto">
                <div className="bg-white rounded-full px-3 py-2 shadow-sm flex items-center gap-2 w-full sm:w-auto">
                  <Calendar size={14} className="text-emerald-400" />
                  <input
                    type="date"
                    className="text-sm outline-none text-emerald-700 bg-transparent w-full"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>

                <select
                  className="text-sm px-3 py-2 cursor-pointer rounded-full bg-emerald-100 shadow-sm outline-emerald-300 w-full sm:w-auto"
                  value={filterSpeciality}
                  onChange={(e) => setFilterSpeciality(e.target.value)}
                >
                  {specialities.map((s) => (
                    <option value={s} key={s}>
                      {s === "all" ? "All Specialities" : s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setQuery("");
                    setFilterDate("");
                    setFilterSpeciality("all");
                    setShowAll(false);
                    setError(null);
                  }}
                  className="ml-0 sm:ml-2 px-3 cursor-pointer py-2 rounded-full bg-emerald-600 text-white text-sm shadow-sm hover:opacity-95 transition w-full sm:w-auto"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </header>
        {loading ? (
          <div className="col-span-full text-center text-emerald-600 py-12 rounded-lg bg-white/60 border border-emerald-100">
            Loading...
          </div>
        ) : error ? (
          <div className="col-span-full text-center text-rose-600 py-6 rounded-lg bg-white/60 border border-rose-100">
            {error}
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className="col-span-full text-center text-emerald-600 py-12 rounded-lg bg-white/60 border border-emerald-100">
            No appointments found.
          </div>
        ) : (
          <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayed.map((a, idx) => {
              const statusLower = (a.status || "").toLowerCase();
              const isCancelled =
                statusLower === "Cancelled" || statusLower === "Cancelled";
              const isCompleted = statusLower === "Completed";
              const isDisabled = isCancelled || isCompleted;

              return (
                <div
                  key={a.id}
                  style={{
                    animation: `fadeUp 420ms cubic-bezier(.2,.9,.2,1) forwards`,
                    animationDelay: `${idx * 70}ms`,
                    opacity: 0,
                  }}
                  className="bg-white rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm border border-emerald-100 flex flex-col gap-3 hover:shadow-md transform hover:-translate-y-1 transition"
                >
                  <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm border border-emerald-100 flex flex-col gap-3 hover:shadow-md transform hover:-translate-y-1 transition">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-medium text-emerald-800 truncate">
                          {a.patientName}
                        </h3>

                        <div className="text-xs sm:text-sm text-emerald-500 flex items-center gap-2">
                          <span>{a.age ? `${a.age} yrs` : ""}</span>
                          <span> {a.age ? ":" : ""} </span>
                          <span>{a.gender}</span>
                          <span className="hidden md:inline"> : </span>
                          <span className=" max-w-30">{a.mobile}</span>
                        </div>
                      </div>

                      <div className="mt-1 text-xs sm:text-sm text-emerald-600 truncate">
                        {a.doctorName} :{" "}
                        <span className="font-medium text-emerald-700">
                          {a.speciality}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-nd lg:pt-3 lg:justify-start flex items-center font-bold text-emerald-700 text-xs sm:text-sm">
                        Fees
                      </div>
                      <div className="text-lg sm:text-xl font-semibold lg:justify-start text-emerald-800 flex items-center justify-end gap-1">
                        <BadgeIndianRupee size={16} />
                        <span>{a.fee}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="inline-flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      <Calendar size={14} className="text-emerald-400" />
                      <span>
                        {formatDateISO(a.slot.date)} — {a.slot.time}
                      </span>
                    </div>

                    <div
                      className={`"text-xs px-3 py-1 rounded-full`}
                    >
                      {a.status ? a.status.toUpperCase() : "PENDING"}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => adminCancelAppointment(a.id)}
                          title={
                            isDisabled
                              ? isCompleted
                                ? "Cannot cancel a completed appointment"
                                : "Already cancelled"
                              : "Admin Cancel (mark as cancelled)"
                          }
                          disabled={isDisabled}
                          aria-disabled={isDisabled}
                          className={`px-3 py-2 cursor-pointer rounded-full text-sm flex items-center gap-2 transition ${
                            isDisabled
                              ? "bg-rose-50 text-rose-400 opacity-60 cursor-not-allowed"
                              : "bg-rose-50 text-rose-700 hover:scale-105"
                          }`}
                        >
                          {isDisabled
                            ? isCompleted
                              ? "Completed"
                              : "Admin Cancelled"
                            : "Admin Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </main>
        )}
        {sortedFiltered.length > 8 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowAll((s) => !s)}
              className="px-4 py-2 cursor-pointer rounded-full bg-white border border-emerald-200 shadow-sm hover:shadow-md transition"
            >
              {showAll
                ? "Show Less"
                : `Show More (${sortedFiltered.length - 8})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointment;
