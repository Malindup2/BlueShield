import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Briefcase, CheckCircle, ArrowRight,
  Clock, AlertTriangle, BarChart2, ShieldAlert
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getPendingReports, listCaseRecords } from "../../../services/illegalCaseAPI";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function IllegalAdminHome() {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem("userRole")?.replace("_", " ") || "ADMIN";

  const [stats, setStats] = useState({ pending: 0, underReview: 0, resolved: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reportsRes, casesRes] = await Promise.all([
          getPendingReports(),
          listCaseRecords({ limit: 100 }),
        ]);

        const reports = reportsRes.data || [];
        const cases = casesRes.data?.items || [];

        // Pending = ILLEGAL_FISHING reports with status PENDING
        const pendingCount = reports.filter(
          (r) => r.status === "PENDING" && !r.illegalCase?.isReviewed
        ).length;

        // Under review = total case records created
        const underReviewCount = cases.length;

        // Resolved = case records with status RESOLVED
        const resolvedCount = cases.filter((c) => c.status === "RESOLVED").length;

        setStats({ pending: pendingCount, underReview: underReviewCount, resolved: resolvedCount });

        // Build monthly distribution
        const monthCounts = Array(12).fill(0);
        cases.forEach((c) => {
          const m = new Date(c.createdAt).getMonth();
          monthCounts[m]++;
        });
        setChartData(MONTHS.map((name, i) => ({ name, count: monthCounts[i] })));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    {
      title: "Pending Illegal Cases",
      value: stats.pending,
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      bg: "bg-red-50",
      border: "border-red-100",
    },
    {
      title: "Cases Under Review",
      value: stats.underReview,
      icon: <Clock className="w-6 h-6 text-amber-500" />,
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      title: "Resolved Cases",
      value: stats.resolved,
      icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
  ];

  const managementCards = [
    {
      title: "Pending Verification",
      subtitle: "Reports awaiting review and validation",
      icon: <FileText className="w-8 h-8 text-red-500" />,
      path: "/dashboard/illegal-admin/reports",
      bg: "bg-red-50",
    },
    {
      title: "Open Verified Cases",
      subtitle: "Ongoing cases in active review",
      icon: <Briefcase className="w-8 h-8 text-blue-600" />,
      path: "/dashboard/illegal-admin/cases",
      bg: "bg-blue-50",
    },
    {
      title: "Reviewed & Resolved Cases",
      subtitle: "Cases resolved & successfully closed",
      icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
      path: "/dashboard/illegal-admin/resolved",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Premium Admin Header */}
      <div className="relative overflow-hidden bg-[#0f172a] p-10 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-full bg-red-600/5 blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-black uppercase tracking-[0.2em]">
                Enforcement Authority
              </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
              Case Control: <span className="text-red-500">{currentRole}</span>
            </h2>
          </div>
          <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-3xl leading-relaxed">
            Overseeing maritime legal workflows. Review evidence, authorize enforcement actions, and maintain regional jurisdiction logs.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map((card) => (
          <div key={card.title} className={`${card.bg} ${card.border} border rounded-2xl p-6 flex items-center gap-5`}>
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm border border-white">
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{card.title}</p>
              <p className="text-4xl font-black text-slate-900">
                {loading ? "—" : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Management Section */}
      <div>
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {managementCards.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.path)}
              className="text-left rounded-2xl border-2 border-slate-200 hover:border-blue-300 bg-white p-6 shadow-sm hover:shadow-md transition-all group flex flex-col gap-4 relative"
            >
              <div className={`w-14 h-14 rounded-xl ${card.bg} flex items-center justify-center`}>
                {card.icon}
              </div>
              <div className="flex-1">
                <p className="text-base font-black text-slate-900">{card.title}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{card.subtitle}</p>
              </div>
              <ArrowRight className="absolute bottom-5 right-5 w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Distribution Chart */}
      <div>
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
          Monthly Distribution of Illegal Cases
        </h3>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">Case Records Created Per Month</p>
              <p className="text-xs text-slate-400">Based on illegal case review record creation dates</p>
            </div>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">Loading chart…</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "bold" }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}