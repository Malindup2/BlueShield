import React, { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  addTeamMember,
  getEnforcements,
  getTeam,
  removeTeamMember,
  updateTeamMember,
} from "../../../services/enforcementAPI";
import {
  AlertTriangle,
  BadgeInfo,
  ChevronDown,
  Clock,
  Filter,
  Plus,
  Search,
  Timer,
  UserCheck,
  UserMinus,
  UserX,
  Users,
  X,
} from "lucide-react";
import { Skeleton } from "../../../components/common/Skeleton";

const TEAM_ROLE_OPTIONS = [
  "LEAD_INVESTIGATOR",
  "INVESTIGATOR",
  "EVIDENCE_HANDLER",
  "SURVEILLANCE",
  "LEGAL_LIAISON",
  "SUPPORT",
];

const emptyManualForm = () => ({
  name: "",
  email: "",
  role: "INVESTIGATOR",
  badgeNumber: "",
  department: "",
  specialization: "",
  contactNumber: "",
  responsibilities: "",
  notes: "",
});

const emptyEditForm = () => ({
  role: "INVESTIGATOR",
  status: "ON_DUTY",
  badgeNumber: "",
  department: "",
  specialization: "",
  contactNumber: "",
  hoursLogged: 0,
  responsibilities: "",
  notes: "",
});

const getApiErrorMessage = (error, fallbackMessage) => {
  const details = error?.response?.data?.errors;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return error?.response?.data?.message || fallbackMessage;
};

export default function OfficerTeam() {
  const [enforcements, setEnforcements] = useState([]);
  const [selectedEnforcement, setSelectedEnforcement] = useState("");
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [team, setTeam] = useState([]);
  const [allTeamMembers, setAllTeamMembers] = useState([]);
  const [savedMemberSearchTerm, setSavedMemberSearchTerm] = useState("");
  const [selectedSavedMember, setSelectedSavedMember] = useState(null);
  const [manualForm, setManualForm] = useState(emptyManualForm());
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [teamRoleFilter, setTeamRoleFilter] = useState("ALL");
  const [teamStatusFilter, setTeamStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState("");
  const [editingEnforcementId, setEditingEnforcementId] = useState("");
  const [editForm, setEditForm] = useState(emptyEditForm());
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [memberIdToDelete, setMemberIdToDelete] = useState("");
  const [memberCaseIdToDelete, setMemberCaseIdToDelete] = useState("");
  const casePickerRef = useRef(null);

  const refreshCurrentTeam = async () => {
    if (selectedEnforcement) {
      const members = await fetchMembersForCase(selectedEnforcement);
      setTeam(members);
      return;
    }
    await fetchAllTeamMembers(enforcements);
  };

  const fetchMembersForCase = async (caseId) => {
    if (!caseId) return [];
    const res = await getTeam(caseId);
    return (Array.isArray(res) ? res : []).map((member) => ({ ...member, _caseId: caseId }));
  };

  const fetchSelectedCaseMembers = async (caseId) => {
    if (!caseId) return;
    setLoading(true);
    try {
      const members = await fetchMembersForCase(caseId);
      setTeam(members);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load team members");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const fetchAllTeamMembers = async (casesList = enforcements, updateTeamView = true) => {
    if (!Array.isArray(casesList) || casesList.length === 0) {
      if (updateTeamView) setTeam([]);
      setAllTeamMembers([]);
      return;
    }

    setLoading(true);
    try {
      const responses = await Promise.allSettled(casesList.map((enf) => fetchMembersForCase(enf._id)));
      const merged = responses.flatMap((result) => (result.status === "fulfilled" && Array.isArray(result.value) ? result.value : []));
      if (updateTeamView) setTeam(merged);
      setAllTeamMembers(merged);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load team members");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    Promise.all([getEnforcements({ limit: 50 })])
      .then(([enforcementRes]) => {
        const cases = enforcementRes.items || [];
        setEnforcements(cases);
        fetchAllTeamMembers(cases);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load assignment options");
      });
  }, []);

  useEffect(() => {
    if (!selectedEnforcement) return;
    fetchSelectedCaseMembers(selectedEnforcement);
  }, [selectedEnforcement]);

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
    if (!showCasePicker) setCaseSearchTerm("");
  }, [selectedEnforcement, showCasePicker]);

  const selectedCase = useMemo(
    () => enforcements.find((enf) => enf._id === selectedEnforcement) || null,
    [enforcements, selectedEnforcement]
  );

  const enforcementStatusById = useMemo(() => {
    const map = new Map();
    enforcements.forEach((enf) => map.set(enf._id, enf.status));
    return map;
  }, [enforcements]);

  const getMemberDutyState = (member) => {
    const normalizedStatus = member.status === "ACTIVE" ? "ON_DUTY" : member.status;
    if (member.status === "RELIEVED") return "RELIEVED";
    if (normalizedStatus === "ON_LEAVE") return "ON_LEAVE";

    if (normalizedStatus === "AVAILABLE") return "AVAILABLE";

    const caseId = member._caseId || selectedEnforcement;
    const caseStatus = caseId ? enforcementStatusById.get(caseId) : null;
    return caseStatus === "CLOSED_RESOLVED" ? "AVAILABLE" : "ON_DUTY";
  };

  const caseStats = useMemo(() => {
    const total = team.length;
    return {
      total,
      onDuty: team.filter((member) => getMemberDutyState(member) === "ON_DUTY").length,
      available: team.filter((member) => getMemberDutyState(member) === "AVAILABLE").length,
      onLeave: team.filter((member) => getMemberDutyState(member) === "ON_LEAVE").length,
      relieved: team.filter((member) => getMemberDutyState(member) === "RELIEVED").length,
      totalHours: team.reduce((sum, member) => sum + (member.hoursLogged || 0), 0),
    };
  }, [team, enforcementStatusById, selectedEnforcement]);

  const filteredCases = useMemo(() => {
    const term = caseSearchTerm.trim().toLowerCase();
    if (!term) return enforcements;

    return enforcements.filter((enf) => {
      const text = [enf?._id, enf?._id?.slice(-6), enf?.status, enf?.priority, enf?.outcome]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(term);
    });
  }, [enforcements, caseSearchTerm]);

  const reusableMembers = useMemo(() => {
    const term = savedMemberSearchTerm.trim().toLowerCase();
    const assignedOfficerIds = new Set(
      team
        .filter((member) => !selectedEnforcement || member._caseId === selectedEnforcement)
        .map((member) => {
          if (typeof member.officer === "string") return member.officer;
          return member.officer?._id;
        })
        .filter(Boolean)
    );
    const assignedEmails = new Set(
      team
        .filter((member) => !selectedEnforcement || member._caseId === selectedEnforcement)
        .map((member) => (member.email || member.officer?.email || "").trim().toLowerCase())
        .filter(Boolean)
    );

    return allTeamMembers.filter((member) => {
      const normalizedStatus = member.status === "ACTIVE" ? "ON_DUTY" : member.status;
      const memberCaseStatus = member._caseId ? enforcementStatusById.get(member._caseId) : null;
      const isOnDuty = normalizedStatus === "ON_DUTY" && memberCaseStatus !== "CLOSED_RESOLVED";
      const isAvailableForReuse = !isOnDuty && normalizedStatus !== "RELIEVED";

      if (!isAvailableForReuse) return false;
      if (selectedEnforcement && member._caseId === selectedEnforcement) return false;

      const candidateOfficerId =
        typeof member.officer === "string" ? member.officer : member.officer?._id;
      const candidateEmail = (member.email || member.officer?.email || "").trim().toLowerCase();

      if (candidateOfficerId && assignedOfficerIds.has(candidateOfficerId)) return false;
      if (!candidateOfficerId && candidateEmail && assignedEmails.has(candidateEmail)) return false;

      const text = [
        member.name,
        member.email,
        member.officer?.name,
        member.officer?.email,
        member.badgeNumber,
        member.department,
        member.specialization,
        member.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return term.length === 0 || text.includes(term);
    });
  }, [allTeamMembers, savedMemberSearchTerm, selectedEnforcement, team]);

  const filteredTeam = useMemo(() => {
    const term = teamSearchTerm.trim().toLowerCase();
    return team.filter((member) => {
      const text = [
        member.name,
        member.email,
        member.officer?.name,
        member.officer?.email,
        member.badgeNumber,
        member.department,
        member.specialization,
        (member.responsibilities || []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = term.length === 0 || text.includes(term);
      const matchesRole = teamRoleFilter === "ALL" || member.role === teamRoleFilter;
      const dutyState = getMemberDutyState(member);
      const matchesStatus = teamStatusFilter === "ALL" || dutyState === teamStatusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [team, teamSearchTerm, teamRoleFilter, teamStatusFilter, enforcementStatusById, selectedEnforcement]);

  const clearFilters = () => {
    setTeamSearchTerm("");
    setTeamRoleFilter("ALL");
    setTeamStatusFilter("ALL");
  };

  const handleManualChange = (field, value) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCaseSelect = (caseId) => {
    setSelectedEnforcement(caseId);
    setCaseSearchTerm("");
    setShowCasePicker(false);
    setSelectedSavedMember(null);
  };

  const handleClearSelection = () => {
    setSelectedEnforcement("");
    setCaseSearchTerm("");
    setShowCasePicker(false);
    setSelectedSavedMember(null);
    fetchAllTeamMembers();
  };

  const handleOpenAssignModal = () => {
    if (!selectedEnforcement) {
      toast.error("Please select a case first");
      return;
    }
    setSelectedSavedMember(null);
    setSavedMemberSearchTerm("");
    setManualForm(emptyManualForm());
    setShowAssignModal(true);
  };

  const selectSavedMember = (member) => {
    setSelectedSavedMember(member);
  };

  const refreshAfterAssign = async () => {
    if (selectedEnforcement) {
      await Promise.all([
        fetchSelectedCaseMembers(selectedEnforcement),
        fetchAllTeamMembers(enforcements, false),
      ]);
    } else {
      await fetchAllTeamMembers();
    }
  };

  const buildSavedMemberPayload = () => {
    if (!selectedSavedMember) return null;

      const isDirectMember = selectedSavedMember.officer?.source === "DIRECT";
      const officerId =
        isDirectMember
          ? undefined
          : typeof selectedSavedMember.officer === "string"
          ? selectedSavedMember.officer
          : selectedSavedMember.officer?._id;
      const fallbackName = (selectedSavedMember.name || selectedSavedMember.officer?.name || "").trim();
      const fallbackEmail = (
        selectedSavedMember.email ||
        selectedSavedMember.officer?.email ||
        ""
      )
        .trim()
        .toLowerCase();

      const payload = {
        role: selectedSavedMember.role || "INVESTIGATOR",
        badgeNumber: selectedSavedMember.badgeNumber || undefined,
        department: selectedSavedMember.department || undefined,
        specialization: selectedSavedMember.specialization || undefined,
        contactNumber: selectedSavedMember.contactNumber || undefined,
        responsibilities: Array.isArray(selectedSavedMember.responsibilities) ? selectedSavedMember.responsibilities : [],
        notes: selectedSavedMember.notes || undefined,
      };

      if (officerId) {
        payload.officerId = officerId;
      } else {
        if (!fallbackName || !fallbackEmail) {
          throw new Error("Selected member is missing identity details. Please add manually.");
        }
        payload.name = fallbackName;
        payload.email = fallbackEmail;
      }

      return payload;
  };

  const hasManualDraft = () => {
    return [
      manualForm.name,
      manualForm.email,
      manualForm.badgeNumber,
      manualForm.department,
      manualForm.specialization,
      manualForm.contactNumber,
      manualForm.responsibilities,
      manualForm.notes,
    ].some((value) => String(value || "").trim().length > 0);
  };

  const buildManualPayload = () => {
    if (!hasManualDraft()) return null;

    if (!manualForm.name.trim()) {
      throw new Error("Name is required for new member");
    }
    if (!manualForm.email.trim()) {
      throw new Error("Email is required for new member");
    }

    return {
      name: manualForm.name.trim(),
      email: manualForm.email.trim().toLowerCase(),
      role: manualForm.role,
      badgeNumber: manualForm.badgeNumber.trim() || undefined,
      department: manualForm.department.trim() || undefined,
      specialization: manualForm.specialization.trim() || undefined,
      contactNumber: manualForm.contactNumber.trim() || undefined,
      responsibilities: manualForm.responsibilities
        .split(/\n|,/)
        .map((value) => value.trim())
        .filter(Boolean),
      notes: manualForm.notes.trim() || undefined,
    };
  };

  const handleAssignSubmit = async (event) => {
    event.preventDefault();
    if (!selectedEnforcement) {
      toast.error("Please select a case first");
      return;
    }

    let savedPayload;
    let manualPayload;
    try {
      savedPayload = selectedSavedMember ? buildSavedMemberPayload() : null;
      manualPayload = buildManualPayload();
    } catch (error) {
      toast.error(error.message || "Please check member details");
      return;
    }

    if (!savedPayload && !manualPayload) {
      toast.error("Select an existing member or enter a new member");
      return;
    }

    setAssigning(true);
    try {
      if (savedPayload) {
        await addTeamMember(selectedEnforcement, savedPayload);
      }

      if (manualPayload) {
        await addTeamMember(selectedEnforcement, manualPayload);
      }

      toast.success(savedPayload && manualPayload ? "Members assigned successfully" : savedPayload ? "Existing member assigned successfully" : "Manual member added successfully");
      setShowAssignModal(false);
      setSelectedSavedMember(null);
      setSavedMemberSearchTerm("");
      setManualForm(emptyManualForm());
      await refreshAfterAssign();
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to assign members"));
    } finally {
      setAssigning(false);
    }
  };

  const handleEditMember = (member) => {
    setEditingMemberId(member._id);
    setEditingEnforcementId(member._caseId || selectedEnforcement || "");
    setEditForm({
      role: member.role || "INVESTIGATOR",
      status: member.status === "ACTIVE" ? "ON_DUTY" : member.status || "ON_DUTY",
      badgeNumber: member.badgeNumber || "",
      department: member.department || "",
      specialization: member.specialization || "",
      contactNumber: member.contactNumber || "",
      hoursLogged: member.hoursLogged || 0,
      responsibilities: (member.responsibilities || []).join(", "),
      notes: member.notes || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const targetCaseId = editingEnforcementId || selectedEnforcement;
    if (!targetCaseId || !editingMemberId) return;

    const payload = {
      role: editForm.role,
      status: editForm.status,
      badgeNumber: editForm.badgeNumber.trim() || undefined,
      department: editForm.department.trim() || undefined,
      specialization: editForm.specialization.trim() || undefined,
      contactNumber: editForm.contactNumber.trim() || undefined,
      hoursLogged: Number(editForm.hoursLogged) || 0,
      responsibilities: editForm.responsibilities
        .split(/\n|,/) 
        .map((value) => value.trim())
        .filter(Boolean),
      notes: editForm.notes.trim() || undefined,
    };

    setEditSubmitting(true);
    try {
      await updateTeamMember(targetCaseId, editingMemberId, payload);
      toast.success("Team member updated");
      setShowEditModal(false);
      setEditingMemberId("");
      setEditingEnforcementId("");
      await refreshAfterAssign();
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to update team member"));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleMemberStatusChange = async (memberId, status, enforcementId = selectedEnforcement) => {
    if (!enforcementId || !memberId) return;
    setUpdatingMemberId(memberId);
    try {
      await updateTeamMember(enforcementId, memberId, { status });
      toast.success("Team member updated");
      await refreshAfterAssign();
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to update team member"));
    } finally {
      setUpdatingMemberId("");
    }
  };

  const requestRemoveMember = (memberId, enforcementId = selectedEnforcement) => {
    setMemberIdToDelete(memberId);
    setMemberCaseIdToDelete(enforcementId || "");
    setShowDeleteConfirmModal(true);
  };

  const handleRemoveMember = async () => {
    const targetCaseId = memberCaseIdToDelete || selectedEnforcement;
    if (!targetCaseId || !memberIdToDelete) return;

    setUpdatingMemberId(memberIdToDelete);
    try {
      await removeTeamMember(targetCaseId, memberIdToDelete);
      toast.success("Team member removed");
      setShowDeleteConfirmModal(false);
      setMemberIdToDelete("");
      setMemberCaseIdToDelete("");
      await refreshAfterAssign();
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to remove team member"));
    } finally {
      setUpdatingMemberId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 shadow-xl space-y-5">
        <div className="absolute -top-16 -right-8 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
              <Users className="w-3.5 h-3.5" /> Team Operations
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Team Roster</h2>
            <p className="text-slate-200 mt-1">Manage personnel assigned to active cases.</p>
          </div>

          <button
            onClick={handleOpenAssignModal}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Assign Team Member
          </button>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm space-y-4">
          <div className="w-full md:w-[38rem] space-y-3" ref={casePickerRef}>
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
              </div>

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
                          <span className="text-sm font-bold text-slate-800">Case ...{enf._id.slice(-6).toUpperCase()}</span>
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

            <div className="flex flex-wrap items-center gap-2">
              {selectedCase ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                  <span className="uppercase tracking-wider text-slate-200/80">Connected</span>
                  <span className="font-mono">Case ...{selectedCase._id.slice(-6).toUpperCase()}</span>
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
              <span>{selectedCase ? "Roster Connected" : "Select Case to Manage Personnel"}</span>
              <span>{enforcements.length} Cases Available</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Total Members</p>
                <p className="mt-1 text-2xl font-black text-slate-900 leading-none">{caseStats.total}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">On Duty</p>
                <p className="mt-1 text-2xl font-black text-slate-900 leading-none">{caseStats.onDuty}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Available</p>
                <p className="mt-1 text-2xl font-black text-slate-900 leading-none">{caseStats.available}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">On Leave</p>
                <p className="mt-1 text-2xl font-black text-slate-900 leading-none">{caseStats.onLeave}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <UserMinus className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Relieved</p>
                <p className="mt-1 text-2xl font-black text-slate-900 leading-none">{caseStats.relieved}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Hours Logged</p>
                <p className="mt-1 text-2xl font-black text-slate-900 leading-none">{caseStats.totalHours}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={teamSearchTerm}
            onChange={(e) => setTeamSearchTerm(e.target.value)}
            placeholder="Search by name, email, badge, department"
            className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={teamRoleFilter}
          onChange={(e) => setTeamRoleFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Roles</option>
          {TEAM_ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            value={teamStatusFilter}
            onChange={(e) => setTeamStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ON_DUTY">On Duty</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="RELIEVED">Relieved</option>
          </select>

          <button
            onClick={clearFilters}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Clear team filters"
            title="Clear filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton variant="circular" width="36px" height="36px" />
                  <div className="space-y-2 flex-1">
                    <Skeleton width="55%" height="14px" />
                    <Skeleton width="35%" height="10px" />
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <Skeleton width="80px" height="20px" />
                  <Skeleton width="70px" height="20px" />
                  <Skeleton width="170px" height="28px" />
                </div>
              </div>
            </div>
          ))
        ) : filteredTeam.length === 0 ? (
          <div className="p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No team members found</h3>
            <p className="text-slate-500 max-w-sm mt-2">
              {team.length === 0
                ? selectedEnforcement
                  ? "There is currently no one assigned to this enforcement record."
                  : "There are currently no members assigned across available cases."
                : "No assigned members match the current search/filter criteria."}
            </p>
            {team.length === 0 ? (
              <button
                onClick={handleOpenAssignModal}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-sm hover:bg-blue-700 transition"
              >
                Assign Team Member
              </button>
            ) : (
              <button
                onClick={clearFilters}
                className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-sm hover:bg-slate-800 transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredTeam.map((member) => {
            const dutyState = getMemberDutyState(member);
            const statusClass =
              dutyState === "ON_DUTY"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : dutyState === "AVAILABLE"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : dutyState === "ON_LEAVE"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-rose-200 bg-rose-50 text-rose-700";
            const caseCode = (member._caseId || selectedEnforcement)
              ? (member._caseId || selectedEnforcement).slice(-6).toUpperCase()
              : "N/A";

            return (
              <div key={member._id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md p-3.5 transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 shrink-0">
                      {(member.officer?.name || member.name || "?").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-800 truncate">{member.officer?.name || member.name || "Unknown"}</h3>
                      <p className="text-[11px] text-slate-500 truncate">{member.officer?.email || member.email || ""}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-wide">
                        <span className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 px-2 py-0.5">{member.role.replaceAll("_", " ")}</span>
                        <span className={`rounded-full border px-2 py-0.5 ${statusClass}`}>{dutyState.replace("_", " ")}</span>
                        <span className="rounded-full border border-blue-200 bg-blue-50 text-blue-700 px-2 py-0.5">Case {caseCode}</span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5">Badge {member.badgeNumber || "N/A"}</span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5">Hours {member.hoursLogged}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:shrink-0">
                    <button
                      onClick={() => handleEditMember(member)}
                      disabled={updatingMemberId === member._id}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleMemberStatusChange(member._id, member.status === "ON_LEAVE" ? "AVAILABLE" : "ON_LEAVE", member._caseId || selectedEnforcement)}
                      disabled={updatingMemberId === member._id}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition disabled:opacity-60"
                    >
                      {member.status === "ON_LEAVE" ? "Set Available" : "Set On Leave"}
                    </button>
                    <button
                      onClick={() => requestRemoveMember(member._id, member._caseId || selectedEnforcement)}
                      disabled={updatingMemberId === member._id}
                      className="text-xs font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md transition disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-bold uppercase text-slate-400">Assigned {format(new Date(member.assignedAt), "MMM d")}</div>
              </div>
            );
          })
        )}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-10 pb-6 md:pt-14">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => {
              setShowAssignModal(false);
              setSelectedSavedMember(null);
              setManualForm(emptyManualForm());
              setSavedMemberSearchTerm("");
            }}
          />

          <form
            onSubmit={handleAssignSubmit}
            className="relative w-full max-w-4xl max-h-[calc(100vh-5rem)] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="absolute left-6 right-6 top-3 h-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 blur-2xl opacity-25 pointer-events-none" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assign Team Member</h3>
                <p className="text-sm text-slate-500 mt-1">Use one submit to assign selected existing members and/or add a manual member.</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedSavedMember(null);
                  setManualForm(emptyManualForm());
                  setSavedMemberSearchTerm("");
                }}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close assign modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Existing Available Members</p>
                      <p className="mt-1 text-sm text-slate-600">Select a saved available member, then submit once at the bottom.</p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">{reusableMembers.length} available</span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      value={savedMemberSearchTerm}
                      onChange={(e) => setSavedMemberSearchTerm(e.target.value)}
                      placeholder="Search members by name, email, role or badge"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {reusableMembers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">No reusable available members found.</div>
                  ) : (
                    <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                      {reusableMembers.map((member) => {
                        const memberName = member.officer?.name || member.name || "Unknown";
                        const caseLabel = member._caseId ? `Case ...${member._caseId.slice(-6).toUpperCase()}` : "Case N/A";
                        const caseSuffix = member._caseId ? ` · ${member._caseId.slice(-6).toUpperCase()}` : "";
                        const isSelected = selectedSavedMember?._id === member._id && selectedSavedMember?._caseId === member._caseId;

                        return (
                          <button
                            key={`${member._caseId || "none"}-${member._id}`}
                            type="button"
                            onClick={() => selectSavedMember(member)}
                            className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                              isSelected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate">{memberName}</p>
                                <p className="text-xs text-slate-500 truncate">{member.email || member.officer?.email || "No email"}</p>
                              </div>
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">{member.status}{caseSuffix}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{member.role.replaceAll("_", " ")}</span>
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{caseLabel}</span>
                              {member.badgeNumber ? <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">Badge {member.badgeNumber}</span> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedSavedMember ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Selected Existing Member</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">{selectedSavedMember.officer?.name || selectedSavedMember.name || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{selectedSavedMember.email || selectedSavedMember.officer?.email || "No email"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        <span className="rounded-md bg-white px-2 py-1 border border-slate-200">{selectedSavedMember.role.replaceAll("_", " ")}</span>
                        {selectedSavedMember.badgeNumber ? <span className="rounded-md bg-white px-2 py-1 border border-slate-200">Badge {selectedSavedMember.badgeNumber}</span> : null}
                        {selectedSavedMember._caseId ? <span className="rounded-md bg-white px-2 py-1 border border-slate-200">Case ID ...{selectedSavedMember._caseId.slice(-6).toUpperCase()}</span> : null}
                      </div>
                      <p className="text-sm text-slate-700">This member will be assigned when you submit the form.</p>
                      <div className="flex justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedSavedMember(null)}
                          className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">Pick a member from the list to assign them.</div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Manual New Member</p>
                      <p className="mt-1 text-sm text-slate-600">Add a brand-new member by entering their details once.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                    <input value={manualForm.name} onChange={(e) => handleManualChange("name", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full name" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input value={manualForm.email} onChange={(e) => handleManualChange("email", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="member@example.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                    <select value={manualForm.role} onChange={(e) => handleManualChange("role", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {TEAM_ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Badge Number</label>
                    <input value={manualForm.badgeNumber} onChange={(e) => handleManualChange("badgeNumber", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                    <input value={manualForm.department} onChange={(e) => handleManualChange("department", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Specialization</label>
                    <input value={manualForm.specialization} onChange={(e) => handleManualChange("specialization", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
                    <input value={manualForm.contactNumber} onChange={(e) => handleManualChange("contactNumber", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Responsibilities</label>
                    <textarea value={manualForm.responsibilities} onChange={(e) => handleManualChange("responsibilities", e.target.value)} placeholder="Enter responsibilities separated by commas or new lines" rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                    <textarea value={manualForm.notes} onChange={(e) => handleManualChange("notes", e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 bg-white flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedSavedMember(null);
                  setManualForm(emptyManualForm());
                  setSavedMemberSearchTerm("");
                }}
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigning}
                className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {assigning ? "Submitting..." : "Submit Assignment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-10 pb-6 md:pt-14">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-2xl max-h-[calc(100vh-5rem)] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Team Member</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-700" aria-label="Close edit modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {TEAM_ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ON_DUTY">On Duty</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="RELIEVED">Relieved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Badge Number</label>
                <input value={editForm.badgeNumber} onChange={(e) => setEditForm((prev) => ({ ...prev, badgeNumber: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                <input value={editForm.department} onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Specialization</label>
                <input value={editForm.specialization} onChange={(e) => setEditForm((prev) => ({ ...prev, specialization: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
                <input value={editForm.contactNumber} onChange={(e) => setEditForm((prev) => ({ ...prev, contactNumber: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hours Logged</label>
                <input type="number" min="0" value={editForm.hoursLogged} onChange={(e) => setEditForm((prev) => ({ ...prev, hoursLogged: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Responsibilities</label>
                <textarea value={editForm.responsibilities} onChange={(e) => setEditForm((prev) => ({ ...prev, responsibilities: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={editSubmitting} className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">{editSubmitting ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !updatingMemberId && setShowDeleteConfirmModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Confirm Removal</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Are you sure you want to remove this team member? This cannot be undone.</p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={() => setShowDeleteConfirmModal(false)} disabled={updatingMemberId} className="py-3 px-4 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition border border-slate-200 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
                <button onClick={handleRemoveMember} disabled={updatingMemberId} className="py-3 px-4 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-lg shadow-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60">{updatingMemberId ? "Removing..." : "Confirm"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
