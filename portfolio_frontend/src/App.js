import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import { ToastProvider } from "./ui/ToastContext";
import { AuthProvider } from "./auth/AuthContext";
import { AdminRoute, ProtectedRoute } from "./routes/ProtectedRoute";

import DashboardLayout from "./layout/DashboardLayout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardHomePage from "./pages/DashboardHomePage";
import ProjectsPage from "./pages/ProjectsPage";
import SkillsPage from "./pages/SkillsPage";
import ProfilePage from "./pages/ProfilePage";
import ContactPage from "./pages/ContactPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminContactInboxPage from "./pages/AdminContactInboxPage";

// PUBLIC_INTERFACE
function App() {
  /** Application entry: providers + routes. */
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Public routes */}
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected dashboard */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHomePage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="skills" element={<SkillsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="contact-inbox" element={<AdminContactInboxPage />} />

                {/* Admin section */}
                <Route element={<AdminRoute />}>
                  <Route path="admin/users" element={<AdminUsersPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
