import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ShieldAlert,
  TriangleAlert,
  Leaf,
  MapPin,
  CloudSun,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Waves,
  Wind,
  Thermometer,
  BadgeAlert,
  CircleOff,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, Circle } from "react-leaflet";
import L from "leaflet";
import toast from "react-hot-toast";

import {
  getHazardCaseById,
  getHazardWeatherSnapshot,
  createZone,
  getZones,
} from "../../../services/hazardAdminAPI";

// leaflet marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function handlingStatusStyle(status) {
  return {
    OPEN: "bg-blue-50 text-blue-700 border-blue-200",
    MONITORING: "bg-cyan-50 text-cyan-700 border-cyan-200",
    MITIGATION_PLANNED: "bg-amber-50 text-amber-700 border-amber-200",
    MITIGATION_IN_PROGRESS: "bg-orange-50 text-orange-700 border-orange-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[status] || "bg-slate-50 text-slate-700 border-slate-200";
}

function severityStyle(severity) {
  return {
    LOW: "bg-sky-50 text-sky-700 border-sky-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
  }[severity] || "bg-slate-50 text-slate-700 border-slate-200";
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

function typeStyle(type) {
  return {
    HAZARD: "bg-amber-50 text-amber-700 border-amber-200",
    ENVIRONMENTAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[type] || "bg-slate-50 text-slate-700 border-slate-200";
}

function riskStyle(level) {
  return {
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
    MODERATE: "bg-amber-50 text-amber-700 border-amber-200",
    HIGH: "bg-rose-50 text-rose-700 border-rose-200",
  }[level] || "bg-slate-50 text-slate-700 border-slate-200";
}

function reportCodeFromId(id = "") {
  const hex = id.slice(-6);
  const numeric = parseInt(hex || "0", 16).toString().slice(-6).padStart(6, "0");
  return `HZR-${numeric}`;
}

function getLatLng(source) {
  const coords =
    source?.baseReport?.location?.coordinates ||
    source?.location?.coordinates ||
    source?.center?.coordinates;

  if (Array.isArray(coords) && coords.length === 2) {
    return { lat: coords[1], lng: coords[0] };
  }
  return null;
}

export default function HazardCaseDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [hazard, setHazard] = useState(null);
  const [loading, setLoading] = useState(true);

  const [weatherLoading, setWeatherLoading] = useState(false);
  const [zoneLoading, setZoneLoading] = useState(false);

  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zone, setZone] = useState(null);

  const [zoneForm, setZoneForm] = useState({
    zoneType: "DANGEROUS",
    warningMessage: "",
    radius: 500,
    expiresAt: "",
  });

  const fetchHazard = async () => {
    setLoading(true);
    try {
      const data = await getHazardCaseById(id);
      setHazard(data);

      try {
        const zonesData = await getZones({ limit: 50 });
        const linkedZone =
          zonesData?.items?.find((item) => item?.sourceHazard?._id === data?._id) || null;
        setZone(linkedZone);
      } catch {
        setZone(null);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load hazard case details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHazard();
  }, [id]);

  const isWeatherCase = useMemo(
    () => hazard?.hazardCategory === "WEATHER",
    [hazard]
  );

  const latLng = useMemo(() => getLatLng(hazard), [hazard]);

  const handleWeatherCheck = async () => {
    if (!hazard?._id) return;

    setWeatherLoading(true);
    try {
      const data = await getHazardWeatherSnapshot(hazard._id);
      setHazard((prev) => ({
        ...prev,
        lastWeatherCheck: data,
      }));
      toast.success("Marine weather checked successfully");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to fetch marine conditions");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleCreateZone = async () => {
    if (!hazard?._id) return;

    if (!zoneForm.warningMessage.trim()) {
      toast.error("Warning message is required");
      return;
    }

    setZoneLoading(true);
    try {
      const created = await createZone({
        sourceHazard: hazard._id,
        zoneType: zoneForm.zoneType,
        warningMessage: zoneForm.warningMessage.trim(),
        radius: Number(zoneForm.radius),
        expiresAt: zoneForm.expiresAt || null,
      });

      setZone(created);
      setShowZoneForm(false);
      setZoneForm({
        zoneType: "DANGEROUS",
        warningMessage: "",
        radius: 500,
        expiresAt: "",
      });
      toast.success("Zone created successfully");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to create zone");
    } finally {
      setZoneLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-10 w-96 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-3/4 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!hazard) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-lg font-black text-slate-800">Hazard case not found</p>
        <button
          onClick={() => navigate("/dashboard/hazard-admin/cases")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Hazard Cases
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/hazard-admin/cases")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Hazard Cases
        </button>

        <button
          onClick={() => navigate(`/dashboard/hazard-admin/cases/${hazard._id}/edit`)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
        >
          Edit Case
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${typeStyle(
                  hazard?.baseReport?.reportType
                )}`}
              >
                {hazard?.baseReport?.reportType === "HAZARD" ? (
                  <TriangleAlert className="h-3 w-3" />
                ) : (
                  <Leaf className="h-3 w-3" />
                )}
                {hazard?.baseReport?.reportType || "REPORT"}
              </span>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${categoryStyle(
                  hazard.hazardCategory
                )}`}
              >
                {hazard.hazardCategory}
              </span>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${severityStyle(
                  hazard.severity
                )}`}
              >
                {hazard.severity}
              </span>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${handlingStatusStyle(
                  hazard.handlingStatus
                )}`}
              >
                {hazard.handlingStatus.replaceAll("_", " ")}
              </span>
            </div>

            <h2 className="text-lg font-black text-slate-900">Linked Report Summary</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Report Code
                </p>
                <p className="font-semibold text-slate-800">
                  {reportCodeFromId(hazard?.baseReport?._id || "")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Report Title
                </p>
                <p className="font-semibold text-slate-800">
                  {hazard?.baseReport?.title || "Untitled report"}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Created Date
                </p>
                <p className="font-semibold text-slate-800">
                  {hazard?.baseReport?.createdAt
                    ? format(new Date(hazard.baseReport.createdAt), "MMM d, yyyy • hh:mm a")
                    : "N/A"}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Reported By
                </p>
                <p className="font-semibold text-slate-800">
                  {hazard?.baseReport?.reportedBy?.name ||
                    hazard?.baseReport?.reportedBy?.email ||
                    "Unknown"}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Address
                </p>
                <p className="font-semibold text-slate-800">
                  {hazard?.baseReport?.location?.address || "Address unavailable"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Description
              </p>
              <p className="leading-relaxed text-slate-700 whitespace-pre-wrap">
                {hazard?.baseReport?.description || "No description available"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-black text-slate-900">Location</h2>
            </div>

            {latLng ? (
              <>
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Auto-filled Center Coordinates
                      </p>
                      <p className="font-semibold text-slate-800">
                        {latLng.lng}, {latLng.lat}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Center Source
                      </p>
                      <p className="font-semibold text-slate-800">
                        Linked report location
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="h-[360px]">
                    <MapContainer
                      center={[latLng.lat, latLng.lng]}
                      zoom={12}
                      scrollWheelZoom
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[latLng.lat, latLng.lng]}>
                        <Popup>
                          {hazard?.baseReport?.title || hazard.caseId}
                        </Popup>
                      </Marker>

                      {zone?.center?.coordinates?.length === 2 && (
                        <Circle
                          center={[zone.center.coordinates[1], zone.center.coordinates[0]]}
                          radius={zone.radius}
                          pathOptions={{
                            color: zone.zoneType === "DANGEROUS" ? "#dc2626" : "#7c3aed",
                            fillColor: zone.zoneType === "DANGEROUS" ? "#f87171" : "#a78bfa",
                            fillOpacity: 0.25,
                          }}
                        />
                      )}
                    </MapContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="font-bold text-slate-700">No valid coordinates available</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Hazard Case Information</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 text-sm">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Case ID
                </p>
                <p className="font-semibold text-slate-800">{hazard.caseId}</p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Hazard Category
                </p>
                <p className="font-semibold text-slate-800">{hazard.hazardCategory}</p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Severity
                </p>
                <p className="font-semibold text-slate-800">{hazard.severity}</p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Handling Status
                </p>
                <p className="font-semibold text-slate-800">
                  {hazard.handlingStatus.replaceAll("_", " ")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Zone Required
                </p>
                <p className="font-semibold text-slate-800">
                  {hazard.zoneRequired ? "Yes" : "No"}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Resolution Note
                </p>
                <p className="font-semibold text-slate-800">
                  {hazard.resolutionNote || "Not resolved yet"}
                </p>
              </div>
            </div>
          </div>

          {isWeatherCase ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CloudSun className="h-5 w-5 text-cyan-600" />
                <h2 className="text-lg font-black text-slate-900">Marine Weather Advisory</h2>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Weather verification is available for weather hazard cases only.
                </p>

                <button
                  onClick={handleWeatherCheck}
                  disabled={weatherLoading}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-bold text-white hover:from-cyan-700 hover:to-blue-700 disabled:opacity-60"
                >
                  {weatherLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking Weather...
                    </>
                  ) : (
                    <>
                      <CloudSun className="h-4 w-4" />
                      Check Weather
                    </>
                  )}
                </button>
              </div>

              {hazard.lastWeatherCheck && (
                <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Provider
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {hazard.lastWeatherCheck.provider || "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Fetched At
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {hazard.lastWeatherCheck.fetchedAt
                          ? format(new Date(hazard.lastWeatherCheck.fetchedAt), "MMM d, yyyy • hh:mm a")
                          : "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2">
                        <Waves className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Wave Height
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {hazard.lastWeatherCheck.waveHeight ?? "-"} m
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-cyan-600" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Wind Wave Height
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {hazard.lastWeatherCheck.windWaveHeight ?? "-"} m
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-rose-600" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Sea Temperature
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {hazard.lastWeatherCheck.seaTemperature ?? "-"} °C
                      </p>
                    </div>

                    <div className={`rounded-xl border p-3 ${riskStyle(hazard.lastWeatherCheck.riskLevel)}`}>
                      <div className="flex items-center gap-2">
                        <BadgeAlert className="h-4 w-4" />
                        <p className="text-xs font-black uppercase tracking-widest">
                          Risk Level
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-black">
                        {hazard.lastWeatherCheck.riskLevel || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Advisory
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {hazard.lastWeatherCheck.advisory || "No advisory available"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Raw Timestamp
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {hazard.lastWeatherCheck.timestamp || "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CircleOff className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-black text-slate-900">Weather Advisory</h2>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Weather check is only available for hazard cases with category set to WEATHER.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-black text-slate-900">Zone Management</h2>

              {!zone && (
                <button
                  onClick={() => setShowZoneForm((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:from-red-800 hover:to-rose-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Zone
                  {showZoneForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}
            </div>

            {zone ? (
              <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Zone Type
                    </p>
                    <p className="font-semibold text-slate-800">{zone.zoneType}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </p>
                    <p className="font-semibold text-slate-800">{zone.status}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Radius
                    </p>
                    <p className="font-semibold text-slate-800">{zone.radius} m</p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Expires At
                    </p>
                    <p className="font-semibold text-slate-800">
                      {zone.expiresAt ? format(new Date(zone.expiresAt), "MMM d, yyyy • hh:mm a") : "No expiry"}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Warning Message
                    </p>
                    <p className="font-semibold text-slate-800">{zone.warningMessage}</p>
                  </div>
                </div>
              </div>
            ) : (
              showZoneForm && (
                <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Zone Center
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      Auto-filled from linked report location
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {latLng ? `${latLng.lng}, ${latLng.lat}` : "Coordinates unavailable"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {hazard?.baseReport?.location?.address || "Address unavailable"}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Zone Type
                    </label>
                    <select
                      value={zoneForm.zoneType}
                      onChange={(e) =>
                        setZoneForm((prev) => ({ ...prev, zoneType: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="DANGEROUS">DANGEROUS</option>
                      <option value="RESTRICTED">RESTRICTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Warning Message
                    </label>
                    <textarea
                      rows={4}
                      value={zoneForm.warningMessage}
                      onChange={(e) =>
                        setZoneForm((prev) => ({ ...prev, warningMessage: e.target.value }))
                      }
                      placeholder="Enter why this zone is dangerous or restricted..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Radius (meters)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="50000"
                        value={zoneForm.radius}
                        onChange={(e) =>
                          setZoneForm((prev) => ({ ...prev, radius: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Expires At
                      </label>
                      <input
                        type="datetime-local"
                        value={zoneForm.expiresAt}
                        onChange={(e) =>
                          setZoneForm((prev) => ({ ...prev, expiresAt: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowZoneForm(false)}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleCreateZone}
                      disabled={zoneLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-600 px-5 py-3 text-sm font-bold text-white hover:from-red-800 hover:to-rose-700 disabled:opacity-60"
                    >
                      {zoneLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Create Zone
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}