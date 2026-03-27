import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import HazardAdminDashboard from "./pages/dashboard/HazardAdminDashboard";


export default function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard/hazard" element={<HazardAdminDashboard />} />


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
         

        </Routes>
      </Router>
    </>
  );
}
