import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldAlert,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  X,
  Filter,
  Radio,
  FileText,
  Clock3,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { SkeletonTableRows } from "../../../components/common/Skeleton";
import {
  getHazardCases,
  deleteHazardCase,
  resolveHazardCase,
} from "../../../services/hazardAdminAPI";

const HANDLING_STATUSES = [
  "ALL",
  "OPEN",
  "MONITORING",
  "MITIGATION_PLANNED",
  "MITIGATION_IN_PROGRESS",
  "RESOLVED",
];

const HAZARD_CATEGORIES = [
  "ALL",
  "WEATHER",
  "POLLUTION",
  "DEBRIS",
  "OBSTRUCTION",
  "OTHER",
];

const SEVERITIES = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

function handlingStatusStyle(status) {
  return {
    OPEN: "bg-blue-50 text-blue-700 border-blue-200",
    MONITORING: "bg-cyan-50 text-cyan-700 border-cyan-200",
    MITIGATION_PLANNED: "bg-amber-50 text-amber-700 border-amber-200",
    MITIGATION_IN_PROGRESS: "bg-orange-50 text-orange-700 border-orange-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[status] || "bg-slate-50 text-slate-700 border-slate-200";
}

function severityStyle() {
  return "bg-[#0f2d5c]/10 text-[#0f2d5c] border-[#0f2d5c]/20";
}

function zoneRequiredStyle() {
  return "bg-[#0f2d5c]/10 text-[#0f2d5c] border-[#0f2d5c]/20";
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

export default function HazardCases() {
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [handlingStatusFilter, setHandlingStatusFilter] = useState("ALL");
  const [hazardCategoryFilter, setHazardCategoryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [caseToResolve, setCaseToResolve] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHazardCases({ limit: 50 });
      setCases(data?.items || []);
    } catch (error) {
      console.error("Failed to load hazard cases:", error);
      toast.error(error?.response?.data?.message || "Failed to load hazard cases");
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const term = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !term ||
        item.caseId?.toLowerCase().includes(term) ||
        item.hazardCategory?.toLowerCase().includes(term) ||
        item.severity?.toLowerCase().includes(term) ||
        item.handlingStatus?.toLowerCase().includes(term) ||
        item.baseReport?.title?.toLowerCase().includes(term) ||
        item.baseReport?.location?.address?.toLowerCase().includes(term);

      const matchesHandling =
        handlingStatusFilter === "ALL" || item.handlingStatus === handlingStatusFilter;

      const matchesCategory =
        hazardCategoryFilter === "ALL" || item.hazardCategory === hazardCategoryFilter;

      const matchesSeverity =
        severityFilter === "ALL" || item.severity === severityFilter;

      return matchesSearch && matchesHandling && matchesCategory && matchesSeverity;
    });
  }, [cases, searchTerm, handlingStatusFilter, hazardCategoryFilter, severityFilter]);

  const stats = useMemo(() => {
    return {
      total: cases.length,
      open: cases.filter((item) => item.handlingStatus === "OPEN").length,
      monitoring: cases.filter((item) => item.handlingStatus === "MONITORING").length,
      inProgress: cases.filter((item) => item.handlingStatus === "MITIGATION_IN_PROGRESS").length,
      resolved: cases.filter((item) => item.handlingStatus === "RESOLVED").length,
    };
  }, [cases]);

  const statCards = [
    {
      label: "TOTAL CASES",
      value: stats.total,
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      iconBox: "bg-blue-50",
    },
    {
      label: "OPEN",
      value: stats.open,
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      iconBox: "bg-amber-50",
    },
    {
      label: "MONITORING",
      value: stats.monitoring,
      icon: <Radio className="h-5 w-5 text-sky-600" />,
      iconBox: "bg-sky-50",
    },
    {
      label: "IN PROGRESS",
      value: stats.inProgress,
      icon: <Clock3 className="h-5 w-5 text-indigo-600" />,
      iconBox: "bg-indigo-50",
    },
    {
      label: "RESOLVED",
      value: stats.resolved,
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      iconBox: "bg-emerald-50",
    },
  ];

  const openDeleteModal = (item) => {
    setCaseToDelete(item);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setCaseToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (!caseToDelete?._id) return;

    setDeleting(true);
    try {
      await deleteHazardCase(caseToDelete._id);
      toast.success("Hazard case deleted successfully");
      closeDeleteModal();
      fetchCases();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to delete hazard case");
    } finally {
      setDeleting(false);
    }
  };

  const openResolveModal = (item) => {
    setCaseToResolve(item);
    setResolutionNote("");
    setResolveModalOpen(true);
  };

  const closeResolveModal = () => {
    setCaseToResolve(null);
    setResolutionNote("");
    setResolveModalOpen(false);
  };

  const handleResolve = async () => {
    if (!caseToResolve?._id) return;

    setResolving(true);
    try {
      await resolveHazardCase(caseToResolve._id, {
        resolutionNote,
      });

      toast.success("Hazard case resolved successfully");
      closeResolveModal();
      fetchCases();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to resolve hazard case");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-8 shadow-xl">
        <div className="absolute -top-12 -right-10 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-8 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
            <ShieldAlert className="h-3 w-3" />
            Hazard Case Center
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
            Hazard Cases
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Monitor all created hazard cases, review handling progress, open case details,
            update records, resolve incidents, and manage follow-up actions such as zones.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[22px] border border-slate-200 bg-white px-6 py-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {card.label}
                </p>
                <p className="mt-3 text-4xl font-extrabold leading-none text-[#0f172a]">
                  {card.value}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${card.iconBox}`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
            Filter Hazard Cases
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by case ID, title, status..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={handlingStatusFilter}
            onChange={(e) => setHandlingStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {HANDLING_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All Handling Statuses" : item.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={hazardCategoryFilter}
            onChange={(e) => setHazardCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {HAZARD_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All Categories" : item}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SEVERITIES.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All Severities" : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Case ID
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Report Title
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Category
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Severity
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Handling Status
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Zone Required
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Created Date
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Resolve
                </th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <SkeletonTableRows rows={6} cols={9} />
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <p className="text-lg font-bold text-slate-800">No hazard cases found</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Try changing the filters or search term.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">{item.caseId}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {item.baseReport?.title || "Untitled report"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${categoryStyle(
                          item.hazardCategory
                        )}`}
                      >
                        {item.hazardCategory}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${severityStyle()}`}
                      >
                        {item.severity}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${handlingStatusStyle(
                          item.handlingStatus
                        )}`}
                      >
                        {item.handlingStatus.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${zoneRequiredStyle()}`}
                      >
                        {item.zoneRequired ? "YES" : "NO"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : "N/A"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {item.handlingStatus === "RESOLVED" ? (
                        <span className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                          Resolved
                        </span>
                      ) : (
                        <button
                          onClick={() => openResolveModal(item)}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Resolve
                        </button>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/hazard-admin/cases/${item._id}`)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
                          title="View case"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => navigate(`/dashboard/hazard-admin/cases/${item._id}/edit`)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
                          title="Edit case"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => openDeleteModal(item)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                          title="Delete case"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Delete Hazard Case
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Confirm Delete</h3>
              </div>

              <button
                onClick={closeDeleteModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Are you sure you want to delete this hazard case?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  This action cannot be undone.
                </p>
                <p className="mt-3 text-sm font-bold text-rose-700">
                  {caseToDelete?.caseId}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resolveModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Resolve Hazard Case
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Add Resolution Note</h3>
              </div>

              <button
                onClick={closeResolveModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-slate-700">You are resolving:</p>
                <p className="mt-2 text-sm font-bold text-emerald-700">
                  {caseToResolve?.caseId}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Resolution Note
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={5}
                  placeholder="Add a short note describing how this hazard was resolved..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeResolveModal}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {resolving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Resolve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}