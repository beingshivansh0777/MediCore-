import React from "react";
import logo from "../assets/logo.png";
import { FaInstagram, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import {
  Activity,
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Send,
  Stethoscope,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Doctors", href: "/doctors" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
    { name: "Appointments", href: "/appointments" },
  ];

  const services = [
    { name: "Blood Pressure Check", href: "/services" },
    { name: "Blood Sugar Test", href: "/services" },
    { name: "Full Blood Count", href: "/services" },
    { name: "X-Ray Scan", href: "/services" },
  ];

  const socialLinks = [
    {
      Icon: FaTwitter,
      color: "hover:text-blue-400",
      name: "Twitter",
      href: "https://x.com/Mishra0857",
    },
    {
      Icon: FaInstagram,
      color: "hover:text-pink-600",
      name: "Instagram",
      href: "https://www.instagram.com/_being_shivansh/",
    },
    {
      Icon: FaLinkedinIn,
      color: "hover:text-blue-700",
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/shivansh-mishra-233b5b2aa/",
    },
  ];

  return (
    <footer className="relative font-serif bg-linear-to-br from-emerald-50 via-green-50 to-teal-50 border-t border-emerald-200 overflow-hidden">
      <div className="absolute top-5 right-5 animate-float hidden md:block">
        <Stethoscope className="w-8 h-8 text-emerald-600" />
      </div>
      <div className="absolute top-1/3 left-5 animate-float hidden md:block ">
        <Activity className="w-5 h-5 text-green-500" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full gap-8 lg:gap-16 mb-10 text-center lg:text-left items-start">
          <div className="lg:col-span-1 flex flex-col items-start w-full">
            <div className="flex items-center justify-center lg:justify-start space-x-4 mb-2">
              <img
                src={logo}
                alt="logo"
                className="w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 object-contain"
              />
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold bg-linear-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent font-['Poppins'] tracking-tight leading-tight">
                  MediCore
                </h2>
                <p className="text-emerald-400 text-xs md:text-sm font-semibold tracking-wide mt-1">
                  HealthCare Solutions
                </p>
              </div>
            </div>

            <p className="text-emerald-700 font-serif italic mb-4 leading-relaxed text-sm md:text-base font-light">
              Your trusted partner in healthcare innovation. We're committed to
              providing exceptional medical care with cutting-edge technology
              and compassionate service.
            </p>

            <div className="space-y-3 w-full md:w-auto">
              <div className="flex items-center justify-center md:justify-start space-x-4 text-emerald-700 hover:text-emerald-800 transition-all duration-300 group transform hover:translate-x-0 md:hover:translate-x-2">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-100 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium"> +91 8858094500</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-4 text-emerald-700 hover:text-emerald-800 transition-all duration-300 group transform hover:translate-x-0 md:hover:translate-x-2">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-100 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm">
                  <Mail className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium">
                  {" "}
                  luckymishra2625@gmail.com{" "}
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-4 text-emerald-700 hover:text-emerald-800 transition-all duration-300 group transform hover:translate-x-0 md:hover:translate-x-2">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-100 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium"> Lucknow,India </span>
              </div>
            </div>
          </div>
          {/* quick Links  */}
          <div className="lg:col-span-1 flex flex-col justify-start">
            <h3 className="text-lg md:text-xl font-bold text-emerald-800 relative inline-block mt-6">
              Quick Links
            </h3>
            <ul className="space-y-2 mt-4">
              {quickLinks.map((link, index) => (
                <li key={link.name} className="w-full">
                  <a
                    href={link.href}
                    className="flex items-center justify-center md:justify-start text-emerald-700 hover:text-emerald-800 transition-all duration-300 group text-sm md:text-base font-medium py-2 px-3 rounded-lg hover:bg-emerald-50 border border-transparent hover:border-emerald-200"
                    style={{
                      animationDelay: `${index * 60}ms`,
                    }}
                  >
                    <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                      <ArrowRight className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span>{link.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {/* Our services */}
          <div className="lg:col-span-1 flex flex-col justify-start">
            <h3 className="text-lg md:text-xl font-bold text-emerald-800 relative inline-block mt-6">
              Our Services
            </h3>
            <ul className="space-y-2 mt-4">
              {services.map((service, index) => (
                <li key={`${service.name}-${index}`}>
                  <a
                    href={service.href}
                    className="flex items-center text-emerald-700 hover:text-green-700 transition-all duration-300 text-sm md:text-base font-medium py-2 rounded-lg hover:bg-green-50 border border-transparent hover:border-green-200"
                  >
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 shrink-0"></span>
                    <span>{service.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-1 flex flex-col justify-start w-full">
            <h3 className="text-lg md:text-xl font-bold text-emerald-800 mt-6 mb-3">
              Stay Connected
            </h3>
            <p className="text-emerald-700 text-sm md:text-base mb-4 font-light text-left">
              Stay Connected for health tips, medical updates, and wellness
              insights delivered to your inbox.
            </p>

            {/* Social icons */}
            <div className="flex gap-3 justify-start mt-4">
              {socialLinks.map(({ Icon, color, name, href }, index) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-emerald-400 to-green-500 rounded-full transform scale-0 group-hover:scale-110 transition-transform duration-300 hidden lg:block"></div>
                  <Icon className="w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 p-2 text-emerald-700 cursor-pointer transform hover:scale-110 hover:rotate-6 transition-all duration-300 relative z-10 bg-white rounded-2xl shadow-lg border-2 border-emerald-100" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center lg:justify-between items-center gap-4 md:gap-6 border-t border-emerald-100 pt-6">
          <div className="text-emerald-700 text-sm md:text-base font-medium flex items-center gap-2">
            <span>&copy;{currentYear} Medicore HealthCare</span>
          </div>
          <div className="text-emerald-700 text-sm md:text-base font-medium flex items-center gap-2">
            <span>Designed by </span>
            <a
              href="https://shivansh-mishra-portfolio.vercel.app/"
              target="_blank"
              className="font-bold text-emerald-500 hover:text-purple-700 transition-colors duration-300"
            >
              Shivansh
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
