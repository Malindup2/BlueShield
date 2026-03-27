import React from "react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import {
  LogOut,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  MapPin,
  FileText,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

// ─── Chart data ───────────────────────────────────────────────────────────────
const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

const categoryData = [
  { name: "Pollution", value: 32 },
  { name: "Illegal Fishing", value: 48 },
  { name: "Danger Zone", value: 19 },
  { name: "Weather Alert", value: 29 },
];

const monthlyData = [
  { month: "Jan", cases: 18 },
  { month: "Feb", cases: 24 },
  { month: "Mar", cases: 15 },
  { month: "Apr", cases: 31 },
  { month: "May", cases: 27 },
  { month: "Jun", cases: 38 },
  { month: "Jul", cases: 22 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ title, value, icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium leading-tight">{title}</p>
        <p className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-md text-xs text-slate-700">
      <p className="font-semibold">{label || payload[0].name}</p>
      <p className="text-blue-600 font-bold">{payload[0].value} cases</p>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function HazardAdminDashboard() {
  const { user, logout } = useAuth();

  const stats = [
    {
      title: "Pending Verification",
      value: 23,
      icon: <Clock size={16} />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Verified Cases",
      value: 80,
      icon: <CheckCircle size={16} />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Active Danger Zones",
      value: 5,
      icon: <ShieldAlert size={16} />,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
    },
    {
      title: "Restricted Zones",
      value: 3,
      icon: <MapPin size={16} />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  const modules = [
    {
      title: "Report Verification",
      desc: "Review & verify incoming hazard reports",
      link: "/dashboard/hazard/reports",
      icon: <FileText size={20} />,
      tag: "23 pending",
      tagStyle: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      title: "Hazard Case Manager",
      desc: "Track all active & resolved cases",
      link: "/dashboard/hazard/cases",
      icon: <AlertTriangle size={20} />,
      tag: "128 total",
      tagStyle: "bg-slate-100 text-slate-500 border-slate-200",
    },
    {
      title: "Zone Manager",
      desc: "Configure danger & restricted zones",
      link: "/dashboard/hazard/zones",
      icon: <MapPin size={20} />,
      tag: "8 active",
      tagStyle: "bg-red-50 text-red-500 border-red-200",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-[1400px] px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-base shadow-sm">
              🛡️
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold text-slate-900">BlueShield</p>
              <p className="text-xs text-slate-400">Life Below Water · SDG 14</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-sm text-slate-400">
            <span>Dashboard</span>
            <ChevronRight size={13} />
            <span className="text-blue-600 font-semibold">Hazard Admin</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-extrabold text-blue-700">
                {user?.email?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-800">{user?.name ?? "Admin User"}</p>
                <p className="text-xs text-slate-400">{user?.email ?? "admin@blueshield.lk"}</p>
              </div>
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="mx-auto max-w-[1400px] px-5 py-5 flex flex-col gap-4">
        {/* Row 1 — Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        {/* Row 2 — Charts */}
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Trend
                </p>
                <p className="text-sm font-bold text-slate-900">Monthly Hazard Cases</p>
              </div>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 rounded-full">
                This Year
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyData} barSize={24}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(59,130,246,0.04)" }}
                />
                <Bar dataKey="cases" fill="#3b82f6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                By Category
              </p>
              <p className="text-sm font-bold text-slate-900">This Month</p>
            </div>
            <div className="flex items-center gap-2">
              <ResponsiveContainer width="48%" height={130}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={3}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2.5 flex-1">
                {categoryData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: PIE_COLORS[i] }}
                    />
                    <span className="text-[11px] text-slate-500 flex-1 truncate">{d.name}</span>
                    <span className="text-[11px] font-bold text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3 — Management Modules (Full Width) */}
        <div className="w-full">
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Management
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modules.map((m) => (
              <Link
                key={m.title}
                to={m.link}
                className="group bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                {/* Navy icon square */}
                <div className="w-12 h-12 rounded-xl bg-[#1e3a5f] flex items-center justify-center text-white shadow-md group-hover:bg-[#1a3255] transition-colors">
                  {m.icon}
                </div>

                {/* Text Content */}
                <div className="flex-1">
                  <p className="text-base font-bold text-slate-900 leading-snug">{m.title}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-snug">{m.desc}</p>
                </div>

                {/* Tag + Navigation Arrow */}
                <div className="flex items-center justify-between mt-auto">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${m.tagStyle}`}
                  >
                    {m.tag}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-600 flex items-center justify-center transition-colors">
                    <ArrowRight
                      size={14}
                      className="text-slate-500 group-hover:text-white transition-colors"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}