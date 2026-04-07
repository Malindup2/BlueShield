import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import axios from "axios";
import API_BASE_URL from "../../../config/api";

export default function FishermanHome() {
  const [reportCount, setReportCount] = useState(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_BASE_URL}/api/reports/my`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1, limit: 1 },
        });
        setReportCount(data.total);
      } catch {
        setReportCount(0);
      }
    };
    fetchCount();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">Welcome, Fisherman!</h2>
        <p className="text-slate-600 mt-2">
          This is your personal dashboard. From here, you can view the marine safety map, submit new incident reports, and track the status of your previous reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/dashboard/my-reports"
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">My Reports</p>
              <p className="text-2xl font-bold text-slate-800">
                {reportCount === null ? "..." : reportCount}
              </p>
            </div>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center text-slate-400">
          Stat Card Placeholder
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center text-slate-400">
          Stat Card Placeholder
        </div>
      </div>
    </div>
  );
}
