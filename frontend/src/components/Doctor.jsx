import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleChevronUp,
  Medal,
  MousePointer2Off,
  Search,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const DoctorPage = () => {
  const API_BASE = import.meta.env.VITE_API_BASE;
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/doctors`);
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            (json && json.message) || `Failed to load doctors (${res.status})`;
          if (mounted) {
            setError(msg);
            setAllDoctors([]);
            setLoading(false);
          }
          return;
        }

        const items = (json && (json.data || json)) || [];
        const normalized = (Array.isArray(items) ? items : []).map((d) => {
          const id = d._id || d.id;
          const image =
            d.imageUrl || d.image || d.imageSmall || d.imageSrc || "";
          let available = true;
          if (typeof d.availability === "string") {
            available = d.availability.toLowerCase() === "available";
          } else if (typeof d.available === "boolean") {
            available = d.available;
          } else if (typeof d.availability === "boolean") {
            available = d.availability;
          } else {
            available = d.availability === "Available" || d.available === true;
          }
          return {
            id,
            name: d.name || "Unknown",
            specialization: d.specialization || "",
            image,
            experience:
              (d.experience ?? d.experience === 0) ? String(d.experience) : "—",
            fee: d.fee ?? d.price ?? 0,
            available,
            raw: d,
          };
        });

        if (mounted) {
          setAllDoctors(normalized);
          setError("");
        }
      } catch (err) {
        console.error("load doctors error:", err);
        if (mounted) {
          setError("Network error while loading doctors.");
          setAllDoctors([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allDoctors;
    return allDoctors.filter(
      (doctor) =>
        (doctor.name || "").toLowerCase().includes(q) ||
        (doctor.specialization || "").toLowerCase().includes(q),
    );
  }, [allDoctors, searchTerm]);

  const displayedDoctors = showAll
    ? filteredDoctors
    : filteredDoctors.slice(0, 8);

  const retry = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/doctors`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError((json && json.message) || `Failed to load (${res.status})`);
        setAllDoctors([]);
        return;
      }
      const items = (json && (json.data || json)) || [];
      const normalized = (Array.isArray(items) ? items : []).map((d) => {
        const id = d._id || d.id;
        const image = d.imageUrl || d.image || "";
        let available = true;
        if (typeof d.availability === "string") {
          available = d.availability.toLowerCase() === "available";
        } else if (typeof d.available === "boolean") {
          available = d.available;
        } else {
          available = d.availability === "Available" || d.available === true;
        }
        return {
          id,
          name: d.name || "Unknown",
          specialization: d.specialization || "",
          image,
          experience: d.experience ?? "—",
          fee: d.fee ?? d.price ?? 0,
          available,
          raw: d,
        };
      });
      setAllDoctors(normalized);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Network error while loading doctors.");
      setAllDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-teal-100 py-8 sm:py-10 px-3 sm:px-6 relative overflow-hidden">
      <div className="absolute -top-40 -right-32 w-72 h-72 sm:w-96 sm:h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-40 -left-32 w-72 h-72 sm:w-96 sm:h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto relative z-10 font-serif">
        <div className="text-center mb-8 sm:mb-10 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent mb-3 tracking-tight">
            Our Medical Experts
          </h1>
          <p className="text-sm sm:text-base text-emerald-700 font-light">
            Find your ideal doctors or specialists
          </p>
        </div>

        <div className="flex justify-center mb-8 sm:mb-12 animate-slide-up">
          <div className="relative w-full max-w-xl transition-all duration-500 px-2 sm:px-0">
            <input
              type="text"
              placeholder="Search doctors by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 sm:py-4 pl-12 pr-10 text-sm sm:text-lg rounded-full border border-emerald-300 bg-white/90 text-emerald-800 placeholder-emerald-400 shadow-md sm:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:shadow-xl transition-all duration-300 hover:shadow-2xl"
            />
            <Search className="absolute left-4 top-3 sm:top-4 text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" />
            {searchTerm.length > 0 && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 sm:top-4 text-emerald-600 hover:text-emerald-800 transition"
              >
                <X size={20} strokeWidth={2.5} className="" />
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="text-center mb-6">
            <div className="text-sm text-rose-600 mb-2">{error}</div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={retry}
                className="px-4 py-2 rounded-full bg-emerald-600 text-white"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* loading section  */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 md:p-6 text-center transition-all duration-300"
              >
                <div className="relative mx-auto mb-4 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-36 lg:h-36 bg-emerald-100 rounded-full"></div>
                <div className="h-5 bg-emerald-100 rounded w-3/4 mx-auto mb-2"></div>

                <div className="h-4 bg-emerald-100 rounded w-1/2 mx-auto mb-3"></div>
                <div className="h-8 bg-emerald-100 rounded w-full mx-auto mt-4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 sm:gap-8 transition-all duration-300 ${
              filteredDoctors.length === 0 ? "opacity-70" : "opacity-100"
            }`}
          >
            {displayedDoctors.length > 0 ? (
              displayedDoctors.map((doctor, index) => (
                <div
                  key={doctor.id || `${doctor.name}-${index}`}
                  className={`bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 md:p-6 text-center transition-all duration-300 hover:shadow-xl animate-fade-in-up ${
                    !doctor.available ? "opacity-80" : ""
                  }`}
                  style={{ animationDelay: `${index * 90}ms` }}
                  role="article"
                >
                  {doctor.available ? (
                    <Link
                      to={`/doctors/${doctor.id}`}
                      state={{ doctor: doctor.raw || doctor }}
                      className="focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded-full"
                    >
                      <div className="relative mx-auto mb-4 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-36 lg:h-36">
                        <img
                          src={doctor.image || "/placeholder-doctor.jpg"}
                          alt={doctor.name}
                          loading="lazy"
                          className="w-full h-full rounded-full object-cover border-4 border-emerald-200 shadow-lg transform transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/placeholder-doctor.jpg";
                          }}
                        />
                      </div>
                    </Link>
                  ) : (
                    <div className="relative mx-auto mb-4 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-36 lg:h-36 opacity-70 cursor-not-allowed">
                      <img
                        src={doctor.image || "/placeholder-doctor.jpg"}
                        alt={doctor.name}
                        loading="lazy"
                        className="w-full h-full rounded-full object-cover border-4 border-gray-200 opacity-70 cursor-not-allowed"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/placeholder-doctor.jpg";
                        }}
                      />
                    </div>
                  )}
                  <h3 className="text-base sm:text-lg md:text-md whitespace-nowrap lg:text-lg font-bold text-emerald-900 mb-1">
                    {doctor.name}
                  </h3>
                  <p className="text-sm sm:text-sm md:text-sm text-emerald-600 font-medium mb-3">
                    {doctor.specialization}
                  </p>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 bg-emerald-50 border border-emerald-300 shadow-sm leading-none">
                    <Medal
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      strokeWidth={2}
                    />
                    <span className="text-emerald-700">
                      {doctor.experience} years experience
                    </span>
                  </div>
                  {doctor.available ? (
                    <Link
                      to={`/doctors/${doctor.id}`}
                      state={{ doctor: doctor.raw || doctor }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-full font-medium transition-all duration-300 text-sm bg-linear-to-r from-emerald-300 to-teal-500 text-white hover:shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                      Book Now
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-full font-medium bg-gray-300 text-gray-600 cursor-not-allowed text-sm"
                    >
                      <MousePointer2Off className="w-5 h-5" />
                      Not Available
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-emerald-800 font-medium text-base animate-fade-in">
                No doctors found.
              </div>
            )}
          </div>
        )}
        {filteredDoctors.length > 8 && (
          <div className="flex justify-center mt-8 sm:mt-10">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center cursor-pointer gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-400 to-teal-500 text-white rounded-full text-md font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              {showAll ? (
                <>
                  <CircleChevronUp className="w-5 h-5" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  Show More
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPage;
