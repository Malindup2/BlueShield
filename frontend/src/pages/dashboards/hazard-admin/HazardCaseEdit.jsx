import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ShieldAlert,
  Loader2,
  CloudSun,
  Waves,
  Wind,
  Thermometer,
  BadgeAlert,
  CircleOff,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  getHazardCaseById,
  updateHazardCase,
  getHazardWeatherSnapshot,
} from "../../../services/hazardAdminAPI";

const HAZARD_CATEGORIES = ["WEATHER", "POLLUTION", "DEBRIS", "OBSTRUCTION", "OTHER"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const HANDLING_STATUSES = [
  "OPEN",
  "MONITORING",
  "MITIGATION_PLANNED",
  "MITIGATION_IN_PROGRESS",
];

function severityStyle(severity) {
  return {
    LOW: "bg-sky-50 text-sky-700 border-sky-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
  }[severity] || "bg-slate-50 text-slate-700 border-slate-200";
}

function categoryStyle(category) {
  return {
    WEATHER: "bg-indigo-50 text-indigo-700 border-indigo-200",
    POLLUTION: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DEBRIS: "bg-amber-50 text-amber-700 border-amber-200",
    OBSTRUCTION: "bg-rose-50 text-rose-700 border-rose-200",
    OTHER: "bg-slate-50 text-slate-700 border-slate-200",
  }[category] || "bg-slate-50 text-slate-700 border-slate-200";
}

function handlingStatusStyle(status) {
  return {
    OPEN: "bg-blue-50 text-blue-700 border-blue-200",
    MONITORING: "bg-cyan-50 text-cyan-700 border-cyan-200",
    MITIGATION_PLANNED: "bg-amber-50 text-amber-700 border-amber-200",
    MITIGATION_IN_PROGRESS: "bg-orange-50 text-orange-700 border-orange-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[status] || "bg-slate-50 text-slate-700 border-slate-200";
}

function riskStyle(level) {
  return {
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
    MODERATE: "bg-amber-50 text-amber-700 border-amber-200",
    HIGH: "bg-rose-50 text-rose-700 border-rose-200",
  }[level] || "bg-slate-50 text-slate-700 border-slate-200";
}

function reportCodeFromId(id = "") {
  const hex = id.slice(-6);
  const numeric = parseInt(hex || "0", 16).toString().slice(-6).padStart(6, "0");
  return `HZR-${numeric}`;
}

export default function HazardCaseEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [hazard, setHazard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [form, setForm] = useState({
    hazardCategory: "OTHER",
    severity: "MEDIUM",
    handlingStatus: "OPEN",
    zoneRequired: false,
  });

  const fetchHazard = async () => {
    setLoading(true);
    try {
      const data = await getHazardCaseById(id);
      setHazard(data);
      setForm({
        hazardCategory: data?.hazardCategory || "OTHER",
        severity: data?.severity || "MEDIUM",
        handlingStatus: data?.handlingStatus || "OPEN",
        zoneRequired: !!data?.zoneRequired,
      });
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load hazard case");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHazard();
  }, [id]);

  const isWeatherCase = useMemo(
    () => form.hazardCategory === "WEATHER",
    [form.hazardCategory]
  );

  const handleSave = async () => {
    if (!form.hazardCategory) {
      toast.error("Hazard category is required");
      return;
    }

    if (!HAZARD_CATEGORIES.includes(form.hazardCategory)) {
      toast.error("Invalid hazard category");
      return;
    }

    if (!form.severity) {
      toast.error("Severity is required");
      return;
    }

    if (!SEVERITIES.includes(form.severity)) {
      toast.error("Invalid severity");
      return;
    }

    if (!form.handlingStatus) {
      toast.error("Handling status is required");
      return;
    }

    if (!HANDLING_STATUSES.includes(form.handlingStatus)) {
      toast.error("Invalid handling status");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        hazardCategory: form.hazardCategory,
        severity: form.severity,
        handlingStatus: form.handlingStatus,
        zoneRequired: form.zoneRequired,
      };

      const updated = await updateHazardCase(id, payload);
      setHazard(updated);
      toast.success("Hazard case updated successfully");
      navigate(`/dashboard/hazard-admin/cases/${id}`);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update hazard case");
    } finally {
      setSaving(false);
    }
  };

  const handleWeatherCheck = async () => {
    if (!hazard?._id) return;

    setWeatherLoading(true);
    try {
      const data = await getHazardWeatherSnapshot(hazard._id);
      setHazard((prev) => ({
        ...prev,
        lastWeatherCheck: data,
      }));
      toast.success("Marine weather checked successfully");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch marine conditions");
    } finally {
      setWeatherLoading(false);
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

  if (!hazard) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-lg font-black text-slate-800">Hazard case not found</p>
        <button
          onClick={() => navigate("/dashboard/hazard-admin/cases")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Hazard Cases
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate(`/dashboard/hazard-admin/cases/${id}`)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Details
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          {isWeatherCase ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CloudSun className="h-5 w-5 text-cyan-600" />
                <h2 className="text-lg font-black text-slate-900">Marine Weather Advisory</h2>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Weather verification is available because this hazard case is categorized as WEATHER.
                </p>

                <button
                  onClick={handleWeatherCheck}
                  disabled={weatherLoading}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-bold text-white hover:from-cyan-700 hover:to-blue-700 disabled:opacity-60"
                >
                  {weatherLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking Weather...
                    </>
                  ) : (
                    <>
                      <CloudSun className="h-4 w-4" />
                      Check Weather
                    </>
                  )}
                </button>
              </div>

              {hazard.lastWeatherCheck && (
                <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2">
                        <Waves className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Wave Height
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {hazard.lastWeatherCheck.waveHeight ?? "-"} m
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-cyan-600" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Wind Wave Height
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {hazard.lastWeatherCheck.windWaveHeight ?? "-"} m
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-rose-600" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Sea Temperature
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {hazard.lastWeatherCheck.seaTemperature ?? "-"} °C
                      </p>
                    </div>

                    <div className={`rounded-xl border p-3 ${riskStyle(hazard.lastWeatherCheck.riskLevel)}`}>
                      <div className="flex items-center gap-2">
                        <BadgeAlert className="h-4 w-4" />
                        <p className="text-xs font-black uppercase tracking-widest">
                          Risk Level
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-black">
                        {hazard.lastWeatherCheck.riskLevel || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Advisory
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {hazard.lastWeatherCheck.advisory || "No advisory available"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Raw Timestamp
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {hazard.lastWeatherCheck.timestamp || "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CircleOff className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-black text-slate-900">Weather Advisory</h2>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Weather check is only available for hazard cases categorized as WEATHER.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-900 to-blue-800 px-6 py-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200">
                Hazard Case Management
              </p>
              <h2 className="mt-2 text-lg font-black text-white">Update Hazard Case</h2>
              <p className="mt-1 text-sm text-blue-100">
                Edit the operational details below and save the updated case configuration.
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Hazard Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
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
                    Severity <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
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

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Handling Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.handlingStatus}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, handlingStatus: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {HANDLING_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item.replaceAll("_", " ")}
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
                      Enable this if this hazard should require restricted or dangerous zone
                      management.
                    </p>
                  </div>
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Linked Report
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {hazard?.baseReport?.title || "Untitled report"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {hazard?.baseReport?.createdAt
                      ? format(new Date(hazard.baseReport.createdAt), "MMM d, yyyy • hh:mm a")
                      : "N/A"}
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => navigate(`/dashboard/hazard-admin/cases/${id}`)}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-bold text-white hover:from-blue-700 hover:to-cyan-700 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}