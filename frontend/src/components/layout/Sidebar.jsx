import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, Map, FileWarning, FileText, Users, Settings,
  LayoutDashboard, Briefcase, Sparkles, Fingerprint, CheckCircle, MapPin
} from "lucide-react";

const MENU_ITEMS = [
  // FISHERMAN
  { title: "My Dashboard", path: "/dashboard/fisherman", icon: <Home className="w-5 h-5" />, roles: ["FISHERMAN"] },
  { title: "Report Incident", path: "/dashboard/report", icon: <FileWarning className="w-5 h-5" />, roles: ["FISHERMAN", "SYSTEM_ADMIN"] },
  { title: "Live Map", path: "/dashboard/fisherman/map", icon: <Map className="w-5 h-5" />, roles: ["FISHERMAN"] },

  // OFFICER
  { title: "Overview", path: "/dashboard/officer", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["OFFICER"] },
  { title: "Reported Incidents", path: "/dashboard/officer/reported-incidents", icon: <MapPin className="w-5 h-5" />, roles: ["OFFICER"] },
  { title: "Cases", path: "/dashboard/officer/cases", icon: <Briefcase className="w-5 h-5" />, roles: ["OFFICER"] },
  { title: "Team", path: "/dashboard/officer/team", icon: <Users className="w-5 h-5" />, roles: ["OFFICER"] },
  { title: "Evidence", path: "/dashboard/officer/evidence", icon: <Fingerprint className="w-5 h-5" />, roles: ["OFFICER"] },
  { title: "AI Risk Analyzer", path: "/dashboard/officer/ai-risk", icon: <Sparkles className="w-5 h-5" />, roles: ["OFFICER"] },

  // ILLEGAL ADMIN — Zones removed as requested
  { title: "Dashboard", path: "/dashboard/illegal-admin", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["ILLEGAL_ADMIN"] },
  { title: "Reports", path: "/dashboard/illegal-admin/reports", icon: <FileText className="w-5 h-5" />, roles: ["ILLEGAL_ADMIN", "SYSTEM_ADMIN"] },
  { title: "Cases", path: "/dashboard/illegal-admin/cases", icon: <Briefcase className="w-5 h-5" />, roles: ["ILLEGAL_ADMIN", "SYSTEM_ADMIN"] },
  { title: "Resolved", path: "/dashboard/illegal-admin/resolved", icon: <CheckCircle className="w-5 h-5" />, roles: ["ILLEGAL_ADMIN", "SYSTEM_ADMIN"] },

  // HAZARD ADMIN
  { title: "Dashboard", path: "/dashboard/hazard-admin", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["HAZARD_ADMIN"] },
  { title: "Reports", path: "/dashboard/hazard-admin/reports", icon: <FileText className="w-5 h-5" />, roles: ["HAZARD_ADMIN", "SYSTEM_ADMIN"] },
  { title: "Zones", path: "/dashboard/hazard-admin/zones", icon: <Map className="w-5 h-5" />, roles: ["HAZARD_ADMIN", "SYSTEM_ADMIN"] },
  { title: "Cases", path: "/dashboard/hazard-admin/cases", icon: <Briefcase className="w-5 h-5" />, roles: ["HAZARD_ADMIN", "SYSTEM_ADMIN"] },

  // SYSTEM ADMIN
  { title: "System Overview", path: "/dashboard/system-admin", icon: <Settings className="w-5 h-5" />, roles: ["SYSTEM_ADMIN"] },
  { title: "Manage Users", path: "/dashboard/system-admin/users", icon: <Users className="w-5 h-5" />, roles: ["SYSTEM_ADMIN"] },
];

export default function Sidebar() {
  const location = useLocation();
  const currentRole = localStorage.getItem("userRole") || "FISHERMAN";
  const visibleLinks = MENU_ITEMS.filter((item) => item.roles.includes(currentRole));

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-full flex flex-col shadow-xl">
      <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3 w-full">
          <img src="/logo.svg" alt="BlueShield Logo" className="h-8 w-8 object-contain rounded-lg border border-white/10 shadow-sm" />
          <span className="font-bold text-white tracking-wide">BlueShield</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
          {currentRole.replace("_", " ")} MENU
        </div>
        {visibleLinks.map((link) => {
          const isRootDashboard = link.path.split("/").length <= 3;
          const isActive = isRootDashboard
            ? location.pathname === link.path
            : location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive ? "bg-blue-600 text-white shadow-md font-medium" : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.icon}
              <span className="text-sm">{link.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">System Health</p>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Optimal</p>
          </div>
        </div>
      </div>
    </div>
  );
}