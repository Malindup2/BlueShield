import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import API_BASE_URL from "../config/api";

// --- CUSTOM STYLES (DivIcons for superior performance & aesthetics) ---

const vesselIcon = new L.DivIcon({
  className: "custom-vessel-marker",
  html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); position: relative;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid #ef4444; animation: ping 2s infinite; opacity: 0.6;"></div>
         </div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const reportPinIcon = new L.DivIcon({
  className: "custom-pin-marker",
  html: `<div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(37, 99, 235, 0.8); position: relative;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 3px solid #2563eb; animation: ping 1.5s infinite;"></div>
         </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Helper component to handle map clicks & background AIS fetching
function InteractionHandler({ onLocationSelect, setVessels, onVesselSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      // 1. Immediate visual update
      onLocationSelect({
        lat,
        lng,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });

      // 2. Fetch vessels in background
      setVessels([]);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/vessels/nearby?lat=${lat}&lng=${lng}`
        );
        const data = res.data?.data || res.data || [];
        const vesselsList = Array.isArray(data) ? data : [];
        setVessels(vesselsList);
        
        if (vesselsList.length > 0) {
          toast.success(`Broadcasting AIS search: ${vesselsList.length} vessels found`);
        }
      } catch (err) {
        console.error("AIS Fetch Error:", err);
      }
    },
  });
  return null;
}

// Ensure map is correctly sized even in split layouts
function MapSizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function VesselMap({ onLocationSelect, onVesselSelect }) {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLocationSelect = useCallback((location) => {
    setSelectedPosition([location.lat, location.lng]);
    onLocationSelect(location);
  }, [onLocationSelect]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-full rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 group" style={{ minHeight: "450px" }}>
      {loading ? (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-slate-50 gap-4">
           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Initializing Maritime Grid...</p>
        </div>
      ) : (
        <MapContainer
          center={[6.9271, 79.8612]}
          zoom={8}
          className="w-full h-full cursor-crosshair"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />
          
          <MapSizer />
          
          <InteractionHandler 
            onLocationSelect={handleLocationSelect} 
            setVessels={setVessels} 
          />

          {/* User's Incident Drop-pin */}
          {selectedPosition && (
            <Marker position={selectedPosition} icon={reportPinIcon}>
              <Popup className="custom-popup">
                <div className="p-2 font-sans text-center">
                  <p className="font-black text-blue-600 uppercase tracking-tighter text-xs">Report Anchor Point</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    {selectedPosition[0].toFixed(4)}, {selectedPosition[1].toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* AIS Layer: Nearby Vessels */}
          {vessels.map((vessel, idx) => {
            const vLat = vessel.LAT || vessel.latitude || vessel.lat;
            const vLng = vessel.LON || vessel.longitude || vessel.lon;
            
            if (vLat != null && vLng != null) {
              return (
                <Marker 
                  key={`${vessel.MMSI || idx}`} 
                  position={[vLat, vLng]} 
                  icon={vesselIcon}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e);
                      onVesselSelect({
                        mmsi: vessel.MMSI,
                        name: vessel.NAME || vessel.name || `Vessel ${vessel.MMSI}`,
                        latitude: vLat,
                        longitude: vLng,
                        type: vessel.TYPE || "Commercial",
                      });
                      toast.success(`Target Locked: ${vessel.NAME || vessel.MMSI}`);
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[140px] font-sans">
                      <p className="font-black text-slate-900 border-b border-slate-100 pb-2 mb-2 uppercase text-sm">
                        {vessel.NAME || "Target ID Unknown"}
                      </p>
                      <div className="space-y-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                         <p>MMSI: <span className="text-slate-800">{vessel.MMSI}</span></p>
                         <p>Type: <span className="text-slate-800">{vessel.TYPE || "Unknown"}</span></p>
                      </div>
                      <button className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition">
                         Connect to Offender
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}
        </MapContainer>
      )}

      {/* Interactive Legend Overlay */}
      <div className="absolute top-6 left-6 z-[999] bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-3 pointer-events-none group-hover:pointer-events-auto transition-all">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Interaction Hub</p>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm animate-pulse" />
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Report Origin (Click map)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">AIS Vessel Detection</span>
        </div>
      </div>

      {/* Map Guidance Overlay */}
      {!selectedPosition && !loading && (
        <div className="absolute inset-x-0 bottom-10 z-[1000] flex justify-center pointer-events-none px-4">
          <div className="bg-[#0f172a] text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl animate-bounce border border-white/20">
             Drop a pin to start investigation
          </div>
        </div>
      )}

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .leaflet-container {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}

