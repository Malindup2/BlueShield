import React, { useState, useEffect, useMemo, useRef } from "react";
import { addTeamMember, getEnforcements, getTeam, getTeamOfficers, removeTeamMember, updateTeamMember } from "../../../services/enforcementAPI";
import { Users, BadgeInfo, Clock, ChevronDown, Plus, X, AlertTriangle, Search, Filter, UserCheck, UserMinus, UserX, Timer } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Skeleton } from "../../../components/common/Skeleton";

const TEAM_ROLE_OPTIONS = [
  "LEAD_INVESTIGATOR",
  "INVESTIGATOR",
  "EVIDENCE_HANDLER",
  "SURVEILLANCE",
  "LEGAL_LIAISON",
  "SUPPORT",
];

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const getApiErrorMessage = (error, fallbackMessage) => {
  const details = error?.response?.data?.errors;
  if (Array.isArray(details) && details.length > 0) {
    return details[0];
  }
  return error?.response?.data?.message || fallbackMessage;
};

export default function OfficerTeam() {
  const [enforcements, setEnforcements] = useState([]);
  const [officerOptions, setOfficerOptions] = useState([]);
  const [selectedEnforcement, setSelectedEnforcement] = useState("");
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [team, setTeam] = useState([]);
  const [assignMode, setAssignMode] = useState("DIRECT");
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [teamRoleFilter, setTeamRoleFilter] = useState("ALL");
  const [teamStatusFilter, setTeamStatusFilter] = useState("ALL");
  const [officerSearchTerm, setOfficerSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [memberIdToDelete, setMemberIdToDelete] = useState("");
  const casePickerRef = useRef(null);
  const [assignForm, setAssignForm] = useState({
    officerId: "",
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
  const [editForm, setEditForm] = useState({
    role: "INVESTIGATOR",
    status: "ACTIVE",
    badgeNumber: "",
    department: "",
    specialization: "",
    contactNumber: "",
    hoursLogged: 0,
    responsibilities: "",
    notes: "",
  });

  const fetchTeamMembers = async (enforcementId) => {
    if (!enforcementId) return;
    setLoading(true);
    try {
      const res = await getTeam(enforcementId);
      setTeam(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load team members");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const getCaseDisplayLabel = (enf) => `Case ...${(enf?._id || "").slice(-6).toUpperCase()}`;

  // Fetch enforcements for dropdown
  useEffect(() => {
    Promise.all([getEnforcements({ limit: 50 }), getTeamOfficers()])
      .then(([enforcementRes, officersRes]) => {
        setEnforcements(enforcementRes.items || []);
        if (enforcementRes.items?.length > 0) {
          const firstCase = enforcementRes.items[0];
          setSelectedEnforcement(firstCase._id);
        }
        setOfficerOptions(Array.isArray(officersRes) ? officersRes : []);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load assignment options");
      });
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

  // Fetch team when enforcement selected
  useEffect(() => {
    if (!selectedEnforcement) return;
    fetchTeamMembers(selectedEnforcement);
  }, [selectedEnforcement]);

  const handleAssignInputChange = (field, value) => {
    setAssignForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetAssignForm = () => {
    setAssignForm({
      officerId: "",
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
    setAssignMode("DIRECT");
    setOfficerSearchTerm("");
  };

  const handleAssignOfficer = async (event) => {
    event.preventDefault();

    if (!selectedEnforcement) {
      toast.error("Select an enforcement case first");
      return;
    }
    if (assignMode === "OFFICER") {
      if (!assignForm.officerId.trim()) {
        toast.error("Team member ID is required");
        return;
      }

      if (!OBJECT_ID_REGEX.test(assignForm.officerId.trim())) {
        toast.error("Team member ID must be a valid 24-character Mongo ObjectId");
        return;
      }
    } else {
      if (!assignForm.name.trim()) {
        toast.error("Name is required");
        return;
      }
      if (!assignForm.email.trim()) {
        toast.error("Email is required");
        return;
      }
    }

    const payload = {
      officerId: assignMode === "OFFICER" ? assignForm.officerId.trim() : undefined,
      name: assignMode === "DIRECT" ? assignForm.name.trim() : undefined,
      email: assignMode === "DIRECT" ? assignForm.email.trim().toLowerCase() : undefined,
      role: assignForm.role,
      badgeNumber: assignForm.badgeNumber.trim() || undefined,
      department: assignForm.department.trim() || undefined,
      specialization: assignForm.specialization.trim() || undefined,
      contactNumber: assignForm.contactNumber.trim() || undefined,
      responsibilities: assignForm.responsibilities
        .split(/\n|,/) 
        .map((value) => value.trim())
        .filter(Boolean),
      notes: assignForm.notes.trim() || undefined,
    };

    setAssigning(true);
    try {
      await addTeamMember(selectedEnforcement, payload);
      toast.success("Team member assigned successfully");
      setShowAssignModal(false);
      resetAssignForm();
      fetchTeamMembers(selectedEnforcement);
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to assign team member"));
    } finally {
      setAssigning(false);
    }
  };

  const handleMemberStatusChange = async (memberId, status) => {
    if (!selectedEnforcement || !memberId) return;
    setUpdatingMemberId(memberId);
    try {
      await updateTeamMember(selectedEnforcement, memberId, { status });
      toast.success("Team member updated");
      fetchTeamMembers(selectedEnforcement);
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to update team member"));
    } finally {
      setUpdatingMemberId("");
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedEnforcement || !memberIdToDelete) return;

    setUpdatingMemberId(memberIdToDelete);
    try {
      await removeTeamMember(selectedEnforcement, memberIdToDelete);
      toast.success("Team member removed");
      setShowDeleteConfirmModal(false);
      setMemberIdToDelete("");
      fetchTeamMembers(selectedEnforcement);
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to remove team member"));
    } finally {
      setUpdatingMemberId("");
    }
  };

  const requestRemoveMember = (memberId) => {
    setMemberIdToDelete(memberId);
    setShowDeleteConfirmModal(true);
  };

  const openEditModal = (member) => {
    setEditingMemberId(member._id);
    setEditForm({
      role: member.role || "INVESTIGATOR",
      status: member.status || "ACTIVE",
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

  const handleEditInputChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateMember = async (event) => {
    event.preventDefault();
    if (!selectedEnforcement || !editingMemberId) return;

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
      await updateTeamMember(selectedEnforcement, editingMemberId, payload);
      toast.success("Team member details updated");
      setShowEditModal(false);
      setEditingMemberId("");
      fetchTeamMembers(selectedEnforcement);
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to update team member"));
    } finally {
      setEditSubmitting(false);
    }
  };

  const clearTeamFilters = () => {
    setTeamSearchTerm("");
    setTeamRoleFilter("ALL");
    setTeamStatusFilter("ALL");
  };

  const filteredTeam = useMemo(() => {
    const term = teamSearchTerm.trim().toLowerCase();

    return team.filter((member) => {
      const searchableText = [
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

      const matchesSearch = term.length === 0 || searchableText.includes(term);
      const matchesRole = teamRoleFilter === "ALL" || member.role === teamRoleFilter;
      const matchesStatus = teamStatusFilter === "ALL" || member.status === teamStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [team, teamSearchTerm, teamRoleFilter, teamStatusFilter]);

  const filteredOfficerOptions = useMemo(() => {
    const term = officerSearchTerm.trim().toLowerCase();
    if (!term) return officerOptions;

    return officerOptions.filter((officer) => {
      const text = `${officer.name || ""} ${officer.email || ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [officerOptions, officerSearchTerm]);

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

  const teamStats = useMemo(() => {
    const total = team.length;
    const active = team.filter((member) => member.status === "ACTIVE").length;
    const onLeave = team.filter((member) => member.status === "ON_LEAVE").length;
    const relieved = team.filter((member) => member.status === "RELIEVED").length;
    const totalHours = team.reduce((sum, member) => sum + (member.hoursLogged || 0), 0);
    return { total, active, onLeave, relieved, totalHours };
  }, [team]);

  const handleCaseSelect = (caseId) => {
    setSelectedEnforcement(caseId);
    setCaseSearchTerm("");
    setShowCasePicker(false);
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
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Assign Team Member
          </button>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm space-y-4">
          <div className="w-full md:w-[30rem]">
            <div ref={casePickerRef} className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                value={caseSearchTerm}
                onChange={(e) => {
                  setCaseSearchTerm(e.target.value);
                  setShowCasePicker(true);
                }}
                onFocus={() => setShowCasePicker(true)}
                placeholder={selectedCase ? `Selected ${getCaseDisplayLabel(selectedCase)} - search by ID, status, priority` : "Search case by ID, status, priority"}
                className="w-full rounded-lg border border-white/20 bg-white/90 pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowCasePicker((prev) => !prev)}
                className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-slate-600"
                aria-label="Toggle case picker"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {showCasePicker && (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-72 overflow-y-auto">
                  {filteredCases.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">No matching cases found.</div>
                  ) : (
                    filteredCases.map((enf) => (
                      <button
                        key={enf._id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleCaseSelect(enf._id)}
                        className={`w-full text-left px-4 py-3 border-b last:border-b-0 border-slate-100 hover:bg-slate-50 ${
                          selectedEnforcement === enf._id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="text-sm font-bold text-slate-800">{getCaseDisplayLabel(enf)}</div>
                        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          {enf.status || "Unknown status"} {enf.priority ? `- ${enf.priority}` : ""}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-100 font-semibold uppercase tracking-wider">
              <span>{selectedCase ? `Selected ${selectedCase._id.slice(-6).toUpperCase()}` : "No case selected"}</span>
              <span>{enforcements.length} cases</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">Total Members</p>
                <p className="mt-1 text-2xl font-black text-white">{teamStats.total}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/90 border border-white/60 text-slate-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200/40 bg-emerald-500/15 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Active</p>
                <p className="mt-1 text-2xl font-black text-white">{teamStats.active}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/90 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200/40 bg-amber-500/15 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">On Leave</p>
                <p className="mt-1 text-2xl font-black text-white">{teamStats.onLeave}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/90 border border-amber-200 text-amber-700 flex items-center justify-center">
                <UserMinus className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-2xl border border-rose-200/40 bg-rose-500/15 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100">Relieved</p>
                <p className="mt-1 text-2xl font-black text-white">{teamStats.relieved}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/90 border border-rose-200 text-rose-700 flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="rounded-2xl border border-blue-200/40 bg-blue-500/15 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Hours Logged</p>
                <p className="mt-1 text-2xl font-black text-white">{teamStats.totalHours}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/90 border border-blue-200 text-blue-700 flex items-center justify-center">
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
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="RELIEVED">Relieved</option>
          </select>

          <button
            onClick={clearTeamFilters}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Clear team filters"
            title="Clear filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
               <div className="flex justify-between">
                 <div className="space-y-2 flex-1">
                   <Skeleton width="60%" height="18px" />
                   <Skeleton width="40%" height="12px" />
                 </div>
                 <Skeleton variant="circular" width="40px" height="40px" />
               </div>
               <div className="space-y-3">
                 <Skeleton width="80%" height="14px" />
                 <Skeleton width="70%" height="14px" />
               </div>
               <div className="pt-4 border-t border-slate-100 flex justify-between">
                 <Skeleton width="30%" height="10px" />
                 <Skeleton width="20%" height="10px" />
               </div>
             </div>
           ))
        ) : filteredTeam.length === 0 ? (
           <div className="col-span-full p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <Users className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-lg font-bold text-slate-700">No team members found</h3>
             <p className="text-slate-500 max-w-sm mt-2">
               {team.length === 0
                 ? "There is currently no one assigned to this enforcement record."
                 : "No assigned members match the current search/filter criteria."}
             </p>
             {team.length === 0 ? (
               <button
                 onClick={() => setShowAssignModal(true)}
                 className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-sm hover:bg-blue-700 transition"
               >
                  Assign Team Member
               </button>
             ) : (
               <button
                 onClick={clearTeamFilters}
                 className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-sm hover:bg-slate-800 transition"
               >
                 Reset Filters
               </button>
             )}
           </div>
        ) : (
          filteredTeam.map(member => (
            <div key={member._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md p-6 relative overflow-hidden transition-shadow">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="font-bold text-lg text-slate-800">{member.officer?.name || member.name || "Unknown"}</h3>
                   <p className="text-xs text-slate-500 mt-0.5">{member.officer?.email || member.email || ""}</p>
                   <p className="text-xs font-black text-blue-600 tracking-wider mt-1">{member.role.replace("_", " ")}</p>
                   <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                     member.status === "ACTIVE"
                       ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                       : member.status === "ON_LEAVE"
                         ? "border-amber-200 bg-amber-50 text-amber-700"
                         : "border-rose-200 bg-rose-50 text-rose-700"
                   }`}>
                     {member.status.replace("_", " ")}
                   </span>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                   {(member.officer?.name || member.name || "?").charAt(0)}
                 </div>
               </div>
               
               <div className="space-y-3 mt-6">
                 <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                   <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Case ID</p>
                   <p className="mt-1 text-sm font-black font-mono text-blue-900 tracking-wide">
                     {selectedEnforcement ? selectedEnforcement.slice(-6).toUpperCase() : "N/A"}
                   </p>
                 </div>
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                   <BadgeInfo className="w-4 h-4 text-slate-400" />
                   <span>Badge: <strong className="text-slate-800">{member.badgeNumber || "N/A"}</strong></span>
                 </div>
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                   <Clock className="w-4 h-4 text-slate-400" />
                   <span>Hours Logged: <strong className="text-slate-800">{member.hoursLogged}</strong></span>
                 </div>
               </div>

               <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-[10px] font-bold uppercase text-slate-400">
                   Assigned {format(new Date(member.assignedAt), "MMM d")}
                 </span>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={() => openEditModal(member)}
                     disabled={updatingMemberId === member._id}
                     className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition disabled:opacity-60"
                   >
                     Edit
                   </button>
                   <button
                     onClick={() =>
                       handleMemberStatusChange(
                         member._id,
                         member.status === "ACTIVE" ? "ON_LEAVE" : "ACTIVE"
                       )
                     }
                     disabled={updatingMemberId === member._id}
                     className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition disabled:opacity-60"
                   >
                     {member.status === "ACTIVE" ? "Set On Leave" : "Set Active"}
                   </button>
                   <button
                     onClick={() => requestRemoveMember(member._id)}
                     disabled={updatingMemberId === member._id}
                     className="text-xs font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md transition disabled:opacity-60"
                   >
                     Remove
                   </button>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-10 pb-6 md:pt-14">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => {
              setShowAssignModal(false);
              resetAssignForm();
            }}
          />
          <div className="relative w-full max-w-2xl max-h-[calc(100vh-5rem)] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="absolute left-6 right-6 top-3 h-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 blur-2xl opacity-25 pointer-events-none" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assign Team Member</h3>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  resetAssignForm();
                }}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close assign officer modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignOfficer} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              <div className="md:col-span-2 flex gap-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setAssignMode("DIRECT")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition ${
                    assignMode === "DIRECT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Direct Member
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode("OFFICER")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition ${
                    assignMode === "OFFICER" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Existing Officer
                </button>
              </div>

              {assignMode === "OFFICER" ? (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Select Existing Team Member</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      value={officerSearchTerm}
                      onChange={(e) => setOfficerSearchTerm(e.target.value)}
                      placeholder="Search member by name or email"
                      className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={officerOptions.some((officer) => officer._id === assignForm.officerId) ? assignForm.officerId : ""}
                    onChange={(e) => handleAssignInputChange("officerId", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select team member</option>
                    {filteredOfficerOptions.map((officer) => (
                      <option key={officer._id} value={officer._id}>
                        {officer.name} - {officer.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Use an existing active officer account.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                    <input
                      value={assignForm.name}
                      onChange={(e) => handleAssignInputChange("name", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      value={assignForm.email}
                      onChange={(e) => handleAssignInputChange("email", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="member@example.com"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={assignForm.role}
                  onChange={(e) => handleAssignInputChange("role", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TEAM_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Badge Number</label>
                <input
                  value={assignForm.badgeNumber}
                  onChange={(e) => handleAssignInputChange("badgeNumber", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                <input
                  value={assignForm.department}
                  onChange={(e) => handleAssignInputChange("department", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Specialization</label>
                <input
                  value={assignForm.specialization}
                  onChange={(e) => handleAssignInputChange("specialization", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
                <input
                  value={assignForm.contactNumber}
                  onChange={(e) => handleAssignInputChange("contactNumber", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Responsibilities</label>
                <textarea
                  value={assignForm.responsibilities}
                  onChange={(e) => handleAssignInputChange("responsibilities", e.target.value)}
                  placeholder="Enter responsibilities separated by commas or new lines"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) => handleAssignInputChange("notes", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    resetAssignForm();
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
                  {assigning ? "Assigning..." : "Assign Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-10 pb-6 md:pt-14">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => {
              setShowEditModal(false);
              setEditingMemberId("");
            }}
          />
          <div className="relative w-full max-w-2xl max-h-[calc(100vh-5rem)] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="absolute left-6 right-6 top-3 h-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 blur-2xl opacity-25 pointer-events-none" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Team Member</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMemberId("");
                }}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close edit team member modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => handleEditInputChange("role", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TEAM_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => handleEditInputChange("status", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="RELIEVED">RELIEVED</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Badge Number</label>
                <input
                  value={editForm.badgeNumber}
                  onChange={(e) => handleEditInputChange("badgeNumber", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hours Logged</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.hoursLogged}
                  onChange={(e) => handleEditInputChange("hoursLogged", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                <input
                  value={editForm.department}
                  onChange={(e) => handleEditInputChange("department", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Specialization</label>
                <input
                  value={editForm.specialization}
                  onChange={(e) => handleEditInputChange("specialization", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
                <input
                  value={editForm.contactNumber}
                  onChange={(e) => handleEditInputChange("contactNumber", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Responsibilities</label>
                <textarea
                  value={editForm.responsibilities}
                  onChange={(e) => handleEditInputChange("responsibilities", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => handleEditInputChange("notes", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMemberId("");
                  }}
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
              setMemberIdToDelete("");
            }}
          />
          <div className="relative w-full max-w-md max-h-[calc(100vh-5rem)] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="absolute left-6 right-6 top-3 h-2 rounded-full bg-gradient-to-r from-red-500 via-rose-400 to-red-500 blur-2xl opacity-25 pointer-events-none" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Confirm Removal</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setMemberIdToDelete("");
                }}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close remove confirmation modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto">
              <p className="text-sm text-slate-600">
                Are you sure you want to remove this team member from the enforcement case?
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setMemberIdToDelete("");
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemoveMember}
                  disabled={updatingMemberId === memberIdToDelete}
                  className="px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {updatingMemberId === memberIdToDelete ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
