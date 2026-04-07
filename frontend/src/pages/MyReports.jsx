import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Clock, ChevronRight } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  RESOLVED: "bg-slate-100 text-slate-800",
};

const SEVERITY_COLORS = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [page]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE_URL}/api/reports/my`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 10 },
      });
      setReports(data.reports);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error("Failed to load your reports");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">My Reports</h2>
        <Link
          to="/dashboard/report"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + New Report
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-700">No reports yet</h3>
          <p className="mt-1 text-slate-500">
            Submit your first report to help keep our waters safe.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-800 truncate">
                    {report.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {report.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[report.status] || "bg-slate-100 text-slate-600"}`}
                    >
                      {report.status?.replace("_", " ")}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[report.severity] || "bg-slate-100 text-slate-600"}`}
                    >
                      {report.severity}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(report.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
