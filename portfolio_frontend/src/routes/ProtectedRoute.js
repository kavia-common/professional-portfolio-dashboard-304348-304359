import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// PUBLIC_INTERFACE
export function ProtectedRoute() {
  /** Require authentication for nested routes. */
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

// PUBLIC_INTERFACE
export function AdminRoute() {
  /** Require admin role for nested routes. */
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role !== "admin") {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
