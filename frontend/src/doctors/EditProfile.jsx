import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit2,
  Save,
  X,
  Plus,
  Calendar,
  Clock,
  Image as ImageIcon,
  Check,
  Trash,
  Star,
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  BadgeIndianRupee,
} from "lucide-react";

const STORAGE_KEY = "doctorToken_v1";

function parse12HourTimeToMinutes(t) {
  if (!t) return 0;
  const [time, ampm] = t.split(" ");
  const [hh, mm] = time.split(":");
  let h = Number(hh) % 12;
  if ((ampm || "").toUpperCase() === "PM") h += 12;
  return h * 60 + Number(mm);
}

function formatTimeFromInput(time24) {
  if (!time24) return time24;
  const [h, m] = time24.split(":");
  let hr = Number(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 || 12;
  return `${String(hr).padStart(2, "0")}:${m} ${ampm}`;
}

function dedupeAndSortSchedule(schedule = {}) {
  const out = {};
  Object.entries(schedule || {}).forEach(([date, slots]) => {
    const uniq = Array.from(new Set(slots || []));
    uniq.sort(
      (a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b),
    );
    out[date] = uniq;
  });
  return out;
}

export default function EditProfilePage({ apiBase }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE;

  const [doc, setDoc] = useState(null);
  const [editing, setEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [localImageFile, setLocalImageFile] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchDoctor() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/doctors/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to fetch doctor");
        const d = json.data || json || {};
        d.schedule = dedupeAndSortSchedule(d.schedule || {});
        d.imageUrl =
          d.imageUrl || d.image || d.imageUrl === null ? d.imageUrl : d.image;
        if (!cancelled) {
          setDoc(d);
          setImagePreview(d.imageUrl || "");
        }
      } catch (err) {
        console.error("fetchDoctor error:", err);
        addToast("Unable to load profile", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) fetchDoctor();
    return () => {
      cancelled = true;
      if (imagePreview && imagePreview.startsWith("blob:"))
        URL.revokeObjectURL(imagePreview);
    };
  }, [id]);

  const addToast = (text, type = "success") => {
    const idt = Date.now() + Math.random();
    const t = { id: idt, text, type };
    setToasts((prev) => [t, ...prev.slice(0, 2)]);
    setTimeout(
      () => setToasts((prev) => prev.filter((it) => it.id !== idt)),
      3000,
    );
  };

  const addDate = (dateStr) => {
    if (!dateStr) return;
    if (doc.schedule[dateStr]) {
      addToast("Date already exists", "error");
      return;
    }
    setDoc((d) => ({ ...d, schedule: { ...d.schedule, [dateStr]: [] } }));
    addToast("Date added successfully", "success");
  };

  const addSlot = (dateStr, time) => {
    if (!dateStr || !time) return;
    const formatted = formatTimeFromInput(time);
    setDoc((d) => {
      const existing = d.schedule[dateStr] || [];
      if (existing.includes(formatted)) {
        addToast(`${formatted} already exists for ${dateStr}`, "error");
        return d;
      }
      const nextArr = [...existing, formatted];
      nextArr.sort(
        (a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b),
      );
      return { ...d, schedule: { ...d.schedule, [dateStr]: nextArr } };
    });
    addToast(`Time slot ${formatted} added`, "success");
  };

  const removeSlot = (dateStr, slot) => {
    setDoc((d) => {
      const next = (d.schedule[dateStr] || []).filter((s) => s !== slot);
      return { ...d, schedule: { ...d.schedule, [dateStr]: next } };
    });
    addToast(`Removed ${slot} from ${dateStr}`, "info");
  };

  const removeDate = (dateStr) => {
    setDoc((d) => {
      const clone = { ...d.schedule };
      delete clone[dateStr];
      return { ...d, schedule: clone };
    });
    addToast(`Date ${dateStr} removed`, "info");
  };


  const handleImageChange = (e) => {
    if (!editing) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview && imagePreview.startsWith("blob:"))
      URL.revokeObjectURL(imagePreview);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setLocalImageFile(file);
    setDoc((d) => ({ ...d, imageUrl: url }));
    addToast("Profile image updated locally", "success");
  };

  const toggleAvailability = () => {
    setDoc((d) => {
      const current = d.availability === "Available" || d.available === true;
      const nextVal = current ? "Unavailable" : "Available";
      return { ...d, availability: nextVal, available: !current };
    });
    addToast("Availability toggled", "info");
  };

  //to reset the data
  const handleReset = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/doctors/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch");
      const d = json.data || json || {};
      d.schedule = dedupeAndSortSchedule(d.schedule || {});
      setDoc(d);
      setImagePreview(d.imageUrl || "");
      setLocalImageFile(null);
      setEditing(false);
      addToast("Reset to server profile", "info");
    } catch (err) {
      console.error("Reset error:", err);
      addToast("Reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // to update the data
  const handleSave = async () => {
    if (!doc) return;
    setSaveMessage({ type: "saving", text: "Saving profile..." });
    addToast("Saving profile...", "info");

    try {
      const form = new FormData();
      const updatable = [
        "name",
        "specialization",
        "experience",
        "qualifications",
        "location",
        "about",
        "fee",
        "availability",
        "success",
        "patients",
        "rating",
        "email",
      ];
      updatable.forEach((k) => {
        if (doc[k] !== undefined && doc[k] !== null) {
          form.append(k, String(doc[k]));
        }
      });

      form.append("schedule", JSON.stringify(doc.schedule || {}));

      if (localImageFile) {
        form.append("image", localImageFile);
      } else if (doc.imageUrl && !doc.imageUrl.startsWith("blob:")) {
        form.append("imageUrl", doc.imageUrl);
      }

      const token = localStorage.getItem(STORAGE_KEY);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/api/doctors/${id}`, {
        method: "PUT",
        headers,
        body: form,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to save");
      }
 
      const updated = json.data || json;
      updated.schedule = dedupeAndSortSchedule(updated.schedule || {});
      setDoc(updated);
      setLocalImageFile(null);
      setImagePreview(updated.imageUrl || imagePreview);
      setEditing(false);
      setSaveMessage({ type: "success", text: "Profile saved successfully!" });
      addToast("Profile saved successfully!", "success");
      setTimeout(() => setSaveMessage(null), 1500);
    } catch (err) {
      console.error("handleSave error:", err);
      setSaveMessage({ type: "error", text: "Save failed" });
      addToast(err.message || "Save failed", "error");
    }
  };

  const fieldConfigs = doc
    ? [
        {
          icon: User,
          label: "Name",
          value: doc.name || "",
          onChange: (v) => setDoc((d) => ({ ...d, name: v })),
        },
        {
          icon: Briefcase,
          label: "Specialization",
          value: doc.specialization || "",
          onChange: (v) => setDoc((d) => ({ ...d, specialization: v })),
        },
        {
          icon: Clock,
          label: "Experience",
          value: doc.experience || "",
          onChange: (v) => setDoc((d) => ({ ...d, experience: v })),
        },
        {
          icon: GraduationCap,
          label: "Qualifications",
          value: doc.qualifications || "",
          onChange: (v) => setDoc((d) => ({ ...d, qualifications: v })),
        },
        {
          icon: MapPin,
          label: "Location",
          value: doc.location || "",
          onChange: (v) => setDoc((d) => ({ ...d, location: v })),
        },
        {
          icon: User,
          label: "Patients",
          value: doc.patients ?? "",
          onChange: (v) =>
            setDoc((d) => ({ ...d, patients: v === "" ? "" : Number(v) || 0 })),
        },
        {
          icon: CheckCircle,
          label: "Success",
          value: doc.success ?? "",
          onChange: (v) =>
            setDoc((d) => ({ ...d, success: v === "" ? "" : Number(v) || 0 })),
        },
        {
          icon: Star,
          label: "Rating (out of 5)",
          value: doc.rating ?? "",
          onChange: (v) =>
            setDoc((d) => ({
              ...d,
              rating: v === "" ? "" : parseFloat(v) || 0,
            })),
        },
        {
          icon: DollarSign,
          label: "Fee (INR)",
          value: doc.fee ?? "",
          onChange: (v) =>
            setDoc((d) => ({ ...d, fee: v === "" ? "" : Number(v) || 0 })),
        },
      ]
    : [];

  // when profile is loading....
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  // if the doctor is not found...
  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Doctor not found.</div>
      </div>
    );
  }

  const isAvailable = doc.availability === "Available" || doc.available;

  return (
    <div className="min-h-screen font-serif bg-linear-to-br from-emerald-50 via-white to-emerald-50/30 p-4 sm:p-5 md:p-6">
      <div className="max-w-6xl pt-8 md:pt-10 mx-auto relative">
        <div className="fixed top-3 right-2 sm:right-4 z-50 space-y-3 max-w-xs sm:max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`transform transition-all duration-300 ease-out rounded-r-lg shadow-lg p-3 sm:p-4 flex items-start gap-3 animate-slideIn ${
                t.type === "error"
                  ? "bg-linear-to-r from-rose-50 to-rose-100 border-l-4 border-rose-500"
                  : t.type === "info"
                    ? "bg-linear-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500"
                    : "bg-linear-to-r from-emerald-50 to-emerald-100 border-l-4 border-emerald-500"
              }`}
            >
              {t.type === "error" ? (
                <AlertCircle className="w-5 h-5 mt-0.5 text-rose-600" />
              ) : (
                <Check className="w-5 h-5 mt-0.5 text-emerald-600" />
              )}
              <span className="text-sm font-medium text-gray-800">
                {t.text}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-emerald-100/50">
          <div className="relative h-24 sm:h-28 md:h-32 bg-linear-to-r from-emerald-400 to-emerald-600">
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 md:left-8 md:transform-none">
              <div className="relative group">
                <img
                  src={imagePreview || ""}
                  alt={doc.name}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 md:ml-23 rounded-full object-cover border-4 border-white shadow-2xl"
                />
                <label
                  className={`absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg transition-transform ${
                    editing ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={!editing}
                  />
                  <ImageIcon
                    className={`absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg transition-transform ${
                      editing
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-60"
                    }`}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-20 pb-8 px-4 sm:px-6 md:px-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-linear-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent truncate">
                  {doc.name}
                </h1>
                <p className="text-sm sm:text-lg text-emerald-700 mt-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="truncate">
                    {doc.specialization} : {doc.location}
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {/* Patients */}
                  <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-full border border-emerald-100 shadow-sm text-sm sm:text-base">
                    <User className="w-4 h-4 text-emerald-600" />
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="text-xs text-emerald-600 font-medium">
                          Patients
                        </div>
                        {!editing ? (
                          <div className="text-sm font-semibold text-emerald-900 truncate">
                            {doc.patients}
                          </div>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={doc.patients ?? ""}
                            onChange={(e) =>
                              setDoc((d) => ({
                                ...d,
                                patients:
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                              }))
                            }
                            className="w-24 rounded-full text-rose-400 border px-2 py-1 text-sm focus:outline-none"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Success */}
                  <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-full border border-emerald-100 shadow-sm text-sm sm:text-base">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <div className="flex flex-col">
                      <div className="text-xs text-emerald-600 font-medium">
                        Success
                      </div>
                      {!editing ? (
                        <div className="text-sm font-semibold text-emerald-900 truncate">
                          {doc.success}
                        </div>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={doc.success ?? ""}
                          onChange={(e) =>
                            setDoc((d) => ({
                              ...d,
                              success:
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                            }))
                          }
                          className="w-24 rounded-full border text-rose-400 px-2 py-1 text-sm focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-3 bg-linear-to-r from-amber-50 to-amber-100 px-3 py-2 rounded-full border border-amber-200 text-sm sm:text-base">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-500" />

                    <div className="flex flex-col">
                      <div className="text-xs text-amber-700 font-medium">
                        Rating
                      </div>
                      {!editing ? (
                        <div className="text-sm font-bold text-amber-800">
                          {typeof doc.rating === "number"
                            ? `${doc.rating}/5`
                            : doc.rating}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={5}
                            step={0.1}
                            value={doc.rating ?? ""}
                            onChange={(e) =>
                              setDoc((d) => ({
                                ...d,
                                rating:
                                  e.target.value === ""
                                    ? ""
                                    : parseFloat(e.target.value),
                              }))
                            }
                            className="w-20 rounded-full border text-rose-400 px-2 py-1 text-sm focus:outline-none"
                          />
                          <div className="text-sm text-amber-700">/5</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fee */}
                  <div className="flex items-center gap-1 bg-linear-to-r from-amber-50 to-amber-100 px-3 py-2 rounded-full border border-amber-200">
                    <BadgeIndianRupee className="w-4 h-4 text-amber-600" />
                    {!editing ? (
                      <span className="text-sm font-bold text-amber-800">
                        {doc.fee}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={doc.fee ?? ""}
                        onChange={(e) =>
                          setDoc((d) => ({
                            ...d,
                            fee:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          }))
                        }
                        className="w-20 rounded-full border text-rose-400 px-2 py-1 text-sm focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={toggleAvailability}
                  className={`flex items-center gap-3 px-4 sm:px-5 py-2 rounded-full cursor-pointer border-2 shadow-sm transition-all duration-300 ${
                    isAvailable
                      ? "bg-linear-to-r from-emerald-50 to-emerald-100 border-emerald-300 hover:shadow-emerald-200"
                      : "bg-linear-to-r from-gray-50 to-gray-100 border-gray-300 hover:shadow-gray-200"
                  } hover:shadow-lg w-full sm:w-auto`}
                >
                  <div
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      isAvailable ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        isAvailable ? "left-6" : "left-0.5"
                      }`}
                    ></div>
                  </div>
                  <span
                    className={`font-medium ${
                      isAvailable ? "text-emerald-700" : "text-gray-600"
                    }`}
                  >
                    {isAvailable ? "Available" : "Unavailable"}
                  </span>
                </button>

                <button
                  onClick={() => setEditing((s) => !s)}
                  className="group relative overflow-hidden bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-5 py-2 rounded-full cursor-pointer shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] w-full sm:w-auto"
                >
                  <div className="relative flex items-center gap-2">
                    <Edit2 className="w-4 h-4" />
                    <span className="font-medium">
                      {editing ? "Cancel" : "Edit Profile"}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {fieldConfigs.map((field, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-full ${
                          editing
                            ? "bg-emerald-100  text-emerald-600"
                            : "bg-gray-100  text-gray-500"
                        }`}
                      >
                        <field.icon className="w-4 h-4" />
                      </div>
                      <label className="text-sm font-semibold text-emerald-800">
                        {field.label}
                      </label>
                    </div>
                    <input
                      value={field.value}
                      onChange={(e) =>
                        editing && field.onChange(e.target.value)
                      }
                      disabled={!editing}
                      readOnly={!editing}
                      className={`w-full rounded-full border-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base transition-all duration-200 ${
                        editing
                          ? "border-emerald-200 bg-emerald-50/50 text-rose-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
                          : "border-gray-200 bg-gray-50/50 text-gray-600 cursor-not-allowed"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                </div>
                About
              </h2>
              <div className="relative">
                <textarea
                  rows={3}
                  value={doc.about || ""}
                  onChange={(e) =>
                    editing && setDoc((d) => ({ ...d, about: e.target.value }))
                  }
                  disabled={!editing}
                  readOnly={!editing}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-sm sm:text-base transition-all duration-200 ${
                    editing
                      ? "border-emerald-200 bg-emerald-50/50 focus:border-emerald-40 text-rose-400 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
                      : "border-gray-200 bg-gray-50/50 text-gray-600 cursor-not-allowed"
                  }`}
                  placeholder="Tell patients about your expertise, approach, and philosophy..."
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {(doc.about || "").length}/500
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="mmb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  Schedule & Availability
                </h2>

                <div className="flex items-center gap-3">
                  {editing && <AddDate onAdd={addDate} />}
                  {saveMessage && (
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        saveMessage?.type === "saving"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {saveMessage.text}
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(doc.schedule || {}).length === 0 ? (
                <div className="text-center py-10 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50">
                  <Calendar className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-emerald-700 font-medium">
                    No schedule added yet
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Add dates to create time slots
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {Object.entries(doc.schedule)
                    .sort(([a], [b]) => (a > b ? 1 : -1))
                    .map(([date, slots]) => (
                      <div
                        key={date}
                        className="group relative bg-linear-to-br from-white to-emerald-50 p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-emerald-100">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-100">
                              <Calendar className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-bold text-base sm:text-lg text-emerald-900">
                                {new Date(date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="text-xs sm:text-sm text-emerald-600">
                                {date}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                              {slots.length} slot{slots.length !== 1 ? "s" : ""}
                            </span>
                            <button
                              onClick={() => editing && removeDate(date)}
                              disabled={!editing}
                              className={`p-2 rounded-full cursor-pointer transition-colors ${
                                editing
                                  ? "hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                                  : "text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {slots.map((slot, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white px-3 py-2 rounded-full border border-emerald-100 hover:border-emerald-200 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-emerald-600" />
                                <span className="font-medium text-emerald-900 text-sm sm:text-base">
                                  {slot}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  editing && removeSlot(date, slot)
                                }
                                disabled={!editing}
                                className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                                  editing
                                    ? "hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                                    : "text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}

                          {editing && (
                            <div className="pt-3 border-t border-emerald-100">
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  className="flex-1 rounded-full px-3 py-2 text-sm border border-emerald-200 bg-white text-rose-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && e.target.value) {
                                      addSlot(date, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value) {
                                      addSlot(date, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                />
                                <button
                                  onClick={(e) => {
                                    const input =
                                      e.currentTarget.previousElementSibling;
                                    if (input.value) {
                                      addSlot(date, input.value);
                                      input.value = "";
                                    }
                                  }}
                                  className="p-2 rounded-full cursor-pointer bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-emerald-100">
              <div className="text-sm text-gray-500">
                {editing
                  ? "Make changes and save your profile"
                  : "View and edit your profile"}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-full cursor-pointer border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 font-medium w-full sm:w-auto text-center"
                >
                  Reset to Server
                </button>

                <button
                  onClick={handleSave}
                  disabled={!editing || saveMessage?.type === "saving"}
                  className="group relative overflow-hidden bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-full cursor-pointer shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto text-center"
                >
                  {saveMessage?.type === "saving" ? (
                    <div className="relative flex items-center gap-2 justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="relative flex items-center gap-2 justify-center">
                        <Save className="w-4 h-4" />
                        <span className="font-medium">Save Profile</span>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <style>{styles.customCSS}</style> */}
    </div>
  );
}

function AddDate({ onAdd }) {
  const [value, setValue] = useState("");
  const handleAdd = () => {
    if (value) {
      onAdd(value);
      setValue("");
    }
  };
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        min={new Date().toISOString().split("T")[0]}
        className="rounded-xl px-3 py-2 border-2 border-emerald-200 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 text-sm sm:text-base"
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <button
        onClick={handleAdd}
        className="flex items-center gap-2 t bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
      >
        <Plus className="w-4 h-4" />
        <span className="font-medium">Add Date</span>
      </button>
    </div>
  );
}
