import { useState } from "react";
import VesselMap from "../components/vesselMap";
import axios from "axios";

export default function SubmitAReport() {
  const [location, setLocation] = useState(null);
  const [vessel, setVessel] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    reportType: "ILLEGAL_FISHING",
    severity: "MEDIUM"
  });

  const handleSubmit = async () => {
    if (!location) {
      alert("Please select a location on the map");
      return;
    }

    const data = {
      ...form,
      reportLocation: location,
      vessel: vessel
    };

    try {
      await axios.post("http://localhost:5000/api/reports", data, {
        headers: {
          Authorization: `Bearer YOUR_TOKEN`
        }
      });

      alert("Report submitted successfully");
    } catch (error) {
      console.error(error);
      alert("Error submitting report");
    }
  };

  return (
    <div>
        
      <h2>Submit a Report</h2>

      <input
        placeholder="Title"
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
      />

      <textarea
        placeholder="Description"
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
      />

      Map Component
      <VesselMap
        onLocationSelect={setLocation}
        onVesselSelect={setVessel}
      />

      <button onClick={handleSubmit}>
        Submit Report
      </button>
    </div>
  );
}