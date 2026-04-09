import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, Trash2, CheckCircle2, Plus, Search, X,
  MapPin, AlertTriangle, Paperclip, FileText
} from "lucide-react";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { format } from "date-fns";
import L from "leaflet";
import {
  getPendingReports, markReportAsReviewed, deleteReviewedCase
} from "../../../services/illegalCaseAPI";

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Generate a deterministic 6-digit code from MongoDB ObjectId
function codeFromId(id = "") {
  const hex = id.slice(-6);
  return "IR-" + parseInt(hex, 16).toString().slice(-6).padStart(6, "0");
}

function severityColor(severity) {
  return {
    LOW: "bg-green-100 text-green-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  }[severity] || "bg-slate-100 text-slate-600";
}

/**
 * FIX: More robust image detection.
 * Handles cases where Mongoose subdocument serialization may return
 * att.type as undefined even though it exists in the DB.
 * Falls back to URL-based detection and also checks common image hosting domains.
 */
function isImageAttachment(att) {
  if (!att) return false;
  const url = att.url || "";
  const mimeType = att.type || "";

  // Check MIME type first (most reliable)
  if (mimeType.startsWith("image/")) return true;

  // Check URL file extension
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url)) return true;

  // Check known image hosting domains (picsum, unsplash, imgur, cloudinary)
  if (
    url.includes("picsum.photos") ||
    url.includes("images.unsplash.com") ||
    url.includes("imgur.com") ||
    url.includes("res.cloudinary.com") ||
    url.includes("cloudinary.com")
  ) {
    return true;
  }

  return false;
}

export default function IllegalReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewReport, setViewReport] = useState(null);

  /**
   * FIX: Track report IDs that have been deleted by the user this session.
   
   */
  const [deletedReportIds, setDeletedReportIds] = useState(new Set());

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPendingReports();
      setReports(res.data || []);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const pendingReports = reports.filter(
    (r) => r.status === "PENDING" && !r.illegalCase?.isReviewed
  );

  // Exclude any reportId that was successfully deleted this session
  const reviewedReports = reports.filter(
    (r) =>
      !deletedReportIds.has(r._id) &&
      (r.status === "REJECTED" || r.status === "RESOLVED" || r.illegalCase?.isReviewed)
  );

  const filteredPending = pendingReports.filter((r) => {
    const code = codeFromId(r._id).toLowerCase();
    return (
      !searchTerm ||
      code.includes(searchTerm.toLowerCase()) ||
      r.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleMarkReviewed = async (reportId) => {
    try {
      await markReportAsReviewed(reportId);
      toast.success("Report marked as reviewed");
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as reviewed");
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Remove this case from your dashboard?")) return;
    try {
      await deleteReviewedCase(reportId);
      //  Record the deleted ID so the card is excluded from reviewedReports
      setDeletedReportIds((prev) => new Set([...prev, reportId]));
      toast.success("Case removed");
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleCreateCaseRecord = (reportId) => {
    navigate(`/dashboard/illegal-admin/cases/new/${reportId}`);
  };

  function getLatLng(report) {
    const coords = report.location?.coordinates;
    if (coords && coords.length === 2) return { lat: coords[1], lng: coords[0] };
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-400/30 bg-red-500/10 text-red-300 text-[10px] font-black uppercase tracking-widest mb-3">
            <AlertTriangle className="w-3 h-3" /> Illegal Fishing Reports
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Illegal Reports</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Review and manage fisherman-reported illegal fishing incidents awaiting verification.
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

      {/* Pending cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-100 animate-pulse rounded-2xl h-52" />
          ))}
        </div>
      ) : filteredPending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-500">No pending illegal fishing reports</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredPending.map((report) => {
            const code = codeFromId(report._id);
            const hasCase = !!report.illegalCase;
            return (
              <div key={report._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col gap-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest">
                      Illegal
                    </span>
                    {/* STYLE: unique code in green rounded label */}
                    <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-black tracking-wider border border-green-200">
                      {code}
                    </span>
                  </div>
                  {/* STYLE: eye icon with dark blue border */}
                  <button
                    onClick={() => setViewReport(report)}
                    className="p-1.5 rounded-lg border border-blue-800 text-blue-800 hover:bg-blue-50 transition"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <p className="font-black text-slate-900 text-sm leading-snug line-clamp-2">{report.title}</p>

                {/* Severity */}
                <span className={`self-start px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${severityColor(report.severity)}`}>
                  {report.severity}
                </span>

                {/* Action buttons */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
                  {/* STYLE: dark grey border on mark as reviewed */}
                  <button
                    onClick={() => handleMarkReviewed(report._id)}
                    className="flex-1 py-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-400"
                  >
                    Mark as Reviewed
                  </button>
                  {/* STYLE: navy blue background for create case record */}
                  <button
                    onClick={() => handleCreateCaseRecord(report._id)}
                    disabled={hasCase}
                    title={hasCase ? "Case record already exists" : "Create case record"}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                      hasCase
                        ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    {hasCase ? "Record Exists" : "Create Case Record"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reviewed / Rejected section */}
      {reviewedReports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
            Reviewed / Rejected Cases
          </h3>
          {reviewedReports.map((report) => {
            const code = codeFromId(report._id);
            const isResolved = report.status === "RESOLVED" || report.illegalCase?.status === "RESOLVED";
            return (
              <div
                key={report._id}
                className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isResolved ? "bg-emerald-100" : "bg-slate-100"}`}>
                  <CheckCircle2 className={`w-5 h-5 ${isResolved ? "text-emerald-600" : "text-slate-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-900 text-sm truncate">{report.title}</p>
                    {/* STYLE: rejected — white bg, red border; resolved — emerald */}
                    {isResolved ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-300">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white text-red-600 border border-red-500">
                        Rejected
                      </span>
                    )}
                    {/* STYLE: unique code in green rounded label */}
                    <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-black tracking-wider border border-green-200">
                      {code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isResolved
                      ? "Resolved by investigation"
                      : `Closed by admin: ${format(new Date(report.updatedAt || Date.now()), "MMM dd, yyyy")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* STYLE: eye icon with dark blue border */}
                  <button
                    onClick={() => setViewReport(report)}
                    className="p-2 rounded-lg border border-blue-800 text-blue-800 hover:bg-blue-50 transition"
                    title="View report"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {/* STYLE: delete icon with red border */}
                  <button
                    onClick={() => handleDelete(report._id)}
                    className="p-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-50 transition"
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

      {/* View Report Detail Modal */}
      {viewReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewReport(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Details</p>
                <h3 className="font-black text-slate-900 text-lg mt-0.5">{viewReport.title}</h3>
              </div>
              <button onClick={() => setViewReport(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Basic info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Report Type</p>
                  <p className="text-sm font-bold text-slate-900">{viewReport.reportType?.replace("_", " ")}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Severity</p>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase ${severityColor(viewReport.severity)}`}>
                    {viewReport.severity}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                  <p className="text-sm text-slate-700">{viewReport.description}</p>
                </div>
              </div>

              {/* Map */}
              {(() => {
                const pos = getLatLng(viewReport);
                return pos ? (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </p>
                    {viewReport.location?.address && (
                      <p className="text-xs text-slate-500 mb-2">{viewReport.location.address}</p>
                    )}
                    <div className="h-52 rounded-xl overflow-hidden border border-slate-200">
                      <MapContainer center={[pos.lat, pos.lng]} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[pos.lat, pos.lng]}>
                          <Popup>{viewReport.title}</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Attachments */}
              {viewReport.attachments?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Paperclip className="w-3 h-3" /> Attachments ({viewReport.attachments.length})
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {viewReport.attachments.map((att, idx) => {
                      const url = att?.url || att || "";
                      const attObj = typeof att === "string" ? { url: att } : att;
                      const showAsImage = isImageAttachment(attObj);

                      return showAsImage ? (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`attachment-${idx + 1}`}
                            className="w-full h-24 object-cover rounded-xl border border-slate-200 hover:opacity-80 transition"
                            onError={(e) => {
                              e.target.parentElement.innerHTML = `
                                <div class="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs font-bold text-slate-500 h-24">
                                  <span>Image unavailable</span>
                                </div>`;
                            }}
                          />
                        </a>
                      ) : (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs font-bold text-blue-700 hover:bg-blue-50 transition h-24"
                        >
                          <Paperclip className="w-4 h-4 flex-shrink-0" />
                          File {idx + 1}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}