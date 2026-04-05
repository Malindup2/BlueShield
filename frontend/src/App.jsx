import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CreateReport from "./pages/SubmitAReport";

// Layout & Protection
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Dashboards
import FishermanHome from "./pages/dashboards/fisherman/FishermanHome";
import OfficerHome from "./pages/dashboards/officer/OfficerHome";
import IllegalAdminHome from "./pages/dashboards/illegal-admin/IllegalAdminHome";
import HazardAdminHome from "./pages/dashboards/hazard-admin/HazardAdminHome";
import SystemAdminHome from "./pages/dashboards/system-admin/SystemAdminHome";

// Static Info Pages
import PrivacyPolicy from "./pages/info/PrivacyPolicy";
import TermsOfService from "./pages/info/TermsOfService";
import SafetyGuides from "./pages/info/SafetyGuides";

export default function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Dashboard Layout wrapper for authenticated users */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            
            {/* COMMON / SHARED */}
            <Route 
              path="report" 
              element={
                <ProtectedRoute allowedRoles={["FISHERMAN", "OFFICER", "SYSTEM_ADMIN"]}>
                  <CreateReport />
                </ProtectedRoute>
              } 
            />

            {/* FISHERMAN */}
            <Route path="fisherman" element={<ProtectedRoute allowedRoles={["FISHERMAN"]}><FishermanHome /></ProtectedRoute>} />
            <Route path="fisherman/map" element={<ProtectedRoute allowedRoles={["FISHERMAN"]}><FishermanHome /></ProtectedRoute>} />

            {/* OFFICER */}
            <Route path="officer" element={<ProtectedRoute allowedRoles={["OFFICER"]}><OfficerHome /></ProtectedRoute>} />
            <Route path="officer/tracking" element={<ProtectedRoute allowedRoles={["OFFICER"]}><OfficerHome /></ProtectedRoute>} />

            {/* ILLEGAL ADMIN */}
            <Route path="illegal-admin" element={<ProtectedRoute allowedRoles={["ILLEGAL_ADMIN", "SYSTEM_ADMIN"]}><IllegalAdminHome /></ProtectedRoute>} />
            <Route path="illegal-admin/reports" element={<ProtectedRoute allowedRoles={["ILLEGAL_ADMIN", "SYSTEM_ADMIN"]}><IllegalAdminHome /></ProtectedRoute>} />
            <Route path="illegal-admin/zones" element={<ProtectedRoute allowedRoles={["ILLEGAL_ADMIN", "SYSTEM_ADMIN"]}><IllegalAdminHome /></ProtectedRoute>} />
            <Route path="illegal-admin/cases" element={<ProtectedRoute allowedRoles={["ILLEGAL_ADMIN", "SYSTEM_ADMIN"]}><IllegalAdminHome /></ProtectedRoute>} />

            {/* HAZARD ADMIN */}
            <Route path="hazard-admin" element={<ProtectedRoute allowedRoles={["HAZARD_ADMIN", "SYSTEM_ADMIN"]}><HazardAdminHome /></ProtectedRoute>} />
            <Route path="hazard-admin/reports" element={<ProtectedRoute allowedRoles={["HAZARD_ADMIN", "SYSTEM_ADMIN"]}><HazardAdminHome /></ProtectedRoute>} />
            <Route path="hazard-admin/zones" element={<ProtectedRoute allowedRoles={["HAZARD_ADMIN", "SYSTEM_ADMIN"]}><HazardAdminHome /></ProtectedRoute>} />
            <Route path="hazard-admin/cases" element={<ProtectedRoute allowedRoles={["HAZARD_ADMIN", "SYSTEM_ADMIN"]}><HazardAdminHome /></ProtectedRoute>} />

            {/* SYSTEM ADMIN */}
            <Route path="system-admin" element={<ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}><SystemAdminHome /></ProtectedRoute>} />
            <Route path="system-admin/users" element={<ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}><SystemAdminHome /></ProtectedRoute>} />

          </Route>

          {/* Static Info Pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/safety" element={<SafetyGuides />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}
