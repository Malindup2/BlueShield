import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";

/**
 * A wrapper for routes that require specific roles to access.
 * Usage: <Route element={<ProtectedRoute allowedRoles={['OFFICER', 'SYSTEM_ADMIN']} />} > ...
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();

  // TODO: Replace with real Auth Context/JWT checking
  // Using localStorage as a temporary mock for the structural layout
  const isAuthenticated = !!localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // 1. If no token, bounce to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If token exists but role is not in the allowed list, bounce to a fallback
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // If they have a token but wrong role, send them back to their appropriate home
    // For now, we'll send them to a generic access-denied or root
    return <Navigate to="/" replace />;
  }

  // 3. If authenticated and role is allowed, render the children (Outlet)
  // We use Outlet implicitly via React Router v6 by rendering children if passed, 
  // or Outlet if used as a Layout route
  return children ? children : <Outlet />;
}
