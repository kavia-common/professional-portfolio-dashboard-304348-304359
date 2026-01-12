import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

// Mock useAuth hook to control auth behavior
jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require("../auth/AuthContext");

function renderWithRouter(ui, { route = "/" } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

test("login page validates inputs and calls login on submit", async () => {
  const login = jest.fn().mockResolvedValue(true);

  useAuth.mockReturnValue({
    login,
    authLoading: false,
  });

  renderWithRouter(<LoginPage />, { route: "/login" });

  // Try submit immediately (should show validation)
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
  expect(await screen.findByText(/username is required/i)).toBeInTheDocument();

  // Fill valid inputs and submit
  fireEvent.change(screen.getByPlaceholderText("username"), { target: { value: "demo" } });
  fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });

  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(login).toHaveBeenCalledWith({ username: "demo", password: "password123" });
  });
});

test("register page validates inputs and calls register on submit", async () => {
  const register = jest.fn().mockResolvedValue(true);

  useAuth.mockReturnValue({
    register,
    authLoading: false,
  });

  renderWithRouter(<RegisterPage />, { route: "/register" });

  // Invalid email triggers validation
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "bad" } });
  fireEvent.change(screen.getByPlaceholderText("username"), { target: { value: "us" } });
  fireEvent.change(screen.getByPlaceholderText(/at least 6 characters/i), { target: { value: "123" } });

  fireEvent.click(screen.getByRole("button", { name: /create account/i }));
  expect(await screen.findByText(/a valid email is required/i)).toBeInTheDocument();

  // Fix inputs
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "ok@example.com" } });
  fireEvent.change(screen.getByPlaceholderText("username"), { target: { value: "user123" } });
  fireEvent.change(screen.getByPlaceholderText(/at least 6 characters/i), { target: { value: "password123" } });

  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  await waitFor(() => {
    expect(register).toHaveBeenCalledWith({
      email: "ok@example.com",
      username: "user123",
      password: "password123",
    });
  });
});
