import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";
import toast from "react-hot-toast";
import 'mapbox-gl/dist/mapbox-gl.css';
import API_BASE_URL from "../config/api";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function VesselMap({ onLocationSelect, onVesselSelect }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if map is already initialized
    if (map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [79.8612, 6.9271], // Sri Lanka center
        zoom: 7,
      });

      map.current.on("load", () => {
        setIsLoading(false);
      });

      // Click map to select report location
      map.current.on("click", async (e) => {
        const lng = e.lngLat.lng;
        const lat = e.lngLat.lat;

        onLocationSelect({ 
          lat, 
          lng,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        });

        // Remove previous marker if exists
        const existingMarkers = document.querySelectorAll('.marker-selected');
        existingMarkers.forEach(el => el.remove());

        // Add new marker
        const markerEl = document.createElement('div');
        markerEl.className = 'marker-selected';
        markerEl.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjMjU2MWVkIi8+PHBhdGggZD0iTTEyIDZWMThNNiAxMkgxOCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=)';
        markerEl.style.backgroundSize = 'contain';
        markerEl.style.width = '32px';
        markerEl.style.height = '32px';
        markerEl.style.cursor = 'pointer';

        new mapboxgl.Marker({ element: markerEl })
          .setLngLat([lng, lat])
          .addTo(map.current);

        // Fetch nearby vessels from backend
        try {
          const res = await axios.get(
            `${API_BASE_URL}/vessels/nearby?lat=${lat}&lng=${lng}`
          );

          const vessels = res.data?.data || res.data || [];
          console.log("Fetched vessels:", vessels);

          // Clear existing vessel markers
          const existingVesselMarkers = document.querySelectorAll('.marker-vessel');
          existingVesselMarkers.forEach(el => el.remove());

          // Add vessel markers
          if (Array.isArray(vessels) && vessels.length > 0) {
            console.log(`Adding ${vessels.length} vessel markers`);
            vessels.forEach((vessel, index) => {
              console.log(`Vessel ${index}:`, vessel);
              const vesselMarkerEl = document.createElement('div');
              vesselMarkerEl.className = 'marker-vessel';
              vesselMarkerEl.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjZWYyMzJiIi8+PHBhdGggZD0iTTEyIDZWMThNNiAxMkgxOCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=)';
              vesselMarkerEl.style.backgroundSize = 'contain';
              vesselMarkerEl.style.width = '28px';
              vesselMarkerEl.style.height = '28px';
              vesselMarkerEl.style.cursor = 'pointer';

              const lng = vessel.LON || vessel.longitude || vessel.lon;
              const lat = vessel.LAT || vessel.latitude || vessel.lat;
              console.log(`Marker coordinates: [${lng}, ${lat}]`);

              if (lng !== undefined && lat !== undefined && !isNaN(lng) && !isNaN(lat)) {
                const marker = new mapboxgl.Marker({ element: vesselMarkerEl })
                  .setLngLat([lng, lat])
                  .addTo(map.current);

                vesselMarkerEl.addEventListener('click', () => {
                  onVesselSelect({
                    mmsi: vessel.MMSI,
                    name: vessel.NAME || vessel.name,
                    latitude: lat,
                    longitude: lng,
                    type: vessel.TYPE || vessel.type,
                  });
                  toast.success(`Vessel "${vessel.NAME || vessel.name}" selected`);
                });
                console.log(`Added marker for vessel: ${vessel.NAME}`);
              } else {
                console.error(`Invalid coordinates for vessel ${vessel.NAME}: lat=${lat}, lng=${lng}`);
              }
            });
          } else {
            console.log("No vessels to display");
          }
        } catch (error) {
          console.error("Error fetching vessels:", error);
          toast.error("Could not fetch nearby vessels");
        }
      });

      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error) {
      console.error("Map initialization error:", error);
      toast.error("Could not initialize map. Check your Mapbox token.");
    }
  }, []);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: "400px" }}
    >
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center bg-slate-100">
          <p className="text-slate-600">Loading map...</p>
        </div>
      )}
    </div>
  );
}