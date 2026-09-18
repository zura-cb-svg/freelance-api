import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import * as usersApi from "../api/users";
import { tokenStorage, onUnauthorized } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | guest

  const loadProfile = useCallback(async () => {
    try {
      const profile = await usersApi.getMyProfile();
      setUser(profile);
      setStatus("authenticated");
    } catch {
      tokenStorage.clear();
      setUser(null);
      setStatus("guest");
    }
  }, []);

  useEffect(() => {
    if (tokenStorage.get()) {
      loadProfile();
    } else {
      setStatus("guest");
    }
  }, [loadProfile]);

  useEffect(() => {
    return onUnauthorized(() => {
      setUser(null);
      setStatus("guest");
    });
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const data = await authApi.login({ email, password });
      const token = data?.access_token ?? data?.token;
      if (!token) {
        throw new Error("Login succeeded but no access token was returned by the server.");
      }
      tokenStorage.set(token);
      await loadProfile();
    },
    [loadProfile]
  );

  const signup = useCallback(async ({ full_name, email, password, role }) => {
    await authApi.signup({ full_name, email, password, role });
    // Signup response schema isn't specified by the backend, so we don't
    // assume it includes a token - route the user to log in explicitly.
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus("guest");
  }, []);

  const refreshProfile = useCallback(() => loadProfile(), [loadProfile]);

  const value = {
    user,
    setUser,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login,
    signup,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
