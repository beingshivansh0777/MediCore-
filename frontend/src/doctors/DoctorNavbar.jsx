import React, { useMemo, useState } from "react";
import logo from "../assets/logo.png";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { Calendar, Edit, Home, Menu, X, LogOutIcon } from "lucide-react";

const DoctorNavbar = () => {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const location = useLocation();

  const doctorId = useMemo(() => {
    if (params?.id) return params.id;
    const m = location.pathname.match(/\/doctor-admin\/([^/]+)/);
    if (m) return m[1];
    return null;
  }, [params, location.pathname]);

  const basePath = doctorId
    ? `/doctor-admin/${doctorId}`
    : "/doctor-admin/login";

  const navItems = [
    { name: "Dashboard", to: `${basePath}`, Icon: Home },
    { name: "Appointments", to: `${basePath}/appointments`, Icon: Calendar },
    { name: "Edit Profile", to: `${basePath}/profile/edit`, Icon: Edit },
  ];

  return (
    <>
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
        <div className="px-5 py-3 rounded-full bg-white/80 backdrop-blur-md border border-emerald-100 shadow-2xl flex items-center justify-between gap-6 transition-all duration-300 hover:shadow-emerald-200/80">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full overflow-hidden">
              <img
                src={logo}
                alt="logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-emerald-700 tracking-wide whitespace-nowrap">
                MediCore Doctors
              </h1>
              <p className="text-[10px] sm:text-xs text-emerald-600">
                Healthcare Solutions
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen((s) => !s)}
              className="lg:hidden p-2 rounded-full text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {navItems.map(({ name, to, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === basePath}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-lg scale-105 ring-2 ring-emerald-200"
                        : "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
                    }`
                  }
                >
                  <Icon size={17} />
                  <span>{name}</span>
                </NavLink>
              ))}
            </div>
            {/* Logout Button */}
            <button
              onClick={() => {
                window.location.href = "/doctor-admin/login";
              }}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm text-sm font-semibold transition-all duration-200 hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:scale-105"
            >
              <LogOutIcon size={17} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed top-28 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-white border border-emerald-100 rounded-2xl shadow-2xl transform origin-top transition-all duration-300 ${
          open
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex flex-col p-4 gap-2">
          {navItems.map(({ name, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === basePath}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-800 hover:bg-emerald-50"
                }`
              }
              onClick={() => setOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    className={`shrink-0 ${isActive ? "text-white" : "text-emerald-600"}`}
                  />
                  <span className={isActive ? "text-white" : ""}>{name}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => {
              window.location.href = "/doctor-admin/login";
              setOpen(false);
            }}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOutIcon size={20} className="shrink-0 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="h-20 lg:h-20"></div>
    </>
  );
};

export default DoctorNavbar;
