import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarRange,
  CheckCircle,
  Search,
  UserRoundCheck,
  Users,
  XCircle,
} from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_API_BASE || "http://localhost:3000"
).replace(/\/$/, "");
const PATIENT_COUNT_API = `${API_BASE}/api/appointments/patients/count`;

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function normalizeDoctor(doc) {
  const id = doc._id || doc.id || String(Math.random()).slice(2);
  const name =
    doc.name ||
    doc.fullName ||
    `${doc.firstName || ""} ${doc.lastName || ""}`.trim() ||
    "Unknown";
  const specialization =
    doc.specialization ||
    doc.speciality ||
    (Array.isArray(doc.specializations)
      ? doc.specializations.join(", ")
      : "") ||
    "General";
  const fee = safeNumber(
    doc.fee ?? doc.fees ?? doc.consultationFee ?? doc.consultation_fee ?? 0,
    0,
  );
  const image =
    doc.imageUrl ||
    doc.image ||
    doc.avatar ||
    `https://i.pravatar.cc/150?u=${id}`;

  const appointments = {
    total:
      doc.appointments?.total ??
      doc.totalAppointments ??
      doc.appointmentsTotal ??
      0,
    completed:
      doc.appointments?.completed ??
      doc.completedAppointments ??
      doc.appointmentsCompleted ??
      0,
    cancelled:
      doc.appointments?.cancelled ??
      doc.cancelledAppointments ??
      doc.appointmentsCancelled ??
      0,
  };

  let earnings = null;
  if (doc.earnings !== undefined && doc.earnings !== null)
    earnings = safeNumber(doc.earnings, 0);
  else if (doc.revenue !== undefined && doc.revenue !== null)
    earnings = safeNumber(doc.revenue, 0);
  else if (appointments.completed && fee)
    earnings = fee * safeNumber(appointments.completed, 0);
  else earnings = 0;

  return {
    id,
    name,
    specialization,
    fee,
    image,
    appointments,
    earnings,
    raw: doc,
  };
}

const Dashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // new patient count
  const [patientCount, setPatientCount] = useState(null);
  const [patientCountLoading, setPatientCountLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [showAll, setshowAll] = useState(false);

  // to load doctors from the server
  useEffect(() => {
    let mounted = true;
    async function loadDoctors() {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/api/doctors?limit=200`;
        console.log("Fetching doctors from:", url);
        const res = await fetch(url);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.message || `Failed to fetch doctors (${res.status})`,
          );
        }
        const body = await res.json();
        let list = [];
        if (Array.isArray(body)) list = body;
        else if (Array.isArray(body.doctors)) list = body.doctors;
        else if (Array.isArray(body.data)) list = body.data;
        else if (Array.isArray(body.items)) list = body.items;
        else {
          const firstArray = Object.values(body).find((v) => Array.isArray(v));
          if (firstArray) list = firstArray;
        }
        const normalized = list.map((d) => normalizeDoctor(d));
        if (mounted) setDoctors(normalized);
      } catch (err) {
        console.error("Failed to load doctors:", err);
        if (mounted) {
          setError(err.message || "Failed to load doctors");
          setDoctors([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDoctors();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadPatientCount() {
      setPatientCountLoading(true);
      try {
        console.log("Fetching patient count from:", PATIENT_COUNT_API);
        const res = await fetch(PATIENT_COUNT_API);
        if (!res.ok) {
          console.warn("Patient count fetch failed:", res.status);
          if (mounted) setPatientCount(0);
          return;
        }

        const body = await res.json().catch(() => ({}));
        const count = Number(
          body?.count ?? body?.totalUsers ?? body?.data ?? 0,
        );
        if (mounted) setPatientCount(isNaN(count) ? 0 : count);
      } catch (err) {
        console.error("Failed to fetch patient count:", err);
        if (mounted) setPatientCount(0);
      } finally {
        if (mounted) setPatientCountLoading(false);
      }
    }
    loadPatientCount();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const totalDoctors = doctors.length;
    const totalAppointments = doctors.reduce(
      (s, d) => s + safeNumber(d.appointments?.total, 0),
      0,
    );
    const totalEarnings = doctors.reduce(
      (s, d) => s + safeNumber(d.earnings, 0),
      0,
    );
    const completed = doctors.reduce(
      (s, d) => s + safeNumber(d.appointments?.completed, 0),
      0,
    );
    const cancelled = doctors.reduce(
      (s, d) => s + safeNumber(d.appointments?.cancelled, 0),
      0,
    );
    const totalLoginPatients =
      doctors.reduce((s, d) => s + (d.raw?.loginPatientsCount ?? 0), 0) || 0;
    return {
      totalDoctors,
      totalAppointments,
      totalEarnings,
      completed,
      cancelled,
      totalLoginPatients,
    };
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    if (!query) return doctors;
    const q = query.trim().toLowerCase();
    const qNum = Number(q);
    return doctors.filter((d) => {
      if (d.name.toLowerCase().includes(q)) return true;
      if ((d.specialization || "").toLowerCase().includes(q)) return true;
      if (d.fee.toString().includes(q)) return true;
      if (!Number.isNaN(qNum) && d.fee <= qNum) return true;
      return false;
    });
  }, [doctors, query]);

  const INITIAL_COUNT = 8;
  const visibleDoctors = showAll
    ? filteredDoctors
    : filteredDoctors.slice(0, INITIAL_COUNT);

  return (
    <div className="min-h-screen font-serif p-4 sm:p-6 bg-linear-to-br from-green-50 via-green-100 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Dashboard
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Overview of doctors & appointments.
            </p>
          </div>
        </div>
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Doctors"
            value={totals.totalDoctors}
          />
          <StatCard
            icon={<UserRoundCheck className="w-6 h-6" />}
            label="Total Registered Users"
            value={
              patientCountLoading
                ? "Loading..."
                : (patientCount ?? totals.totalLoginPatients)
            }
          />
          <StatCard
            icon={<CalendarRange className="w-6 h-6" />}
            label="Total Appointments"
            value={totals.totalAppointments}
          />
          <StatCard
            icon={<BadgeIndianRupee className="w-6 h-6" />}
            label="Total Earnings"
            value={`${totals.totalEarnings.toLocaleString()}`}
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Completed"
            value={totals.completed}
          />
          <StatCard
            icon={<XCircle className="w-6 h-6" />}
            label="Cancelled"
            value={totals.cancelled}
          />
        </div>

        <div className="mb-6">
          <label className="block text-lg text-slate-600 mb-2">
            Search Doctors
          </label>
          <div className="flex items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full shadow-sm border border-green-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-200 w-full"
                placeholder="Search name, specialization, fees"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-green-500" />
            </div>
            <button
              onClick={() => {
                setQuery("");
                setshowAll(false);
              }}
              className="px-3 py-2 bg-green-500 text-white rounded-full shadow hover:bg-green-600 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-green-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Doctors</h2>
            <p className="text-sm text-slate-500">
              {loading
                ? "Loading..."
                : `Showing ${visibleDoctors.length} of ${filteredDoctors.length}`}
            </p>
          </div>
          {error && (
            <div className="px-6 py-4 border-b border-green-50 text-sm text-rose-600">
              Error in loading doctors : {error}
            </div>
          )}

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-green-50">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Fees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Appointments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Cancelled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Total Earnings
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-50">
                {visibleDoctors.map((d, idx) => (
                  <tr
                    key={d.id}
                    className={`group transform transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${idx % 2 === 0 ? "bg-white" : "bg-green-50/40"}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-4">
                      <div className="w-1 h-12 rounded-md mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-b from-emerald-400 to-green-200" />
                      <img
                        src={d.image}
                        alt={d.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-green-100"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {d.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          ID: {d.id}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {d.specialization}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-700">
                      ₹ {d.fee}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-700">
                      {d.appointments.total}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-emerald-600">
                      {d.appointments.completed}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-rose-500">
                      {d.appointments.cancelled}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-800">
                      ₹ {d.earnings.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden px-4 py-4">
            <div className="space-y-3">
              {visibleDoctors.map((d) => (
                <MobileDoctorCard key={d.id} d={d} />
              ))}
            </div>
          </div>
          {filteredDoctors.length > INITIAL_COUNT && (
            <div className="px-6 py-4 border-t border-green-50 flex justify-center">
              <button
                onClick={() => setshowAll((s) => !s)}
                className="px-4 py-2 rounded-full bg-white border border-green-200 shadow-sm hover:bg-green-50 transition cursor-pointer"
              >
                {showAll
                  ? "Show Less"
                  : `Show More (${filteredDoctor.length - INITIAL_COUNT})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

function StatCard({ icon, label, value }) {
  return (
    <div className="p-4 rounded-full bg-linear-to-br from-emerald-100 to-emerald-50 shadow-sm border border-green-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/80 rounded-full shadow-inner">{icon}</div>
        <div className="flex-1">
          <div className="text-sm text-slate-600">{label}</div>
          <div className="text-xl font-semibold text-slate-800">{value}</div>
        </div>
      </div>
    </div>
  );
}

function MobileDoctorCard({ d }) {
  return (
    <div className="bg-white rounded-xl shadow p-3 border border-green-50 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <img
          src={d.image}
          alt={d.name}
          className="w-12 h-12 rounded-full object-cover"
        />

        <div>
          <div className="text-sm font-medium text-slate-800">{d.name}</div>
          <div className="text-xs text-slate-500">{d.specialization}</div>
        </div>
      </div>

      <div className="mt-2 text-sm text-slate-700 font-semibold">
        ₹ {Number(d.fee || 0).toLocaleString()}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xs text-slate-500">Appts</div>
          <div className="text-sm font-semibold text-slate-800">
            {d.appointments?.total || 0}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">Done</div>
          <div className="text-sm font-semibold text-slate-800">
            {d.appointments?.completed || 0}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">Cancelled</div>
          <div className="text-sm font-semibold text-slate-800">
            {d.appointments?.cancelled || 0}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
        <div>Earned</div>
        <div className="font-semibold">
          ₹ {Number(d.earnings || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
