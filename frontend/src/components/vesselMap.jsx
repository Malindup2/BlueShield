import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";
import toast from "react-hot-toast";
import 'mapbox-gl/dist/mapbox-gl.css';
import API_BASE_URL from "../config/api";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function VesselMap({ onLocationSelect, onVesselSelect, showGetLocation = false }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [nearbyVessels, setNearbyVessels] = useState([]);
  const [isFindingVessels, setIsFindingVessels] = useState(false);

  const clearSelectedMarker = useCallback(() => {
    const existingMarkers = document.querySelectorAll('.marker-selected');
    existingMarkers.forEach(el => el.remove());
  }, []);

  const clearVesselMarkers = useCallback(() => {
    const existingVesselMarkers = document.querySelectorAll('.marker-vessel');
    existingVesselMarkers.forEach(el => el.remove());
  }, []);

  const placeSelectedMarker = useCallback((longitude, latitude) => {
    clearSelectedMarker();

    const markerEl = document.createElement('div');
    markerEl.className = 'marker-selected';
    markerEl.innerHTML = `
      <div style="
        width: 28px;
        height: 28px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      "></div>
    `;

    new mapboxgl.Marker({ element: markerEl })
      .setLngLat([longitude, latitude])
      .addTo(map.current);
  }, [clearSelectedMarker]);

  const placeVesselMarkers = (vessels) => {
    clearVesselMarkers();

    vessels.forEach((vessel) => {
      const lng = vessel.LON || vessel.longitude || vessel.lon;
      const lat = vessel.LAT || vessel.latitude || vessel.lat;
      if (lng === undefined || lat === undefined || isNaN(lng) || isNaN(lat)) {
        return;
      }

      const vesselName = vessel.NAME || vessel.name || 'Unknown Vessel';
      const vesselMmsi = vessel.MMSI || vessel.mmsi || 'N/A';

      const vesselEl = document.createElement('div');
      vesselEl.className = 'marker-vessel';
      vesselEl.style.cursor = 'pointer';
      vesselEl.innerHTML = `
        <div style="position: relative;">
          <div style="
            width: 24px;
            height: 24px;
            background: #10b981;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.35);
          "></div>
          <div class="vessel-tooltip" style="
            display: none;
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.85);
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            pointer-events: none;
            z-index: 100;
          ">
            <div style="font-weight: 600;">${vesselName}</div>
            <div style="opacity: 0.8; font-size: 11px;">MMSI: ${vesselMmsi}</div>
          </div>
        </div>
      `;

      vesselEl.addEventListener('mouseenter', () => {
        vesselEl.querySelector('.vessel-tooltip').style.display = 'block';
      });
      vesselEl.addEventListener('mouseleave', () => {
        vesselEl.querySelector('.vessel-tooltip').style.display = 'none';
      });

      new mapboxgl.Marker({ element: vesselEl })
        .setLngLat([lng, lat])
        .addTo(map.current);

      vesselEl.addEventListener('click', () => {
        onVesselSelect({
          mmsi: vesselMmsi,
          name: vesselName,
          latitude: lat,
          longitude: lng,
          type: vessel.TYPE || vessel.type,
        });
        toast.success(`Vessel "${vesselName}" selected`);
      });
    });
  };

  const fetchNearbyVessels = async () => {
    if (!selectedPoint) {
      toast.error('Select a location first (click on map or get your current location)');
      return;
    }

    setIsFindingVessels(true);
    try {
      // Create bounding box around selected point
      const delta = 0.15; // ~16km at equator
      const minlat = selectedPoint.lat - delta;
      const maxlat = selectedPoint.lat + delta;
      const minlon = selectedPoint.lng - delta;
      const maxlon = selectedPoint.lng + delta;

      console.log('🚢 Fetching vessels in zone:', { minlat, maxlat, minlon, maxlon, API_BASE_URL });

      const res = await axios.get(`${API_BASE_URL}/api/vessels/zone`, {
        params: {
          minlat,
          maxlat,
          minlon,
          maxlon,
          minutesBack: 60,
        },
      });

      console.log('✓ API response received:', {
        status: res.status,
        dataType: typeof res.data,
        hasData: !!res.data?.data,
        count: res.data?.count,
        vesselSample: res.data?.data?.[0]
      });

      const vessels = res.data?.data || res.data || [];
      
      // Check if this is mock data (mock MMSI values are "111111111" and "222222222")
      const isMockData = vessels.length <= 2 && vessels.every(v => 
        (v.MMSI === "111111111" || v.MMSI === "222222222" || v.MMSI === 111111111 || v.MMSI === 222222222)
      );

      console.log(`${isMockData ? '⚠️  Mock data detected' : '✓ Real data'}: ${vessels.length} vessels`);

      setNearbyVessels(vessels);
      placeVesselMarkers(vessels);
      
      if (Array.isArray(vessels) && vessels.length === 0) {
        toast.error('No vessels found in this area');
      } else if (isMockData) {
        toast.success(`Found ${vessels.length} vessel${vessels.length === 1 ? '' : 's'} (demo data)`);
      } else {
        toast.success(`✓ Found ${vessels.length} live vessel${vessels.length === 1 ? '' : 's'}`);
      }
    } catch (error) {
      console.error('✗ Error fetching vessels in zone:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Could not fetch vessels in this area.');
      setNearbyVessels([]);
      clearVesselMarkers();
    } finally {
      setIsFindingVessels(false);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Center map on user's location
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 12,
            duration: 2000
          });
        }

        const locationData = {
          lat: latitude,
          lng: longitude,
          address: `Current Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        };

        setSelectedPoint(locationData);
        onLocationSelect(locationData);

        if (map.current && isMapLoaded) {
          placeSelectedMarker(longitude, latitude);
          toast.success("Location found and marked on map");
        } else {
          toast.success("Location found! Map will mark location when ready.");
        }

        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Unable to get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        toast.error(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if map is already initialized - prevent re-initialization
    if (map.current) {
      console.log('Map already initialized, skipping re-initialization');
      return;
    }

    console.log('Initializing map...');

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [79.8612, 6.9271], // Sri Lanka center
        zoom: 7,
      });

      map.current.on("load", () => {
        setIsLoading(false);
        setIsMapLoaded(true);
      });

      // Click map to select report location
      map.current.on("click", (e) => {
        const lng = e.lngLat.lng;
        const lat = e.lngLat.lat;

        const selected = {
          lat,
          lng,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        };

        setSelectedPoint(selected);
        onLocationSelect(selected);

        if (map.current && isMapLoaded) {
          placeSelectedMarker(lng, lat);
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
  }, [onLocationSelect, onVesselSelect, isMapLoaded, placeSelectedMarker]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden" style={{ minHeight: "400px" }}>
      <div
        ref={mapContainer}
        className="w-full h-full"
      >
        {isLoading && (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <p className="text-slate-600">Loading map...</p>
          </div>
        )}
      </div>

      {/* Controls on the map */}
      {showGetLocation && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation || !isMapLoaded}
            className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-md border border-gray-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isGettingLocation ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Getting location...
              </>
            ) : !isMapLoaded ? (
              <>
                🗺️ Loading map...
              </>
            ) : (
              <>
                📍 Get My Location
              </>
            )}
          </button>

          <button
            onClick={fetchNearbyVessels}
            disabled={!selectedPoint || isFindingVessels || !isMapLoaded}
            className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-md border border-gray-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isFindingVessels ? (
              <>
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                Finding vessels...
              </>
            ) : (
              <>
                🚢 Find Vessels in Area
              </>
            )}
          </button>
        </div>
      )}

      {nearbyVessels.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 max-h-56 w-80 overflow-y-auto bg-white bg-opacity-90 p-2 rounded-lg shadow-lg border border-gray-200">
          <h4 className="text-sm font-semibold mb-1">Vessels in area</h4>
          <ul className="space-y-1 text-xs text-gray-700">
            {nearbyVessels.map((vessel, index) => (
              <li key={`vessel-${index}`} className="p-1 border-b border-gray-200 last:border-b-0">
                <strong>{vessel.NAME || vessel.name || 'Unnamed'}</strong>
                <div className="text-gray-500">MMSI: {vessel.MMSI || 'N/A'}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}