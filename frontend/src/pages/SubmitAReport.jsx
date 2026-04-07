import React, { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, AlertCircle, FileUp, Shield, Ship } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import VesselMap from "../components/vesselMap";
import API_BASE_URL from "../config/api";

export default function SubmitAReport() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    reportType: "ILLEGAL_FISHING",
    severity: "MEDIUM",
    isAnonymous: false,
    vesselName: "",
    vesselMmsi: "",
    vesselLatitude: "",
    vesselLongitude: "",
  });

  // Client-side validation
  const isFormValid = useMemo(() => {
    return form.title.trim() && form.description.trim() && location;
  }, [form.title, form.description, location]);

  // Memoized callback functions to prevent VesselMap re-renders
  const handleLocationSelect = useCallback((locationData) => {
    setLocation(locationData);
  }, []);

  const handleVesselSelect = useCallback((vesselData) => {
    setForm((prev) => ({
      ...prev,
      vesselName: vesselData.name || "",
      vesselMmsi: vesselData.mmsi || "",
      vesselLatitude: vesselData.latitude || "",
      vesselLongitude: vesselData.longitude || "",
    }));
  }, []);

  const REPORT_TYPES = [
    { value: "ILLEGAL_FISHING", label: "Illegal Fishing" },
    { value: "HAZARD", label: "Marine Hazard" },
    { value: "ENVIRONMENTAL", label: "Environmental Concern" },
    { value: "OTHER", label: "Other" },
  ];

  const SEVERITIES = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!form.title.trim()) {
        toast.error("Please enter a report title");
        setLoading(false);
        return;
      }

      if (!form.description.trim()) {
        toast.error("Please enter a description");
        setLoading(false);
        return;
      }

      if (!location) {
        toast.error("Please select a location on the map");
        setLoading(false);
        return;
      }

      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to submit a report");
        navigate("/login");
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("reportType", form.reportType);
      formData.append("severity", form.severity);
      formData.append("isAnonymous", form.isAnonymous);

      // Append vessel info if provided
      if (form.vesselName || form.vesselMmsi) {
        formData.append("vessel", JSON.stringify({
          name: form.vesselName,
          mmsi: form.vesselMmsi,
          latitude: form.vesselLatitude ? parseFloat(form.vesselLatitude) : undefined,
          longitude: form.vesselLongitude ? parseFloat(form.vesselLongitude) : undefined,
        }));
      }

      formData.append("location", JSON.stringify({
        type: "Point",
        coordinates: [location.lng, location.lat],
        address: location.address || "",
      }));

      // Add attachments
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const headers = {
        "Content-Type": "multipart/form-data",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      await axios.post(`${API_BASE_URL}/api/reports`, formData, { headers });

      toast.success("Report submitted successfully!");
      setForm({
        title: "",
        description: "",
        reportType: "ILLEGAL_FISHING",
        severity: "MEDIUM",
        isAnonymous: false,
        vesselName: "",
        vesselMmsi: "",
        vesselLatitude: "",
        vesselLongitude: "",
      });
      setLocation(null);
      setAttachments([]);
      navigate("/dashboard/my-reports");
    } catch (error) {
      console.error("Report submission error:", error);
      console.error("Response data:", error.response?.data);
      const message =
        error.response?.data?.message || "Error submitting report. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left side: Map (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center overflow-hidden h-screen p-8">
        <div className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl">
          <VesselMap
            onLocationSelect={handleLocationSelect}
            onVesselSelect={handleVesselSelect}
            showGetLocation={true}
          />
        </div>
      </div>

      {/* Right side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/"
              className="inline-flex items-center text-sm font-semibold text-blue-600 mb-8 hover:text-blue-700 transition"
            >
              &larr; Back to Home
            </Link>

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Submit a Report
            </h2>
            <p className="mt-2 text-slate-500 mb-8">
              Help protect our marine environment by reporting suspicious activities.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="title">
                  Report Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={form.title}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    placeholder="Brief title of the incident"
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={form.description}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition resize-none"
                  placeholder="Provide detailed information about the incident..."
                  rows="4"
                />
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="reportType">
                  Report Type
                </label>
                <select
                  id="reportType"
                  name="reportType"
                  value={form.reportType}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white"
                >
                  {REPORT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="severity">
                  Severity Level
                </label>
                <select
                  id="severity"
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white"
                >
                  {SEVERITIES.map((severity) => (
                    <option key={severity.value} value={severity.value}>
                      {severity.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vessel Information */}
              <div className="space-y-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Ship className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-700">Vessel Information</span>
                  <span className="text-xs text-slate-400">(click a vessel on the map or enter manually)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-600" htmlFor="vesselName">Vessel Name</label>
                    <input
                      id="vesselName"
                      name="vesselName"
                      type="text"
                      value={form.vesselName}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm"
                      placeholder="e.g. MV BlueSky"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-600" htmlFor="vesselMmsi">MMSI</label>
                    <input
                      id="vesselMmsi"
                      name="vesselMmsi"
                      type="text"
                      value={form.vesselMmsi}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm"
                      placeholder="e.g. 111111111"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600" htmlFor="vesselLatitude">Latitude</label>
                    <input
                      id="vesselLatitude"
                      name="vesselLatitude"
                      type="number"
                      step="any"
                      value={form.vesselLatitude}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm"
                      placeholder="e.g. 6.9271"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600" htmlFor="vesselLongitude">Longitude</label>
                    <input
                      id="vesselLongitude"
                      name="vesselLongitude"
                      type="number"
                      step="any"
                      value={form.vesselLongitude}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm"
                      placeholder="e.g. 79.8612"
                    />
                  </div>
                </div>

                {form.vesselName && (
                  <p className="text-xs text-emerald-700">
                    Selected: {form.vesselName} {form.vesselMmsi ? `(MMSI: ${form.vesselMmsi})` : ''}
                  </p>
                )}
              </div>

              {/* Map on mobile/tablet */}
              <div className="lg:hidden space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Select Location on Map
                </label>
                <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200">
                  <VesselMap
                    onLocationSelect={handleLocationSelect}
                    onVesselSelect={handleVesselSelect}
                    showGetLocation={true}
                  />
                </div>
                {location && (
                  <p className="text-sm text-slate-600">
                    📍 Location selected: {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                  </p>
                )}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="attachments">
                  Attachments (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileUp className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="attachments"
                    name="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  />
                </div>
                {attachments.length > 0 && (
                  <p className="text-sm text-slate-600">
                    {attachments.length} file(s) selected
                  </p>
                )}
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  id="isAnonymous"
                  name="isAnonymous"
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
                />
                <label
                  htmlFor="isAnonymous"
                  className="text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Submit as anonymous
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit Report"}
                {!loading && <AlertCircle className="w-4 h-4" />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Need help?{" "}
              <a href="#" className="font-semibold text-blue-600 hover:text-blue-500 transition">
                Contact support
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}