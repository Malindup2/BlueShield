import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEnforcements, getEnforcementById, getEvidence, getTeam, addAction, closeEnforcement } from "../../../services/enforcementAPI";
import { FileText, Filter, AlertCircle, CheckCircle, X, Users, Paperclip, ArrowRight, Clock3, Scale, Plus, Lock, RotateCcw, Activity, Sparkles, Gavel, Ship, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

import { SkeletonTableRows } from "../../../components/common/Skeleton";

export default function OfficerCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewSection, setReviewSection] = useState("summary");
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedCaseTeam, setSelectedCaseTeam] = useState([]);
  const [selectedCaseEvidence, setSelectedCaseEvidence] = useState([]);
  const [actionForm, setActionForm] = useState({ actionType: "INSPECTION", description: "", amount: "" });
  const [closeForm, setCloseForm] = useState({ outcome: "PENDING", penaltyAmount: "", notes: "" });
  const [savingAction, setSavingAction] = useState(false);
  const [closingCase, setClosingCase] = useState(false);
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await getEnforcements({ limit: 50 });
        setCases(res.items || []);
      } catch (error) {
        console.error("Failed to fetch cases", error);
        toast.error("Failed to load cases");
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchCases();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL": return "text-red-600 bg-red-100";
      case "HIGH": return "text-orange-600 bg-orange-100";
      case "MEDIUM": return "text-amber-600 bg-amber-100";
      default: return "text-blue-600 bg-blue-100";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN": return "text-blue-600 bg-blue-50 border-blue-200";
      case "COURT_PENDING": return "text-purple-600 bg-purple-50 border-purple-200";
      case "CLOSED_RESOLVED": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const filteredCases = cases.filter((item) => {
    const idText = item?._id?.slice(-6)?.toUpperCase() || "";
    const descriptionText = item?.description || "";
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch =
      term.length === 0 ||
      idText.toLowerCase().includes(term) ||
      descriptionText.toLowerCase().includes(term);

    const matchesStatus = statusFilter === "ALL" || item?.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || item?.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const caseStats = useMemo(() => {
    const total = cases.length;
    const open = cases.filter((item) => item?.status === "OPEN").length;
    const courtPending = cases.filter((item) => item?.status === "COURT_PENDING").length;
    const resolved = cases.filter((item) => item?.status === "CLOSED_RESOLVED").length;
    const critical = cases.filter((item) => item?.priority === "CRITICAL").length;
    return { total, open, courtPending, resolved, critical };
  }, [cases]);

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    doc.setFontSize(18);
    doc.text("BlueShield Enforcement Report", 40, 42);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "MMM d, yyyy HH:mm")}`, 40, 60);
    doc.text(`Records: ${filteredCases.length}`, 40, 74);

    const body = filteredCases.map((item) => [
      item?._id?.slice(-6)?.toUpperCase() || "N/A",
      item?.status?.replaceAll("_", " ") || "N/A",
      item?.priority || "N/A",
      item?.outcome?.replaceAll("_", " ") || "N/A",
      format(new Date(item?.createdAt || Date.now()), "MMM d, yyyy"),
    ]);

    autoTable(doc, {
      startY: 90,
      head: [["Case ID", "Status", "Priority", "Outcome", "Created"]],
      body,
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save("BlueShield_Enforcement_Report.pdf");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  };

  const loadReviewData = async (caseId) => {
    try {
      const [caseRes, teamRes, evidenceRes] = await Promise.all([
        getEnforcementById(caseId),
        getTeam(caseId),
        getEvidence(caseId),
      ]);

      setSelectedCase(caseRes);
      setSelectedCaseTeam(Array.isArray(teamRes) ? teamRes : []);
      setSelectedCaseEvidence(Array.isArray(evidenceRes) ? evidenceRes : []);

      setCases((current) => current.map((item) => (item._id === caseId ? caseRes : item)));
    } catch (error) {
      console.error("Failed to reload review data", error);
      toast.error("Failed to refresh case review data");
      throw error;
    }
  };

  const closeReviewPanel = () => {
    setShowReviewPanel(false);
    setReviewSection("summary");
    setSelectedCase(null);
    setSelectedCaseTeam([]);
    setSelectedCaseEvidence([]);
    setShowCloseConfirmModal(false);
  };

  const handleReviewCase = async (caseId) => {
    setReviewLoading(true);
    setShowReviewPanel(true);
    setReviewSection("summary");
    setSelectedCase(null);
    setSelectedCaseTeam([]);
    setSelectedCaseEvidence([]);
    setActionForm({ actionType: "INSPECTION", description: "", amount: "" });
    setCloseForm({ outcome: "PENDING", penaltyAmount: "", notes: "" });

    try {
      await loadReviewData(caseId);
    } catch (error) {
      console.error("Failed to load case review data", error);
      toast.error("Failed to open case review");
      closeReviewPanel();
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAddAction = async (event) => {
    event.preventDefault();
    if (!selectedCase?._id || !actionForm.description.trim()) return;

    setSavingAction(true);
    try {
      const payload = {
        actionType: actionForm.actionType,
        description: actionForm.description.trim(),
      };

      if (actionForm.amount !== "") {
        payload.amount = Number(actionForm.amount);
      }

      const updated = await addAction(selectedCase._id, payload);
      await loadReviewData(updated._id || selectedCase._id);
      setActionForm({ actionType: "INSPECTION", description: "", amount: "" });
      toast.success("Officer action logged");
    } catch (error) {
      console.error("Failed to add action", error);
      toast.error(error?.response?.data?.message || "Failed to log officer action");
    } finally {
      setSavingAction(false);
    }
  };

  const executeCloseCase = async () => {
    if (!selectedCase?._id) return;

    setClosingCase(true);
    try {
      const payload = { outcome: closeForm.outcome };

      if (closeForm.penaltyAmount !== "") {
        payload.penaltyAmount = Number(closeForm.penaltyAmount);
      }

      if (closeForm.notes.trim()) {
        payload.notes = closeForm.notes.trim();
      }

      const updated = await closeEnforcement(selectedCase._id, payload);
      await loadReviewData(updated._id || selectedCase._id);
      setShowCloseConfirmModal(false);
      toast.success("Case closed successfully");
    } catch (error) {
      console.error("Failed to close case", error);
      toast.error(error?.response?.data?.message || "Failed to close case");
    } finally {
      setClosingCase(false);
    }
  };

  const handleCloseCase = async (event) => {
    event.preventDefault();
    if (!selectedCase?._id) return;
    setShowCloseConfirmModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 shadow-xl">
        <div className="absolute -top-16 -right-8 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
                <Activity className="w-3.5 h-3.5" /> Case Operations
              </p>
              <h2 className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-white">Case Management</h2>
              <p className="text-slate-200 mt-1 text-sm md:text-base">Manage assigned enforcement workflows and statuses.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 w-full lg:w-[52rem]">
              <div className="h-20 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-200 font-black">Total</p>
                  <p className="mt-1 text-lg font-black text-white">{loading ? "--" : caseStats.total}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white border border-blue-700 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white bg-white/90 rounded" style={{ backgroundColor: '#fff', color: '#1e40af' }} />
                </div>
              </div>
              <div className="h-20 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-200 font-black">Open</p>
                  <p className="mt-1 text-lg font-black text-white">{loading ? "--" : caseStats.open}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white border border-blue-700 flex items-center justify-center">
                  <Clock3 className="w-4 h-4 text-white bg-white/90 rounded" style={{ backgroundColor: '#fff', color: '#0369a1' }} />
                </div>
              </div>
              <div className="h-20 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-200 font-black">Court</p>
                  <p className="mt-1 text-lg font-black text-white">{loading ? "--" : caseStats.courtPending}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-purple-700 text-white border border-purple-700 flex items-center justify-center">
                  <Gavel className="w-4 h-4 text-white bg-white/90 rounded" style={{ backgroundColor: '#fff', color: '#7c3aed' }} />
                </div>
              </div>
              <div className="h-20 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-200 font-black">Resolved</p>
                  <p className="mt-1 text-lg font-black text-white">{loading ? "--" : caseStats.resolved}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white border border-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white bg-white/90 rounded" style={{ backgroundColor: '#fff', color: '#059669' }} />
                </div>
              </div>
              <div className="h-20 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-1">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-200 font-black">Critical</p>
                  <p className="mt-1 text-lg font-black text-white">{loading ? "--" : caseStats.critical}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-red-700 text-white border border-red-700 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white bg-white/90 rounded" style={{ backgroundColor: '#fff', color: '#dc2626' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search case ID or description"
                className="sm:col-span-2 lg:col-span-2 w-full rounded-lg border border-white/20 bg-white/90 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="COURT_PENDING">Court Pending</option>
                <option value="CLOSED_RESOLVED">Closed Resolved</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full rounded-lg border border-white/20 px-3 py-2.5 text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
                <button
                  onClick={clearFilters}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  <Filter className="w-4 h-4" /> Clear
                </button>
                <button
                  onClick={handleExportPdf}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <FileText className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-100 uppercase tracking-wider">
              <span className="inline-flex items-center gap-1.5"><Gavel className="w-3.5 h-3.5" /> {filteredCases.length} visible cases</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {showReviewPanel && selectedCase && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.22em] mb-2">Officer Review</p>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-black text-slate-900">{selectedCase._id.slice(-6).toUpperCase()}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(selectedCase.status)}`}>
                    {(selectedCase.status || "UNKNOWN").replace("_", " ")}
                  </span>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${getPriorityColor(selectedCase.priority)}`}>
                    {selectedCase.priority || "N/A"}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                  {selectedCase.relatedCase?.description || selectedCase.notes || "No case summary available."}
                </p>
              </div>

              <button
                onClick={closeReviewPanel}
                className="text-slate-500 hover:text-slate-700 rounded-full p-2 hover:bg-slate-100"
                aria-label="Close case review section"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "summary", label: "Summary" },
                { key: "team", label: `Team (${selectedCaseTeam.length})` },
                { key: "evidence", label: `Evidence (${selectedCaseEvidence.length})` },
                { key: "actions", label: `Actions (${selectedCase.actions?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setReviewSection(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${reviewSection === tab.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {reviewLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 h-44 animate-pulse" />
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 h-44 animate-pulse" />
              </div>
            ) : reviewSection === "summary" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white relative overflow-hidden lg:col-span-1">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 blur-3xl" />
                  <div className="relative z-10 space-y-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">Lead Officer</p>
                      <p className="mt-1 font-bold text-lg">{selectedCase.leadOfficer?.name || "Unknown"}</p>
                      <p className="text-sm text-slate-300">{selectedCase.leadOfficer?.email || "No email"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-slate-300 font-black">Court</p>
                        <p className="mt-1 font-semibold">{selectedCase.courtDate ? format(new Date(selectedCase.courtDate), "MMM d, yyyy") : "Not set"}</p>
                      </div>
                      <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-slate-300 font-black">Penalty</p>
                        <p className="mt-1 font-semibold">{selectedCase.penaltyAmount || 0}</p>
                      </div>
                      <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-slate-300 font-black">Team</p>
                        <p className="mt-1 font-semibold">{selectedCaseTeam.length}</p>
                      </div>
                      <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-slate-300 font-black">Evidence</p>
                        <p className="mt-1 font-semibold">{selectedCaseEvidence.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-blue-50 p-5 relative overflow-hidden lg:col-span-1">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-blue-600" />
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Vessel Intelligence</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Reported by Fisherman</p>
                        <p className="mt-1 font-bold text-slate-800">{selectedCase.relatedCase?.baseReport?.vessel?.name || "Unknown Vessel"}</p>
                        <p className="text-xs text-slate-500 font-mono">MMSI: {selectedCase.relatedCase?.baseReport?.vessel?.mmsi || "N/A"}</p>
                      </div>

                      <div className="pt-2 border-t border-blue-100">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Admin Tracked Data</p>
                        <p className="mt-1 font-bold text-slate-800">{selectedCase.relatedCase?.vesselId || "Pending Verification"}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-[9px] font-black text-blue-700 uppercase">Type: {selectedCase.relatedCase?.vesselType || "N/A"}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-[9px] font-black text-amber-700 uppercase">Tracked: {selectedCase.relatedCase?.trackedVesselData ? "YES" : "NO"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Case Date</p>
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Clock3 className="w-4 h-4 text-slate-400" />
                      {format(new Date(selectedCase.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Outcome</p>
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Scale className="w-4 h-4 text-slate-400" />
                      {(selectedCase.outcome || "PENDING").replaceAll("_", " ")}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
                    <h4 className="font-black text-slate-900 mb-3">Quick Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => navigate("/dashboard/officer/team")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <Users className="w-4 h-4" /> Team
                      </button>
                      <button
                        onClick={() => navigate("/dashboard/officer/evidence")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <Paperclip className="w-4 h-4" /> Evidence
                      </button>
                      <button
                        onClick={() => navigate("/dashboard/officer/ai-risk")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <ArrowRight className="w-4 h-4" /> AI Risk
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : reviewSection === "team" ? (
              <div className="space-y-4">
                {selectedCaseTeam.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="text-sm font-semibold text-slate-600">No team members assigned yet.</p>
                    <p className="mt-1 text-xs text-slate-400">Add officers to build an enforcement response team.</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Assigned Members</p>
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600">
                          {selectedCaseTeam.length} Total
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {selectedCaseTeam.map((member) => {
                        const fullName = member.officer?.name || member.name || "Unknown";
                        const initials = fullName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <div
                            key={member._id}
                            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm font-black tracking-wide text-slate-700">
                                  {initials || "NA"}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-slate-900">{fullName}</p>
                                  <p className="truncate text-xs text-slate-500">{member.email || member.officer?.email || "No email"}</p>
                                </div>
                              </div>

                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${member.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                                {member.status || "N/A"}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                                {member.role || "Member"}
                              </span>

                              {member.badgeNumber ? (
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                  Badge {member.badgeNumber}
                                </span>
                              ) : null}

                              {member.department ? (
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                  {member.department}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : reviewSection === "evidence" ? (
              <div className="space-y-2">
                {selectedCaseEvidence.length === 0 ? (
                  <p className="text-sm text-slate-500">No evidence logged yet.</p>
                ) : (
                  selectedCaseEvidence.map((item) => (
                    <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.description}</p>
                        <p className="text-xs text-slate-500">{item.evidenceType}</p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.referenceNumber}</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <form onSubmit={handleAddAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-blue-600" />
                      <h4 className="font-black text-slate-900">Officer Action</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        value={actionForm.actionType}
                        onChange={(e) => setActionForm((current) => ({ ...current, actionType: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="INSPECTION">Inspection</option>
                        <option value="WARNING">Warning</option>
                        <option value="FINE_ISSUED">Fine Issued</option>
                        <option value="SEIZURE">Seizure</option>
                        <option value="ARREST">Arrest</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={actionForm.amount}
                        onChange={(e) => setActionForm((current) => ({ ...current, amount: e.target.value }))}
                        placeholder="Amount (optional)"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <textarea
                      rows="4"
                      value={actionForm.description}
                      onChange={(e) => setActionForm((current) => ({ ...current, description: e.target.value }))}
                      placeholder="Describe the officer action"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="submit"
                      disabled={savingAction || !actionForm.description.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Plus className="w-4 h-4" /> {savingAction ? "Saving..." : "Log Action"}
                    </button>
                  </form>

                  <form onSubmit={handleCloseCase} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-black text-slate-900">Close Case</h4>
                    </div>

                    <select
                      value={closeForm.outcome}
                      onChange={(e) => setCloseForm((current) => ({ ...current, outcome: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="WARNING_ISSUED">Warning Issued</option>
                      <option value="FINE_COLLECTED">Fine Collected</option>
                      <option value="EQUIPMENT_SEIZED">Equipment Seized</option>
                      <option value="VESSEL_SEIZED">Vessel Seized</option>
                      <option value="ARREST_MADE">Arrest Made</option>
                      <option value="CASE_DISMISSED">Case Dismissed</option>
                    </select>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={closeForm.penaltyAmount}
                      onChange={(e) => setCloseForm((current) => ({ ...current, penaltyAmount: e.target.value }))}
                      placeholder="Penalty amount (optional)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <textarea
                      rows="4"
                      value={closeForm.notes}
                      onChange={(e) => setCloseForm((current) => ({ ...current, notes: e.target.value }))}
                      placeholder="Closure notes"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="submit"
                      disabled={closingCase || selectedCase?.status === "CLOSED_RESOLVED"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <RotateCcw className="w-4 h-4" /> {closingCase ? "Closing..." : "Close Case"}
                    </button>
                  </form>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="font-black text-slate-900 mb-4">Officer Actions Log</h4>
                  {selectedCase.actions?.length ? (
                    <div className="space-y-2">
                      {selectedCase.actions.map((action) => (
                        <div key={action._id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-800">{action.actionType.replaceAll("_", " ")}</p>
                            <p className="text-xs text-slate-500 truncate">{action.description || "No description"}</p>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            {action.amount != null ? `Rs. ${Number(action.amount).toLocaleString()}` : "No amount"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No officer actions recorded yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Case / ID</th>
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Outcome</th>
                <th className="p-4">Created By</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4">Assigned By</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <SkeletonTableRows rows={8} cols={6} />
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">No active cases assigned.</td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">No cases match the selected filters.</td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{c._id.slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-slate-400 mt-1">{format(new Date(c.createdAt), "MMM d, yyyy")}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(c.status)}`}>
                        {(c.status || "UNKNOWN").replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${getPriorityColor(c.priority)}`}>
                        {c.priority || "N/A"}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{(c.outcome || "N/A").replace("_", " ")}</td>
                    <td className="p-4 text-slate-500">{c.updatedBy ? "Officer" : "System"}</td>
                    <td className="p-4 text-slate-500">{c.updatedAt ? format(new Date(c.updatedAt), "MMM d, yyyy HH:mm") : "-"}</td>
                    <td className="p-4 text-slate-500">
                      {c.relatedCase && c.relatedCase.escalatedBy ? (
                        <>
                          {c.relatedCase.escalatedBy.name}
                          {c.relatedCase.escalatedBy.email ? (
                            <span className="block text-xs text-slate-400">{c.relatedCase.escalatedBy.email}</span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleReviewCase(c._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm shadow hover:bg-blue-700 transition"
                        aria-label="Review case"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCloseConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !closingCase && setShowCloseConfirmModal(false)}
          />

          <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Confirm Case Closure</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Are you sure you want to close this case and mark it as resolved? This will update linked illegal case and report statuses.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setShowCloseConfirmModal(false)}
                  disabled={closingCase}
                  className="py-3 px-4 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition border border-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={executeCloseCase}
                  disabled={closingCase}
                  className="py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {closingCase ? "Closing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
