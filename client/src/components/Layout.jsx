import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  Zap,
  LayoutDashboard,
  BriefcaseBusiness,
  PlusCircle,
  List,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Users,
  Settings,
} from "lucide-react";
import { Zap, LayoutDashboard, BriefcaseBusiness, PlusCircle, List, LogOut, LogIn, UserPlus, Menu, X, Bell, UserCircle } from "lucide-react";
import api from "../api";

const base = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150";
const active = "bg-blue-600 text-white shadow-sm";
const idle = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

// Poll interval for unread notification count (ms)
const POLL_INTERVAL = 60_000;

export default function Layout({ children }) {
  const nav = useNavigate();
  const token = localStorage.getItem("token");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    nav("/login");
  };

  // Fetch unread notification count when logged in
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const { data } = await api.get("/api/notifications/unread-count");
        if (!cancelled) setUnread(data.count || 0);
      } catch {
        // ignore silently
      }
    };

    fetchUnread();
    const id = setInterval(fetchUnread, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  const navLinks = token ? (
    <>
      <NavLink to="/post" className={({ isActive }) => `${base} ${isActive ? active : idle}`} onClick={() => setMobileOpen(false)}>
        <PlusCircle className="w-4 h-4" /> Post Job
      </NavLink>
      <NavLink to="/jobs" className={({ isActive }) => `${base} ${isActive ? active : idle}`} onClick={() => setMobileOpen(false)}>
        <List className="w-4 h-4" /> Browse
      </NavLink>
      <NavLink to="/providers" className={({ isActive }) => `${base} ${isActive ? active : idle}`} onClick={() => setMobileOpen(false)}>
        <Users className="w-4 h-4" /> Providers
      </NavLink>
      <NavLink to="/dashboard" className={({ isActive }) => `${base} ${isActive ? active : idle}`} onClick={() => setMobileOpen(false)}>
        <LayoutDashboard className="w-4 h-4" /> Dashboard
      </NavLink>
      <NavLink to="/my-jobs" className={({ isActive }) => `${base} ${isActive ? active : idle}`} onClick={() => setMobileOpen(false)}>
        <BriefcaseBusiness className="w-4 h-4" /> My Jobs
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `${base} ${isActive ? active : idle}`} onClick={() => setMobileOpen(false)}>
        <Settings className="w-4 h-4" /> Settings
      <NavLink
        to="/notifications"
        className={({ isActive }) => `${base} ${isActive ? active : idle} relative`}
        onClick={() => setMobileOpen(false)}
      >
        <Bell className="w-4 h-4" />
        Notifications
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `${base} ${isActive ? active : idle}`} onClick={() => setMobileOpen(false)}>
        <UserCircle className="w-4 h-4" /> Profile
      </NavLink>
      <button
        onClick={logout}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-150"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </>
  ) : (
    <>
      <NavLink to="/providers" className={({ isActive }) => `${base} ${isActive ? active : idle}`} onClick={() => setMobileOpen(false)}>
        <Users className="w-4 h-4" /> Providers
      </NavLink>
      <NavLink to="/login" className={({ isActive }) => `${base} ${isActive ? active : idle}`} onClick={() => setMobileOpen(false)}>
        <LogIn className="w-4 h-4" /> Login
      </NavLink>
      <NavLink to="/signup" className={({ isActive }) => `${base} ${isActive ? active : idle}`} onClick={() => setMobileOpen(false)}>
        <UserPlus className="w-4 h-4" /> Sign up
      </NavLink>
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 hover:text-blue-600 transition-colors">
            <span className="bg-blue-600 text-white p-1 rounded-lg">
              <Zap className="w-4 h-4" />
            </span>
            ServiQuick
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">{navLinks}</nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-100 px-4 py-3 flex flex-col gap-1 bg-white">
            {navLinks}
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

      <footer className="mt-10 border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <span className="bg-blue-600 text-white p-0.5 rounded">
              <Zap className="w-3 h-3" />
            </span>
            ServiQuick
          </div>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} ServiQuick. All rights reserved.</p>
        </div>
      </footer>

      <Toaster position="top-right" toastOptions={{ className: "text-sm" }} />
    </>
  );
}
