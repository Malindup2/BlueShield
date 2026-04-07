import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Ship, AlignLeft, Tag, Hash, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { createCaseRecord, getCaseRecordById, updateCaseRecord } from "../../../services/illegalCaseAPI";

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function IllegalCaseForm({ isEdit = false }) {
  const navigate = useNavigate();
  const { reportId, caseId } = useParams();

  const [form, setForm] = useState({
    title: "",
    description: "",
    vesselDigits: "", // just the 7 digits — prefix shown in UI
    vesselType: "",
    severity: "MEDIUM",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Prefill form when editing
  useEffect(() => {
    if (!isEdit || !caseId) return;
    (async () => {
      try {
        const res = await getCaseRecordById(caseId);
        const c = res.data;
        setForm({
          title: c.title || "",
          description: c.description || "",
          vesselDigits: (c.vesselId || "").replace("IMO-", ""),
          vesselType: c.vesselType || "",
          severity: c.severity || "MEDIUM",
        });
      } catch {
        toast.error("Failed to load case record");
        navigate("/dashboard/illegal-admin/cases");
      } finally {
        setFetching(false);
      }
    })();
  }, [isEdit, caseId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVesselDigits = (e) => {
    // Only allow digits, max 7
    const val = e.target.value.replace(/\D/g, "").slice(0, 7);
    setForm((prev) => ({ ...prev, vesselDigits: val }));
  };

  const validate = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return false; }
    if (!form.description.trim()) { toast.error("Description is required"); return false; }
    if (form.vesselDigits.length !== 7) { toast.error("Vessel ID must be exactly 7 digits"); return false; }
    if (!form.vesselType.trim()) { toast.error("Vessel type is required"); return false; }
    if (!/^[a-zA-Z\s]+$/.test(form.vesselType.trim())) { toast.error("Vessel type must contain letters only"); return false; }
    if (!SEVERITIES.includes(form.severity)) { toast.error("Invalid severity"); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      vesselId: `IMO-${form.vesselDigits}`,
      vesselType: form.vesselType.trim(),
      severity: form.severity,
    };
    try {
      if (isEdit) {
        await updateCaseRecord(caseId, payload);
        toast.success("Case record updated");
        navigate(`/dashboard/illegal-admin/cases/${caseId}`);
      } else {
        const res = await createCaseRecord(reportId, payload);
        toast.success("Case record created");
        navigate(`/dashboard/illegal-admin/cases/${res.data._id}`);
      }
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (Array.isArray(errors)) {
        errors.forEach((e) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || "Failed to save record");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm font-bold">Loading…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-3">
            Illegal Case Review
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {isEdit ? "Update Case Record" : "Create Case Record"}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {isEdit ? "Modify the details below and click Update Record." : "Fill in the details below to create a new illegal case review record."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        {/* Date (read-only) */}
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Date
          </label>
          <input
            type="text"
            readOnly
            value={format(new Date(), "MMMM dd, yyyy")}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter case title"
            maxLength={200}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <AlignLeft className="w-4 h-4" /> Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Enter detailed description of the case"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Vessel ID */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Hash className="w-4 h-4" /> Vessel ID <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
            <span className="px-4 py-3 bg-slate-50 text-slate-500 font-black text-sm border-r border-slate-200 select-none">
              IMO-
            </span>
            <input
              value={form.vesselDigits}
              onChange={handleVesselDigits}
              placeholder="7 digits"
              inputMode="numeric"
              maxLength={7}
              className="flex-1 px-4 py-3 text-sm focus:outline-none"
            />
            <span className="px-3 text-xs text-slate-400 font-bold">
              {form.vesselDigits.length}/7
            </span>
          </div>
        </div>

        {/* Vessel Type */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Ship className="w-4 h-4" /> Vessel Type <span className="text-red-500">*</span>
          </label>
          <input
            name="vesselType"
            value={form.vesselType}
            onChange={handleChange}
            placeholder="e.g. Bottom Trawler"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-4 h-4" /> Severity <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="severity"
              value={form.severity}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-sm transition disabled:opacity-60"
          >
            {loading ? "Saving…" : isEdit ? "Update Record" : "Place Record"}
          </button>
        </div>
      </form>
    </div>
  );
}