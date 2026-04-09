import React, { useEffect, useState } from "react";
import { getBasicStats, getStatsByDateRange } from "../../../services/enforcementAPI";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Shield, AlertCircle, Clock, CheckCircle, Activity, TrendingUp, ArrowUpRight, Layers, BarChart3 } from "lucide-react";

import { Skeleton } from "../../../components/common/Skeleton";

export default function OfficerHome() {
  const [stats, setStats] = useState(null);
  const [trendStats, setTrendStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const basic = await getBasicStats();
        const trends = await getStatsByDateRange({});
        setStats(basic);
        setTrendStats(trends);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        // Artificially delay loading for a smooth skeleton transition
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchStats();
  }, []);

  const priorityData = Object.entries(stats?.byPriority || {}).map(([key, value]) => ({ name: key, value }));
  const statusData = Object.entries(stats?.byStatus || {}).map(([key, value]) => ({ name: key, value }));
  const createdByPeriod = trendStats?.createdByPeriod || [];
  const totalRecentCreated = createdByPeriod.reduce((sum, item) => sum + (item?.count || 0), 0);
  const peakPeriod = createdByPeriod.reduce(
    (peak, item) => (item?.count > peak.count ? { label: item._id, count: item.count } : peak),
    { label: "N/A", count: 0 }
  );

  const COLORS = ["#0ea5e9", "#f59e0b", "#ef4444", "#10b981"];
  const statusPalette = {
    OPEN: "#0ea5e9",
    COURT_PENDING: "#f59e0b",
    CLOSED_RESOLVED: "#10b981",
  };

  const priorityPalette = {
    LOW: "#38bdf8",
    MEDIUM: "#f59e0b",
    HIGH: "#f97316",
    CRITICAL: "#ef4444",
  };

  const statusOrder = ["OPEN", "COURT_PENDING", "CLOSED_RESOLVED"];
  const sortedStatusData = [...statusData].sort((a, b) => statusOrder.indexOf(a.name) - statusOrder.indexOf(b.name));

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-7 shadow-2xl">
        <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100">
                <Activity className="w-3.5 h-3.5" /> Command Deck
              </p>
              <h2 className="mt-4 text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Officer Intelligence Overview
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-cyan-100/90 font-black">Recent Cases</p>
                <p className="mt-1 text-2xl font-black text-white">{loading ? "--" : totalRecentCreated}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-cyan-100/90 font-black">Peak Window</p>
                <p className="mt-1 text-sm md:text-base font-black text-white truncate">{loading ? "--" : peakPeriod.label}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm px-4 py-3 sm:col-span-2 md:col-span-1">
                <p className="text-[10px] uppercase tracking-widest text-cyan-100/90 font-black">Updated</p>
                <p className="mt-1 text-xs md:text-sm font-semibold text-slate-100">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <Skeleton width="40%" height="12px" className="mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton width="60%" height="32px" />
                <Skeleton variant="circular" width="48px" height="48px" />
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="group bg-gradient-to-br from-white to-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between transition hover:shadow-xl hover:-translate-y-0.5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cases</p>
                <h3 className="text-3xl font-black text-slate-800">{stats?.total || 0}</h3>
                <p className="text-xs text-slate-500 inline-flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> All tracked enforcements</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <div className="group bg-gradient-to-br from-white to-amber-50/50 p-6 rounded-3xl border border-amber-100 shadow-sm flex items-center justify-between transition hover:shadow-xl hover:-translate-y-0.5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Cases</p>
                <h3 className="text-3xl font-black text-slate-800">{stats?.byStatus?.OPEN || 0}</h3>
                <p className="text-xs text-slate-500">Requires active follow-up</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="group bg-gradient-to-br from-white to-rose-50/50 p-6 rounded-3xl border border-rose-100 shadow-sm flex items-center justify-between transition hover:shadow-xl hover:-translate-y-0.5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Priority</p>
                <h3 className="text-3xl font-black text-red-600">{stats?.byPriority?.CRITICAL || 0}</h3>
                <p className="text-xs text-slate-500">Highest urgency workload</p>
              </div>
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="group bg-gradient-to-br from-white to-emerald-50/60 p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between transition hover:shadow-xl hover:-translate-y-0.5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved</p>
                <h3 className="text-3xl font-black text-emerald-600">{stats?.byStatus?.CLOSED_RESOLVED || 0}</h3>
                <p className="text-xs text-slate-500">Successfully closed cases</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm xl:col-span-4">
              <Skeleton width="30%" height="16px" className="mb-8" />
              <div className="h-64 flex flex-col justify-end gap-2">
                <div className="flex items-end gap-4 h-full px-4">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton key={j} className="flex-1" height={`${Math.random() * 80 + 20}%`} />
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm xl:col-span-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Status Distribution</h3>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sortedStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={86} label>
                      {sortedStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {sortedStatusData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusPalette[entry.name] || COLORS[idx % COLORS.length] }} />
                      <span>{entry.name.replaceAll("_", " ")}</span>
                    </div>
                    <span className="font-bold text-slate-800">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm xl:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Priority Mix</h3>
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-3">
                {(priorityData.length ? priorityData : [
                  { name: "LOW", value: 0 },
                  { name: "MEDIUM", value: 0 },
                  { name: "HIGH", value: 0 },
                  { name: "CRITICAL", value: 0 },
                ]).map((item) => (
                  <div key={item.name} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider mb-1.5">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityPalette[item.name] || "#94a3b8" }} />
                        {item.name}
                      </span>
                      <span className="text-slate-800">{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(((item.value || 0) / Math.max(stats?.total || 1, 1)) * 100, 100)}%`,
                          backgroundColor: priorityPalette[item.name] || "#94a3b8",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Mini pie chart for priority mix visualization */}
              <div className="flex flex-col items-center mt-8">
                <PieChart width={120} height={120}>
                  <Pie
                    data={priorityData.length ? priorityData : [
                      { name: "LOW", value: 0 },
                      { name: "MEDIUM", value: 0 },
                      { name: "HIGH", value: 0 },
                      { name: "CRITICAL", value: 0 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={2}
                  >
                    {(priorityData.length ? priorityData : [
                      { name: "LOW", value: 0 },
                      { name: "MEDIUM", value: 0 },
                      { name: "HIGH", value: 0 },
                      { name: "CRITICAL", value: 0 },
                    ]).map((entry, idx) => (
                      <Cell key={`cell-${entry.name}`} fill={priorityPalette[entry.name] || COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <span className="mt-2 text-xs text-slate-500 font-medium">Priority Mix Overview</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm xl:col-span-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Cases Created by Date</h3>
                <BarChart3 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="h-72 -mx-4 px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={createdByPeriod} margin={{ top: 16, right: 16, left: 0, bottom: 0 }} barCategoryGap={"20%"}>
                    <defs>
                      <linearGradient id="barGradientPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="#e0e7ff" />
                    <XAxis dataKey="_id" tick={{ fill: '#7c3aed', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#7c3aed', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid #c4b5fd', boxShadow: '0 2px 8px #c4b5fd33' }}
                      labelStyle={{ color: '#a78bfa', fontWeight: 700 }}
                      itemStyle={{ color: '#a78bfa', fontWeight: 600 }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="url(#barGradientPurple)" isAnimationActive />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Periods Tracked</p>
                  <p className="mt-1 text-lg font-black text-slate-800">{createdByPeriod.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Total Created</p>
                  <p className="mt-1 text-lg font-black text-slate-800">{totalRecentCreated}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Peak Count</p>
                  <p className="mt-1 text-lg font-black text-slate-800">{peakPeriod.count}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
