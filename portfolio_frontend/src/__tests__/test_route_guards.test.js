import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AdminRoute, ProtectedRoute } from "../routes/ProtectedRoute";

jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require("../auth/AuthContext");

function renderRoutes(initialEntry, element) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route element={element}>
          <Route path="/protected" element={<div>Protected Content</div>} />
          <Route path="/admin" element={<div>Admin Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

test("ProtectedRoute redirects to /login when unauthenticated", () => {
  useAuth.mockReturnValue({ isAuthenticated: false });

  renderRoutes("/protected", <ProtectedRoute />);
  expect(screen.getByText("Login Page")).toBeInTheDocument();
});

test("ProtectedRoute renders Outlet when authenticated", () => {
  useAuth.mockReturnValue({ isAuthenticated: true });

  renderRoutes("/protected", <ProtectedRoute />);
  expect(screen.getByText("Protected Content")).toBeInTheDocument();
});

test("AdminRoute redirects to /dashboard when not admin", () => {
  useAuth.mockReturnValue({ isAuthenticated: true, role: "user" });

  renderRoutes("/admin", <AdminRoute />);
  expect(screen.getByText("Dashboard")).toBeInTheDocument();
});

test("AdminRoute renders Outlet when admin", () => {
  useAuth.mockReturnValue({ isAuthenticated: true, role: "admin" });

  renderRoutes("/admin", <AdminRoute />);
  expect(screen.getByText("Admin Content")).toBeInTheDocument();
});
