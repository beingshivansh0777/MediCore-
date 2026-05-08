import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import {
  BadgeIndianRupee,
  Eye,
  EyeClosed,
  Search,
  Star,
  Trash,
  Users,
  Users2,
} from "lucide-react";

function formatDateISO(iso) {
  if (!iso || typeof iso !== "string") return iso;
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(Number(d));
  const month = monthNames[dateObj.getMonth()] || "";
  return `${day} ${month} ${y}`;
}

function normalizeToDateString(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().split("T")[0];
}

function buildScheduleMap(schedule) {
  const map = {};
  if (!schedule || typeof schedule !== "object") return map;

  Object.entries(schedule).forEach(([k, v]) => {
    const nd = normalizeToDateString(k) || String(k);
    map[nd] = Array.isArray(v) ? v.slice() : [];
  });

  return map;
}

function getSortedScheduleDates(scheduleMap) {
  return Object.keys(scheduleMap).sort((a, b) => new Date(a) - new Date(b));
}

const List = () => {
  const API_BASE = import.meta.env.VITE_API_BASE;

  const [doctors, setDoctors] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async function fetchDoctors() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctors`);
      const body = await res.json().catch(() => null);

      if (res.ok && body?.success) {
        const list = Array.isArray(body.data)
          ? body.data
          : Array.isArray(body.doctors)
            ? body.doctors
            : [];

        const normalized = list.map((d) => ({
          ...d,
          schedule: buildScheduleMap(d.schedule || {}),
        }));

        setDoctors(normalized);
      } else {
        console.error("Failed to fetch doctors", res.status, body);
        setDoctors([]);
      }
    } catch (err) {
      console.error("Network error while fetching doctors", err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDoctors();
  }, []);

  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = doctors;

    if (filterStatus === "available") {
      list = list.filter(
        (d) => (d.availability || "").toLowerCase() === "available",
      );
    } else if (filterStatus === "unavailable") {
      list = list.filter(
        (d) => (d.availability || "").toLowerCase() !== "available",
      );
    }

    if (!q) return list;

    return list.filter(
      (d) =>
        (d.name || "").toLowerCase().includes(q) ||
        (d.specialization || "").toLowerCase().includes(q),
    );
  }, [doctors, query, filterStatus]);

  const displayed = useMemo(() => {
    return showAll ? filtered : filtered.slice(0, 6);
  }, [filtered, showAll]);

  function toggle(id) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  async function removeDoctor(id) {
    const doc = doctors.find((d) => (d._id || d.id) === id);
    if (!doc) return;

    const ok = window.confirm(`Delete ${doc.name}?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/doctors/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        alert(body?.message || "Failed to delete");
        return;
      }

      setDoctors((prev) => prev.filter((p) => (p._id || p.id) !== id));

      if (expanded === id) setExpanded(null);
    } catch (err) {
      console.error("Delete error", err);
      alert("Network error while deleting doctor");
    }
  }

  function applyStatusFilter(status) {
    setFilterStatus((prev) => (prev === status ? "all" : status));
    setExpanded(null);
    setShowAll(false);
  }

  return (
    <div className="min-h-screen font-serif bg-emerald-50 p-4 sm:p-6 md:p-8">
      <header className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white shadow-sm">
              <Users size={20} className="text-emerald-600" />
            </div>

            <div>
              <h1 className="text-lg font-semibold text-emerald-800">
                Find a Doctor
              </h1>
              <p className="text-sm text-emerald-600">
                Search by name or specialization
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center bg-white rounded-full px-3 py-2 shadow-sm w-full sm:w-72">
              <Search size={16} className="text-emerald-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctors, specialization"
                className="ml-3 w-full outline-none text-emerald-700 placeholder-emerald-400 bg-transparent"
              />
            </div>

            <button
              onClick={() => {
                setQuery("");
                setExpanded(null);
                setShowAll(false);
                setFilterStatus("all");
              }}
              className="px-3 py-2 cursor-pointer rounded-full bg-emerald-600 text-white shadow hover:opacity-95 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* FILTER BUTTONS */}
        <div className="flex flex-wrap gap-2 pt-5">
          <button
            onClick={() => applyStatusFilter("available")}
            className={`text-xs px-3 py-1 rounded-full transition border ${
              filterStatus === "available"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-emerald-700 border-emerald-200"
            }`}
          >
            Available
          </button>

          <button
            onClick={() => applyStatusFilter("unavailable")}
            className={`text-xs px-3 py-1 rounded-full transition border ${
              filterStatus === "unavailable"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-red-600 border-red-100"
            }`}
          >
            Unavailable
          </button>
        </div>
      </header>

      <main className="max-w-6xl grid xl:grid-cols-2 lg:grid-cols-2 lg:gap-3 xl:gap-4 mx-auto space-y-4">
        {loading && (
          <div className="text-center text-emerald-600 py-8">
            Loading Doctors Profile.....
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center text-emerald-600 py-8">
            Doctors not found.
          </div>
        )}

        {displayed.map((doc) => {
          const id = doc._id || doc.id;
          const isOpen = expanded === id;
          const isAvailable =
            (doc.availability || "").toLowerCase() === "available";

          const scheduleMap = doc.schedule;
          const sortedDates = getSortedScheduleDates(scheduleMap);

          return (
            <article
              key={id}
              className="bg-linear-to-r from-emerald-100/50 to-white rounded-2xl shadow-md border border-emerald-100 overflow-hidden transition-all duration-300"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-row-reverse sm:flex-row items-center gap-3 p-3 sm:p-4">
                  <img
                    src={doc.imageUrl || doc.image || ""}
                    alt={doc.name}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover border border-emerald-200 shadow-sm"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-lg text-emerald-800 font-medium truncate">
                            {doc.name}
                          </h3>

                          <span
                            className={`inline-flex items-center gap-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                              isAvailable
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isAvailable ? "bg-emerald-600" : "bg-red-600"
                              }`}
                            />
                            {isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm text-emerald-600 truncate mt-1">
                          {doc.specialization} • {doc.experience} years
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 sm:mt-0 sm:ml-4">
                        <div className="text-sm text-emerald-700 flex items-center gap-1">
                          <Star size={14} />
                          {doc.rating}
                        </div>
                        <button
                          onClick={() => toggle(id)}
                          className="transition-transform duration-200 hover:scale-110"
                        >
                          {isOpen ? <Eye size={18} /> : <EyeClosed size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="text-xs text-emerald-500">Patients</div>
                      <div className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                        <Users2 size={14} /> {doc.patients}
                      </div>
                      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeDoctor(id)}
                            className="px-3 py-1 cursor-pointer rounded-full bg-red-50 text-red-600 text-xs flex items-center gap-2 transition"
                          >
                            <Trash size={14} /> Delete
                          </button>
                        </div>

                        <div className="text-md font-bold text-emerald-700">
                          Fees :
                        </div>
                        <div className="text-sm text-emerald-800 font-medium flex items-center gap-1">
                          <BadgeIndianRupee /> {doc.fee}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="px-4 md:px-5 bg-white overflow-auto sm:overflow-visible"
                style={{
                  maxHeight: isOpen ? (isMobileScreen ? 320 : 600) : 0,
                  transition:
                    "max-height 420ms cubic-bezier(.2,.9,.2,1), padding 220ms ease",
                  paddingTop: isOpen ? 16 : 0,
                  paddingBottom: isOpen ? 16 : 0,
                }}
              >
                {isOpen && (
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${
                      isOpen ? "block" : "hidden"
                    }`}
                  >
                    <div className="col-span-2">
                      <h4 className="text-md font-bold text-emerald-700 mb-1">
                        About
                      </h4>
                      <p className="text-sm text-emerald-600 wrap-break-words whitespace-normal">
                        {doc.about}
                      </p>

                      <div className="mt-4">
                        <div className="text-md text-emerald-700 font-bold">
                          Qualifications
                        </div>
                        <div className="text-sm text-emerald-600 wrap-break-words whitespace-normal">
                          {doc.qualifications}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-md text-emerald-700 font-bold">
                          Schedule
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sortedDates.map((date) => {
                            const slots = scheduleMap[date] || [];
                            return (
                              <div key={date} className="min-w-full md:min-w-0">
                                <div className="text-xs text-emerald-500">
                                  {formatDateISO(date)}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {slots.map((s, i) => (
                                    <span
                                      key={i}
                                      className="text-xs px-3 py-1 rounded-full border border-emerald-100 shadow-sm wrap-break-words"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <aside className="col-span-1 flex flex-col sm:flex-row md:flex-col xl:flex-col lg:flex-col gap-3 items-start md:items-end">
                      <div className="text-md text-emerald-700 font-bold">
                        Success
                      </div>
                      <div className="text-sm text-emerald-700">
                        {doc.success}%
                      </div>

                      <div className="text-md text-emerald-700 font-bold">
                        Patients
                      </div>
                      <div className="text-sm text-emerald-700">
                        {doc.patients}
                      </div>

                      <div className="text-md text-emerald-700 font-bold">
                        Location
                      </div>
                      <div className="text-sm sm:whitespace-nowrap whitespace-normal text-emerald-700">
                        {doc.location}
                      </div>
                    </aside>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        {filtered.length > 6 && (
          <div className="col-span-full flex justify-center mt-4">
            <button
              onClick={() => showAll((s) => !s)}
              className="px-5 py-2 cursor-pointer rounded-full bg-white border border-emerald-300 shadow-sm hover:shadow-md transition"
            >
              {showAll ? "Show Less" : `Show More (${filtered.length - 4})`}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default List;
