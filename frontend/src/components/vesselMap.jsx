import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;


export default function VesselMap({ onLocationSelect, onVesselSelect }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [79.8612, 6.9271],
      zoom: 7
    });

    // Click map to select report location
    map.current.on("click", async (e) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;

      onLocationSelect({ latitude: lat, longitude: lng });

      new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Fetch nearby vessels from backend
      const res = await axios.get(
        `http://localhost:5000/api/vessels/nearby?lat=${lat}&lng=${lng}`
      );

      const vessels = res.data;

      // Add vessel markers
      vessels.forEach((vessel) => {
        const marker = new mapboxgl.Marker({ color: "red" })
          .setLngLat([vessel.lon, vessel.lat])
          .addTo(map.current);

        marker.getElement().addEventListener("click", () => {
          onVesselSelect({
            mmsi: vessel.MMSI,
            name: vessel.NAME,
            latitude: vessel.LAT,
            longitude: vessel.LON,
            type: vessel.TYPE
          });
        });
      });
    });
  }, []);

  return <div ref={mapContainer} style={{ height: "400px" }} />;
}