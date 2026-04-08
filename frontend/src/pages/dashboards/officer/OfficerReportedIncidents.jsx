import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  MapPin, AlertCircle, Shield, ArrowRight, Layers, 
  Crosshair, Filter, Navigation, Info, Eye, ExternalLink
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";

import API_BASE_URL from "../../../config/api";
import { useAuth } from "../../../context/AuthContext";
import { Skeleton } from "../../../components/common/Skeleton";

// Fix Leaflet Marker Icon issue in React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to center map when data changes
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 10);
  }, [center, map]);
  return null;
}

export default function OfficerReportedIncidents() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [mapCenter, setMapCenter] = useState([7.8731, 80.7718]); // Sri Lanka center
  const [filterSeverity, setFilterSeverity] = useState("ALL");

  useEffect(() => {
    fetchAssignedCases();
  }, [user]);

  const fetchAssignedCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE_URL}/api/enforcements?status=OPEN`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const items = res.data.items || [];
      setCases(items);
      
      // Center map on the first case if available
      if (items.length > 0 && items[0].relatedCase?.baseReport?.location?.coordinates) {
        const [lng, lat] = items[0].relatedCase.baseReport.location.coordinates;
        setMapCenter([lat, lng]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load assigned incidents");
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = useMemo(() => {
    if (filterSeverity === "ALL") return cases;
    return cases.filter(c => c.severity === filterSeverity);
  }, [cases, filterSeverity]);

  const handleCaseClick = (caseItem) => {
    setSelectedCase(caseItem);
    if (caseItem.relatedCase?.baseReport?.location?.coordinates) {
      const [lng, lat] = caseItem.relatedCase.baseReport.location.coordinates;
      setMapCenter([lat, lng]);
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case "CRITICAL": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      case "HIGH": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "MEDIUM": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default: return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    }
  };

  const getMarkerIcon = (severity, type = "incident") => {
    const color = severity === "CRITICAL" ? "#f43f5e" : 
                 severity === "HIGH" ? "#f97316" : 
                 severity === "MEDIUM" ? "#f59e0b" : "#3b82f6";
    
    if (type === "vessel") {
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: white; color: ${color}; width: 32px; height: 32px; border-radius: 12px; border: 2px solid ${color}; display: flex; items-center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path><path d="M19.38 20.51a11.58 11.58 0 0 0-14.76 0"></path><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"></path><path d="M12 12V2"></path><path d="M6 12h12l-1 7H7l-1-7Z"></path></svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    }

    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="position: relative; width: 24px; height: 24px;">
               <div style="position: absolute; inset: 0; background-color: ${color}; opacity: 0.4; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
               <div style="position: relative; background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>
             </div>
             <style>
               @keyframes ping {
                 75%, 100% { transform: scale(3.5); opacity: 0; }
               }
             </style>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  if (loading && cases.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-1/3 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[600px] lg:col-span-2 rounded-3xl" />
          <Skeleton className="h-[600px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 overflow-hidden">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Reported Incidents
          </h1>
          <p className="text-slate-500 font-medium">Visualizing your active investigation map</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
           <Filter className="w-4 h-4 text-slate-400 ml-2" />
           {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(sev => (
             <button
               key={sev}
               onClick={() => setFilterSeverity(sev)}
               className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                 filterSeverity === sev 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50"
               }`}
             >
               {sev}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Map Section */}
        <div className="lg:col-span-2 relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-200 group">
          <MapContainer 
            center={mapCenter} 
            zoom={10} 
            className="w-full h-full z-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            />
            <MapRecenter center={mapCenter} />
            
            {filteredCases.map((c) => {
              const incidentCoords = c.relatedCase?.baseReport?.location?.coordinates;
              const vesselCoords = c.relatedCase?.baseReport?.vessel?.latitude && c.relatedCase?.baseReport?.vessel?.longitude 
                ? [c.relatedCase.baseReport.vessel.longitude, c.relatedCase.baseReport.vessel.latitude] 
                : null;

              const markers = [];
              
              if (incidentCoords) {
                const [lng, lat] = incidentCoords;
                markers.push(
                  <Marker 
                    key={`${c._id}-incident`}
                    position={[lat, lng]}
                    icon={getMarkerIcon(c.severity || c.priority, "incident")}
                    eventHandlers={{ click: () => handleCaseClick(c) }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-1">
                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Incident Spot</div>
                        <h3 className="font-bold text-slate-900 mb-1">{c.title || c._id.slice(-6).toUpperCase()}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getSeverityColor(c.severity || c.priority)}`}>
                            {c.severity || c.priority}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              }

              if (vesselCoords) {
                const [lng, lat] = vesselCoords;
                markers.push(
                  <Marker 
                    key={`${c._id}-vessel`}
                    position={[lat, lng]}
                    icon={getMarkerIcon(c.severity || c.priority, "vessel")}
                    eventHandlers={{ click: () => handleCaseClick(c) }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-1">
                        <div className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-1">Suspect Vessel</div>
                        <h3 className="font-bold text-slate-900 mb-1">{c.relatedCase?.baseReport?.vessel?.name || "Unknown Vessel"}</h3>
                        <div className="text-[10px] font-mono font-bold text-slate-500">MMSI: {c.relatedCase?.baseReport?.vessel?.mmsi || "N/A"}</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              }

              return markers;
            })}
          </MapContainer>

          {/* Floating Map Controls */}
          <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2">
            <button 
              onClick={fetchAssignedCases}
              className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl shadow-xl transition border border-slate-100 flex items-center gap-2 group"
            >
              <Navigation className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold mr-1">Reset View</span>
            </button>
          </div>

          <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-3">
             <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/50 w-64">
                <div className="flex items-center gap-2 mb-3">
                   <Layers className="w-4 h-4 text-blue-600" />
                   <span className="text-xs font-black uppercase text-slate-800 tracking-wider">Legend</span>
                </div>
                <div className="space-y-2">
                   {[
                     { label: "Critical Risk", color: "bg-rose-500" },
                     { label: "High Risk", color: "bg-orange-500" },
                     { label: "Normal Activity", color: "bg-blue-500" },
                   ].map(item => (
                     <div key={item.label} className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${item.color}`} />
                       <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* List Section */}
        <div className="flex flex-col min-h-0 space-y-4">
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex items-center justify-between">
             <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Load</span>
                <p className="text-xl font-black text-slate-900">{filteredCases.length} Incidents</p>
             </div>
             <div className="p-3 bg-blue-50 rounded-2xl">
                <Crosshair className="w-6 h-6 text-blue-600" />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scroll-smooth custom-scrollbar">
            {filteredCases.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400 text-center uppercase tracking-wider">No incidents matching filter</p>
              </div>
            ) : (
              filteredCases.map(c => (
                <motion.div
                  key={c._id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleCaseClick(c)}
                  className={`p-5 rounded-[2rem] border transition-all cursor-pointer group ${
                    selectedCase?._id === c._id 
                      ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200 scale-100" 
                      : "bg-white border-slate-100 hover:border-blue-200 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getSeverityColor(c.severity)}`}>
                      {c.severity}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${selectedCase?._id === c._id ? "text-slate-400" : "text-slate-400"}`}>
                      {c.caseNumber}
                    </span>
                  </div>
                  
                  <h3 className={`font-black text-sm mb-2 line-clamp-1 ${selectedCase?._id === c._id ? "text-white" : "text-slate-900"}`}>
                    {c.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className={`w-3.5 h-3.5 ${selectedCase?._id === c._id ? "text-blue-400" : "text-slate-400"}`} />
                    <span className={`text-[11px] font-medium truncate ${selectedCase?._id === c._id ? "text-slate-300" : "text-slate-500"}`}>
                      {c.relatedCase?.baseReport?.location?.address || "Location not specified"}
                    </span>
                  </div>

                  <div className={`pt-4 border-t ${selectedCase?._id === c._id ? "border-white/10" : "border-slate-50"} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                       <Info className={`w-3.5 h-3.5 ${selectedCase?._id === c._id ? "text-slate-500" : "text-slate-400"}`} />
                       <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCase?._id === c._id ? "text-slate-500" : "text-slate-400"}`}>
                         vessel: {c.relatedCase?.vesselId || "N/A"}
                       </span>
                    </div>
                    <Link 
                      to={`/dashboard/officer/cases`}
                      className={`p-2 rounded-xl transition-all ${
                        selectedCase?._id === c._id 
                        ? "bg-blue-600 text-white" 
                        : "bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 20px;
          padding: 8px;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
