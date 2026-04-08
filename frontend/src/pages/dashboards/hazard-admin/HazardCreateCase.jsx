import React, { useEffect, useMemo, useState } from "react";
import {
  TriangleAlert,
  Leaf,
  Plus,
  Loader2,
  ArrowLeft,
  FolderPlus,
  AlertTriangle,
  MapPinned,
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

    if (!form.hazardCategory) {
      toast.error("Hazard category is required");
      return;
    }

    if (!HAZARD_CATEGORIES.includes(form.hazardCategory)) {
      toast.error("Invalid hazard category");
      return;
    }

    if (!form.severity) {
      toast.error("Hazard severity is required");
      return;
    }

    if (!SEVERITIES.includes(form.severity)) {
      toast.error("Invalid hazard severity");
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
      <div className="space-y-4 flex flex-col items-center">
        <div className="w-full max-w-[980px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-8 w-56 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-200" />
            <div className="h-3 w-3/4 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[980px] rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-[17px] font-semibold text-slate-800">Report not found</p>
          <p className="mt-2 text-[15px] text-slate-500">
            The selected report could not be loaded.
          </p>
          <button
            onClick={() => navigate("/dashboard/hazard-admin/reports")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1e3a8a] px-4 py-2.5 text-[15px] font-medium text-white hover:bg-[#1d4ed8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col items-center">
      <div className="w-full max-w-[980px]">
        <button
          onClick={() => navigate("/dashboard/hazard-admin/reports")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[15px] font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </button>
      </div>

      <div className="w-full max-w-[980px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-5 py-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100">
            <FolderPlus className="h-3.5 w-3.5" />
            Hazard Case Creation
          </p>

          <h1 className="mt-2 text-[18px] font-semibold text-white">
            Create Hazard Case
          </h1>

          <p className="mt-1 text-[14px] text-slate-200">
            Create a new hazard record from the verified source report.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)]">
          <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-5 md:border-b-0 md:border-r">
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Source Report
              </p>
              <h2 className="mt-1 text-[16px] font-semibold text-slate-900">
                Report Summary
              </h2>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${typeStyle(
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
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${severityStyle(
                  report.severity
                )}`}
              >
                {report.severity}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Report Code
                </p>
                <p className="mt-1 text-[15px] font-medium text-slate-800">
                  {reportCodeFromId(report._id)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Reported By
                </p>
                <p className="mt-1 text-[15px] font-medium text-slate-800">
                  {report.reportedBy?.name || report.reportedBy?.email || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Created Date
                </p>
                <p className="mt-1 text-[15px] font-medium text-slate-800">
                  {report.createdAt
                    ? format(new Date(report.createdAt), "MMM d, yyyy • hh:mm a")
                    : "N/A"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Address
                </p>
                <p className="mt-1 text-[14px] leading-6 text-slate-700">
                  {report.location?.address || "Address unavailable"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Description
                </p>
                <p className="mt-1 text-[14px] leading-6 text-slate-700 whitespace-pre-wrap">
                  {report.description || "No description available"}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 md:pl-6 md:pr-8">
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                New Hazard Record
              </p>
              <h2 className="mt-1 text-[16px] font-semibold text-slate-900">
                Create Hazard Case
              </h2>
            </div>

            <div className="max-w-[450px] space-y-4 md:ml-4">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <FolderPlus className="h-3.5 w-3.5" />
                  Hazard Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.hazardCategory}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hazardCategory: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  {HAZARD_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Hazard Severity <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.severity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, severity: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  {SEVERITIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={form.zoneRequired}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, zoneRequired: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a]"
                />
                <div>
                  <p className="flex items-center gap-2 text-[15px] font-medium text-slate-800">
                    <MapPinned className="h-4 w-4 text-[#1e3a8a]" />
                    Zone required for this hazard
                  </p>
                  <p className="mt-1 text-[14px] leading-5 text-slate-500">
                    Enable this if a restricted or dangerous zone may be needed after case creation.
                  </p>
                </div>
              </label>

              <div className="border-t border-slate-200 pt-4">
                <button
                  onClick={handleCreate}
                  disabled={creating || !canCreate}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-medium transition ${
                    canCreate
                      ? "bg-[#1e3a8a] text-white hover:bg-[#1d4ed8]"
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
    </div>
  );
}