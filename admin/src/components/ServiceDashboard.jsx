import {
  BadgeIndianRupee,
  Calendar,
  CheckCheckIcon,
  CheckCircle,
  ClipboardList,
  Search,
  XCircle,
  XCircleIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

function normalizeService(doc) {
  if (!doc) return null;
  const id = doc._id || doc.id || String(Math.random()).slice(2);
  const name = doc.name || doc.title || doc.serviceName || "Untitled Service";
  const price =
    Number(doc.price ?? doc.fee ?? doc.fees ?? doc.cost ?? doc.amount) || 0;
  const image =
    doc.imageUrl ||
    doc.image ||
    doc.avatar ||
    `https://i.pravatar.cc/150?u=${id}`;
  // various possible stat shapes
  const totalAppointments =
    doc.totalAppointments ??
    doc.appointments?.total ??
    doc.count ??
    doc.stats?.total ??
    doc.bookings ??
    0;
  const completed =
    doc.completed ??
    doc.appointments?.completed ??
    doc.stats?.completed ??
    doc.completedAppointments ??
    0;
  const canceled =
    doc.canceled ??
    doc.appointments?.canceled ??
    doc.stats?.canceled ??
    doc.canceledAppointments ??
    0;

  return {
    id,
    name,
    price,
    image,
    totalAppointments: Number(totalAppointments) || 0,
    completed: Number(completed) || 0,
    canceled: Number(canceled) || 0,
    raw: doc,
  };
}

const API_BASE = import.meta.env.VITE_API_BASE;

const ServiceDashboard = ({ services: servicesProp = null }) => {
  const [services, setServices] = useState(
    Array.isArray(servicesProp) ? servicesProp.map(normalizeService) : [],
  );
  const [loading, setLoading] = useState(!Array.isArray(servicesProp));
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const pollHandleRef = useRef(null);

  function buildFetchOptions() {
    const opts = {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    };
    const token = localStorage.getItem("authToken");
    if (token) opts.headers["Authorization"] = `Bearer ${token}`;
    return opts;
  }
  // fetch the services
  async function fetchServices({ showLoading = true } = {}) {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      const url = `${API_BASE}/api/service-appointments/stats`;
      const res = await fetch(url, buildFetchOptions());
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Failed to fetch services (${res.status})`,
        );
      }
      const body = await res.json();

      let list = [];
      if (Array.isArray(body)) list = body;
      else if (Array.isArray(body.services)) list = body.services;
      else if (Array.isArray(body.data)) list = body.data;
      else if (Array.isArray(body.items)) list = body.items;
      else {
        const maybeArray = Object.values(body).find((v) => Array.isArray(v));
        if (maybeArray) list = maybeArray;
      }

      const normalized = (list || []).map(normalizeService).filter(Boolean);
      if (mountedRef.current) {
        setServices(normalized);
        setError(null);
      }
    } catch (err) {
      console.error("Error while fetching services:", err);
      if (mountedRef.current) {
        setError(err.message || "Failed to load services");
      }
    } finally {
      if (mountedRef.current && showLoading) setLoading(false);
      fetchingRef.current = false;
    }
  }

  useEffect(() => {
    window.refreshServices = () => fetchServices({ showLoading: true });
    return () => {
      try {
        delete window.refreshServices;
      } catch {}
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (Array.isArray(servicesProp)) {
      setServices(servicesProp.map(normalizeService));
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    fetchServices({ showLoading: true });
    function startPolling() {
      if (pollHandleRef.current) return;
      pollHandleRef.current = setInterval(() => {
        if (document.visibilityState === "visible")
          fetchServices({ showLoading: false });
      }, 10000);
    }

    function stopPolling() {
      if (pollHandleRef.current) {
        clearInterval(pollHandleRef.current);
        pollHandleRef.current = null;
      }
    }

    startPolling();
    //refresh the onfocus
    function onFocus() {
      fetchServices({ showLoading: false });
    }
    window.addEventListener("focus", onFocus);

    function onServicesUpdated() {
      fetchServices({ showLoading: false });
    }
    window.addEventListener("services:updated", onServicesUpdated);

    function onStorage(e) {
      if (e?.key === "service_bookings_updated") {
        fetchServices({ showLoading: false });
      }
    }
    window.addEventListener("storage", onStorage);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchServices({ showLoading: false });
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mountedRef.current = false;
      stopPolling();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("services:updated", onServicesUpdated);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [servicesProp]);

  //tptal stats summary
  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;
    const qNum = Number(q);
    return services.filter((s) => {
      if (s.name.toLowerCase().includes(q)) return true;
      if (!Number.isNaN(qNum) && s.price <= qNum) return true;
      if (s.price.toString().includes(q)) return true;
      return false;
    });
  }, [services, searchQuery]);

  const INITIAL_COUNT = 8;
  const visibleServices = showAll
    ? filteredServices
    : filteredServices.slice(0, INITIAL_COUNT);

  const totals = useMemo(() => {
    return filteredServices.reduce(
      (acc, s) => {
        acc.totalServices += 1;
        acc.totalAppointments += s.totalAppointments;
        acc.totalCompleted += s.completed;
        acc.totalCanceled += s.canceled;
        acc.totalEarning += s.completed * s.price;
        return acc;
      },
      {
        totalServices: 0,
        totalAppointments: 0,
        totalCompleted: 0,
        totalCanceled: 0,
        totalEarning: 0,
      },
    );
  }, [filteredServices]);

  function formatCurrency(v) {
    return `₹${Number(v || 0).toLocaleString()}`;
  }

  return (
    <div className="min-h-screen font-serif p-4 sm:p-6 bg-linear-to-b from-emerald-50 via-emerald-25 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center md:items-center justify-between mb-6 gap-3 md:gap-6 lg:gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-emerald-800">
              Service Dashboard
            </h1>
            <p className="text-sm text-green-600">
              Overview of services,appointments and earnings
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex items-center gap-3">
            <div className="text-xs text-slate-600">
              {loading ? "Loading..." : `${filteredServices.length} services`}
            </div>

            <button
              className={`px-3 py-1 rounded-full text-sm ${
                Array.isArray(servicesProp)
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-white text-emerald-600 border border-emerald-200 hover:shadow-sm"
              }`}
              onClick={() => {
                if (Array.isArray(servicesProp)) return;
                fetchServices({ showLoading: true });
              }}
              title={
                Array.isArray(servicesProp)
                  ? "Service provided by parent components"
                  : "Refresh"
              }
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={<ClipboardList size={18} />}
            label={"Total Services"}
            value={totals.totalServices}
          />
          <StatCard
            icon={<Calendar size={18} />}
            label={"Total Appointments"}
            value={totals.totalAppointments}
          />
          <StatCard
            icon={<BadgeIndianRupee size={18} />}
            label={"Total Earning"}
            value={formatCurrency(totals.totalEarning)}
          />
          <StatCard
            icon={<CheckCheckIcon size={18} />}
            label={"Completed"}
            value={totals.totalCompleted}
          />
          <StatCard
            icon={<XCircleIcon size={18} />}
            label={"Cancelled"}
            value={totals.totalCanceled}
          />
        </div>
        {/* Search bar */}
        <div className="mb-6 flex justify-start">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-emerald-200 w-full sm:w-64">
            <Search size={18} className="text-emerald-700" />
            <input
              type="text"
              placeholder="Search Services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm outline-none"
            />
            {searchQuery.length > 0 && (
              <XCircleIcon
                size={16}
                className="text-red-500 cursor-pointer"
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>
        </div>
        {/* table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-b border-transparent">
          <div className="hidden md:grid lg:hidden grid-cols-5 items-center gap-6 px-4 py-3 text-sm text-gray-600 bg-emerald-50">
            <div className="text-center text-xs font-medium">Service</div>
            <div className="text-center text-xs font-medium">Appointments</div>
            <div className="text-center text-xs font-medium">Completed</div>
            <div className="text-center text-xs font-medium">Cancelled</div>
            <div className="text-center text-xs font-medium">Earning</div>
          </div>
          <div className="hidden lg:grid md:text-xs lg:text-xs xl:text-md grid-cols-12 items-center gap-4 px-4 py-3 text-sm text-gray-600 bg-emerald-50">
            <div className="col-span-5">Service</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-1 text-center text-xs font-medium">
              Appointments
            </div>
            <div className="col-span-1 text-center text-xs font-medium">
              Completed
            </div>
            <div className="col-span-1 text-center text-xs font-medium">
              Canceled
            </div>
            <div className="col-span-2 text-right">Earning</div>
          </div>

          <div className="divide-y divide-transparent min-w-full">
            {loading ? (
              <div className="px-4 py-6 text-center text-gray-500">
                Loading Services...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-center text-rose-600">
                Error : {error}
              </div>
            ) : visibleServices.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                No services found
              </div>
            ) : (
              visibleServices.map((s) => {
                const earning = s.completed * s.price;
                return (
                  <div
                    key={s.id}
                    className="px-4 py-4 font-serif hover:shadow-md transition bg-white md:bg-transparent"
                  >
                    <div className="hidden md:grid lg:hidden grid-cols-5 items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 ring-1 ring-emerald-100">
                          <img
                            src={s.image}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-emerald-800 whitespace-nowrap">
                            {s.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(s.price)}
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-sm">
                        {s.totalAppointments}
                      </div>
                      <div className="text-center text-sm text-emerald-700">
                        {s.completed}
                      </div>
                      <div className="text-center text-sm text-red-500">
                        {s.canceled}
                      </div>
                      <div className=" text-sm text-right">
                        {formatCurrency(earning)}
                      </div>
                    </div>
                    <div className="hidden lg:grid grid-cols-12 items-center gap-4">
                      <div className="col-span-5 flex items-center gap-4 ">
                        <div className="w-16 h-16 rounded-xl overflow-hidden ring-1 ring-emerald-100 bg-gray-200">
                          <img
                            src={s.image}
                            alt={s.image}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold md:text-xs lg:text-lg xl:text-lg text-emerald-800">
                          {s.name}
                        </h3>
                      </div>
                      <div className="col-span-2">
                        {formatCurrency(s.price)}
                      </div>
                      <div className="col-span-1 text-center">
                        {s.totalAppointments}
                      </div>
                      <div className="col-span-1 text-center">
                        {s.completed}
                      </div>
                      <div className="col-span-1 text-center">{s.canceled}</div>
                      <div className="col-span-2 text-right">
                        {formatCurrency(earning)}
                      </div>
                    </div>
                    {/* for mobile view */}
                    <div className="md:hidden flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 ring-1 ring-emerald-100">
                          <img
                            src={s.image}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold text-xs text-emerald-800">
                              {s.name}
                            </h3>
                            <div className="text-sm font-medium">
                              {formatCurrency(s.price)}
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-2 bg-emerald-50 px-2 py-1 rounded-full ring-1 ring-emerald-100">
                              <Calendar size={14} />
                              <span className="leading-none">
                                {s.totalAppointments} Appointments
                              </span>
                            </div>

                            <div className="flex items-center gap-2 bg-emerald-50 px-2 py-1 rounded-full ring-1 ring-emerald-100">
                              <CheckCircle size={14} />
                              <span className="leading-none text-emerald-700">
                                {s.completed} Completed
                              </span>
                            </div>

                            <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded-full ring-1 ring-red-100">
                              <XCircle size={14} />
                              <span className="leading-none text-red-500">
                                {s.canceled} Canceled
                              </span>
                            </div>

                            <div className="flex items-center gap-2 bg-emerald-50 px-2 py-1 rounded-full ring-1 ring-emerald-100">
                              <BadgeIndianRupee size={14} />
                              <span className="leading-none">
                                Total Earning : {formatCurrency(earning)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* Show more/Less */}
        {filteredServices.length > INITIAL_COUNT && (
          <div className="px-6 py-4 border-t border-green-50 flex justify-center">
            <button
              onClick={() => setShowAll((s) => !s)}
              className="px-4 py-2 rounded-full cursor-pointer bg-white border border-green-200 shadow-sm hover:bg-green-50 transition"
            >
              {showAll
                ? "Show Less"
                : `Show More(${filteredServices.length - INITIAL_COUNT})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDashboard;

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-full bg-linear-to-br from-emerald-100 to-emerald-50 shadow-sm border border-green-100 p-4 gap-4 flex items-center">
      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-lg font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}
