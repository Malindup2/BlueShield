import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Ship, Radar, ArrowLeft, Calendar,
  Hash, MapPin, Plus, ChevronDown, UserCheck,
  CheckCircle, Loader2, Globe, AlertTriangle, Download
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getCaseRecordById,
  trackVessel,
  addNote,
  escalateCase,
  getOfficers,
} from "../../../services/illegalCaseAPI";
import { useTranslation, LANGUAGES } from "../../../hooks/useTranslation";

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function severityStyle(s) {
  return ({
    LOW: "bg-green-100 text-green-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  }[s] || "bg-slate-100 text-slate-600");
}

function riskColor(risk) {
  return ({
    low: "text-green-400",
    medium: "text-amber-400",
    high: "text-orange-400",
    critical: "text-red-400",
  }[risk?.toLowerCase()] || "text-slate-400");
}

// ── PDF Generation ──────────────────────────────────────────────────────────
function generatePDF(caseData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 38, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("BlueShield", margin, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Maritime Law Enforcement Platform", margin, 23);

  doc.setFillColor(59, 130, 246);
  doc.roundedRect(pageW - margin - 52, 10, 52, 14, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("ILLEGAL CASE REVIEW", pageW - margin - 26, 18.5, { align: "center" });

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(0, 38, pageW, 38);

  let y = 50;

  // Document title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text("Case Review Report", margin, y);

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(pageW - margin - 65, y - 8, 65, 12, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(29, 78, 216);
  doc.text(caseData.caseNumber || "N/A", pageW - margin - 32.5, y - 1, { align: "center" });

  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Meta row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const dateStr = caseData.createdAt ? format(new Date(caseData.createdAt), "MMMM dd, yyyy") : "N/A";
  doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy  HH:mm")}`, margin, y);
  doc.text(`Record Date: ${dateStr}`, pageW / 2, y, { align: "center" });

  const sevColors = { LOW: [34, 197, 94], MEDIUM: [234, 179, 8], HIGH: [249, 115, 22], CRITICAL: [239, 68, 68] };
  const sevRgb = sevColors[caseData.severity] || [100, 116, 139];
  doc.setFillColor(...sevRgb);
  doc.roundedRect(pageW - margin - 30, y - 5, 30, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(caseData.severity || "", pageW - margin - 15, y - 0.5, { align: "center" });

  y += 12;

  // Section 1 heading
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentW, 8, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentW, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("SECTION 1 — CASE OVERVIEW", margin + 4, y + 5.5);
  y += 14;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("CASE TITLE", margin, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(caseData.title || "N/A", contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 6;

  // Vessel ID + Type table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Vessel ID", "Vessel Type"]],
    body: [[caseData.vesselId || "N/A", caseData.vesselType || "N/A"]],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    columnStyles: { 0: { fontStyle: "bold", textColor: [29, 78, 216] } },
    theme: "grid",
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.3,
  });
  y = doc.lastAutoTable.finalY + 8;

  // Description
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("DESCRIPTION", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(caseData.description || "N/A", contentW);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 10;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Section 2 heading
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("SECTION 2 — VESSEL TRACKING STATISTICS", margin + 4, y + 5.5);
  y += 14;

  const vessel = caseData.trackedVesselData;
  if (!vessel) {
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(margin, y, contentW, 14, 2, 2, "F");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(194, 65, 12);
    doc.text("Vessel data has not been tracked for this case yet.", margin + 4, y + 8.5);
    y += 22;
  } else {
    const riskRgb = { low: [34, 197, 94], medium: [234, 179, 8], high: [249, 115, 22], critical: [239, 68, 68] }[vessel.riskCategory?.toLowerCase()] || [100, 116, 139];

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Field", "Value"]],
      body: [
        ["IMO Number", vessel.imo || "N/A"],
        ["Vessel Type", vessel.vesselType || "N/A"],
        ["Registered Owner", vessel.registeredOwner || "N/A"],
        ["Risk Category", vessel.riskCategory?.toUpperCase() || "N/A"],
        ["Previous Violations", String(vessel.previousViolations ?? "N/A")],
      ],
      headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      bodyStyles: { fontSize: 9.5, textColor: [30, 41, 59] },
      columnStyles: { 0: { fontStyle: "bold", textColor: [71, 85, 105], cellWidth: 55 }, 1: { textColor: [15, 23, 42] } },
      didParseCell: (data) => {
        if (data.row.index === 3 && data.column.index === 1) { data.cell.styles.textColor = riskRgb; data.cell.styles.fontStyle = "bold"; }
        if (data.row.index === 4 && data.column.index === 1 && parseInt(vessel.previousViolations) > 0) { data.cell.styles.textColor = [239, 68, 68]; data.cell.styles.fontStyle = "bold"; }
      },
      theme: "striped",
      alternateRowStyles: { fillColor: [248, 250, 252] },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.3,
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("BlueShield — Maritime Law Enforcement Platform", margin, footerY);
  doc.text(`Case: ${caseData.caseNumber || "N/A"}  |  Status: ${caseData.status}  |  Confidential`, pageW - margin, footerY, { align: "right" });

  const filename = `BlueShield_Case_${(caseData.caseNumber || "report").replace(/[^a-z0-9]/gi, "_")}.pdf`;
  doc.save(filename);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function IllegalCaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [escalating, setEscalating] = useState(false);

  const fetchCase = useCallback(async () => {
    try {
      const [caseRes, officersRes] = await Promise.all([
        getCaseRecordById(caseId),
        getOfficers(),
      ]);
      setCaseData(caseRes.data);
      setOfficers(officersRes.data || []);
    } catch {
      toast.error("Failed to load case details");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetchCase(); }, [fetchCase]);

  const isFinalized = caseData?.status === "ESCALATED" || caseData?.status === "RESOLVED";
  const canDownloadPDF = !!caseData?.trackButtonUsed;

  /**
   * Read vessel directly from caseData — this is always the latest value
   * from fetchCase() and is used in both the textMap (for translation) and
   * directly in the JSX (for guaranteed display even before translation resolves).
   */
  const vessel = caseData?.trackedVesselData;

  /**
   * textMap contains ALL strings that go through the translation system.
   * Vessel data values ARE included here so they get translated when a
   * non-English language is active.
   *
   * They are ALSO read directly from `vessel` in the JSX (see vesselRows below)
   * as a fallback to ensure data always shows even if translation is in-flight.
   */
  const textMap = useMemo(() => {
    if (!caseData) return {};
    return {
      pageTitle: "Illegal Case Review Details",
      pageSubtitle: "Full details for this case review record",
      pageBadge: "Case Intelligence",
      sectionOverview: "Case Overview",
      labelTitle: "Title",
      labelVesselId: "Vessel ID",
      labelDescription: "Description",
      labelVesselType: "Vessel Type",
      labelDateCreated: "Date Created",
      severityValue: `${caseData.severity} Severity`,
      titleValue: caseData.title || "",
      descriptionValue: caseData.description || "",
      vesselTypeValue: caseData.vesselType || "",
      vesselIdValue: caseData.vesselId || "",
      dateValue: caseData.createdAt ? format(new Date(caseData.createdAt), "MMM dd, yyyy") : "",
      sectionVesselTracking: "Vessel Tracking Statistics",
      trackPrompt: "Track and fetch vessel info",
      trackBtn: caseData.trackButtonUsed ? "Already Tracked" : "Track Vessel",
      vesselDataLocked: "Vessel data locked",
      labelImo: "IMO Number",
      labelVesselTypeData: "Vessel Type",
      labelOwner: "Registered Owner",
      labelRiskCategory: "Risk Category",
      labelViolations: "Previous Violations",
      // Vessel data values — populated once tracking is done
      imoValue: vessel?.imo || "",
      vesselTypeDataValue: vessel?.vesselType || "",
      ownerValue: vessel?.registeredOwner || "",
      riskCategoryValue: vessel?.riskCategory?.toUpperCase() || "",
      violationsValue: vessel?.previousViolations !== undefined ? String(vessel.previousViolations) : "",
      sectionNotes: "Operational Notes",
      notePlaceholder: "Add a note…",
      addNoteBtn: "Add",
      referenceNotes: "Reference Notes",
      assignOfficerLabel: "Assign Officer",
      selectOfficerPlaceholder: "Select an officer…",
      escalateBtn: "Escalate",
      assignedOfficerLabel: "Assigned Officer",
      assignedOfficerName: caseData.assignedOfficer?.name || "",
      assignedOfficerEmail: caseData.assignedOfficer?.email || "",
      sectionLocation: "View Location",
      noLocation: "No location data available",
      noLocationSub: "This report did not include a location",
      downloadPdf: "Download PDF",
      pdfDisabledHint: "Track vessel first to enable PDF",
      ...(caseData.reviewNotes || []).reduce((acc, note, i) => {
        acc[`note_${i}`] = note.content;
        return acc;
      }, {}),
    };
  }, [caseData, vessel]);

  const { language, setLanguage, t, translating } = useTranslation(textMap);

  const handleTrack = async () => {
    setTracking(true);
    try {
      await trackVessel(caseId);
      toast.success("Vessel data fetched successfully");
      await fetchCase();
    } catch (err) {
      toast.error(err.response?.data?.message || "Tracking failed");
    } finally {
      setTracking(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) { toast.error("Note cannot be empty"); return; }
    setAddingNote(true);
    try {
      await addNote(caseId, noteText.trim());
      setNoteText("");
      toast.success("Note added");
      await fetchCase();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleEscalate = async () => {
    if (!caseData?.trackButtonUsed) { toast.error("Please track the vessel data before escalating"); return; }
    if (!selectedOfficerId) { toast.error("Please assign an officer to escalate the case further"); return; }
    setEscalating(true);
    try {
      await escalateCase(caseId, selectedOfficerId);
      toast.success("Case escalated successfully");
      await fetchCase();
    } catch (err) {
      toast.error(err.response?.data?.message || "Escalation failed");
    } finally {
      setEscalating(false);
    }
  };

  const getLatLng = () => {
    const coords = caseData?.baseReport?.location?.coordinates;
    if (coords?.length === 2) return { lat: coords[1], lng: coords[0] };
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }
  if (!caseData) return null;

  const pos = getLatLng();

  /**
   * VESSEL DISPLAY FIX:
   * Each row has:
   *   labelKey  — translated label via t() (e.g. "IMO Number" → translated)
   *   valueKey  — key in textMap/translations (used by t() for translated value)
   *   directVal — direct read from vessel object (always current, never stale)
   *
   * We display: t(valueKey) if it returns a non-empty string, else directVal.
   * This means:
   *   - In English: t() returns textMap[valueKey] = vessel.imo etc. ✓
   *   - In non-English after translation: t() returns translated string ✓
   *   - In non-English while translation is in-flight: directVal shows raw data ✓
   *   - After tracking while non-English active: directVal shows immediately,
   *     then auto-retranslate (from useTranslation fix) replaces with translated ✓
   */
  const vesselRows = vessel
    ? [
        { labelKey: "labelImo",           valueKey: "imoValue",           directVal: vessel.imo ?? "—",                          colored: false },
        { labelKey: "labelVesselTypeData", valueKey: "vesselTypeDataValue", directVal: vessel.vesselType ?? "—",                  colored: false },
        { labelKey: "labelOwner",          valueKey: "ownerValue",          directVal: vessel.registeredOwner ?? "—",             colored: false },
        { labelKey: "labelRiskCategory",   valueKey: "riskCategoryValue",   directVal: vessel.riskCategory?.toUpperCase() ?? "—", colored: true  },
        { labelKey: "labelViolations",     valueKey: "violationsValue",     directVal: String(vessel.previousViolations ?? "—"),  colored: false },
      ]
    : [];

  return (
    <div className="space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate("/dashboard/illegal-admin/cases")}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Case Records
      </button>

      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-3">
              <AlertTriangle className="w-3 h-3" /> {t("pageBadge")}
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight">{t("pageTitle")}</h1>
            <p className="text-slate-400 mt-1 text-sm">{t("pageSubtitle")}</p>
          </div>

          {/* Language Selector */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 backdrop-blur-sm">
              <Globe className="w-4 h-4 text-blue-300 flex-shrink-0" />
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={translating}
                  className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer appearance-none pr-5 disabled:opacity-60"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1 w-3 h-3 text-white/60 pointer-events-none" />
              </div>
              {translating && <Loader2 className="w-3.5 h-3.5 text-blue-300 animate-spin flex-shrink-0" />}
            </div>
            {language !== "en" && (
              <span className="text-[10px] text-blue-300/70 font-bold">
                {LANGUAGES.find((l) => l.code === language)?.label} — Azure AI
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Download PDF button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (!canDownloadPDF) {
              toast.error("Please track vessel data first to enable PDF download");
              return;
            }
            generatePDF(caseData);
            toast.success("PDF downloaded successfully");
          }}
          title={canDownloadPDF ? "Download case report as PDF" : t("pdfDisabledHint")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm ${
            canDownloadPDF
              ? "bg-[#0f172a] hover:bg-slate-700 text-white"
              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
          }`}
        >
          <Download className="w-4 h-4" />
          {t("downloadPdf")}
          {!canDownloadPDF && (
            <span className="ml-1 text-[10px] font-black uppercase tracking-wider opacity-70">(Track first)</span>
          )}
        </button>
      </div>

      {/* Top row: Section 1 + Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* SECTION 1 — Case Overview */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-black text-slate-900">{t("sectionOverview")}</h2>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex-shrink-0 ${severityStyle(caseData.severity)}`}>
              {t("severityValue")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("labelTitle")}</p>
              <p className="font-black text-slate-900 text-sm leading-snug">{t("titleValue")}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3" /> {t("labelVesselId")}
              </p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-black text-sm border border-blue-100">
                {t("vesselIdValue")}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("labelDescription")}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{t("descriptionValue")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("labelVesselType")}</p>
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-900">{t("vesselTypeValue")}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {t("labelDateCreated")}
              </p>
              <p className="text-sm font-bold text-slate-900">{t("dateValue")}</p>
            </div>
          </div>
        </div>

        {/* SECTION 2 — Vessel Tracking
         *
         * DISPLAY FIX: Value cells use a helper that prefers t(valueKey) when
         * it returns a non-empty string, and falls back to directVal otherwise.
         * This guarantees data always shows — even while translation is loading
         * or when the translation cache was cleared after vessel data arrived.
         */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d2137 100%)" }}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Radar className="w-5 h-5 text-blue-300" />
              <h2 className="text-base font-black text-white text-center">{t("sectionVesselTracking")}</h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              {vessel ? (
                <div className="w-full space-y-3">
                  {vesselRows.map((item) => {
                    // Prefer translated value; fall back to raw vessel data
                    const displayValue = t(item.valueKey) || item.directVal;
                    return (
                      <div key={item.labelKey} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
                        <span className="text-xs font-bold text-slate-300">{t(item.labelKey)}</span>
                        <span className={`text-xs font-black ${item.colored ? riskColor(vessel?.riskCategory) : "text-white"}`}>
                          {displayValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Radar className="w-8 h-8 text-white/60" />
                  </div>
                  <p className="text-blue-300 text-sm font-bold italic">{t("trackPrompt")}</p>
                </div>
              )}
            </div>

            <div className="mt-5">
              {isFinalized && vessel ? (
                <div className="text-center text-xs text-slate-400 font-bold">{t("vesselDataLocked")}</div>
              ) : (
                <button
                  onClick={handleTrack}
                  disabled={tracking || caseData.trackButtonUsed}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition border ${
                    caseData.trackButtonUsed
                      ? "bg-white/10 text-slate-400 border-white/10 cursor-not-allowed"
                      : "bg-white text-[#0f172a] border-white hover:bg-blue-50"
                  }`}
                >
                  {tracking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
                  {t("trackBtn")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Section 3 + Section 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* SECTION 3 — Operational Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-black text-slate-900">{t("sectionNotes")}</h2>

          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t("notePlaceholder")}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleAddNote}
              disabled={addingNote || !noteText.trim()}
              className="px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
            >
              {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t("addNoteBtn")}
            </button>
          </div>

          {caseData.reviewNotes?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{t("referenceNotes")}</p>
              <ul className="space-y-2">
                {caseData.reviewNotes.map((note, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-black text-slate-400 mr-2">
                        {format(new Date(note.addedAt), "MMM dd, yyyy")}
                      </span>
                      <span className="text-slate-700">{t(`note_${i}`)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isFinalized && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-sm font-bold text-slate-700">{t("assignOfficerLabel")}</label>
              <div className="relative">
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">{t("selectOfficerPlaceholder")}</option>
                  {officers.map((o) => (
                    <option key={o._id} value={o._id}>{o.name} — {o.email}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {selectedOfficerId && (
                <button
                  onClick={handleEscalate}
                  disabled={escalating}
                  className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  {escalating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  {t("escalateBtn")}
                </button>
              )}
            </div>
          )}

          {isFinalized && caseData.assignedOfficer && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t("assignedOfficerLabel")}</p>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                  {caseData.assignedOfficer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">{t("assignedOfficerName")}</p>
                  <p className="text-xs text-slate-400">{t("assignedOfficerEmail")}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-600 ml-auto" />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4 — Location Map */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-black text-slate-900">{t("sectionLocation")}</h2>
          </div>
          {pos ? (
            <>
              {caseData.baseReport?.location?.address && (
                <p className="text-xs text-slate-400">{caseData.baseReport.location.address}</p>
              )}
              <div className="h-64 rounded-xl overflow-hidden border border-slate-200">
                <MapContainer center={[pos.lat, pos.lng]} zoom={9} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[pos.lat, pos.lng]}>
                    <Popup>
                      <span className="font-bold">{caseData.baseReport?.title || "Incident Location"}</span>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </>
          ) : (
            <div className="h-64 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <MapPin className="w-8 h-8 mb-2" />
              <p className="text-sm font-bold">{t("noLocation")}</p>
              <p className="text-xs mt-1">{t("noLocationSub")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}