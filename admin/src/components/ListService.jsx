import React, { useState, useRef, useEffect } from "react";
import {
  Image as ImageIcon,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  Search,
  Calendar,
  Plus,
} from "lucide-react";


export default function ListServicePage() {
  const API_BASE = import.meta.env.VITE_API_BASE;

  const [services, setServices] = useState([]);
  const [openDetails, setOpenDetails] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [editForm, setEditForm] = useState(null);
  const fileRef = useRef();

  // Toasts
  const [toasts, setToasts] = useState([]);
  function addToast(
    message,
    type = "success",
    ttl = 3000,
    position = "bottom-right",
    animated = false,
  ) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type, position, animated }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const todayISO = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  function sortSlotsForDisplay(slots = []) {
    if (!Array.isArray(slots)) return [];

    const today = new Date();
    const todayVal = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const dateOnlyVal = (dateStr) => {
      if (!dateStr || typeof dateStr !== "string")
        return Number.POSITIVE_INFINITY;
      const parts = dateStr.split("-");
      if (parts.length !== 3) return Number.POSITIVE_INFINITY;
      const y = Number(parts[0]),
        m = Number(parts[1]) - 1,
        d = Number(parts[2]);
      if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d))
        return Number.POSITIVE_INFINITY;
      return Date.UTC(y, m, d);
    };
    const arr = slots.slice();

    arr.sort((a, b) => {
      const aDateVal = dateOnlyVal(a.date);
      const bDateVal = dateOnlyVal(b.date);

      const aIsPast = aDateVal < todayVal;
      const bIsPast = bDateVal < todayVal;
      if (aIsPast !== bIsPast) return aIsPast ? -1 : 1;

      if (aIsPast && bIsPast && aDateVal !== bDateVal) {
        return bDateVal - aDateVal;
      }
      if (!aIsPast && !bIsPast && aDateVal !== bDateVal) {
        return aDateVal - bDateVal;
      }

      const aTs = slotDateTimeToMs(a) || Number.POSITIVE_INFINITY;
      const bTs = slotDateTimeToMs(b) || Number.POSITIVE_INFINITY;
      return aTs - bTs;
    });

    return arr;
  }
  
  //to ftch services 
  async function fetchServices() {
    try {
      const res = await fetch(`${API_BASE}/api/services`);
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("Failed to fetch services", body);
        addToast("Failed to load services", "error");
        setServices([]);
        return;
      }
      const items = (body && (body.data || body.services || body.items)) || [];
      const normalized = items.map((s) => ({
        id: s._id || s.id,
        name: s.name,
        about: s.about || "",
        instructions: s.instructions || s.preInstructions || [],
        instructionsText: (s.instructions || s.preInstructions || []).join(
          "\n",
        ),
        price: s.price ?? s.fee ?? 0,
        available: s.available ?? s.availability === "Available",
        image: s.image || s.imageUrl || s.imageSrc || s.imageSmall || "",

        slots: Array.isArray(s.slots)
          ? convertSlotsForUI(s.slots)
          : s.slots && typeof s.slots === "object"
            ? convertSlotsMapToArray(s.slots)
            : [],
        _raw: s,
      }));
      setServices(normalized);
    } catch (err) {
      console.error("fetchServices error", err);
      addToast("Network error while loading services", "error");
      setServices([]);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  function convertSlotsForUI(slotStrings = []) {
    return (slotStrings || []).map((s, idx) => {
      const raw = String(s || "");
      const m = raw.match(
        /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s*•\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
      );
      if (m) {
        const day = m[1].padStart(2, "0");
        const monthShort = m[2];
        const year = m[3];
        const hour = String(Number(m[4])); // 1-12
        const minute = String(m[5]).padStart(2, "0");
        const ampm = (m[6] || "AM").toUpperCase();
        const mi = months.findIndex(
          (mm) => mm.toLowerCase() === monthShort.toLowerCase(),
        );
        const monthNum = mi >= 0 ? String(mi + 1).padStart(2, "0") : "01";
        const date = `${year}-${monthNum}-${day}`;
        return { id: `s-${idx}`, date, hour, minute, ampm, raw };
      }

      const isoMatch = raw.match(
        /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})?)?/,
      );
      if (isoMatch) {
        const datePart = isoMatch[1];
        let hour = "10";
        let minute = "00";
        let ampm = "AM";
        if (isoMatch[2]) {
          const hh = Number(isoMatch[2]);
          const mm = String(Number(isoMatch[3] || "0")).padStart(2, "0");
          minute = mm;
          if (hh === 0) {
            hour = "12";
            ampm = "AM";
          } else if (hh === 12) {
            hour = "12";
            ampm = "PM";
          } else if (hh > 12) {
            hour = String(hh - 12);
            ampm = "PM";
          } else {
            hour = String(hh);
            ampm = "AM";
          }
        }
        return { id: `s-${idx}`, date: datePart, hour, minute, ampm, raw };
      }

      const timeOnly = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeOnly) {
        const hour = String(Number(timeOnly[1]));
        const minute = String(timeOnly[2]).padStart(2, "0");
        const ampm = (timeOnly[3] || "AM").toUpperCase();
        return {
          id: `s-${idx}`,
          date: "",
          hour,
          minute,
          ampm,
          raw,
        };
      }

      return {
        id: `s-${idx}`,
        date: "",
        hour: "10",
        minute: "00",
        ampm: "AM",
        raw,
      };
    });
  }

  function convertSlotsMapToArray(slotsMap) {
    try {
      const out = [];
      if (slotsMap instanceof Map) {
        for (const [date, arr] of slotsMap.entries()) {
          (arr || []).forEach((t, idx) => {
            const parsed = parseFrontendSlotString(date, t);
            out.push({ id: `${date}-${idx}`, ...parsed, raw: t });
          });
        }
      } else {
        for (const date of Object.keys(slotsMap || {})) {
          (slotsMap[date] || []).forEach((t, idx) => {
            const parsed = parseFrontendSlotString(date, t);
            out.push({ id: `${date}-${idx}`, ...parsed, raw: t });
          });
        }
      }
      return out;
    } catch (e) {
      return [];
    }
  }

  function parseFrontendSlotString(date, timeStr) {
    const slot = {
      date: date || "",
      hour: "10",
      minute: "00",
      ampm: "AM",
      raw: timeStr,
    };

    if (!timeStr) return slot;
    const raw = String(timeStr);

    const isoMatch = raw.match(
      /[T\s](\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})?$/,
    );
    if (isoMatch) {
      const hh24 = Number(isoMatch[1]);
      const mm = String(Number(isoMatch[2])).padStart(2, "0");
      if (hh24 === 0) {
        slot.hour = "12";
        slot.ampm = "AM";
      } else if (hh24 === 12) {
        slot.hour = "12";
        slot.ampm = "PM";
      } else if (hh24 > 12) {
        slot.hour = String(hh24 - 12);
        slot.ampm = "PM";
      } else {
        slot.hour = String(hh24);
        slot.ampm = "AM";
      }
      slot.minute = mm;
      return slot;
    }

    const m = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (m) {
      slot.hour = String(Number(m[1]));
      slot.minute = String(m[2]).padStart(2, "0");
      slot.ampm = (m[3] || "AM").toUpperCase();
    }
    return slot;
  }

  function toggleDetails(id) {
    setOpenDetails((prev) => ({ [id]: !prev[id] }));
  }

  async function startEdit(service) {
    let latest = service;
    if (service.id) {
      try {
        const res = await fetch(`${API_BASE}/api/services/${service.id}`);
        const body = await res.json().catch(() => null);
        if (res.ok && body) {
          latest = body.data || body.service || body;
        }
      } catch (e) {}
    }

    const normalized = {
      id: latest._id || latest.id,
      name: latest.name || "",
      about: latest.about || "",
      instructionsText: (
        latest.instructions ||
        latest.preInstructions ||
        []
      ).join("\n"),
      price: latest.price ?? latest.fee ?? 0,
      available:
        latest.available ?? latest.availability === "Available" ?? true,
      imagePreview: latest.imageUrl || latest.image || latest.imageSrc || "",
      imageFile: null,
      slots: sortSlotsForDisplay(
        Array.isArray(latest.slots)
          ? convertSlotsForUI(latest.slots)
          : convertSlotsMapToArray(latest.slots),
      ),
    };

    setEditingId(normalized.id);
    setEditForm(normalized);
    setOpenDetails({ [normalized.id]: true });
  }
  // to cancel an edit 
  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  function validateSlots(slots = []) {
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot) {
        return {
          valid: false,
          message: "Please fill all slot date/time fields.",
        };
      }
      if (!slot.date || !/^\d{4}-\d{2}-\d{2}$/.test(slot.date)) {
        return {
          valid: false,
          message:
            "Please provide a valid date (year-month-day) for all slots. Example: 2025-12-31.",
        };
      }
      if (!slot.hour || !/^(?:[1-9]|1[0-2])$/.test(String(slot.hour))) {
        return {
          valid: false,
          message: "Please select hour (1-12) for all slots.",
        };
      }
      if (!slot.minute || !/^\d{2}$/.test(String(slot.minute))) {
        return {
          valid: false,
          message: "Please select minute (00-59) for all slots.",
        };
      }
      const mm = Number(slot.minute);
      if (isNaN(mm) || mm < 0 || mm > 59) {
        return {
          valid: false,
          message: "Please select a valid minute (00-59) for all slots.",
        };
      }
      if (!slot.ampm || (slot.ampm !== "AM" && slot.ampm !== "PM")) {
        return {
          valid: false,
          message: "Please select AM or PM for all slots.",
        };
      }
      const slotTs = slotDateTimeToMs(slot);
      if (slotTs <= Date.now()) {
        return {
          valid: false,
          message:
            "One or more slots are in the past. Please pick future date/time for all slots.",
        };
      }
    }
    return { valid: true };
  }

  function findDuplicateInSlots(slots = []) {
    const seen = new Set();
    for (let s of slots) {
      const key = `${s.date}|${s.hour}|${String(s.minute).padStart(2, "0")}|${
        s.ampm
      }`;
      if (seen.has(key)) return key;
      seen.add(key);
    }
    return null;
  }

  function slotsToFormattedStrings(slots = []) {
    return (slots || []).map((s) => {
      if (typeof s === "string") return s;
      if (s.raw && typeof s.raw === "string" && s.raw.includes("•"))
        return s.raw;
      // build formatted string from date/hour/minute/ampm
      const parts = (s.date || "").split("-");
      const year = parts[0] || "";
      const monthNum = Number(parts[1] || "1");
      const day = parts[2] ? String(Number(parts[2])).padStart(2, "0") : "";
      const monthName = months[monthNum - 1] || months[0];
      const hour = String(s.hour || "10").padStart(2, "0");
      const minute = String(s.minute || "00").padStart(2, "0");
      const ampm = (s.ampm || "AM").toUpperCase();
      if (!day || !year) {
        return s.raw || `${hour}:${minute} ${ampm}`;
      }
      return `${day} ${monthName} ${year} • ${hour}:${minute} ${ampm}`;
    });
  }

  function slotDateTimeToMs(slot) {
    const [y, m, d] = (slot.date || "").split("-");
    if (!y || !m || !d) return 0;
    let h = Number(slot.hour || 0);
    const mm = Number(slot.minute || 0);
    const ap = (slot.ampm || "AM").toUpperCase();
    if (ap === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h = h + 12;
    }
    return new Date(Number(y), Number(m) - 1, Number(d), h, mm, 0, 0).getTime();
  }
  // to save edited data 
  async function saveEdit() {
    if (!editForm) return;

    if ((editForm.slots || []).length > 0) {
      const validation = validateSlots(editForm.slots || []);
      if (!validation.valid) {
        addToast(validation.message, "error");
        return;
      }
      const dupKey = findDuplicateInSlots(editForm.slots || []);
      if (dupKey) {
        const [date, hour, minute, ampm] = dupKey.split("|");
        addToast(
          `Duplicate slot detected: ${formatDateHuman(
            date,
          )} — ${hour}:${minute} ${ampm}`,
          "error",
          4000,
          "top-right",
          true,
        );
        return;
      }
    }

    try {
      const fd = new FormData();
      fd.append("name", editForm.name || "");
      fd.append("about", editForm.about || "");
      fd.append("price", String(Number(editForm.price || 0)));
      fd.append(
        "availability",
        editForm.available ? "available" : "unavailable",
      );

      const instructions = (editForm.instructionsText || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      fd.append("instructions", JSON.stringify(instructions));

      const slotsFormatted = slotsToFormattedStrings(editForm.slots || []);
      fd.append("slots", JSON.stringify(slotsFormatted));

      if (editForm.imageFile) {
        fd.append("image", editForm.imageFile);
      }

      const id = editForm.id;
      const res = await fetch(`${API_BASE}/api/services/${id}`, {
        method: "PUT",
        body: fd,
      });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Save failed:", body);
        addToast(body?.message || "Failed to save service", "error");
        return;
      }

      const updatedRaw = body?.data || body?.service || null;

      setServices((list) =>
        list.map((s) =>
          s.id === id
            ? {
                id,
                name: editForm.name,
                about: editForm.about,
                instructions: instructions,
                instructionsText: instructions.join("\n"),
                price: Number(editForm.price) || 0,
                available: !!editForm.available,
                image:
                  updatedRaw?.imageUrl ||
                  updatedRaw?.image ||
                  editForm.imagePreview ||
                  s.image,
                slots:
                  updatedRaw?.slots && Array.isArray(updatedRaw.slots)
                    ? convertSlotsForUI(updatedRaw.slots)
                    : editForm.slots || s.slots,
                _raw: updatedRaw || s._raw,
              }
            : s,
        ),
      );

      addToast("Service updated successfully", "success");
      cancelEdit();
    } catch (err) {
      console.error("saveEdit error", err);
      addToast("Network error while saving", "error");
    }
  }
  // to remove services
  async function removeService(id) {
    if (!window.confirm("Are you sure you want to remove this service?"))
      return;
    try {
      const res = await fetch(`${API_BASE}/api/services/${id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("Delete failed", body);
        addToast(body?.message || "Failed to remove service", "error");
        return;
      }
      setServices((s) => s.filter((x) => x.id !== id));
      setOpenDetails({});
      addToast("Service removed", "success");
    } catch (err) {
      console.error("removeService error", err);
      addToast("Network error while removing", "error");
    }
  }

  function onImageFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (editForm?.imagePreview && editForm.imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(editForm.imagePreview);
      } catch (err) {}
    }
    const url = URL.createObjectURL(f);
    setEditForm((prev) => ({ ...prev, imagePreview: url, imageFile: f }));
  }
  // to adding new Slot 
  function addNewSlot() {
    const nextId =
      (editForm.slots?.reduce((a, b) => {
        const idA = Number(String(a.id || "0").replace(/\D/g, "")) || 0;
        const idB = Number(String(b.id || "0").replace(/\D/g, "")) || 0;
        return Math.max(idA, idB);
      }, 0) || 0) + 1;
    const newSlot = {
      id: `s-${nextId}`,
      date: todayISO,
      hour: "10",
      minute: "00",
      ampm: "AM",
    };
    setEditForm((p) => ({ ...p, slots: [...(p.slots || []), newSlot] }));
  }
  // to update existing slot 
  function updateSlot(slotId, field, value) {
    setEditForm((p) => {
      const oldSlot = (p.slots || []).find((s) => s.id === slotId) || {};
      if (field === "date" && value) {
        if (value < todayISO) {
          addToast(
            "Cannot select a past date. Choose today or a future date.",
            "error",
          );
          return p;
        }
      }

      const newSlots = (p.slots || []).map((s) =>
        s.id === slotId ? { ...s, [field]: value } : s,
      );

      const dupKey = findDuplicateInSlots(newSlots || []);
      if (dupKey) {
        const [date, hour, minute, ampm] = dupKey.split("|");
        addToast(
          `Duplicate slot detected: ${formatDateHuman(
            date,
          )} — ${hour}:${minute} ${ampm}`,
          "error",
          3500,
          "top-right",
          true,
        );
      }

      return { ...p, slots: newSlots };
    });
  }
  // to remove slot
  function removeSlot(slotId) {
    setEditForm((p) => ({
      ...p,
      slots: (p.slots || []).filter((s) => s.id !== slotId),
    }));
  }

  const filtered = services
    .filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((s) => {
      if (filterMode === "all") return true;
      if (filterMode === "available") return s.available === true;
      if (filterMode === "unavailable") return s.available === false;
      return true;
    });

  function formatDateHuman(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const mi = Number(m) - 1;
    const mon = months[mi] || m;
    return `${String(Number(d))} ${mon} ${y}`;
  }

return (
  <div className="p-4 sm:p-6 max-w-6xl font-serif mx-auto min-h-screen bg-linear-to-b from-green-50 via-white to-white">
    {/* Header */}
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
      <div className="w-full md:w-auto">
        <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-700">
          Services
        </h1>
        <p className="text-sm text-emerald-500 mt-1">
          Manage your services — edit, schedule slots or remove
        </p>
      </div>

      <div className="flex flex-col md:flex-col items-stretch md:items-center gap-3 w-full md:w-auto">
        <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-emerald-100 bg-white p-1">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 cursor-pointer rounded-full text-sm transition ${
              filterMode === "all"
                ? "bg-emerald-600 text-white"
                : "text-emerald-700 bg-transparent"
            }`}
            type="button"
          >
            All
          </button>
          <button
            onClick={() => setFilterMode("available")}
            className={`px-3 py-1 cursor-pointer rounded-full text-sm transition ${
              filterMode === "available"
                ? "bg-emerald-600 text-white"
                : "text-emerald-700 bg-transparent"
            }`}
            type="button"
          >
            Available
          </button>
          <button
            onClick={() => setFilterMode("unavailable")}
            className={`px-3 py-1 cursor-pointer rounded-full text-sm transition ${
              filterMode === "unavailable"
                ? "bg-emerald-600 text-white"
                : "text-emerald-700 bg-transparent"
            }`}
            type="button"
          >
            Unavailable
          </button>
        </div>

        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-emerald-300" />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="pl-12 pr-4 py-2 rounded-full border border-emerald-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 transition w-full md:w-72 bg-white"
          />
        </div>
      </div>
    </div>

    {/* Grid */}
    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6">
      {filtered.map((svc) => {
        const isOpen = !!openDetails[svc.id];
        const isEditing = editingId === svc.id;

        return (
          <div key={svc.id} className="bg-white rounded-2xl overflow-hidden transform transition hover:-translate-y-1 hover:shadow-2xl border border-emerald-50">
            <div
              className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 cursor-pointer"
              onClick={() => toggleDetails(svc.id)}
            >
              <div className="w-full sm:w-36 h-36 rounded-lg overflow-hidden bg-emerald-50 ring-1 ring-emerald-50 shrink-0">
                {svc.image ? (
                  <img
                    src={svc.image}
                    alt={svc.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-300">
                    <ImageIcon />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-emerald-700 truncate">{svc.name}</h2>
                    <p className="text-sm text-emerald-500 mt-1 line-clamp-2">{svc.about}</p>
                  </div>

                  <div className="text-left sm:text-right mt-2 sm:mt-0">
                    <div className="text-md font-semibold text-emerald-700">₹{svc.price}</div>
                    <div
                      className={`text-xs mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                        svc.available
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {svc.available ? (
                        <><Check className="w-3 h-3" /> Available</>
                      ) : (
                        <><X className="w-3 h-3" /> Unavailable</>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 font-bold text-sm text-emerald-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {svc.slots.length} slot{svc.slots.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="pl-3 self-start sm:self-center">
                <ChevronDown
                  className={`w-6 h-6 transition-transform ${
                    isOpen ? "rotate-180 text-emerald-400" : "text-emerald-300"
                  }`}
                />
              </div>
            </div>

            <div className={`px-4 pb-4 transition-all ${isOpen ? "block" : "hidden"}`}>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-36 h-36 rounded-lg overflow-hidden bg-emerald-50 ring-1 ring-emerald-50 shrink-0">
                      {editForm?.imagePreview ? (
                        <img
                          src={editForm.imagePreview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-300">
                          <ImageIcon />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        className="w-full border rounded-lg px-3 py-2 outline-none transition focus:ring-2 focus:ring-green-200 focus:border-green-300 border-green-100 bg-white"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                      <input
                        className="w-full border rounded-lg px-3 py-2 outline-none transition focus:ring-2 focus:ring-green-200 focus:border-green-300 border-green-100 bg-white mt-1"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, price: e.target.value }))
                        }
                        type="number"
                        placeholder="Price"
                      />

                      <div className="mt-1 flex items-center gap-2">
                        <label className="text-sm text-emerald-600">Availability</label>
                        <select
                          value={editForm.available ? "true" : "false"}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              available: e.target.value === "true",
                            }))
                          }
                          className="border rounded-full cursor-pointer px-3 py-1 outline-none focus:ring-2 focus:ring-emerald-200 border-emerald-300"
                        >
                          <option value="true">Available</option>
                          <option value="false">Unavailable</option>
                        </select>
                      </div>

                      <div className="mt-2">
                        <label className="text-sm block mb-1 text-emerald-700">Change image</label>
                        <input
                          ref={fileRef}
                          onChange={onImageFileChange}
                          type="file"
                          accept="image/*"
                          className="w-full border border-emerald-300 rounded-full px-4 py-2 text-sm bg-white cursor-pointer file:bg-emerald-50 file:border-0 file:px-4 file:py-1 file:rounded-full file:text-emerald-700 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-md font-bold mb-1 text-emerald-600">About</label>
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 outline-none transition focus:ring-2 focus:ring-green-200 focus:border-green-300 border-green-100 bg-white min-h-17"
                      value={editForm.about}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, about: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-md font-bold mb-1 text-emerald-600">Instructions (one per line)</label>
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 outline-none transition focus:ring-2 focus:ring-green-200 focus:border-green-300 border-green-100 bg-white min-h-20"
                      value={editForm.instructionsText}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          instructionsText: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm text-emerald-600">Slots</label>
                      <button
                        onClick={addNewSlot}
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-2 text-sm px-2 py-1 rounded-full border border-emerald-100"
                      >
                        <Plus className="w-4 h-4" /> Add slot
                      </button>
                    </div>

                    <div className="space-y-2 mt-2">
                      {(editForm.slots || []).map((slot) => (
                        <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                          <input
                            type="date"
                            value={slot.date}
                            onChange={(e) =>
                              updateSlot(slot.id, "date", e.target.value)
                            }
                            required
                            min={todayISO}
                            className="border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-200 border-emerald-100 w-full sm:w-auto"
                          />

                          <div className="flex gap-2 items-center w-full sm:w-auto">
                            <select
                              value={slot.hour}
                              onChange={(e) =>
                                updateSlot(slot.id, "hour", e.target.value)
                              }
                              required
                              className="border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-200 border-emerald-100 w-20"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                <option key={h} value={String(h)}>{h}</option>
                              ))}
                            </select>

                            <select
                              value={slot.minute}
                              onChange={(e) =>
                                updateSlot(slot.id, "minute", e.target.value)
                              }
                              required
                              className="border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-200 border-emerald-100 w-20"
                            >
                              {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                                <option key={m} value={String(m).padStart(2, "0")}>
                                  {String(m).padStart(2, "0")}
                                </option>
                              ))}
                            </select>

                            <select
                              value={slot.ampm}
                              onChange={(e) =>
                                updateSlot(slot.id, "ampm", e.target.value)
                              }
                              required
                              className="border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-200 border-emerald-100 w-20"
                            >
                              <option>AM</option>
                              <option>PM</option>
                            </select>
                          </div>

                          <div className="shrink-0">
                            <button
                              onClick={() => removeSlot(slot.id)}
                              className="px-2 py-1 rounded-full cursor-pointer border-red-500 bg-red-300 border text-sm text-black"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 justify-end">
                    <button onClick={cancelEdit} className="px-3 py-2 rounded-full cursor-pointer border-red-600 bg-red-300 border w-full sm:w-auto">
                      Cancel
                    </button>
                    <button onClick={saveEdit} className="px-3 py-2 rounded-full cursor-pointer bg-emerald-600 text-white w-full sm:w-auto">
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-md font-bold text-emerald-700">About</h3>
                    <p className="text-md text-emerald-500 mt-1">{svc.about}</p>
                  </div>

                  <div>
                    <h3 className="text-md font-bold text-emerald-700">Instructions</h3>
                    <ul className="list-disc list-inside text-md text-emerald-500 mt-1 space-y-1">
                      {svc.instructions.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-md font-bold text-emerald-700">Slots</h3>
                    <div className="mt-2 space-y-2 text-sm text-emerald-600">
                      {svc.slots.length === 0 ? (
                        <div className="text-emerald-300">No slots scheduled</div>
                      ) : (
                        sortSlotsForDisplay(svc.slots).map((slot) => (
                          <div key={slot.id} className="flex font-bold items-center gap-3">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <div>
                              <div>
                                {formatDateHuman(slot.date)} — {slot.hour}:
                                {String(slot.minute).padStart(2, "0")} {slot.ampm}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => startEdit(svc)}
                      className="inline-flex bg-emerald-200 cursor-pointer items-center gap-2 px-3 py-2 rounded-full border border-emerald-300"
                    >
                      <Edit2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Edit</span>
                    </button>

                    <button
                      onClick={() => removeService(svc.id)}
                      className="inline-flex items-center bg-red-200 cursor-pointer gap-2 px-3 py-2 rounded-full border text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>

    {filtered.length === 0 && (
      <div className="text-center text-emerald-300 mt-8">No services match your search.</div>
    )}

    {/* Toast containers */}
    <div className="fixed right-3 top-3 z-50 space-y-3">
      {toasts
        .filter((t) => t.position === "top-right")
        .map((t) => (
          <div key={t.id} className={`transform transition-all ${t.animated ? "animate-bounce" : ""}`}>
            <div className={`max-w-sm px-4 py-3 rounded-lg shadow-lg border ${t.type === "success" ? "bg-white border-emerald-100" : "bg-white border-slate-100"}`}>
              <div className="flex items-start gap-3">
                <div className={t.type === "success" ? "text-emerald-500" : "text-slate-400"}>
                  <Check className="w-5 h-5" />
                </div>
                <div className="flex-1 text-sm text-emerald-700">{t.message}</div>
                <button
                  onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
                  className="text-emerald-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
    </div>

    <div className="fixed right-3 bottom-3 z-50 space-y-3">
      {toasts
        .filter((t) => t.position === "bottom-right")
        .map((t) => (
          <div key={t.id} className="transform transition-all">
            <div className={`max-w-sm px-4 py-3 rounded-lg shadow-lg border ${t.type === "success" ? "bg-white border-emerald-100" : "bg-white border-slate-100"}`}>
              <div className="flex items-start gap-3">
                <div className={t.type === "success" ? "text-emerald-500" : "text-slate-400"}>
                  <Check className="w-5 h-5" />
                </div>
                <div className="flex-1 text-sm text-emerald-700">{t.message}</div>
                <button
                  onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
                  className="text-emerald-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
    </div>
  </div>
)
}