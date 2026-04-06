import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import API_BASE_URL from "../config/api";

// Custom icons
const vesselIcon = new L.DivIcon({
  className: "custom-vessel-marker",
  html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const pinIcon = new L.DivIcon({
  className: "custom-pin-marker",
  html: `<div style="background-color: #2563eb; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(37, 99, 235, 0.8); position: relative;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid #2563eb; animation: ping 1.5s infinite;"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Component to handle map clicks and drop a pin
function InteractionHandler({ setPinnedLocation }) {
  useMapEvents({
    click(e) {
      setPinnedLocation([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function HomeMap() {
  const [vessels, setVessels] = useState([]);
  const [pinnedLocation, setPinnedLocation] = useState([7.8731, 80.7718]); // Default center
  const [loading, setLoading] = useState(true);

  const SRI_LANKA_CENTER = [7.8731, 80.7718];

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/vessels/nearby?lat=${pinnedLocation[0]}&lng=${pinnedLocation[1]}&radius=200`
        );
        const data = res.data?.data || res.data || [];
        setVessels(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching vessels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVessels();
  }, [pinnedLocation]);

  return (
    <div className="w-full h-full relative group">
      {loading && (
        <div className="absolute inset-0 z-[1000] bg-slate-50/80 flex items-center justify-center backdrop-blur-sm transition-opacity duration-500">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-600 tracking-widest uppercase">Initializing Monitoring Systems...</p>
          </div>
        </div>
      )}

      <MapContainer 
        center={SRI_LANKA_CENTER} 
        zoom={7} 
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <InteractionHandler setPinnedLocation={setPinnedLocation} />

        {/* The Dropped Pin */}
        <Marker position={pinnedLocation} icon={pinIcon}>
          <Popup className="custom-popup">
            <div className="p-2 font-sans">
              <p className="font-bold text-blue-600 uppercase tracking-tight text-xs">Selected Location</p>
              <p className="text-xs text-slate-500 font-medium">{pinnedLocation[0].toFixed(4)}, {pinnedLocation[1].toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>

        {vessels.map((vessel, idx) => {
          const lat = vessel.LAT || vessel.latitude || vessel.lat;
          const lon = vessel.LON || vessel.longitude || vessel.lon;
          if (!lat || !lon) return null;

          return (
            <Marker key={idx} position={[lat, lon]} icon={vesselIcon}>
              <Popup>
                <div className="p-2 font-sans min-w-[120px]">
                  <p className="font-black text-[#0f172a] text-sm uppercase">{vessel.NAME || vessel.name || "Unknown Vessel"}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Type: {vessel.TYPE || "Commercial"}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-[999] bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 border-b border-slate-100 pb-2">Interaction Hub</p>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Selected Point (Click map to move)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Vessel (Live AIS)</span>
        </div>
      </div>
    </div>
  );
}
