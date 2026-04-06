import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, Pencil, Trash2, Search, Filter, Briefcase,
  Calendar, ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { listCaseRecords, deleteCaseRecord } from "../../../services/illegalCaseAPI";

function codeFromId(id = "") {
  const hex = id.slice(-6);
  return "IRR-" + parseInt(hex, 16).toString().slice(-6).padStart(6, "0");
}

function statusStyle(status) {
  return {
    OPEN: "bg-blue-100 text-blue-700",
    ESCALATED: "bg-amber-100 text-amber-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
  }[status] || "bg-slate-100 text-slate-600";
}

export default function IllegalCaseRecords() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCaseRecords({ limit: 100 });
      setCases(res.data?.items || []);
    } catch {
      toast.error("Failed to load case records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const filtered = cases.filter((c) => {
    const code = codeFromId(c._id).toLowerCase();
    const matchSearch = !searchTerm ||
      code.includes(searchTerm.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (caseId, status) => {
    if (status === "ESCALATED") {
      toast.error("Cannot delete a record while it is escalated");
      return;
    }
    if (!window.confirm("Delete this case record permanently?")) return;
    try {
      await deleteCaseRecord(caseId);
      toast.success("Record deleted");
      fetchCases();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-3">
            <Briefcase className="w-3 h-3" /> Case Management
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Illegal Case Review Records</h1>
          <p className="text-slate-400 mt-1 text-sm">
            All illegal case review records created from fisherman reports.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code or title…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {["ALL", "OPEN", "ESCALATED", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === s
                  ? "bg-[#0f172a] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Case list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="bg-slate-100 animate-pulse h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-500">No case records found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const code = codeFromId(c._id);
            const canUpdate = c.status === "OPEN";
            const canDelete = c.status !== "ESCALATED";
            return (
              <div
                key={c._id}
                className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition"
              >
                {/* Left icon */}
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-blue-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{code}</p>
                  <p className="font-black text-[#1e3a5f] text-sm mt-0.5 truncate">{c.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">
                      {format(new Date(c.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex-shrink-0 ${statusStyle(c.status)}`}>
                  {c.status.toLowerCase()}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Eye always visible */}
                  <button
                    onClick={() => navigate(`/dashboard/illegal-admin/cases/${c._id}`)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Edit — only OPEN */}
                  {canUpdate && (
                    <button
                      onClick={() => navigate(`/dashboard/illegal-admin/cases/edit/${c._id}`)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                      title="Update record"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete — OPEN or RESOLVED (not ESCALATED) */}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(c._id, c.status)}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}