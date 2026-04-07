import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, CheckCircle2, CheckCircle, Search } from "lucide-react";
import toast from "react-hot-toast";
import { listCaseRecords, deleteCaseRecord } from "../../../services/illegalCaseAPI";

function codeFromId(id = "") {
  const hex = id.slice(-6);
  return "IRR-" + parseInt(hex, 16).toString().slice(-6).padStart(6, "0");
}

export default function ResolvedIllegalCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCaseRecords({ status: "RESOLVED", limit: 100 });
      setCases(res.data?.items || []);
    } catch {
      toast.error("Failed to load resolved cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const filtered = cases.filter((c) => {
    const code = codeFromId(c._id).toLowerCase();
    return !searchTerm || code.includes(searchTerm.toLowerCase()) || c.title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (caseId) => {
    if (!window.confirm("Delete this resolved record permanently?")) return;
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
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-3">
            <CheckCircle className="w-3 h-3" /> Resolved Cases
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Resolved Illegal Cases</h1>
          <p className="text-slate-400 mt-1 text-sm">
            All illegal case review records that have been successfully resolved through investigation.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by code or title…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Stats */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Resolved</p>
          <p className="text-2xl font-black text-slate-900">{loading ? "—" : cases.length}</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-slate-100 animate-pulse h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-500">No resolved cases found</p>
          <p className="text-sm text-slate-400 mt-1">Cases will appear here once they are resolved through enforcement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const code = codeFromId(c._id);
            return (
              <div
                key={c._id}
                className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition"
              >
                {/* Tick */}
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-900 text-sm truncate">{c.title}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">
                      Resolved
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{code}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Resolved by investigation</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/dashboard/illegal-admin/cases/${c._id}`)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}