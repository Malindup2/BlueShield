import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
} from "react-leaflet";
import {
  Search,
  Loader2,
  Map,
  Table2,
  ShieldAlert,
  Eye,
  Pencil,
  X,
  Save,
  MapPinned,
  ShieldCheck,
  FileWarning,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { getZones, updateZone } from "../../../services/hazardAdminAPI";

const ZONE_TYPES = ["RESTRICTED", "DANGEROUS"];
const ZONE_STATUSES = ["ACTIVE", "DISABLED"];

function zoneTypeStyle(type) {
  return type === "DANGEROUS"
    ? "bg-red-100 text-red-700 border-red-200"
    : "bg-purple-100 text-purple-700 border-purple-200";
}

function statusStyle(status) {
  return status === "ACTIVE"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-600 border-slate-200";
}

function hazardCategoryStyle(category) {
  return {
    WEATHER: "bg-indigo-100 text-indigo-700 border-indigo-200",
    POLLUTION: "bg-emerald-100 text-emerald-700 border-emerald-200",
    DEBRIS: "bg-amber-100 text-amber-700 border-amber-200",
    OBSTRUCTION: "bg-rose-100 text-rose-700 border-rose-200",
    OTHER: "bg-slate-100 text-slate-700 border-slate-200",
  }[category] || "bg-slate-100 text-slate-700 border-slate-200";
}

function getZoneColors(type) {
  if (type === "DANGEROUS") {
    return {
      stroke: "#dc2626",
      fill: "#ef4444",
      glow: "#f87171",
      hotspot: "#fee2e2",
    };
  }

  return {
    stroke: "#7c3aed",
    fill: "#8b5cf6",
    glow: "#a78bfa",
    hotspot: "#f3e8ff",
  };
}

const ICON_THEMES = {
  total: {
    wrap: "bg-blue-50 text-blue-500",
  },
  active: {
    wrap: "bg-violet-50 text-violet-500",
  },
  disabled: {
    wrap: "bg-rose-50 text-rose-500",
  },
  dangerous: {
    wrap: "bg-amber-50 text-amber-500",
  },
  restricted: {
    wrap: "bg-emerald-50 text-emerald-500",
  },
};

export default function Zones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("map");
  const [search, setSearch] = useState("");

  const [selectedZone, setSelectedZone] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editZone, setEditZone] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await getZones({
        limit: 50,
        includeExpired: true,
      });
      setZones(data?.items || []);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load zones");
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const filteredZones = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return zones;

    return zones.filter((zone) => {
      return (
        zone?.sourceHazard?.caseId?.toLowerCase().includes(term) ||
        zone?.zoneType?.toLowerCase().includes(term) ||
        zone?.status?.toLowerCase().includes(term) ||
        zone?.warningMessage?.toLowerCase().includes(term) ||
        zone?.sourceHazard?.hazardCategory?.toLowerCase().includes(term)
      );
    });
  }, [zones, search]);

  const stats = useMemo(() => {
    return {
      total: zones.length,
      active: zones.filter((z) => z.status === "ACTIVE").length,
      disabled: zones.filter((z) => z.status === "DISABLED").length,
      dangerous: zones.filter((z) => z.zoneType === "DANGEROUS").length,
      restricted: zones.filter((z) => z.zoneType === "RESTRICTED").length,
    };
  }, [zones]);

  const statCards = [
    {
      key: "total",
      label: "Total Zones",
      value: stats.total,
      sub: "All active and disabled zones",
      icon: FileWarning,
      valueClass: "text-slate-800",
    },
    {
      key: "active",
      label: "Active Zones",
      value: stats.active,
      sub: "Currently enforced safety areas",
      icon: MapPinned,
      valueClass: "text-slate-800",
    },
    {
      key: "disabled",
      label: "Disabled Zones",
      value: stats.disabled,
      sub: "Inactive zone boundaries",
      icon: ShieldAlert,
      valueClass: "text-slate-800",
    },
    {
      key: "dangerous",
      label: "Dangerous Zones",
      value: stats.dangerous,
      sub: "High-risk restricted regions",
      icon: ShieldCheck,
      valueClass: "text-slate-800",
    },
    {
      key: "restricted",
      label: "Restricted Zones",
      value: stats.restricted,
      sub: "Controlled maritime areas",
      icon: Map,
      valueClass: "text-slate-800",
    },
  ];

  const openView = (zone) => {
    setSelectedZone(zone);
    setShowViewModal(true);
  };

  const openEdit = (zone) => {
    setEditZone({
      _id: zone._id,
      zoneType: zone.zoneType,
      warningMessage: zone.warningMessage,
      radius: zone.radius,
      expiresAt: zone.expiresAt
        ? new Date(zone.expiresAt).toISOString().slice(0, 16)
        : "",
      status: zone.status,
    });
    setShowEditModal(true);
  };

  const handleToggleStatus = async (zone) => {
    try {
      await updateZone(zone._id, {
        status: zone.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
      });
      toast.success("Zone status updated");
      fetchZones();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update zone status");
    }
  };

  const handleSaveEdit = async () => {
    if (!editZone?._id) return;

    const trimmedMessage = (editZone.warningMessage || "").trim();
    const radiusNumber = Number(editZone.radius);

    if (!editZone.zoneType) {
      toast.error("Zone type is required");
      return;
    }

    if (!ZONE_TYPES.includes(editZone.zoneType)) {
      toast.error("Invalid zone type");
      return;
    }

    if (!trimmedMessage) {
      toast.error("Warning message is required");
      return;
    }

    if (trimmedMessage.length > 400) {
      toast.error("Warning message cannot exceed 400 characters");
      return;
    }

    if (!editZone.radius && editZone.radius !== 0) {
      toast.error("Radius is required");
      return;
    }

    if (Number.isNaN(radiusNumber)) {
      toast.error("Radius must be a valid number");
      return;
    }

    if (radiusNumber < 10 || radiusNumber > 50000) {
      toast.error("Radius must be between 10 and 50000 meters");
      return;
    }

    if (editZone.status && !ZONE_STATUSES.includes(editZone.status)) {
      toast.error("Invalid zone status");
      return;
    }

    setSavingEdit(true);
    try {
      await updateZone(editZone._id, {
        zoneType: editZone.zoneType,
        warningMessage: trimmedMessage,
        radius: radiusNumber,
        expiresAt: editZone.expiresAt || null,
        status: editZone.status,
      });
      toast.success("Zone updated successfully");
      setShowEditModal(false);
      setEditZone(null);
      fetchZones();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update zone");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950 p-8 shadow-xl">
        <div className="absolute -top-12 -right-10 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-8 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
            <ShieldAlert className="h-3 w-3" />
            Zone Management
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
            Restricted & Dangerous Zones
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            View all active and disabled maritime zones, manage zone status,
            inspect affected hazard details, and visualize protected areas on the map.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          const theme = ICON_THEMES[card.key];

          return (
            <div
              key={card.label}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {card.label}
                </p>
                <h3 className={`text-3xl font-black ${card.valueClass}`}>
                  {loading ? "--" : card.value}
                </h3>
                <p className="text-xs text-slate-500">{card.sub}</p>
              </div>

              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.wrap}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              viewMode === "table"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Table2 className="h-4 w-4" />
            Table View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              viewMode === "map"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Map className="h-4 w-4" />
            Map View
          </button>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hazard ID, type, status, or message..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-700" />
        </div>
      )}

      {!loading && viewMode === "table" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Hazard ID
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Zone Type
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Center
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Radius
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Expires At
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Toggle
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredZones.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <p className="text-lg font-black text-slate-800">No zones found</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Try changing the search term.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredZones.map((zone) => (
                    <tr
                      key={zone._id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-900">
                          {zone?.sourceHazard?.caseId || "N/A"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${zoneTypeStyle(
                            zone.zoneType
                          )}`}
                        >
                          {zone.zoneType}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyle(
                            zone.status
                          )}`}
                        >
                          {zone.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {zone?.center?.coordinates?.[0]}, {zone?.center?.coordinates?.[1]}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">{zone.radius} m</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {zone.expiresAt
                            ? format(new Date(zone.expiresAt), "MMM d, yyyy • hh:mm a")
                            : "No expiry"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={zone.status === "ACTIVE"}
                            onChange={() => handleToggleStatus(zone)}
                          />
                          <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
                        </label>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(zone)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition"
                            title="View zone"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openEdit(zone)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition"
                            title="Edit zone"
                          >
                            <Pencil className="h-4 w-4" />
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
      )}

      {!loading && viewMode === "map" && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-[620px]">
            <MapContainer
              center={[7.2, 79.8]}
              zoom={10}
              className="h-full w-full"
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filteredZones
                .filter((zone) => zone.status === "ACTIVE")
                .map((zone) => {
                  const coords = zone?.center?.coordinates || [79.8, 7.2];
                  const colors = getZoneColors(zone.zoneType);
                  const latlng = [coords[1], coords[0]];
                  const radius = Number(zone.radius) || 100;

                  return (
                    <React.Fragment key={zone._id}>
                      <Circle
                        center={latlng}
                        radius={Math.max(radius * 3.2, 700)}
                        interactive={false}
                        pathOptions={{
                          stroke: false,
                          fillColor: colors.glow,
                          fillOpacity: zone.zoneType === "DANGEROUS" ? 0.1 : 0.08,
                        }}
                      />

                      <Circle
                        center={latlng}
                        radius={Math.max(radius * 1.8, 350)}
                        interactive={false}
                        pathOptions={{
                          stroke: false,
                          fillColor: colors.fill,
                          fillOpacity: zone.zoneType === "DANGEROUS" ? 0.18 : 0.14,
                        }}
                      />

                      <Circle
                        center={latlng}
                        radius={radius}
                        pathOptions={{
                          color: colors.stroke,
                          fillColor: colors.fill,
                          fillOpacity: zone.zoneType === "DANGEROUS" ? 0.3 : 0.24,
                          opacity: 1,
                          weight: 2.5,
                        }}
                      >
                        <Popup>
                          <div className="min-w-[220px] space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${zoneTypeStyle(
                                  zone.zoneType
                                )}`}
                              >
                                {zone.zoneType}
                              </span>

                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${hazardCategoryStyle(
                                  zone?.sourceHazard?.hazardCategory
                                )}`}
                              >
                                {zone?.sourceHazard?.hazardCategory || "OTHER"}
                              </span>
                            </div>

                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Hazard ID
                              </p>
                              <p className="text-sm font-semibold text-slate-800">
                                {zone?.sourceHazard?.caseId || "N/A"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Warning Message
                              </p>
                              <p className="text-sm font-semibold text-slate-800">
                                {zone.warningMessage}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                  Status
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                  {zone.status}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                  Radius
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                  {zone.radius} m
                                </p>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Circle>

                      <CircleMarker
                        center={latlng}
                        radius={18}
                        interactive={false}
                        pathOptions={{
                          color: "#ffffff",
                          weight: 2,
                          fillColor: colors.fill,
                          fillOpacity: 0.95,
                        }}
                      />

                      <CircleMarker
                        center={latlng}
                        radius={8}
                        interactive={false}
                        pathOptions={{
                          color: "#ffffff",
                          weight: 2,
                          fillColor: colors.hotspot,
                          fillOpacity: 1,
                        }}
                      />
                    </React.Fragment>
                  );
                })}
            </MapContainer>
          </div>
        </div>
      )}

      {showViewModal && selectedZone && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Zone Details
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  {selectedZone?.sourceHazard?.caseId || "Zone"}
                </h3>
              </div>

              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedZone(null);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${zoneTypeStyle(
                    selectedZone.zoneType
                  )}`}
                >
                  {selectedZone.zoneType}
                </span>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyle(
                    selectedZone.status
                  )}`}
                >
                  {selectedZone.status}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Hazard ID
                  </p>
                  <p className="font-semibold text-slate-800">
                    {selectedZone?.sourceHazard?.caseId || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Hazard Category
                  </p>
                  <p className="font-semibold text-slate-800">
                    {selectedZone?.sourceHazard?.hazardCategory || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Radius
                  </p>
                  <p className="font-semibold text-slate-800">{selectedZone.radius} m</p>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Expires At
                  </p>
                  <p className="font-semibold text-slate-800">
                    {selectedZone.expiresAt
                      ? format(new Date(selectedZone.expiresAt), "MMM d, yyyy • hh:mm a")
                      : "No expiry"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Warning Message
                  </p>
                  <p className="font-semibold text-slate-800">
                    {selectedZone.warningMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editZone && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Edit Zone
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  Update Zone Details
                </h3>
              </div>

              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditZone(null);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Zone Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editZone.zoneType}
                  onChange={(e) =>
                    setEditZone((prev) => ({ ...prev, zoneType: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="DANGEROUS">DANGEROUS</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Warning Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={editZone.warningMessage}
                  onChange={(e) =>
                    setEditZone((prev) => ({ ...prev, warningMessage: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Radius (meters) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="10"
                    max="50000"
                    value={editZone.radius}
                    onChange={(e) =>
                      setEditZone((prev) => ({ ...prev, radius: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={editZone.expiresAt}
                    onChange={(e) =>
                      setEditZone((prev) => ({ ...prev, expiresAt: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditZone(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-600 px-5 py-3 text-sm font-bold text-white hover:from-violet-800 hover:to-purple-700 disabled:opacity-60"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
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