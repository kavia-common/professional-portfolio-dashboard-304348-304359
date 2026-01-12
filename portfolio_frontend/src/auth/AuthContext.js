import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, configureApiClient } from "../api/client";
import { decodeJwtPayload, isJwtExpired } from "./jwt";
import { useToast } from "../ui/ToastContext";

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides authentication state and actions using in-memory JWT. */
  const { pushToast } = useToast();

  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const role = useMemo(() => {
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    return payload?.role || null;
  }, [token]);

  const isAuthenticated = !!token && !isJwtExpired(token);

  const logout = useCallback(
    (reason) => {
      setToken(null);
      setProfile(null);
      if (reason) {
        pushToast({ type: "error", title: "Signed out", message: reason });
      }
    },
    [pushToast]
  );

  // Configure API client hooks once
  useEffect(() => {
    configureApiClient({
      getToken: () => token,
      onUnauthorized: (err) => {
        // Token expired or user lacks permission; for 401 we force re-login.
        if (err?.status === 401) {
          logout("Your session expired. Please sign in again.");
        } else if (err?.status === 403) {
          pushToast({ type: "error", title: "Access denied", message: "You do not have permission to perform this action." });
        }
      },
    });
  }, [token, logout, pushToast]);

  const refreshProfile = useCallback(async () => {
    if (!token || isJwtExpired(token)) return;
    try {
      const p = await api.profile.getMe();
      setProfile(p);
    } catch {
      // handled globally
    }
  }, [token]);

  const login = useCallback(
    async ({ username, password }) => {
      setAuthLoading(true);
      try {
        const resp = await api.auth.login({ username, password });
        const accessToken = resp?.access_token;
        if (!accessToken) throw new Error("Missing access_token");
        setToken(accessToken);
        pushToast({ type: "success", title: "Welcome back", message: "You are signed in." });
        // Fetch profile after setting token (use local token to avoid race)
        try {
          const p = await api.profile.getMe();
          setProfile(p);
        } catch {
          // handled by global handler
        }
        return true;
      } catch (e) {
        pushToast({ type: "error", title: "Login failed", message: e?.message || "Unable to sign in." });
        return false;
      } finally {
        setAuthLoading(false);
      }
    },
    [pushToast]
  );

  const register = useCallback(
    async ({ email, username, password }) => {
      setAuthLoading(true);
      try {
        await api.auth.register({ email, username, password });
        pushToast({ type: "success", title: "Account created", message: "You can now sign in." });
        return true;
      } catch (e) {
        pushToast({ type: "error", title: "Registration failed", message: e?.message || "Unable to register." });
        return false;
      } finally {
        setAuthLoading(false);
      }
    },
    [pushToast]
  );

  // If token is set but profile missing, fetch it
  useEffect(() => {
    if (token && !isJwtExpired(token) && !profile) {
      refreshProfile();
    }
  }, [token, profile, refreshProfile]);

  const value = useMemo(
    () => ({
      token,
      role,
      profile,
      isAuthenticated,
      authLoading,
      login,
      register,
      logout,
      refreshProfile,
      setProfile, // used by Profile page after update
    }),
    [token, role, profile, isAuthenticated, authLoading, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
