import React, { useEffect, useState } from "react";
import { getBasicStats, getStatsByDateRange } from "../../../services/enforcementAPI";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Shield, AlertCircle, Clock, CheckCircle, Activity, TrendingUp, CalendarRange, ArrowUpRight } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-7 shadow-xl">
        <div className="absolute -top-20 -right-10 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">
              <Activity className="w-3.5 h-3.5" /> Operational Intelligence
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-white">Officer Overview</h2>
            <p className="mt-2 text-slate-200 max-w-2xl">
              Monitor enforcement workload, risk posture, and case movement in one command panel.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-100">
                <TrendingUp className="w-3.5 h-3.5" /> Trend-aware monitoring
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-widest text-slate-200 font-black">Recent Cases</p>
              <p className="mt-1 text-2xl font-black text-white">{loading ? "--" : totalRecentCreated}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-widest text-slate-200 font-black">Peak Window</p>
              <p className="mt-1 text-base font-black text-white truncate">{loading ? "--" : peakPeriod.label}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-widest text-slate-200 font-black">Last Updated</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <Skeleton width="40%" height="12px" className="mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton width="60%" height="32px" />
                <Skeleton variant="circular" width="48px" height="48px" />
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition hover:shadow-md hover:-translate-y-0.5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cases</p>
                <h3 className="text-3xl font-black text-slate-800">{stats?.total || 0}</h3>
                <p className="text-xs text-slate-500 inline-flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> All tracked enforcements</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition hover:shadow-md hover:-translate-y-0.5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Cases</p>
                <h3 className="text-3xl font-black text-slate-800">{stats?.byStatus?.OPEN || 0}</h3>
                <p className="text-xs text-slate-500">Requires active follow-up</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition hover:shadow-md hover:-translate-y-0.5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Priority</p>
                <h3 className="text-3xl font-black text-red-600">{stats?.byPriority?.CRITICAL || 0}</h3>
                <p className="text-xs text-slate-500">Highest urgency workload</p>
              </div>
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition hover:shadow-md hover:-translate-y-0.5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved</p>
                <h3 className="text-3xl font-black text-emerald-600">{stats?.byStatus?.CLOSED_RESOLVED || 0}</h3>
                <p className="text-xs text-slate-500">Successfully closed cases</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-1">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Status Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {statusData.map((entry, idx) => (
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

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-2">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Cases Created by Date</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={createdByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip cursor={{fill: 'transparent'}}/>
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#0ea5e9", stroke: "#ffffff", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
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
      </div>
    </div>
  );
}
