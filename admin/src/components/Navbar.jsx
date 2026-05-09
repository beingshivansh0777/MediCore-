import React, {
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";
import logoImg from "/logo.png";
import { Link, useNavigate, useLocation, NavLink } from "react-router-dom";
import {
  Calendar,
  Grid,
  Home,
  List,
  Menu,
  PlusSquare,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useClerk, useUser, useAuth } from "@clerk/react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navInnerRef = useRef(null);
  const indicatorRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const clerk = useClerk();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, isLoaded: userLoaded } = useUser();

  const moveIndicator = useCallback(() => {
    const container = navInnerRef.current;
    const ind = indicatorRef.current;
    if (!container || !ind) return;

    const active = container.querySelector(".nav-item.active");
    if (!active) {
      ind.style.opacity = "0";
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    const left = activeRect.left - containerRect.left + container.scrollLeft;
    const width = activeRect.width;

    ind.style.transform = `translateX(${left}px)`;
    ind.style.width = `${width}px`;
    ind.style.opacity = "1";
  }, []);

  useLayoutEffect(() => {
    moveIndicator();
    const t = setTimeout(() => {
      moveIndicator();
    }, 120);
    return () => clearTimeout(t);
  }, [location.pathname, moveIndicator]);

  useEffect(() => {
    const container = navInnerRef.current;
    if (!container) return;

    const onScroll = () => {
      moveIndicator();
    };
    container.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      moveIndicator();
    });
    ro.observe(container);
    if (container.parentElement) ro.observe(container.parentElement);

    window.addEventListener("resize", moveIndicator);

    moveIndicator();

    return () => {
      container.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.removeEventListener("resize", moveIndicator);
    };
  }, [moveIndicator]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    let mounted = true;
    const storeToken = async () => {
      if (!authLoaded || !userLoaded) return;
      if (!isSignedIn) {
        try {
          localStorage.removeItem("clerk_token");
        } catch (error) {}
        return;
      }
      try {
        if (getToken) {
          const token = await getToken();
          if (!mounted) return;
          if (token) {
            try {
              localStorage.setItem("clerk_token", token);
            } catch (error) {
              console.warn(
                "Failed to access clerk token from localStorage",
                error,
              );
            }
          }
        }
      } catch (error) {
        console.warn("Could not retrieve Clerk token");
      }
    };
    storeToken();
    return () => {
      mounted = false;
    };
  }, [isSignedIn, authLoaded, userLoaded, getToken]);

  const handleOpenSignIn = () => {
    if (!clerk || !clerk.openSignIn) {
      console.warn("Clerk is not available");
      return;
    }
    clerk.openSignIn();
  };
  const handleSignOut = async () => {
    if (!clerk || !clerk.signOut) {
      console.warn("Clerk is not available");
      return;
    }
    try {
      await clerk.signOut();
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      try {
        localStorage.removeItem("clerk_token");
      } catch (error) {}
      navigate("/");
    }
  };

  return (
    <header className="relative font-serif ">
      <nav className="mx-auto max-w-7xl lg:px-7 xl:px-2 px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="logo" className="w-18 h-18 rounded-full" />

            <Link to="/">
              <div className="text-3xl xl:block lg:text-xs xl:text-xl font-bold text-green-700">
                MediCore
              </div>
              <div className="text-xs xl:block text-gray-500">
                Healthcare Solutions
              </div>
            </Link>
          </div>

          {/* Center Nav */}
          <div className="hidden lg:flex items-center justify-center relative">
            <div className="glow relative rounded-3xl p-1 bg-linear-to-r from-emerald-100 via-emerald-200 to-emerald-100">
              <div className="relative flex items-center">
                <div
                  ref={navInnerRef}
                  tabIndex={0}
                  className="center-inner relative whitespace-nowrap rounded-3xl bg-white/95 lg:px-2 px-4 py-2 flex items-center gap-2 shadow-lg border border-gray-100 overflow-x-auto"
                  style={{
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <CenterNavItem
                    to="/h"
                    label="Dashboard"
                    icon={<Home size={16} />}
                  />
                  <CenterNavItem
                    to="/add"
                    label="Add Doctor"
                    icon={<UserPlus size={16} />}
                  />
                  <CenterNavItem
                    to="/list"
                    label="List Doctors"
                    icon={<Users size={16} />}
                  />
                  <CenterNavItem
                    to="/appointments"
                    label="Appointments"
                    icon={<Calendar size={16} />}
                  />
                  <CenterNavItem
                    to="/service-dashboard"
                    label="Service Dashboard"
                    icon={<Grid size={16} />}
                  />
                  <CenterNavItem
                    to="/add-service"
                    label="Add Service"
                    icon={<PlusSquare size={16} />}
                  />
                  <CenterNavItem
                    to="/list-service"
                    label="List Services"
                    icon={<List size={16} />}
                  />
                  <CenterNavItem
                    to="/service-appointments"
                    label="Service Appointments"
                    icon={<Calendar size={16} />}
                  />
                  <div
                    ref={indicatorRef}
                    className="absolute bottom-0 h-0.5 bg-emerald-500 transition-all duration-300"
                    style={{ width: 0, opacity: 0 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <button
                onClick={handleSignOut}
                className="hidden lg:flex lg:mx-1 xl:mx-1 lg:-mr-6 xl:mr-5 px-4 py-2 rounded-full bg-amber-500 text-white text-sm items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                Sign Out
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={handleOpenSignIn}
                  className="px-3 py-2 cursor-pointer rounded-full border bg-white text-emerald-600 text-sm shadow-sm"
                >
                  Login
                </button>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden p-2 rounded-full bg-white shadow"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile navigation menu */}
        {open && (
          <div
            className="fixed inset-0 z-10 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
        {open && (
          <div className="mt-3 lg:hidden z-20 relative" id="mobile.menu">
            <div className="rounded-xl bg-white shadow-md p-3 space-y-2 border">
              <MobileItem
                to="/h"
                label="Dashboard"
                icon={<Home size={16} />}
                onClick={() => setOpen(false)}
              />

              <MobileItem
                to="/add"
                label="Add Doctor"
                icon={<UserPlus size={16} />}
                onClick={() => setOpen(false)}
              />
              <MobileItem
                to="/list"
                label="List Doctors"
                icon={<Users size={16} />}
                onClick={() => setOpen(false)}
              />
              <MobileItem
                to="/appointments"
                label="Appointments"
                icon={<Calendar size={16} />}
                onClick={() => setOpen(false)}
              />

              <MobileItem
                to="/service-dashboard"
                label="Service Dashboard"
                icon={<Grid size={16} />}
                onClick={() => setOpen(false)}
              />
              <MobileItem
                to="/add-service"
                label="Add Service"
                icon={<PlusSquare size={16} />}
                onClick={() => setOpen(false)}
              />
              <MobileItem
                to="/list-service"
                label="List Services"
                icon={<List size={16} />}
                onClick={() => setOpen(false)}
              />
              <MobileItem
                to="/service-appointments"
                label="Service Appointments"
                icon={<Calendar size={16} />}
                onClick={() => setOpen(false)}
              />
              <div className="pt-2 border-t mt-2">
                {isSignedIn ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setOpen(false);
                    }}
                    className="w-full py-2 rounded-full border bg-amber-500 text-white font-medium"
                  >
                    Sign Out
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleOpenSignIn();
                        setOpen(false);
                      }}
                      className="w-full cursor-pointer py-2 rounded-full border bg-white text-emerald-600 font-medium"
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;

function CenterNavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `nav-item ${isActive ? "active text-emerald-400 font-semibold" : "text-gray-700 hover:text-emerald-600"} relative flex flex-col lg:text-xs lg:-mx-2 xl:text-md items-center gap-1 px-3 py-2 rounded-lg transition-all text-sm`
      }
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

function MobileItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-2 py-2 rounded-md ${
          isActive ? "bg-emerald-50 text-emerald-600" : "hover:bg-gray-50"
        }`
      }
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}
