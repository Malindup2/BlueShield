import React, { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, FileSearch, Filter, Lock, Paperclip, Search, ShieldCheck, Upload, X, ExternalLink, FileStack, Activity, Sparkles, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

import { Skeleton } from "../../../components/common/Skeleton";
import { deleteEvidence, getEnforcements, getEvidence, updateEvidence, uploadEvidence } from "../../../services/enforcementAPI";

const EVIDENCE_TYPES = ["PHOTOGRAPH", "VIDEO", "DOCUMENT", "PHYSICAL_ITEM", "TESTIMONY", "DIGITAL_LOG"];
const EVIDENCE_CONDITIONS = ["INTACT", "DAMAGED", "DETERIORATED", "SEALED"];

const getAttachmentLabel = (attachment, index) => {
  if (attachment?.filename) return attachment.filename;
  return `Attachment ${index + 1}`;
};

const getApiErrorMessage = (error, fallback) => {
  const details = error?.response?.data?.errors;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return error?.response?.data?.message || error?.message || fallback;
};

export default function OfficerEvidence() {
  const [enforcements, setEnforcements] = useState([]);
  const [selectedEnforcement, setSelectedEnforcement] = useState("");
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [verificationFilter, setVerificationFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showEditEvidenceModal, setShowEditEvidenceModal] = useState(false);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [updatingEvidenceId, setUpdatingEvidenceId] = useState("");
  const [editingEnforcementId, setEditingEnforcementId] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [evidenceIdToDelete, setEvidenceIdToDelete] = useState("");
  const [evidenceCaseIdToDelete, setEvidenceCaseIdToDelete] = useState("");
  const casePickerRef = useRef(null);
  const [evidenceForm, setEvidenceForm] = useState({
    evidenceType: "PHOTOGRAPH",
    description: "",
    condition: "INTACT",
    storageLocation: "",
    collectionMethod: "",
    notes: "",
    isSealed: false,
    files: [],
  });
  const [editEvidenceForm, setEditEvidenceForm] = useState({
    evidenceId: "",
    evidenceType: "PHOTOGRAPH",
    description: "",
    condition: "INTACT",
    storageLocation: "",
    collectionMethod: "",
    notes: "",
    isSealed: false,
    files: [],
  });

  const fetchEvidenceItems = async (enforcementId) => {
    if (!enforcementId) return;
    setLoading(true);
    try {
      const res = await getEvidence(enforcementId);
      const items = Array.isArray(res) ? res : [];
      setEvidenceItems(items.map((item) => ({ ...item, _caseId: enforcementId })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load evidence items");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const fetchAllEvidenceItems = async (casesList = enforcements) => {
    if (!Array.isArray(casesList) || casesList.length === 0) {
      setEvidenceItems([]);
      return;
    }

    setLoading(true);
    try {
      const responses = await Promise.allSettled(
        casesList.map((enf) => getEvidence(enf._id))
      );

      const mergedItems = responses.flatMap((result, index) => {
        if (result.status !== "fulfilled" || !Array.isArray(result.value)) return [];

        const enforcement = casesList[index];
        return result.value.map((item) => ({
          ...item,
          _caseId: enforcement?._id || "",
        }));
      });

      setEvidenceItems(mergedItems);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load evidence items");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const getCaseDisplayLabel = (enf) => `Case ...${(enf?._id || "").slice(-6).toUpperCase()}`;

  useEffect(() => {
    getEnforcements({ limit: 50 })
      .then(res => {
        const cases = res.items || [];
        setEnforcements(cases);
        fetchAllEvidenceItems(cases);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedEnforcement) return;
    if (!showCasePicker) {
      setCaseSearchTerm("");
    }
  }, [selectedEnforcement, showCasePicker]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!casePickerRef.current) return;
      if (!casePickerRef.current.contains(event.target)) {
        setShowCasePicker(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!selectedEnforcement) return;
    fetchEvidenceItems(selectedEnforcement);
  }, [selectedEnforcement]);

  const resetEvidenceForm = () => {
    setEvidenceForm({
      evidenceType: "PHOTOGRAPH",
      description: "",
      condition: "INTACT",
      storageLocation: "",
      collectionMethod: "",
      notes: "",
      isSealed: false,
      files: [],
    });
  };

  const handleEvidenceFieldChange = (field, value) => {
    setEvidenceForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenEvidenceModal = () => {
    if (!selectedEnforcement) {
      toast.error("Please select a case first");
      return;
    }
    setShowEvidenceModal(true);
  };

  const handleEvidenceSubmit = async (event) => {
    event.preventDefault();

    if (!selectedEnforcement) {
      toast.error("Please select an enforcement case first");
      return;
    }
    if (!evidenceForm.description.trim()) {
      toast.error("Description is required");
      return;
    }

    const formData = new FormData();
    formData.append("evidenceType", evidenceForm.evidenceType);
    formData.append("description", evidenceForm.description.trim());
    formData.append("condition", evidenceForm.condition);
    formData.append("isSealed", String(evidenceForm.isSealed));

    if (evidenceForm.storageLocation.trim()) {
      formData.append("storageLocation", evidenceForm.storageLocation.trim());
    }
    if (evidenceForm.collectionMethod.trim()) {
      formData.append("collectionMethod", evidenceForm.collectionMethod.trim());
    }
    if (evidenceForm.notes.trim()) {
      formData.append("notes", evidenceForm.notes.trim());
    }
    evidenceForm.files.forEach((file) => {
      formData.append("attachments", file);
    });

    setSubmittingEvidence(true);
    try {
      await uploadEvidence(selectedEnforcement, formData);
      toast.success("Evidence logged successfully");
      setShowEvidenceModal(false);
      resetEvidenceForm();
      fetchEvidenceItems(selectedEnforcement);
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to log evidence"));
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleVerifyEvidence = async (evidenceId, enforcementId = selectedEnforcement) => {
    if (!enforcementId || !evidenceId) return;
    setUpdatingEvidenceId(evidenceId);

    try {
      const formData = new FormData();
      formData.append("verified", "true");
      await updateEvidence(enforcementId, evidenceId, formData);
      toast.success("Evidence verified");
      if (selectedEnforcement) {
        fetchEvidenceItems(selectedEnforcement);
      } else {
        fetchAllEvidenceItems();
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to verify evidence");
    } finally {
      setUpdatingEvidenceId("");
    }
  };

  const handleDeleteEvidence = async () => {
    const targetCaseId = evidenceCaseIdToDelete || selectedEnforcement;
    if (!targetCaseId || !evidenceIdToDelete) return;

    setUpdatingEvidenceId(evidenceIdToDelete);
    try {
      await deleteEvidence(targetCaseId, evidenceIdToDelete);
      toast.success("Evidence deleted");
      setShowDeleteConfirmModal(false);
      setEvidenceIdToDelete("");
      setEvidenceCaseIdToDelete("");
      if (selectedEnforcement) {
        fetchEvidenceItems(selectedEnforcement);
      } else {
        fetchAllEvidenceItems();
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to delete evidence");
    } finally {
      setUpdatingEvidenceId("");
    }
  };

  const requestDeleteEvidence = (evidenceId, enforcementId = selectedEnforcement) => {
    setEvidenceIdToDelete(evidenceId);
    setEvidenceCaseIdToDelete(enforcementId || "");
    setShowDeleteConfirmModal(true);
  };

  const openEditEvidenceModal = (evidence) => {
    setEditingEnforcementId(evidence._caseId || selectedEnforcement || "");
    setEditEvidenceForm({
      evidenceId: evidence._id,
      evidenceType: evidence.evidenceType || "PHOTOGRAPH",
      description: evidence.description || "",
      condition: evidence.condition || "INTACT",
      storageLocation: evidence.storageLocation || "",
      collectionMethod: evidence.collectionMethod || "",
      notes: evidence.notes || "",
      isSealed: Boolean(evidence.isSealed),
      files: [],
    });
    setShowEditEvidenceModal(true);
  };

  const handleEditEvidenceFieldChange = (field, value) => {
    setEditEvidenceForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditEvidenceSubmit = async (event) => {
    event.preventDefault();
    const targetCaseId = editingEnforcementId || selectedEnforcement;
    if (!targetCaseId || !editEvidenceForm.evidenceId) return;

    const formData = new FormData();
    formData.append("evidenceType", editEvidenceForm.evidenceType);
    formData.append("description", editEvidenceForm.description.trim());
    formData.append("condition", editEvidenceForm.condition);
    formData.append("isSealed", String(editEvidenceForm.isSealed));

    if (editEvidenceForm.storageLocation.trim()) {
      formData.append("storageLocation", editEvidenceForm.storageLocation.trim());
    }
    if (editEvidenceForm.collectionMethod.trim()) {
      formData.append("collectionMethod", editEvidenceForm.collectionMethod.trim());
    }
    if (editEvidenceForm.notes.trim()) {
      formData.append("notes", editEvidenceForm.notes.trim());
    }
    editEvidenceForm.files.forEach((file) => {
      formData.append("attachments", file);
    });

    setEditSubmitting(true);
    try {
      await updateEvidence(targetCaseId, editEvidenceForm.evidenceId, formData);
      toast.success("Evidence updated successfully");
      setShowEditEvidenceModal(false);
      setEditingEnforcementId("");
      if (selectedEnforcement) {
        fetchEvidenceItems(selectedEnforcement);
      } else {
        fetchAllEvidenceItems();
      }
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to update evidence"));
    } finally {
      setEditSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setConditionFilter("ALL");
    setVerificationFilter("ALL");
  };

  const filteredEvidence = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return evidenceItems.filter((item) => {
      const matchesSearch =
        term.length === 0 ||
        item.referenceNumber?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.storageLocation?.toLowerCase().includes(term) ||
        item.collectionMethod?.toLowerCase().includes(term) ||
        item.notes?.toLowerCase().includes(term);

      const matchesType = typeFilter === "ALL" || item.evidenceType === typeFilter;
      const matchesCondition = conditionFilter === "ALL" || item.condition === conditionFilter;
      const matchesVerification =
        verificationFilter === "ALL" ||
        (verificationFilter === "VERIFIED" && Boolean(item.verifiedBy)) ||
        (verificationFilter === "UNVERIFIED" && !item.verifiedBy);

      return matchesSearch && matchesType && matchesCondition && matchesVerification;
    });
  }, [conditionFilter, evidenceItems, searchTerm, typeFilter, verificationFilter]);

  const evidenceStats = useMemo(() => {
    const total = evidenceItems.length;
    const sealed = evidenceItems.filter((item) => item.isSealed).length;
    const verified = evidenceItems.filter((item) => Boolean(item.verifiedBy)).length;
    const attachedFiles = evidenceItems.reduce((count, item) => count + (item.attachments?.length || 0), 0);

    return { total, sealed, verified, attachedFiles };
  }, [evidenceItems]);

  const filteredCases = useMemo(() => {
    const term = caseSearchTerm.trim().toLowerCase();
    if (!term) return enforcements;

    return enforcements.filter((enf) => {
      const searchText = [
        enf?._id,
        enf?._id?.slice(-6),
        enf?.status,
        enf?.priority,
        enf?.outcome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(term);
    });
  }, [enforcements, caseSearchTerm]);

  const selectedCase = useMemo(
    () => enforcements.find((enf) => enf._id === selectedEnforcement) || null,
    [enforcements, selectedEnforcement]
  );

  const handleCaseSelect = (caseId) => {
    setSelectedEnforcement(caseId);
    setCaseSearchTerm("");
    setShowCasePicker(false);
  };

  const handleClearSelection = () => {
    setSelectedEnforcement("");
    setCaseSearchTerm("");
    setShowCasePicker(false);
    fetchAllEvidenceItems();
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 shadow-xl space-y-5">
        <div className="absolute -top-16 -right-8 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
              <Activity className="w-3.5 h-3.5" /> Evidence Operations
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Chain of Custody</h2>
            <p className="text-slate-200 mt-1">Capture, verify, and track evidence integrity for each case.</p>
          </div>

          <button
            onClick={handleOpenEvidenceModal}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition flex-shrink-0 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Log Evidence</span>
          </button>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm space-y-4">
          <div className="w-full lg:w-[38rem] space-y-3" ref={casePickerRef}>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  value={caseSearchTerm}
                  onChange={(e) => {
                    setCaseSearchTerm(e.target.value);
                    setShowCasePicker(true);
                  }}
                  onFocus={() => setShowCasePicker(true)}
                  placeholder="Select case by ID, status or priority"
                  className="w-full rounded-xl border border-white/20 bg-white/90 pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCasePicker((prev) => !prev)}
                  className="absolute right-2 top-2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  title="Toggle case list"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showCasePicker && (
                  <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
                    {filteredCases.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">No matching cases found.</div>
                    ) : (
                      filteredCases.map((enf) => (
                        <button
                          key={enf._id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleCaseSelect(enf._id)}
                          className={`w-full text-left px-4 py-3 border-b last:border-b-0 border-slate-100 hover:bg-blue-50 transition ${
                            selectedEnforcement === enf._id ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-800">{getCaseDisplayLabel(enf)}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                              enf.status === "CLOSED_RESOLVED" ? "border-emerald-200 text-emerald-600" : "border-amber-200 text-amber-600"
                            }`}>
                              {enf.status?.replace("_", " ")}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] font-semibold text-slate-500">
                             Priority: <span className={enf.priority === "CRITICAL" ? "text-red-500" : "text-slate-700"}>{enf.priority}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedCase ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                  <span className="uppercase tracking-wider text-slate-200/80">Connected</span>
                  <span className="font-mono">{getCaseDisplayLabel(selectedCase)}</span>
                </div>
              ) : (
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-200/80">
                  No Case Selected
                </div>
              )}

              {selectedCase ? (
                <button
                  onClick={handleClearSelection}
                  className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20"
                  title="Clear Selection"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              ) : null}
            </div>

            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-200/70 font-semibold uppercase tracking-wider">
              <span>{selectedCase ? "Evidence Filtered by Case" : "Showing Evidence Across Cases"}</span>
              <span>{enforcements.length} Cases Available</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">Total</p>
                <p className="mt-1 text-2xl font-black text-white">{evidenceStats.total}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/90 border border-white/60 text-slate-700 flex items-center justify-center">
                <FileStack className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200/40 bg-emerald-500/15 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Verified</p>
                <p className="mt-1 text-2xl font-black text-white">{evidenceStats.verified}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/90 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200/40 bg-amber-500/15 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">Sealed</p>
                <p className="mt-1 text-2xl font-black text-white">{evidenceStats.sealed}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/90 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-2xl border border-blue-200/40 bg-blue-500/15 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Attachments</p>
                <p className="mt-1 text-2xl font-black text-white">{evidenceStats.attachedFiles}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/90 border border-blue-200 text-blue-700 flex items-center justify-center">
                <Paperclip className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
            <div className="xl:col-span-4 relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ref, description, storage, notes"
                className="w-full rounded-xl border border-white/20 bg-white/90 pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="xl:col-span-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Types</option>
                {EVIDENCE_TYPES.map((type) => (
                  <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
                ))}
              </select>
            </div>

            <div className="xl:col-span-2">
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Conditions</option>
                {EVIDENCE_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>{condition.replaceAll("_", " ")}</option>
                ))}
              </select>
            </div>

            <div className="xl:col-span-2">
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Verification</option>
                <option value="VERIFIED">Verified</option>
                <option value="UNVERIFIED">Unverified</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="xl:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              <Filter className="w-4 h-4" /> Clear Filters
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-100 uppercase tracking-wider">
            <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> {filteredEvidence.length} visible evidence items</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                 <div className="flex justify-between">
                   <Skeleton width="30%" height="18px" />
                   <Skeleton width="20%" height="18px" />
                 </div>
                 <Skeleton width="90%" height="24px" />
                 <Skeleton width="100%" height="14px" className="p-4" />
                 <div className="grid grid-cols-2 gap-2">
                   <Skeleton height="32px" />
                   <Skeleton height="32px" />
                 </div>
                 <div className="pt-4 border-t border-slate-100 flex justify-between">
                   <Skeleton width="40%" height="10px" />
                   <Skeleton width="20%" height="10px" />
                 </div>
               </div>
             ))
          ) : filteredEvidence.length === 0 ? (
             <div className="col-span-full p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                 <FileSearch className="w-8 h-8 text-slate-300" />
               </div>
               <h3 className="text-lg font-bold text-slate-700">No Evidence Found</h3>
               <p className="text-slate-500 max-w-sm mt-2">
                 {evidenceItems.length === 0
                   ? selectedEnforcement
                     ? "There is no digital evidence logged for this enforcement case yet."
                     : "There is no digital evidence logged across available cases yet."
                   : "No records match the current search or filter settings."}
               </p>
               {evidenceItems.length > 0 && (
                 <button
                   onClick={clearFilters}
                   className="mt-6 px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                 >
                   Reset Filters
                 </button>
               )}
             </div>
          ) : (
            filteredEvidence.map((ev) => {
              const isReportLinked = ev.source === "REPORT_ATTACHMENT";
              const enforcementId =
                typeof ev.enforcement === "string"
                  ? ev.enforcement
                  : ev.enforcement?._id;
              const caseIdValue = ev._caseId || enforcementId || selectedEnforcement || "";
              const caseIdLabel = caseIdValue ? caseIdValue.slice(-6).toUpperCase() : "N/A";
              const pairLabel = caseIdLabel !== "N/A" ? `PAIR-${caseIdLabel}` : "PAIR-UNKNOWN";

              return (
              <div key={ev._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200">
                        {ev.evidenceType}
                      </span>
                      {isReportLinked ? (
                        <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-[10px] font-black uppercase tracking-widest border border-cyan-200">
                          Fisherman Report
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase tracking-widest border border-blue-200">
                          Officer Evidence
                        </span>
                      )}
                    </div>
                    {ev.isSealed && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 uppercase tracking-widest">
                        <Lock className="w-3 h-3" /> Sealed
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-slate-800 mb-2 truncate" title={ev.description}>{ev.description}</h3>
                  <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                    REF: {ev.referenceNumber}
                  </p>
                  <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Case ID</p>
                    <p className="mt-1 text-sm font-black font-mono text-blue-900 tracking-wide">
                      {caseIdLabel}
                    </p>
                  </div>
                  <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">Pair Tag</p>
                    <p className="mt-1 text-sm font-black font-mono text-violet-900 tracking-wide">
                      {pairLabel}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Condition</p>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">{ev.condition}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attachments</p>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> {ev.attachments?.length || 0}
                      </p>
                    </div>
                  </div>

                  {(ev.attachments?.length || 0) > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">View Files</p>
                      <div className="space-y-1.5">
                        {ev.attachments.slice(0, 3).map((attachment, index) => (
                          <a
                            key={attachment.publicId || attachment.url || `${ev._id}-${index}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                            title={attachment.url}
                          >
                            <span className="truncate pr-2">{getAttachmentLabel(attachment, index)}</span>
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                          </a>
                        ))}
                        {ev.attachments.length > 3 && (
                          <p className="text-[11px] text-slate-500 px-1">+{ev.attachments.length - 3} more files</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                   <div className="text-xs text-slate-500">
                     Logged on {format(new Date(ev.collectedAt), "MMM d")}
                   </div>
                   {isReportLinked ? (
                     <div className="text-xs font-bold text-cyan-700">Read-only source</div>
                   ) : (
                     <button
                       onClick={() => openEditEvidenceModal(ev)}
                       disabled={updatingEvidenceId === ev._id}
                       className="text-sm font-bold text-slate-600 hover:text-slate-800 disabled:opacity-60"
                     >
                       Edit
                     </button>
                   )}
                   {ev.verifiedBy ? (
                     <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                       <ShieldCheck className="w-4 h-4" /> Verified
                     </div>
                   ) : isReportLinked ? (
                     <div className="text-xs font-bold text-slate-400">Report attachment</div>
                   ) : (
                     <button
                       onClick={() => handleVerifyEvidence(ev._id, ev._caseId || selectedEnforcement)}
                       disabled={updatingEvidenceId === ev._id}
                       className="text-sm font-bold text-blue-600 hover:text-blue-800 disabled:opacity-60"
                     >
                       Verify
                     </button>
                   )}
                   {!isReportLinked ? (
                     <button
                       onClick={() => requestDeleteEvidence(ev._id, ev._caseId || selectedEnforcement)}
                       disabled={updatingEvidenceId === ev._id}
                       className="text-sm font-bold text-red-600 hover:text-red-800 disabled:opacity-60"
                     >
                       Delete
                     </button>
                   ) : (
                     <div className="text-xs font-bold text-slate-400">Protected</div>
                   )}
                </div>
              </div>
              );
            })
          )}
      </div>

      {showEvidenceModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-10 pb-6 md:pt-14">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => {
              setShowEvidenceModal(false);
              resetEvidenceForm();
            }}
          />
          <div className="relative w-full max-w-2xl max-h-[calc(100vh-5rem)] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="absolute left-6 right-6 top-3 h-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 blur-2xl opacity-25 pointer-events-none" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
              <div>
                <h3 className="text-lg font-black text-slate-900">Log New Evidence</h3>
              </div>
              <button
                onClick={() => {
                  setShowEvidenceModal(false);
                  resetEvidenceForm();
                }}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close evidence modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEvidenceSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Evidence Type</label>
                <select
                  value={evidenceForm.evidenceType}
                  onChange={(e) => handleEvidenceFieldChange("evidenceType", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EVIDENCE_TYPES.map((value) => (
                    <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Condition</label>
                <select
                  value={evidenceForm.condition}
                  onChange={(e) => handleEvidenceFieldChange("condition", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EVIDENCE_CONDITIONS.map((value) => (
                    <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={evidenceForm.description}
                  onChange={(e) => handleEvidenceFieldChange("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Storage Location</label>
                <input
                  value={evidenceForm.storageLocation}
                  onChange={(e) => handleEvidenceFieldChange("storageLocation", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Collection Method</label>
                <input
                  value={evidenceForm.collectionMethod}
                  onChange={(e) => handleEvidenceFieldChange("collectionMethod", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  value={evidenceForm.notes}
                  onChange={(e) => handleEvidenceFieldChange("notes", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Attachments (max 5)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    handleEvidenceFieldChange("files", Array.from(e.target.files || []).slice(0, 5))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
                {evidenceForm.files.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">{evidenceForm.files.length} file(s) selected</p>
                )}
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="isSealed"
                  type="checkbox"
                  checked={evidenceForm.isSealed}
                  onChange={(e) => handleEvidenceFieldChange("isSealed", e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isSealed" className="text-sm font-medium text-slate-700">Mark this evidence as sealed</label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEvidenceModal(false);
                    resetEvidenceForm();
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEvidence}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {submittingEvidence ? "Submitting..." : "Log Evidence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditEvidenceModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-10 pb-6 md:pt-14">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowEditEvidenceModal(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[calc(100vh-5rem)] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="absolute left-6 right-6 top-3 h-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 blur-2xl opacity-25 pointer-events-none" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Evidence</h3>
              </div>
              <button
                onClick={() => setShowEditEvidenceModal(false)}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close edit evidence modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditEvidenceSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Evidence Type</label>
                <select
                  value={editEvidenceForm.evidenceType}
                  onChange={(e) => handleEditEvidenceFieldChange("evidenceType", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EVIDENCE_TYPES.map((value) => (
                    <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Condition</label>
                <select
                  value={editEvidenceForm.condition}
                  onChange={(e) => handleEditEvidenceFieldChange("condition", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EVIDENCE_CONDITIONS.map((value) => (
                    <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={editEvidenceForm.description}
                  onChange={(e) => handleEditEvidenceFieldChange("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Storage Location</label>
                <input
                  value={editEvidenceForm.storageLocation}
                  onChange={(e) => handleEditEvidenceFieldChange("storageLocation", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Collection Method</label>
                <input
                  value={editEvidenceForm.collectionMethod}
                  onChange={(e) => handleEditEvidenceFieldChange("collectionMethod", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  value={editEvidenceForm.notes}
                  onChange={(e) => handleEditEvidenceFieldChange("notes", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Add More Attachments (optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    handleEditEvidenceFieldChange("files", Array.from(e.target.files || []).slice(0, 5))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="editIsSealed"
                  type="checkbox"
                  checked={editEvidenceForm.isSealed}
                  onChange={(e) => handleEditEvidenceFieldChange("isSealed", e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="editIsSealed" className="text-sm font-medium text-slate-700">Mark this evidence as sealed</label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditEvidenceModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-10 pb-6 md:pt-14">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => {
              setShowDeleteConfirmModal(false);
              setEvidenceIdToDelete("");
            }}
          />
          <div className="relative w-full max-w-md max-h-[calc(100vh-5rem)] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="absolute left-6 right-6 top-3 h-2 rounded-full bg-gradient-to-r from-red-500 via-rose-400 to-red-500 blur-2xl opacity-25 pointer-events-none" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Confirm Deletion</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setEvidenceIdToDelete("");
                }}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close delete confirmation modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto">
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this evidence item? This action cannot be undone.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setEvidenceIdToDelete("");
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteEvidence}
                  disabled={updatingEvidenceId === evidenceIdToDelete}
                  className="px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {updatingEvidenceId === evidenceIdToDelete ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
