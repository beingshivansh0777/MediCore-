import React, { useState, useRef,useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, UserButton } from "@clerk/clerk-react";
import logo from "../assets/public/logo.png";
import { User, Key, Menu, X } from "lucide-react";

const STORAGE_KEY = "doctorToken_v1";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const navRef = useRef(null);
  const clerk = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setIsDoctorLoggedIn(Boolean(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Doctors", href: "/doctors" },
    { label: "Services", href: "/services" },
    { label: "Appointments", href: "/appointments" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <div className="navbar-border"></div>
      <nav ref={navRef}
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100 transition-transform duration-500 ${
          showNavbar ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-7xl font-[pacifico] md:px-2 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 -ml-3 sm:-ml-4">
              <div className="relative group w-20 h-20 sm:w-24 sm:h-24 lg:w-15 lg:h-15 xl:w-32 xl:h-32">
                <div className="relative flex items-center justify-center overflow-hidden p-2 mx-1 h-full w-full">
                  <img
                    src={logo}
                    alt="logo"
                    className="w-14 h-14 sm:w-18 sm:h-18 lg:w-15 lg:h-15 xl:w-24 xl:h-24 md:w-20 md:h-20 object-contain"
                  />
                </div>
              </div>
              <div className="block sm:block">
                <h1 className="text-2xl md:text-2xl lg:text-2xl xl:text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-emerald-600 to-green-600 tracking-tight">
                  MediCore
                </h1>
                <p className="text-xs lg:text-xs text-gray-500">
                  HealthCare Solutions
                </p>
              </div>
            </Link>
            <div className="hidden lg:-mx-5 lg:flex items-center gap-2">
              <div className="flex gap-1 bg-white border border-emerald-200 p-1 rounded-full shadow-lg">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`nav-item px-5 md:px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? "bg-emerald-600 text-white"
                          : "text-gray-700 hover:text-emerald-600"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* right side of navbar */}
            <div className="flex items-center gap-3">
              <SignedOut>
                <Link
                  to="/doctor-admin/login"
                  className="btn-add hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-black transition-transform duration-200"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden lg:text-xs lg:whitespace-nowrap sm:inline-block">
                    Doctor Admin
                  </span>
                </Link>
                {/* Paitent Login */}
                <button
                  onClick={() => clerk.openSignIn()}
                  className="btn-login hidden lg:flex lg:text-sm items-center gap-2 bg-linear-to-r from-emerald-400 to-green-600 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-xl transition-all duration-300 cursor-default"
                >
                  <Key className="w-4 h-4" />
                  Login
                </button>
              </SignedOut>

              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>

              {/* to toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2.5 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                {isOpen ? (
                  <X className="w-6 h-6 text-gray-900" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-900" />
                )}
              </button>
            </div>
          </div>

          {/* mobile navigation */}
          {isOpen && (
            <div className="mobile-menu lg:hidden pb-4 space-y-2 border-t border-emerald-100 pt-4">
              {navItems.map((item, idx) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={idx}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-emerald-500 text-white"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <SignedOut>
                <Link
                  to="/doctor-admin/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border text-black border-emerald-200 bg-white text-sm font-semibold hover:bg-emerald-50 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Doctor Admin
                </Link>

                <div className="w-full mt-3">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      clerk.openSignIn();
                    }}
                    className="w-full cursor-default md:rounded-full flex items-center justify-center gap-2 bg-linear-to-r from-emerald-500 to-green-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Login
                  </button>
                </div>
              </SignedOut>
            </div>
          )}
        </div>
      </nav>
      <style>
        {`
@keyframes borderFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.navbar-border {
  height: 2px;
  background: linear-gradient(90deg, #10b981, #34d399, #059669, #10b981);
  background-size: 300% 100%;
  animation: borderFlow 6s ease infinite;
}

.nav-item {
  animation: slideIn 0.45s ease-out forwards;
  position: relative;
}

.nav-item.active {
  background: white !important;
  color: #059669 !important;
  box-shadow: 0 6px 18px rgba(5, 150, 105, 0.12);
}

.nav-item.active::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 9999px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translateX(-50%) scale(1.25);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-add {
  background-image: linear-gradient(white, white), linear-gradient(90deg, #10b981, #34d399, #059669);
  background-origin: padding-box, border-box;
  background-clip: padding-box, border-box;
  border: 2px solid transparent;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(16,185,129,0.06);
  transform: translateZ(0);
}

.btn-add:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(16,185,129,0.12);
}

.btn-login {
  animation: glow 2.2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.22),
      0 4px 12px rgba(16, 185, 129, 0.12);
  }
  50% {
    box-shadow: 0 0 32px rgba(16, 185, 129, 0.36),
      0 6px 22px rgba(16, 185, 129, 0.18);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    height: 0;
  }
  to {
    opacity: 1;
    height: auto;
  }
}

.mobile-menu {
  animation: fadeIn 0.28s ease-out;
}
`}
      </style>
    </>
  );
};

export default Navbar;
