import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import {
  CreditCard,
  Wallet,
  CheckCircle,
  Bell,
  Clock,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { Toaster } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE;
const API = axios.create({ baseURL: API_BASE });

//helper fn
function pad(n) {
  return String(n ?? 0).padStart(2, "0");
}

// this fn will give ti,e
function parseDateTime(dateStr, timeStr) {
  const fast = new Date(`${dateStr} ${timeStr}`);
  if (!isNaN(fast)) return fast;

  const parts = (dateStr || "").split(" ");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const months = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = months[m];
    let [t, ampm] = (timeStr || "").split(" ");
    let [hh, mm] = (t || "0:00").split(":");
    hh = Number(hh || 0);
    mm = Number(mm || 0);

    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;

    return new Date(Number(y), month, Number(d), hh, mm);
  }

  const iso = new Date(dateStr);
  if (!isNaN(iso)) return iso;
  return new Date();
}

function computeStatus(item) {
  const now = new Date();
  if (!item) return "Pending";

  if (item.status === "Canceled") return "Canceled";
  if (item.status === "Rescheduled") {
    if (
      item.rescheduledTo &&
      item.rescheduledTo.date &&
      item.rescheduledTo.time
    ) {
      const dt = parseDateTime(
        item.rescheduledTo.date,
        item.rescheduledTo.time,
      );
      if (now >= dt) return "Completed";
    }
    return "Rescheduled";
  }
  if (item.status === "Completed") return "Completed";
  if (item.status === "Confirmed") {
    const dtConfirmed = parseDateTime(item.date, item.time);
    if (now >= dtConfirmed) return "Completed";
    return "Confirmed";
  }
  if (item.status === "Pending") {
    const dtPending = parseDateTime(item.date, item.time);
    if (now >= dtPending) return "Completed";
    return "Pending";
  }

  const dt = parseDateTime(item.date, item.time);
  if (now >= dt) return "Completed";
  return item.confirmed ? "Confirmed" : "Pending";
}

const PaymentBadge = ({ payment }) => {
  return payment === "Online" ? (
    <span className="px-3 py-1 rounded-full font-semibold text-xs bg-green-100 text-green-700 border border-green-300 flex items-center gap-1">
      <CreditCard className="w-3" /> Online
    </span>
  ) : (
    <span className="px-3 py-1 rounded-full font-semibold text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 flex items-center gap-1">
      <Wallet className="w-3" /> Cash
    </span>
  );
};

const StatusBadge = ({ itemStatus }) => {
  if (itemStatus === "Completed")
    return (
      <span className="px-3 py-1 rounded-full font-semibold text-xs bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
        <CheckCircle className="w-3" /> Completed
      </span>
    );

  if (itemStatus === "Confirmed")
    return (
      <span className="px-3 py-1 rounded-full font-semibold text-xs bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
        <Bell className="w-3" /> Confirmed
      </span>
    );

  if (itemStatus === "Pending")
    return (
      <span className="px-3 py-1 rounded-full font-semibold text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1">
        <Clock className="w-3" /> Pending
      </span>
    );

  if (itemStatus === "Canceled")
    return (
      <span className="px-3 py-1 rounded-full font-semibold text-xs bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
        <XCircle className="w-3" /> Cancelled
      </span>
    );

  return (
    <span className="px-3 py-1 rounded-full font-semibold text-xs bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
      <CalendarDays className="w-3" /> Rescheduled
    </span>
  );
};

const Appointment = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const [doctorAppts, setDoctorAppts] = useState([]);
  const [serviceAppts, setServiceAppts] = useState([]);

  const [appointmentsRaw, setAppointmentsRaw] = useState({
    doctors: [],
    services: [],
  });
  const [error, setError] = useState(null);

  const loadDoctorAppointments = useCallback(async () => {
    if (!isLoaded) return;
    setLoadingDoctors(true);
    setError(null);

    let token = null;
    try {
      token = await getToken();
      console.log(
        "Clerk token (frontend):",
        token ? `${token.slice(0, 20)}...` : null,
      );
    } catch (err) {
      console.error("Failed to get Clerk token (frontend):", err);
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log("Outgoing headers for /api/appointments/me:", headers);

    try {
      const resp = await API.get("/api/appointments/me", { headers });
      console.log("Response from /api/appointments/me:", resp?.data);

      const fetched =
        resp?.data?.appointments ?? resp?.data?.data ?? resp?.data ?? [];
      const arr = Array.isArray(fetched) ? fetched : [];

      const doctors = arr.filter((a) => {
        return (
          (a.doctorId !== undefined && a.doctorId !== null) ||
          !!a.doctorName ||
          !a.serviceId
        );
      });

      setDoctorAppts(doctors);
      setAppointmentsRaw((p) => ({ ...p, doctors: doctors }));
    } catch (err) {
      console.error(
        "Error calling /api/appointments/me:",
        err?.response?.data || err.message || err,
      );

      if (user?.id) {
        try {
          console.log("Attempting debug request with ?createdBy=", user.id);
          const debugResp = await API.get(
            `/api/appointments/me?createdBy=${user.id}`,
            { headers },
          );
          console.log("Debug fallback response:", debugResp?.data);

          const fetched =
            debugResp?.data?.appointments ??
            debugResp?.data?.data ??
            debugResp?.data ??
            [];
          const arr = Array.isArray(fetched) ? fetched : [];
          const doctors = arr.filter(
            (a) =>
              (a.doctorId !== undefined && a.doctorId !== null) ||
              !!a.doctorName ||
              !a.serviceId,
          );
          setDoctorAppts(doctors);
          setAppointmentsRaw((p) => ({ ...p, doctors }));
        } catch (err2) {
          console.error(
            "Debug fallback failed (doctors):",
            err2?.response?.data || err2.message || err2,
          );
          setError((prev) =>
            prev
              ? prev + " | Doctors failed"
              : "Failed to load doctor appointments. Check console.",
          );
          setDoctorAppts([]);
        }
      } else {
        setError((prev) =>
          prev
            ? prev + " | No user id for doctors"
            : "Failed to load doctor appointments and no user id available for debug fallback.",
        );
        setDoctorAppts([]);
      }
    } finally {
      setLoadingDoctors(false);
    }
  }, [isLoaded, getToken, user]);

  const loadServiceAppointments = useCallback(async () => {
    if (!isLoaded) return;
    setLoadingServices(true);
    setError(null);

    let token = null;
    try {
      token = await getToken();
    } catch (err) {
      console.error("Failed to get Clerk token (frontend): err", err);
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log("Outgoing headers for /api/service-appointments/me:", headers);

    try {
      const resp = await API.get("/api/service-appointments/me", { headers });
      console.log("Response from /api/service-appointments/me:", resp?.data);

      const fetched =
        resp?.data?.appointments ?? resp?.data?.data ?? resp?.data ?? [];
      const arr = Array.isArray(fetched) ? fetched : [];
      console.log(arr);

      setServiceAppts(arr);
      setAppointmentsRaw((p) => ({ ...p, services: arr }));
    } catch (err) {
      console.error(
        "Error calling /api/service-appointments/me:",
        err?.response?.data || err.message || err,
      );

      if (user?.id) {
        try {
          console.log("Attempting debug request with ?createdBy=", user.id);
          const debugResp = await API.get(
            `/api/service-appointments/me?createdBy=${user.id}`,
            { headers },
          );
          console.log("Debug fallback response (services):", debugResp?.data);

          const fetched =
            debugResp?.data?.appointments ??
            debugResp?.data?.data ??
            debugResp?.data ??
            [];
          const arr = Array.isArray(fetched) ? fetched : [];
          setServiceAppts(arr);
          setAppointmentsRaw((p) => ({ ...p, services: arr }));
        } catch (err2) {
          console.error(
            "Debug fallback failed (services):",
            err2?.response?.data || err2.message || err2,
          );
          setError((prev) =>
            prev
              ? prev + " | Services failed"
              : "Failed to load service appointments. Check console.",
          );
          setServiceAppts([]);
        }
      } else {
        setError((prev) =>
          prev
            ? prev + " | No user id for services"
            : "Failed to load service appointments and no user id available for debug fallback.",
        );
        setServiceAppts([]);
      }
    } finally {
      setLoadingServices(false);
    }
  }, [isLoaded, getToken, user]);

  useEffect(() => {
    loadDoctorAppointments();
    loadServiceAppointments();
  }, [
    isLoaded,
    isSignedIn,
    user,
    loadDoctorAppointments,
    loadServiceAppointments,
  ]);

  // to reschedule we have to mormalize the field with UI
  function normalizeRescheduled(rt) {
    if (!rt) return null;
    if (rt.date && rt.time) return { date: rt.date, time: rt.time };
    if (
      rt.date &&
      (rt.hour !== undefined || rt.minute !== undefined || rt.ampm)
    ) {
      const hour = rt.hour ?? 0;
      const minute = rt.minute ?? 0;
      const ampm = rt.ampm ?? "";
      return { date: rt.date, time: `${hour}:${pad(minute)} ${ampm}` };
    }
    return {
      date: rt.date || rt?.dateString || "",
      time:
        rt.time ||
        (rt.hour
          ? `${rt.hour}:${pad(rt.minute || 0)} ${rt.ampm || ""}`
          : rt?.timeString || ""),
    };
  }
  // to get appointment details
  const appointmentData = useMemo(() => {
    return doctorAppts
      .map((a) => {
        const id = a._id || a.id || String(a._id || "");
        const doctorObj =
          typeof a.doctorId === "object" && a.doctorId ? a.doctorId : {};
        const image =
          doctorObj.imageUrl ||
          doctorObj.image ||
          doctorObj.avatar ||
          a.doctorImage?.url ||
          a.doctorImage ||
          "";
        const doctorName =
          (doctorObj.name && String(doctorObj.name).trim()) ||
          (a.doctorName && String(a.doctorName).trim()) ||
          (a.doctor && String(a.doctor).trim()) ||
          (a.patientName && String(a.patientName).trim()) ||
          "Doctor";

        const patientName = a.patientName || a.patient || "Patient";
        const specialization =
          doctorObj.specialization || a.specialization || a.speciality || "";
        const experience = doctorObj.experience || a.experience || "";
        const date = a.date || "";
        let time = a.time || "";

        if (!time) {
          if (a.hour !== undefined && a.minute !== undefined && a.ampm) {
            time = `${a.hour}:${pad(a.minute)} ${a.ampm}`;
          } else if (a.hour !== undefined && a.ampm) {
            time = `${a.hour}:00 ${a.ampm}`;
          }
        }

        const payment = (a.payment && a.payment.method) || "Cash";
        const status =
          a.status ||
          (a.payment && a.payment.status === "Paid" ? "Confirmed" : "Pending");
        const rescheduledTo = normalizeRescheduled(
          a.rescheduledTo || {
            date: a.rescheduledDate,
            time: a.rescheduledTime,
          },
        );

        return {
          id,
          image,
          doctor: doctorName,
          patientName,
          specialization,
          experience,
          date,
          time,
          payment,
          status,
          rescheduledTo,
        };
      })
      .map((x) => ({ ...x, status: computeStatus(x) }));
  }, [doctorAppts]);

  const serviceData = useMemo(() => {
    return serviceAppts
      .map((s) => {
        const id = s._id || s.id || String(s._id || "");
        const svc =
          typeof s.serviceId === "object" && s.serviceId ? s.serviceId : {};
        const image =
          svc.imageUrl ||
          svc.image ||
          svc.imageSmall ||
          s.serviceImage?.url ||
          s.serviceImage ||
          "";
        const name = s.serviceName || svc.name || svc.title || "Service";
        const patientName = s.patientName || s.patient || "Patient";
        const price = s.fees ?? s.amount ?? s.price ?? 0;
        const date = s.date || "";
        let time = s.time || "";
        if (!time) {
          if (s.hour !== undefined && s.minute !== undefined && s.ampm) {
            time = `${s.hour}:${pad(s.minute)} ${s.ampm}`;
          } else if (s.hour !== undefined && s.ampm) {
            time = `${s.hour}:00 ${s.ampm}`;
          }
        }

        const payment = (s.payment && s.payment.method) || "Cash";
        const status =
          s.status ||
          (s.payment && s.payment.status === "Paid" ? "Confirmed" : "Pending");

        const rescheduledTo = normalizeRescheduled(s.rescheduledTo || null);

        return {
          id,
          image,
          name,
          patientName,
          price,
          date,
          time,
          payment,
          status,
          rescheduledTo,
        };
      })
      .map((x) => ({ ...x, status: computeStatus(x) }));
  }, [serviceAppts]);

  return (
    <div className="min-h-screen font-serif bg-linear-to-br from-green-50 to-emerald-100 py-10 px-4">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-emerald-700 text-center mb-6">
          Your Doctor Appointment
        </h1>
        {loadingDoctors && (
          <div className="text-center text-emerald-600 py-4">
            Loading Doctors...
          </div>
        )}

        {!loadingDoctors && appointmentData.length === 0 && (
          <div className="text-center text-emerald-600 py-4">
            No doctor appointments found.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {appointmentData.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-md hover:shadow-emerald-400 transform hover:-translate-y-2 transition-all duration-300 flex flex-col items-center"
            >
              <div className="w-28 h-28 rounded-full border-4 border-emerald-300 shadow-md bg-emerald-50 flex items-center justify-center overflow-hidden">
                <img
                  src={
                    item.image
                      ? item.image.startsWith("http")
                        ? item.image
                        : `${API_BASE}${item.image}`
                      : "/placeholder-doctor.png"
                  }
                  alt={item.doctor}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-doctor.png";
                  }}
                />
              </div>

              <h2 className="text-xl md:text-sm xl:text-md text-gray-700 whitespace-nowrap lg:text-lg font-semibold mt-4 text-center">
                {item.doctor}
              </h2>
              <div className="text-sm  text-emerald-700 mt-1">
                {item.specialization}{" "}
                {item.experience ? `${item.experience}` : ""}
              </div>

              <div className="mt-4 rounded-2xl border text-gray-700 bg-emerald-50 border-emerald-200 py-3 px-4 w-full flex gap-3">
                <div className="flex flex-col items-center gap-2 pt-0.5">
                  <CalendarDays className="w-5 h-5 text-emerald-600 shrink-0" />
                  <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                <div className="flex flex-col gap-1 leading-tight">
                  <span className="font-medium">
                    {new Date(item.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  <span className="text-sm text-gray-700">{item.time}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-2">
                <PaymentBadge payment={item.payment} />
                <StatusBadge itemStatus={item.status} />
              </div>
              {item.status === "Rescheduled" && item.rescheduledTo ? (
                <div className="mt-3 text-center xl:text-md text-sm text-blue-700">
                  Resheduled to{" "}
                  <span className="font-semibold xl:line-clamp-2">
                    {item.rescheduledTo.date} : {item.rescheduledTo.time}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <h2 className="text-3xl font-bold text-blue-400 text-center mb-6">
          Your Booked Services
        </h2>
        {loadingDoctors && (
          <div className="text-center text-blue-400 py-4">
            Loading Service Bookings...
          </div>
        )}

        {!loadingServices && serviceData.length === 0 && (
          <div className="text-center text-blue-400 py-4">
            No services bookings found...
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {serviceData.map((srv) => (
            <div
              key={srv.id}
              className="bg-white border border-blue-200 rounded-2xl p-6 shadow-md"
            >
              <div className="w-28 h-28 rounded-full border-4 border-blue-300 mx-auto bg-blue-50 flex items-center justify-center overflow-hidden">
                <img
                  src={srv.image || "/placeholder-service.png"}
                  alt={srv.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <h3 className="text-xl md:text-sm text-gray-700 lg:text-md xl:text-lg font-semibold text-center mt-4">
                {srv.name}
              </h3>

              <p className="text-center text-green-700  font-semibold text-lg mt-2">
                ₹{srv.price}
              </p>

              <p className="mt-4 rounded-full border text-gray-700 bg-blue-50 border-blue-200 py-1 px-3 flex justify-center gap-2 text-sm">
                <CalendarDays className="w-4" /> {srv.date}
              </p>

              <p className="mt-2 rounded-full border text-gray-700 bg-blue-50 border-blue-200 py-1 px-3 flex justify-center gap-2 text-sm">
                <Clock className="w-4" /> {srv.time}
              </p>

              <div className="mt-4 flex justify-center gap-2">
                <PaymentBadge payment={srv.payment} />
                <StatusBadge itemStatus={srv.status} />
              </div>

              {srv.status === "Rescheduled" && srv.rescheduledTo ? (
                <div className="mt-3 text-center xl:text-md xl:whitespace-nowrap text-sm text-blue-700">
                  Rescheduled to{" "}
                  <span className="font-semibold xl:line-clamp-2">
                    {srv.rescheduledTo.date} : {srv.rescheduledTo.time}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Appointment;
