import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CreateReport from "./pages/SubmitAReport";
import MyReports from "./pages/MyReports";

// Layout & Protection
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Dashboards
import FishermanHome from "./pages/dashboards/fisherman/FishermanHome";
import OfficerHome from "./pages/dashboards/officer/OfficerHome";
import OfficerCases from "./pages/dashboards/officer/OfficerCases";
import OfficerTeam from "./pages/dashboards/officer/OfficerTeam";
import OfficerEvidence from "./pages/dashboards/officer/OfficerEvidence";
import OfficerAIRisk from "./pages/dashboards/officer/OfficerAIRisk";

import IllegalAdminHome from "./pages/dashboards/illegal-admin/IllegalAdminHome";
import HazardAdminHome from "./pages/dashboards/hazard-admin/HazardAdminHome";
import SystemAdminHome from "./pages/dashboards/system-admin/SystemAdminHome";
import ModulePlaceholder from "./pages/common/ModulePlaceholder";

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

            <Route
              path="my-reports"
              element={
                <ProtectedRoute allowedRoles={["FISHERMAN", "OFFICER", "SYSTEM_ADMIN"]}>
                  <MyReports />
                </ProtectedRoute>
              }
            />

            {/* FISHERMAN */}
            <Route path="fisherman" element={<ProtectedRoute allowedRoles={["FISHERMAN"]}><FishermanHome /></ProtectedRoute>} />
            <Route
              path="fisherman/map"
              element={
                <ProtectedRoute allowedRoles={["FISHERMAN"]}>
                  <ModulePlaceholder title="Live Map" note="Fisherman live map module will be implemented by the team." />
                </ProtectedRoute>
              }
            />

            {/* OFFICER */}
            <Route path="officer" element={<ProtectedRoute allowedRoles={["OFFICER"]}><OfficerHome /></ProtectedRoute>} />
            <Route path="officer/cases" element={<ProtectedRoute allowedRoles={["OFFICER"]}><OfficerCases /></ProtectedRoute>} />
            <Route path="officer/team" element={<ProtectedRoute allowedRoles={["OFFICER"]}><OfficerTeam /></ProtectedRoute>} />
            <Route path="officer/evidence" element={<ProtectedRoute allowedRoles={["OFFICER"]}><OfficerEvidence /></ProtectedRoute>} />
            <Route path="officer/ai-risk" element={<ProtectedRoute allowedRoles={["OFFICER"]}><OfficerAIRisk /></ProtectedRoute>} />

            {/* ILLEGAL ADMIN */}
            <Route path="illegal-admin" element={<ProtectedRoute allowedRoles={["ILLEGAL_ADMIN", "SYSTEM_ADMIN"]}><IllegalAdminHome /></ProtectedRoute>} />
            <Route
              path="illegal-admin/reports"
              element={
                <ProtectedRoute allowedRoles={["ILLEGAL_ADMIN", "SYSTEM_ADMIN"]}>
                  <ModulePlaceholder title="Illegal Admin Reports" note="This module is reserved for team implementation." />
                </ProtectedRoute>
              }
            />
            <Route
              path="illegal-admin/zones"
              element={
                <ProtectedRoute allowedRoles={["ILLEGAL_ADMIN", "SYSTEM_ADMIN"]}>
                  <ModulePlaceholder title="Illegal Admin Zones" note="This module is reserved for team implementation." />
                </ProtectedRoute>
              }
            />
            <Route
              path="illegal-admin/cases"
              element={
                <ProtectedRoute allowedRoles={["ILLEGAL_ADMIN", "SYSTEM_ADMIN"]}>
                  <ModulePlaceholder title="Illegal Admin Cases" note="This module is reserved for team implementation." />
                </ProtectedRoute>
              }
            />

            {/* HAZARD ADMIN */}
            <Route path="hazard-admin" element={<ProtectedRoute allowedRoles={["HAZARD_ADMIN", "SYSTEM_ADMIN"]}><HazardAdminHome /></ProtectedRoute>} />
            <Route
              path="hazard-admin/reports"
              element={
                <ProtectedRoute allowedRoles={["HAZARD_ADMIN", "SYSTEM_ADMIN"]}>
                  <ModulePlaceholder title="Hazard Admin Reports" note="This module is reserved for team implementation." />
                </ProtectedRoute>
              }
            />
            <Route
              path="hazard-admin/zones"
              element={
                <ProtectedRoute allowedRoles={["HAZARD_ADMIN", "SYSTEM_ADMIN"]}>
                  <ModulePlaceholder title="Hazard Admin Zones" note="This module is reserved for team implementation." />
                </ProtectedRoute>
              }
            />
            <Route
              path="hazard-admin/cases"
              element={
                <ProtectedRoute allowedRoles={["HAZARD_ADMIN", "SYSTEM_ADMIN"]}>
                  <ModulePlaceholder title="Hazard Admin Cases" note="This module is reserved for team implementation." />
                </ProtectedRoute>
              }
            />

            {/* SYSTEM ADMIN */}
            <Route path="system-admin" element={<ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}><SystemAdminHome /></ProtectedRoute>} />
            <Route
              path="system-admin/users"
              element={
                <ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}>
                  <ModulePlaceholder title="Manage Users" note="User management module will be implemented by the team." />
                </ProtectedRoute>
              }
            />

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
