import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Ship, Radar, ArrowLeft, Calendar, AlertTriangle,
  Hash, MapPin, StickyNote, Plus, ChevronDown, UserCheck,
  CheckCircle, Loader2, Anchor
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  getCaseRecordById, trackVessel, addNote, escalateCase, getOfficers
} from "../../../services/illegalCaseAPI";

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function severityStyle(s) {
  return {
    LOW: "bg-green-100 text-green-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  }[s] || "bg-slate-100 text-slate-600";
}

function riskColor(risk) {
  return {
    low: "text-green-400",
    medium: "text-amber-400",
    high: "text-orange-400",
    critical: "text-red-400",
  }[risk?.toLowerCase()] || "text-slate-400";
}

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

  const handleTrack = async () => {
    setTracking(true);
    try {
      await trackVessel(caseId);
      toast.success("Vessel data fetched successfully");
      fetchCase();
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
      fetchCase();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleEscalate = async () => {
    if (!caseData?.trackButtonUsed) {
      toast.error("Please track the vessel data before escalating");
      return;
    }
    if (!selectedOfficerId) {
      toast.error("Please assign an officer to escalate the case further");
      return;
    }
    setEscalating(true);
    try {
      await escalateCase(caseId, selectedOfficerId);
      toast.success("Case escalated successfully");
      fetchCase();
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
  const vessel = caseData.trackedVesselData;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/dashboard/illegal-admin/cases")}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Case Records
      </button>

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Illegal Case Review Details</h1>
        <p className="text-slate-400 text-sm mt-0.5">Full details for this case review record</p>
      </div>

      {/* Top row: Section 1 (Case Overview) + Section 2 (Vessel Tracking) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── SECTION 1: Case Overview ──────────────────────────── */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-black text-slate-900">Case Overview</h2>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex-shrink-0 ${severityStyle(caseData.severity)}`}>
              {caseData.severity} Severity
            </span>
          </div>

          {/* Title + Vessel ID row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Title</p>
              <p className="font-black text-slate-900 text-sm leading-snug">{caseData.title}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Vessel ID
              </p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-black text-sm border border-blue-100">
                {caseData.vesselId}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed">{caseData.description}</p>
          </div>

          {/* Vessel Type + Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vessel Type</p>
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-900">{caseData.vesselType}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date Created
              </p>
              <p className="text-sm font-bold text-slate-900">
                {format(new Date(caseData.createdAt), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Vessel Tracking ──────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d2137 100%)" }}>
          <div className="p-6 h-full flex flex-col">
            {/* Section title */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Radar className="w-5 h-5 text-blue-300" />
              <h2 className="text-base font-black text-white text-center">Vessel Tracking Statistics</h2>
            </div>

            {/* Content area */}
            <div className="flex-1 flex flex-col items-center justify-center">
              {vessel ? (
                /* Vessel data display */
                <div className="w-full space-y-3">
                  {[
                    { label: "IMO Number", value: vessel.imo },
                    { label: "Vessel Type", value: vessel.vesselType },
                    { label: "Registered Owner", value: vessel.registeredOwner },
                    {
                      label: "Risk Category",
                      value: vessel.riskCategory?.toUpperCase(),
                      extra: riskColor(vessel.riskCategory),
                    },
                    { label: "Previous Violations", value: vessel.previousViolations?.toString() },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
                      <span className="text-xs font-bold text-slate-300">{item.label}</span>
                      <span className={`text-xs font-black ${item.extra || "text-white"}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Pre-track state */
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Radar className="w-8 h-8 text-white/60" />
                  </div>
                  <p className="text-blue-300 text-sm font-bold italic">Track and fetch vessel info</p>
                </div>
              )}
            </div>

            {/* Track button */}
            <div className="mt-5">
              {isFinalized && vessel ? (
                <div className="text-center text-xs text-slate-400 font-bold">Vessel data locked</div>
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
                  {caseData.trackButtonUsed ? "Already Tracked" : "Track Vessel"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Section 3 (Notes) + Section 4 (Location Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── SECTION 3: Operational Notes ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-black text-slate-900">Operational Notes</h2>

          {/* Add note input */}
          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleAddNote}
              disabled={addingNote || !noteText.trim()}
              className="px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
            >
              {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>

          {/* Reference notes list */}
          {caseData.reviewNotes?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Reference Notes</p>
              <ul className="space-y-2">
                {caseData.reviewNotes.map((note, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-black text-slate-400 mr-2">
                        {format(new Date(note.addedAt), "MMM dd, yyyy")}
                      </span>
                      <span className="text-slate-700">{note.content}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Assign Officer + Escalate — only show when OPEN */}
          {!isFinalized && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-sm font-bold text-slate-700">
                Assign Officer
              </label>
              <div className="relative">
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">Select an officer…</option>
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
                  Escalate
                </button>
              )}
            </div>
          )}

          {/* Show assigned officer when finalized */}
          {isFinalized && caseData.assignedOfficer && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Officer</p>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                  {caseData.assignedOfficer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">{caseData.assignedOfficer.name}</p>
                  <p className="text-xs text-slate-400">{caseData.assignedOfficer.email}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-600 ml-auto" />
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 4: Location Map ──────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-black text-slate-900">View Location</h2>
          </div>
          {pos ? (
            <>
              {caseData.baseReport?.location?.address && (
                <p className="text-xs text-slate-400">{caseData.baseReport.location.address}</p>
              )}
              <div className="h-64 rounded-xl overflow-hidden border border-slate-200">
                <MapContainer
                  center={[pos.lat, pos.lng]}
                  zoom={9}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                >
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
              <p className="text-sm font-bold">No location data available</p>
              <p className="text-xs mt-1">This report did not include a location</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}