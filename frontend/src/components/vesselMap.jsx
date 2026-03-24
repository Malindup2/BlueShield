import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY;

export default function VesselMap({ onLocationSelect }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

    useEffect(() => {
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/streets-v11",
            center: [0, 0],
            zoom: 2,
        });

        //when user clciks on the map, get the coordinates and pass it to the parent component
        mapRef.current.on("click", (e) => {
            const lng = e.lngLat.lng;
            const lat = e.lngLat.lat;

            new mapboxgl.Marker().setLngLat([lng, lat]).addTo(mapRef.current);

            onLocationSelect({ longitude: lng, latitude: lat });
        });

    }, [onLocationSelect]);

    return <div ref={mapContainerRef} style={{ width: "100%", height: "400px" }} />;
}



