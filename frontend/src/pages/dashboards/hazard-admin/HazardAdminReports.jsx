import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Search,
  TriangleAlert,
  Leaf,
  Calendar,
  User,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  Clock3,
  XCircle,
  Plus,
  Loader2,
  X,
  CloudSun,
  FileText,
  Image as ImageIcon,
  FileArchive,
  FileVideo,
  ExternalLink,
  Waves,
  Thermometer,
  Wind,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";

import { SkeletonCard } from "../../../components/common/Skeleton";
import {
  getHazardReviewReports,
  getHazardReviewReportById,
  updateHazardReviewReportStatus,
  getWeatherByLocation,
} from "../../../services/hazardAdminAPI";

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_TABS = ["ALL", "PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"];

function reportCodeFromId(id = "") {
  const hex = id.slice(-6);
  const numeric = parseInt(hex || "0", 16).toString().slice(-6).padStart(6, "0");
  return `HZR-${numeric}`;
}

function typeStyle(type) {
  return {
    HAZARD: "bg-amber-50 text-amber-700 border-amber-200",
    ENVIRONMENTAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[type] || "bg-slate-50 text-slate-600 border-slate-200";
}

function statusStyle(status) {
  return {
    PENDING: "bg-slate-100 text-slate-700 border-slate-200",
    UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
    VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
    RESOLVED: "bg-purple-50 text-purple-700 border-purple-200",
  }[status] || "bg-slate-100 text-slate-600 border-slate-200";
}

function severityStyle(severity) {
  return {
    LOW: "bg-sky-50 text-sky-700 border-sky-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
  }[severity] || "bg-slate-50 text-slate-600 border-slate-200";
}

function countStatus(items = [], status) {
  return items.filter((item) => item.status === status).length;
}

function getLatLng(report) {
  const coords = report?.location?.coordinates;
  if (Array.isArray(coords) && coords.length === 2) {
    return { lat: coords[1], lng: coords[0] };
  }
  return null;
}

function normalizeType(type = "") {
  return String(type || "").toLowerCase().trim();
}

function normalizeUrl(url = "") {
  return String(url || "").toLowerCase().trim();
}

function isImageAttachment(type = "", url = "") {
  const t = normalizeType(type);
  const u = normalizeUrl(url);

  return (
    t === "image" ||
    t.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(u)
  );
}

function isPdfAttachment(type = "", url = "") {
  const t = normalizeType(type);
  const u = normalizeUrl(url);

  return t === "pdf" || t.includes("pdf") || /\.pdf$/i.test(u);
}

function isVideoAttachment(type = "", url = "") {
  const t = normalizeType(type);
  const u = normalizeUrl(url);

  return (
    t === "video" ||
    t.startsWith("video/") ||
    /\.(mp4|mov|avi|mkv|webm)$/i.test(u)
  );
}

function isDocAttachment(type = "", url = "") {
  const t = normalizeType(type);
  const u = normalizeUrl(url);

  return (
    t === "doc" ||
    t === "docx" ||
    t.includes("word") ||
    /\.(doc|docx)$/i.test(u)
  );
}

function fileIcon(type = "", url = "") {
  if (isImageAttachment(type, url)) return <ImageIcon className="w-5 h-5 text-blue-600" />;
  if (isVideoAttachment(type, url)) return <FileVideo className="w-5 h-5 text-violet-600" />;
  if (isPdfAttachment(type, url)) return <FileText className="w-5 h-5 text-red-600" />;
  if (isDocAttachment(type, url)) return <FileText className="w-5 h-5 text-sky-600" />;
  return <FileArchive className="w-5 h-5 text-slate-600" />;
}

function attachmentLabel(type = "", url = "", index = 0) {
  if (isImageAttachment(type, url)) return `Image Attachment ${index + 1}`;
  if (isVideoAttachment(type, url)) return `Video Attachment ${index + 1}`;
  if (isPdfAttachment(type, url)) return `PDF Attachment ${index + 1}`;
  if (isDocAttachment(type, url)) return `Document Attachment ${index + 1}`;
  return `Attachment ${index + 1}`;
}

function riskStyle(level = "") {
  const key = String(level || "").toUpperCase();
  return {
    LOW: "bg-emerald-50 border-emerald-100 text-emerald-700",
    MODERATE: "bg-amber-50 border-amber-100 text-amber-700",
    HIGH: "bg-rose-50 border-rose-100 text-rose-700",
  }[key] || "bg-slate-50 border-slate-200 text-slate-700";
}

const NAVY_BUTTON =
  "bg-[#1e3a8a] text-white hover:bg-[#1d4ed8] shadow-sm";
const NAVY_RING = "focus:ring-[#1e3a8a]";

export default function HazardAdminReports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm] = useState("");
  const [reportTypeFilter] = useState("ALL");

  const [selectedReport, setSelectedReport] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [statusDraft, setStatusDraft] = useState("PENDING");
  const [savingStatus, setSavingStatus] = useState(false);

  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHazardReviewReports({ limit: 100 });
      setReports(data?.items || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load hazard reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: countStatus(reports, "PENDING"),
      underReview: countStatus(reports, "UNDER_REVIEW"),
      verified: countStatus(reports, "VERIFIED"),
      rejected: countStatus(reports, "REJECTED"),
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesTab = activeTab === "ALL" || report.status === activeTab;
      const matchesType = reportTypeFilter === "ALL" || report.reportType === reportTypeFilter;

      const code = reportCodeFromId(report._id).toLowerCase();
      const title = report.title?.toLowerCase() || "";
      const address = report.location?.address?.toLowerCase() || "";
      const reporter = report.reportedBy?.name?.toLowerCase() || "";
      const term = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !term ||
        code.includes(term) ||
        title.includes(term) ||
        address.includes(term) ||
        reporter.includes(term);

      return matchesTab && matchesType && matchesSearch;
    });
  }, [reports, activeTab, reportTypeFilter, searchTerm]);

  const openViewModal = async (reportId) => {
    setShowViewModal(true);
    setViewLoading(true);
    setWeatherData(null);

    try {
      const data = await getHazardReviewReportById(reportId);
      setSelectedReport(data);
      setStatusDraft(data?.status || "PENDING");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load report details");
      setShowViewModal(false);
      setSelectedReport(null);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedReport(null);
    setStatusDraft("PENDING");
    setWeatherData(null);
  };

  const handleStatusUpdate = async () => {
    if (!selectedReport?._id) return;
    setSavingStatus(true);

    try {
      const updated = await updateHazardReviewReportStatus(selectedReport._id, {
        status: statusDraft,
      });

      setSelectedReport(updated);
      setReports((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));

      toast.success("Report status updated");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update report status");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCheckWeather = async () => {
    const latLng = getLatLng(selectedReport);

    if (!latLng) {
      toast.error("No valid location found for weather check");
      return;
    }

    setWeatherLoading(true);

    try {
      const data = await getWeatherByLocation({
        lat: latLng.lat,
        lng: latLng.lng,
      });

      setWeatherData(data);
      toast.success("Weather checked successfully");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch marine conditions");
    } finally {
      setWeatherLoading(false);
    }
  };

  const goToCreateCase = (report) => {
    navigate(`/dashboard/hazard-admin/reports/${report._id}/create-case`, {
      state: {
        report,
      },
    });
  };

  const selectedLatLng = getLatLng(selectedReport);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 p-8 rounded-3xl border border-slate-700 shadow-xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 text-[10px] font-bold uppercase tracking-[0.16em] mb-3">
            <ShieldAlert className="w-3 h-3" />
            Hazard Review Desk
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Hazard & Environmental Reports
          </h1>
          <p className="text-slate-200 mt-2 max-w-3xl">
            Review incoming marine hazard and environmental reports, verify incidents, and move approved reports into hazard operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {[
          {
            label: "Total Reports",
            value: stats.total,
            icon: <FileText className="w-5 h-5 text-blue-500" />,
            iconBox: "bg-blue-50",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: <Clock3 className="w-5 h-5 text-amber-500" />,
            iconBox: "bg-amber-50",
          },
          {
            label: "Under Review",
            value: stats.underReview,
            icon: <Search className="w-5 h-5 text-[#1e3a8a]" />,
            iconBox: "bg-blue-50",
          },
          {
            label: "Verified",
            value: stats.verified,
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
            iconBox: "bg-emerald-50",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: <XCircle className="w-5 h-5 text-rose-500" />,
            iconBox: "bg-rose-50",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {card.label}
              </p>
              <p className="text-3xl font-black text-slate-800">
                {card.value}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.iconBox}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl px-5 pt-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-6 border-b border-slate-200">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === "UNDER_REVIEW" ? "Under Review" : tab.replace("_", " ");

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-sm font-medium transition ${
                  isActive
                    ? "text-[#1e3a8a]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute left-0 bottom-0 h-0.5 w-full rounded-full bg-[#1e3a8a]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">{SkeletonCard({ count: 4 })}</div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <p className="text-lg font-bold text-slate-800">No reports found</p>
          <p className="text-sm text-slate-500 mt-2">
            Try changing the status tab.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const canCreate = report.status === "VERIFIED";

            return (
              <div
                key={report._id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${typeStyle(
                          report.reportType
                        )}`}
                      >
                        {report.reportType === "HAZARD" ? (
                          <TriangleAlert className="w-3 h-3" />
                        ) : (
                          <Leaf className="w-3 h-3" />
                        )}
                        {report.reportType}
                      </span>

                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold tracking-widest uppercase">
                        {reportCodeFromId(report._id)}
                      </span>

                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${severityStyle(
                          report.severity
                        )}`}
                      >
                        {report.severity}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {report.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {report.createdAt ? format(new Date(report.createdAt), "MMM d, yyyy") : "N/A"}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {report.reportedBy?.name || report.reportedBy?.email || "Unknown reporter"}
                      </span>

                      <span className="inline-flex items-center gap-2 truncate max-w-full">
                        <MapPin className="w-4 h-4" />
                        {report.location?.address || "Location unavailable"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end gap-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${statusStyle(
                        report.status
                      )}`}
                    >
                      {report.status === "UNDER_REVIEW" ? "UNDER REVIEW" : report.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openViewModal(report._id)}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                        title="View report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        disabled={!canCreate}
                        onClick={() => goToCreateCase(report)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                          canCreate
                            ? `${NAVY_BUTTON}`
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        Create Hazard Case
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showViewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center px-4 py-6">
          <div className="relative w-full max-w-7xl h-[86vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Hazard Report Review
                </p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  {selectedReport?.title || "Loading..."}
                </h2>
              </div>

              <button
                onClick={closeViewModal}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-[calc(86vh-82px)] overflow-y-auto p-6">
              {viewLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {SkeletonCard({ count: 4 })}
                </div>
              ) : selectedReport ? (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                  <div className="xl:col-span-3 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${typeStyle(
                            selectedReport.reportType
                          )}`}
                        >
                          {selectedReport.reportType === "HAZARD" ? (
                            <TriangleAlert className="w-3 h-3" />
                          ) : (
                            <Leaf className="w-3 h-3" />
                          )}
                          {selectedReport.reportType}
                        </span>

                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${severityStyle(
                            selectedReport.severity
                          )}`}
                        >
                          {selectedReport.severity}
                        </span>

                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${statusStyle(
                            selectedReport.status
                          )}`}
                        >
                          {selectedReport.status === "UNDER_REVIEW"
                            ? "UNDER REVIEW"
                            : selectedReport.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-4">Report Summary</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">
                            Code
                          </p>
                          <p className="text-slate-800 font-semibold">
                            {reportCodeFromId(selectedReport._id)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">
                            Created Date
                          </p>
                          <p className="text-slate-800 font-semibold">
                            {selectedReport.createdAt
                              ? format(new Date(selectedReport.createdAt), "MMM d, yyyy • hh:mm a")
                              : "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">
                            Reported By
                          </p>
                          <p className="text-slate-800 font-semibold">
                            {selectedReport.reportedBy?.name ||
                              selectedReport.reportedBy?.email ||
                              "Unknown"}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">
                            Address
                          </p>
                          <p className="text-slate-800 font-semibold">
                            {selectedReport.location?.address || "Address unavailable"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">
                          Description
                        </p>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {selectedReport.description || "No description available"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-slate-900">Location</h3>
                      </div>

                      {selectedLatLng ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200">
                          <div className="h-[320px]">
                            <MapContainer
                              center={[selectedLatLng.lat, selectedLatLng.lng]}
                              zoom={12}
                              scrollWheelZoom
                              className="w-full h-full"
                            >
                              <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker position={[selectedLatLng.lat, selectedLatLng.lng]}>
                                <Popup>
                                  {selectedReport.title}
                                  <br />
                                  {selectedReport.location?.address || "Hazard report location"}
                                </Popup>
                              </Marker>
                            </MapContainer>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                          <p className="font-bold text-slate-700">No valid coordinates available</p>
                          <p className="text-sm text-slate-500 mt-1">
                            This report does not contain a valid map location.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-slate-700" />
                        <h3 className="text-lg font-bold text-slate-900">Attachments</h3>
                      </div>

                      {selectedReport.attachments?.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedReport.attachments.map((attachment, index) => {
                            const url = attachment?.url || "";
                            const type = attachment?.type || "";

                            return (
                              <div
                                key={`${url}-${index}`}
                                className="border border-slate-200 rounded-2xl p-4 bg-slate-50"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                                    {fileIcon(type, url)}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-800 truncate">
                                      {attachmentLabel(type, url, index)}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 break-all">
                                      {type || "Unknown file type"}
                                    </p>

                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-2 hover:text-blue-700"
                                    >
                                      Open file
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>

                                {isImageAttachment(type, url) && (
                                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <img
                                      src={url}
                                      alt={`Attachment ${index + 1}`}
                                      className="w-full h-44 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  </div>
                                )}

                                {isVideoAttachment(type, url) && (
                                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <video controls className="w-full h-44 object-cover">
                                      <source src={url} />
                                    </video>
                                  </div>
                                )}

                                {isPdfAttachment(type, url) && (
                                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4">
                                    <p className="text-sm font-semibold text-slate-700">
                                      PDF preview is opened in a new tab.
                                    </p>
                                  </div>
                                )}

                                {isDocAttachment(type, url) && (
                                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4">
                                    <p className="text-sm font-semibold text-slate-700">
                                      Document file available to open in a new tab.
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                          <p className="font-bold text-slate-700">No attachments available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <CloudSun className="w-5 h-5 text-cyan-600" />
                        <h3 className="text-lg font-bold text-slate-900">Weather Verification</h3>
                      </div>

                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Check current marine conditions for this report location.
                        </p>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                          Risk level and advisory are calculated by the backend and returned directly from the weather-check endpoint.
                        </p>

                        <button
                          onClick={handleCheckWeather}
                          disabled={weatherLoading}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition disabled:opacity-60"
                        >
                          {weatherLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Checking Weather...
                            </>
                          ) : (
                            <>
                              <CloudSun className="w-4 h-4" />
                              Check Weather
                            </>
                          )}
                        </button>
                      </div>

                      {weatherData && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <Waves className="w-4 h-4" />
                                Wave Height
                              </p>
                              <p className="font-bold text-slate-900 mt-1">
                                {weatherData.waveHeight ?? "-"} m
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <Wind className="w-4 h-4" />
                                Wind Wave Height
                              </p>
                              <p className="font-bold text-slate-900 mt-1">
                                {weatherData.windWaveHeight ?? "-"} m
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <Thermometer className="w-4 h-4" />
                                Sea Temperature
                              </p>
                              <p className="font-bold text-slate-900 mt-1">
                                {weatherData.seaTemperature ?? "-"} °C
                              </p>
                            </div>
                          </div>

                          <div className={`rounded-xl p-3 border ${riskStyle(weatherData.riskLevel)}`}>
                            <p className="text-xs font-bold text-slate-400">Risk Level</p>
                            <p className="font-black text-lg">{weatherData.riskLevel || "-"}</p>
                          </div>

                          <div className="rounded-xl p-3 bg-blue-50 border border-blue-100">
                            <p className="text-xs font-bold text-slate-400">Advisory</p>
                            <p className="text-sm text-slate-700">
                              {weatherData.advisory || "No advisory available"}
                            </p>
                          </div>

                          <div className="text-xs text-slate-500 space-y-1">
                            <p>
                              Provider: {weatherData.provider || "-"}
                            </p>
                            <p>
                              Marine Timestamp: {weatherData.timestamp || "-"}
                            </p>
                            <p>
                              Fetched at:{" "}
                              {weatherData.fetchedAt
                                ? format(new Date(weatherData.fetchedAt), "MMM d, yyyy • hh:mm a")
                                : "-"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Update Report Status</h3>

                      <div className="space-y-4">
                        <select
                          value={statusDraft}
                          onChange={(e) => setStatusDraft(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 ${NAVY_RING}`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="VERIFIED">Verified</option>
                          <option value="REJECTED">Rejected</option>
                        </select>

                        <button
                          onClick={handleStatusUpdate}
                          disabled={savingStatus}
                          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60 ${NAVY_BUTTON}`}
                        >
                          {savingStatus ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Update Status"
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-3">Create Hazard Case</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Open a dedicated creation page to convert this verified report into a
                        hazard case for operational handling.
                      </p>

                      <button
                        onClick={() => goToCreateCase(selectedReport)}
                        disabled={selectedReport.status !== "VERIFIED"}
                        className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                          selectedReport.status === "VERIFIED"
                            ? `${NAVY_BUTTON}`
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        Create Hazard Case
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}