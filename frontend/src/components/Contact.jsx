import React, { useState } from "react";
import {
  Mail,
  MailIcon,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  SendHorizontal,
  Stethoscope,
  User,
  User2Icon,
} from "lucide-react";

const FAQItem = ({ item }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => setOpen(!open)}
      className={`cursor-pointer transition-all duration-300 rounded-xl border mb-4 ${
        open
          ? "bg-emerald-600 text-white border-emerald-600 shadow-lg"
          : "bg-white text-gray-800 border-emerald-200 hover:bg-emerald-50"
      }`}
    >
      <div className="flex justify-between items-center p-4 font-semibold text-sm sm:text-base">
        <span>{item.q}</span>
        <span className="text-lg">{open ? "−" : "+"}</span>
      </div>

      <div
        className={`px-4 overflow-hidden transition-all duration-300 text-sm ${
          open ? "max-h-40 pb-4 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {item.a}
      </div>
    </div>
  );
};

const ContactPage = () => {
  const initial = {
    name: "",
    email: "",
    phone: "",
    department: "",
    service: "",
    message: "",
  };

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const departments = [
    "General Physician",
    "Cardiology",
    "Orthopedics",
    "Dermatology",
    "Pediatrics",
    "Gynecology",
  ];

  const servicesMapping = {
    "General Physician": [
      "General Consultation",
      "Adult Checkup",
      "Vaccination",
      "Health Screening",
    ],
    Cardiology: [
      "ECG",
      "Echocardiography",
      "Stress Test",
      "Heart Consultation",
    ],
    Orthopedics: ["Fracture Care", "Joint Pain Consultation", "Physiotherapy"],
    Dermatology: ["Skin Consultation", "Allergy Test", "Acne Treatment"],
    Pediatrics: ["Child Checkup", "Vaccination (Child)", "Growth Monitoring"],
    Gynecology: ["Antenatal Care", "Pap Smear", "Ultrasound"],
  };

  const genericServices = [
    "General Consultation",
    "ECG",
    "Blood Test",
    "X-Ray",
    "Ultrasound",
    "Physiotherapy",
    "Vaccination",
  ];

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[0-9]{10}$/.test(form.phone))
      e.phone = "Phone number must be exactly 10 digits";

    if (!form.department && !form.service) {
      e.department = "Please choose a department or service";
      e.service = "Please choose a department or service";
    }

    if (!form.message.trim()) e.message = "Please write a short message";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "department") {
      setForm((prev) => ({ ...prev, department: value, service: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: undefined }));

    if (name === "department" || name === "service") {
      setErrors((prev) => {
        const copy = { ...prev };
        if (
          (name === "department" && value) ||
          (name === "service" && value) ||
          form.department ||
          form.service
        ) {
          delete copy.department;
          delete copy.service;
        }
        return copy;
      });
    }
  }

  //Submit the data and send it to whatsapp
  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const text = `*Contact Request*\nName: ${form.name}\nEmail: ${
      form.email
    }\nPhone: ${form.phone}\nDepartment: ${
      form.department || "N/A"
    }\nService: ${form.service || "N/A"}\nMessage: ${form.message}`;

    const url = `https://wa.me/8858094500?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");

    setForm(initial);
    setErrors({});
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  }

  //shows the department specific services for screens
  const availableServices = form.department
    ? servicesMapping[form.department] || []
    : genericServices;

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-100 via-white to-emerald-50 py-12 px-4 sm:px-6 md:px-8 lg:px-20 font-serif relative overflow-hidden">
      <div className="hidden md:block absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full blur-3xl opacity-18 animate-pulse"></div>
      <div className="hidden lg:block absolute bottom-0 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-10 animate-spin-slow"></div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start">
        <div className="relative bg-white/60 backdrop-blur-sm shadow-2xl rounded-3xl border border-emerald-200 p-6 sm:p-8 md:p-10 transition-all">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-800 mb-2">
            Contact Our Clinic
          </h2>
          <p className="text-sm sm:text-md text-emerald-700 mb-6 italic">
            Fill the form - Connect with us on Whatsapp instantly.
          </p>

          <form action="" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-emerald-800 text-sm font-semibold flex items-center gap-2">
                  <User2Icon size={16} /> Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full px-4 py-3 mt-1 border border-emerald-400 bg-white rounded-xl shadow-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm sm:text-base"
                />
                {errors.name && (
                  <p className="text-xs text-rose-500 mt-1">{errors.name}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-emerald-800 text-sm font-semibold flex items-center gap-2">
                  <Mail size={16} /> Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  className="w-full px-4 py-3 mt-1 border border-emerald-400 bg-white rounded-xl shadow-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm sm:text-base"
                />
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-emerald-800 text-sm font-semibold flex items-center gap-2">
                  <Phone size={16} /> Phone
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="1234567890"
                  className="w-full px-4 py-3 mt-1 border border-emerald-400 bg-white rounded-xl shadow-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm sm:text-base"
                />
                {errors.phone && (
                  <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-emerald-800 text-sm font-semibold flex items-center gap-2">
                  <MapPin size={16} /> Department
                </label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 mt-1 border border-emerald-400 bg-white rounded-xl shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm sm:text-base"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.department}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-emerald-800 text-sm font-semibold flex items-center gap-2">
                <Stethoscope size={16} /> Service
              </label>
              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                className="w-full px-4 py-3 mt-1 border border-emerald-400 bg-white rounded-xl shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm sm:text-base"
              >
                <option value="">Select Services(or choose Department)</option>
                {availableServices.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.service && (
                <p className="text-xs text-rose-500 mt-1">{errors.service}</p>
              )}
            </div>
            <div>
              <label className="text-emerald-800 text-sm font-semibold flex items-center gap-2">
                <MessageSquare size={16} /> Message
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Describe your concern here..."
                rows={4}
                className="w-full px-4 py-3 mt-1 border border-emerald-400 bg-white rounded-xl shadow-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm sm:text-base"
              ></textarea>
              {errors.message && (
                <p className="text-xs text-rose-500 mt-1">{errors.message}</p>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3">
              <button
                type="submit"
                className="w-full md:w-auto flex items-center gap-2 justify-center bg-emerald-600 text-white px-5 py-2 rounded-full shadow-lg transition-transform active:scale-95"
              >
                <SendHorizontal size={18} />
                <span>Send via Whatsapp</span>
              </button>
              {sent && (
                <p className="text-emerald-700 italic text-sm animate-pulse">
                  Opening WhatsApp...
                </p>
              )}
            </div>
          </form>
        </div>
        {/* Right side  */}
        <div className="space-y-6 md:sticky md:top-2">
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-emerald-300">
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-emerald-800">
              Visit Our Clinic
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Lucknow Uttar Pradesh
            </p>
            <p className="mt-3 flex items-center text-gray-700 gap-2 text-sm sm:text-md">
              <PhoneCall size={16} /> 8858094600
            </p>
            <p className="mt-3 flex items-center gap-2 text-gray-700 text-sm sm:text-md">
              <MailIcon size={16} /> medicore@gmail.com
            </p>
          </div>

          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3559.460792853461!2d80.98709187529213!3d26.870382662861033!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399be2ae3cea2421%3A0x6c0de12e8a77818f!2sGomti%20Nagar%2C%20Lucknow%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1731769000000!5m2!1sen!2sin"
            className="w-full h-80 sm:h-100 md:h-127 lg:h-114 rounded-3xl shadow-2xl border-2 border-emerald-200 hover:shadow-emerald-400 transition-all duration-500"
            title="Gomti Nagar Map"
            loading="lazy"
            allowFullScreen
          ></iframe>
        </div>
        <div className="md:col-span-2 flex justify-center mt-6">
          <div className="w-full max-w-3xl bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-emerald-100">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-center text-emerald-800 mb-6">
              FAQs
            </h3>

            {[
              {
                q: "Do I need a prior appointment?",
                a: "Walk-ins are welcome, but booking an appointment online that helps to reduce waiting time.",
              },
              {
                q: "What is the consultation fee?",
                a: "Fees vary depending on the doctor and service. You can confirm during booking.",
              },
              {
                q: "What payment methods are accepted?",
                a: "We accept cash, UPI, and major debit/credit cards.",
              },
            ].map((item, index) => (
              <FAQItem key={index} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
