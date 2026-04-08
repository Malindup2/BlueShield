import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  TriangleAlert,
  Leaf,
  Calendar,
  User,
  MapPin,
  Plus,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  createHazardFromReport,
  getHazardReviewReportById,
} from "../../../services/hazardAdminAPI";

const HAZARD_CATEGORIES = ["WEATHER", "POLLUTION", "DEBRIS", "OBSTRUCTION", "OTHER"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function reportCodeFromId(id = "") {
  const hex = id.slice(-6);
  const numeric = parseInt(hex || "0", 16).toString().slice(-6).padStart(6, "0");
  return `HZR-${numeric}`;
}

function typeStyle(type) {
  return {
    HAZARD: "bg-amber-50 text-amber-700 border-amber-200",
    ENVIRONMENTAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[type] || "bg-slate-50 text-slate-600 border-slate-200";
}

function severityStyle(severity) {
  return {
    LOW: "bg-sky-50 text-sky-700 border-sky-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
  }[severity] || "bg-slate-50 text-slate-600 border-slate-200";
}

export default function HazardCreateCase() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reportId } = useParams();

  const [report, setReport] = useState(location.state?.report || null);
  const [loading, setLoading] = useState(!location.state?.report);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    hazardCategory: "OTHER",
    severity: "MEDIUM",
    zoneRequired: false,
  });

  useEffect(() => {
    const loadReport = async () => {
      if (!reportId || report) return;

      setLoading(true);
      try {
        const data = await getHazardReviewReportById(reportId);
        setReport(data);
        setForm((prev) => ({
          ...prev,
          severity: data?.severity || "MEDIUM",
        }));
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId, report]);

  const canCreate = useMemo(() => report?.status === "VERIFIED", [report]);

  const handleCreate = async () => {
    if (!report?._id) return;

    if (!canCreate) {
      toast.error("Only verified reports can be converted into hazard cases");
      return;
    }

    setCreating(true);
    try {
      await createHazardFromReport(report._id, form);
      toast.success("Hazard case created successfully");
      navigate("/dashboard/hazard-admin/reports");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to create hazard case");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-10 w-96 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-3/4 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-lg font-black text-slate-800">Report not found</p>
        <p className="mt-2 text-sm text-slate-500">
          The selected report could not be loaded.
        </p>
        <button
          onClick={() => navigate("/dashboard/hazard-admin/reports")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-8 shadow-xl">
        <div className="absolute -top-12 -right-10 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-8 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
            <ShieldAlert className="h-3 w-3" />
            Hazard Case Creation
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
            Create Hazard Case
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Convert a verified hazard or environmental report into a formal hazard case
            for operational monitoring, intervention planning, and zone-based action.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/hazard-admin/reports")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </button>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${typeStyle(
            report.reportType
          )}`}
        >
          {report.reportType === "HAZARD" ? (
            <TriangleAlert className="mr-1 h-3 w-3" />
          ) : (
            <Leaf className="mr-1 h-3 w-3" />
          )}
          {report.reportType}
        </span>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${severityStyle(
            report.severity
          )}`}
        >
          {report.severity}
        </span>

        {canCreate ? (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Verified Report
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-700">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Report must be verified first
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Report Summary</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Report Code
                </p>
                <p className="font-semibold text-slate-800">{reportCodeFromId(report._id)}</p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Created Date
                </p>
                <p className="font-semibold text-slate-800">
                  {report.createdAt ? format(new Date(report.createdAt), "MMM d, yyyy • hh:mm a") : "N/A"}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Reported By
                </p>
                <p className="font-semibold text-slate-800">
                  {report.reportedBy?.name || report.reportedBy?.email || "Unknown"}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Address
                </p>
                <p className="font-semibold text-slate-800">
                  {report.location?.address || "Address unavailable"}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Report Type
                </p>
                <p className="font-semibold text-slate-800">{report.reportType}</p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Current Status
                </p>
                <p className="font-semibold text-slate-800">
                  {report.status === "UNDER_REVIEW" ? "UNDER REVIEW" : report.status}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Description
              </p>
              <p className="leading-relaxed text-slate-700 whitespace-pre-wrap">
                {report.description || "No description available"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Hazard Configuration</h2>
            <p className="mt-1 text-sm text-slate-500">
              Set the operational details for the new hazard case.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Hazard Category
                </label>
                <select
                  value={form.hazardCategory}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hazardCategory: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {HAZARD_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Hazard Severity
                </label>
                <select
                  value={form.severity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, severity: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SEVERITIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={form.zoneRequired}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, zoneRequired: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-bold text-slate-800">Zone required for this hazard</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Enable this if the hazard is likely to require a restricted or dangerous
                    zone after case creation.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Ready to Create</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              This will create a new hazard case linked to report{" "}
              <span className="font-bold text-slate-800">{reportCodeFromId(report._id)}</span>.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/dashboard/hazard-admin/reports")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleCreate}
                disabled={creating || !canCreate}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                  canCreate
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Hazard Case
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}