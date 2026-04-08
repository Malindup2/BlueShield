import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  MapPinned,
  ShieldAlert,
  Loader2,
  ArrowRight,
  FileWarning,
} from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
} from "react-leaflet";
import toast from "react-hot-toast";

import { getHazardDashboardSummary } from "../../../services/hazardAdminAPI";

function getZoneColors(type) {
  if (type === "DANGEROUS") {
    return {
      stroke: "#dc2626",
      fill: "#ef4444",
      glow: "#f87171",
      hotspot: "#fee2e2",
    };
  }

  return {
    stroke: "#7c3aed",
    fill: "#8b5cf6",
    glow: "#a78bfa",
    hotspot: "#f3e8ff",
  };
}

function reportTypeStyle(type) {
  return {
    HAZARD: "bg-amber-50 text-amber-700 border-amber-200",
    ENVIRONMENTAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[type] || "bg-slate-50 text-slate-700 border-slate-200";
}

const BAR_SHADES = [
  "#0f172a", // slate-950
  "#1e3a8a", // navy
  "#1d4ed8", // blue
  "#312e81", // indigo
  "#475569", // slate
];

const ICON_THEMES = {
  pending: {
    wrap: "bg-blue-50 text-blue-500",
  },
  active: {
    wrap: "bg-violet-50 text-violet-500",
  },
  verified: {
    wrap: "bg-emerald-50 text-emerald-500",
  },
  disabled: {
    wrap: "bg-rose-50 text-rose-500",
  },
};

export default function HazardAdminHome() {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem("userRole")?.replace("_", " ") || "ADMIN";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingReports: 0,
    activeZones: 0,
    disabledZones: 0,
    verifiedHazardCases: 0,
  });
  const [monthlyCategoryChart, setMonthlyCategoryChart] = useState([]);
  const [recentPendingReports, setRecentPendingReports] = useState([]);
  const [zones, setZones] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await getHazardDashboardSummary();

        setStats(
          data?.stats || {
            pendingReports: 0,
            activeZones: 0,
            disabledZones: 0,
            verifiedHazardCases: 0,
          }
        );
        setMonthlyCategoryChart(data?.monthlyCategoryChart || []);
        setRecentPendingReports(data?.recentPendingReports || []);
        setZones(data?.activeZonesMap || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load hazard dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const chartData = useMemo(() => {
    return (monthlyCategoryChart || []).map((item, index) => ({
      ...item,
      fill: BAR_SHADES[index % BAR_SHADES.length],
    }));
  }, [monthlyCategoryChart]);

  const statCards = [
    {
      key: "pending",
      label: "Pending Reports",
      value: stats.pendingReports,
      sub: "Awaiting hazard review",
      icon: FileWarning,
      valueClass: "text-slate-800",
    },
    {
      key: "active",
      label: "Active Zones",
      value: stats.activeZones,
      sub: "Restricted and dangerous areas",
      icon: MapPinned,
      valueClass: "text-slate-800",
    },
    {
      key: "verified",
      label: "Verified Hazard Cases",
      value: stats.verifiedHazardCases,
      sub: "Confirmed operational cases",
      icon: ShieldCheck,
      valueClass: "text-slate-800",
    },
    {
      key: "disabled",
      label: "Disabled Zones",
      value: stats.disabledZones,
      sub: "Inactive safety boundaries",
      icon: ShieldAlert,
      valueClass: "text-slate-800",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-7 shadow-xl">
        <div className="absolute -top-20 -right-10 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">
            Safety Authority
          </p>

          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-white">
            Hazard Center
          </h2>

          <p className="mt-2 text-slate-200 max-w-2xl">
            Monitor hazard reports, active zones, and verified marine safety cases in one command panel.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const theme = ICON_THEMES[card.key];

          return (
            <div
              key={card.label}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {card.label}
                </p>
                <h3 className={`text-3xl font-black ${card.valueClass}`}>
                  {loading ? "--" : card.value}
                </h3>
                <p className="text-xs text-slate-500">{card.sub}</p>
              </div>

              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.wrap}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Map */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="xl:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Hazard Category Distribution
            </h3>
          </div>

          <div className="h-64">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148,163,184,0.08)" }}
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                    }}
                  />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} maxBarSize={70}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Active Zones Map
            </h3>

            <button
              onClick={() => navigate("/dashboard/hazard-admin/zones")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="h-64">
              <MapContainer
                center={[7.2, 79.8]}
                zoom={10}
                className="h-full w-full"
                scrollWheelZoom
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {zones.map((zone) => {
                  const coords = zone?.center?.coordinates || [79.8, 7.2];
                  const latlng = [coords[1], coords[0]];
                  const radius = Number(zone.radius) || 100;
                  const colors = getZoneColors(zone.zoneType);

                  return (
                    <React.Fragment key={zone._id}>
                      <Circle
                        center={latlng}
                        radius={Math.max(radius * 3.2, 700)}
                        interactive={false}
                        pathOptions={{
                          stroke: false,
                          fillColor: colors.glow,
                          fillOpacity: zone.zoneType === "DANGEROUS" ? 0.1 : 0.08,
                        }}
                      />

                      <Circle
                        center={latlng}
                        radius={Math.max(radius * 1.8, 350)}
                        interactive={false}
                        pathOptions={{
                          stroke: false,
                          fillColor: colors.fill,
                          fillOpacity: zone.zoneType === "DANGEROUS" ? 0.18 : 0.14,
                        }}
                      />

                      <Circle
                        center={latlng}
                        radius={radius}
                        pathOptions={{
                          color: colors.stroke,
                          fillColor: colors.fill,
                          fillOpacity: zone.zoneType === "DANGEROUS" ? 0.3 : 0.24,
                          opacity: 1,
                          weight: 2.5,
                        }}
                      >
                        <Popup>
                          <div className="min-w-[200px] space-y-2">
                            <p className="text-sm font-bold text-slate-900">
                              {zone?.sourceHazard?.caseId || "Zone"}
                            </p>
                            <p className="text-xs text-slate-600">
                              {zone.warningMessage}
                            </p>
                            <p className="text-xs text-slate-500">
                              {zone.zoneType} • {zone.radius} m
                            </p>
                          </div>
                        </Popup>
                      </Circle>

                      <CircleMarker
                        center={latlng}
                        radius={18}
                        pathOptions={{
                          color: "#ffffff",
                          weight: 2,
                          fillColor: colors.fill,
                          fillOpacity: 0.95,
                        }}
                      />

                      <CircleMarker
                        center={latlng}
                        radius={8}
                        pathOptions={{
                          color: "#ffffff",
                          weight: 2,
                          fillColor: colors.hotspot,
                          fillOpacity: 1,
                        }}
                      />
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent reports */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Recent Pending Reports
          </h3>

          <button
            onClick={() => navigate("/dashboard/hazard-admin/reports")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : recentPendingReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-lg font-bold text-slate-800">No pending reports</p>
            <p className="mt-2 text-sm text-slate-500">
              New incoming hazard or environmental reports will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {recentPendingReports.map((report) => (
              <div
                key={report._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${reportTypeStyle(
                      report.reportType
                    )}`}
                  >
                    {report.reportType}
                  </span>

                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                    {report.status}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-900">
                  {report.title}
                </h4>

                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {report.description}
                </p>

                <div className="mt-4 space-y-1 text-sm">
                  <p className="font-semibold text-slate-700">
                    {report.location?.address || "No address available"}
                  </p>
                  <p className="text-slate-500">
                    {report.createdAt
                      ? format(new Date(report.createdAt), "MMM d, yyyy • hh:mm a")
                      : "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}