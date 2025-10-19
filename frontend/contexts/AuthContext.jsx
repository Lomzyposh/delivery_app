import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_URL } from "../hooks/api";

const AuthContext = createContext(null);

function normalizeUser(u) {
  if (!u) return null;
  const id = u.id || u._id || u.userId || u.sub || null;
  return id ? { ...u, id } : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(null);
  const [cart, setCart] = useState(null);
  const [booted, setBooted] = useState(false);

  const userId = user?.id || null;

  useEffect(() => {
    const reqInt = axios.interceptors.request.use((config) => {
      if (access) config.headers.Authorization = `Bearer ${access}`;
      return config;
    });

    const resInt = axios.interceptors.response.use(
      (res) => res,
      async (err) => {
        if (err.response?.status === 401) {
          const refresh = await SecureStore.getItemAsync("refresh");
          if (refresh) {
            try {
              const { data } = await axios.post(`${API_URL}/refresh`, { refresh });
              setAccess(data.access);
              err.config.headers.Authorization = `Bearer ${data.access}`;
              return axios(err.config);
            } catch {
              await SecureStore.deleteItemAsync("refresh");
              setUser(null);
              setAccess(null);
            }
          }
        }
        throw err;
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInt);
      axios.interceptors.response.eject(resInt);
    };
  }, [access]);

  // Boot: try refresh token → set access + user
  useEffect(() => {
    (async () => {
      const refresh = await SecureStore.getItemAsync("refresh");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/refresh`, { refresh });
          setAccess(data.access);
          const payload = JSON.parse(atob(data.access.split(".")[1]));
          setUser(normalizeUser({ id: payload.sub, role: payload.role }));
        } catch {
          await SecureStore.deleteItemAsync("refresh");
        }
      }
      setBooted(true);
    })();
  }, []);

  // Keep it simple: load cart whenever we have a userId
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/cart?userId=${encodeURIComponent(userId)}`);
        const data = await res.json();
        setCart(data);
        console.log("Cart gotten / Created");
      } catch (e) {
        console.warn("loadCart failed:", e.message);
      }
    })();
  }, [userId]);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_URL}/login`, { email, password });
    setAccess(data.access);
    setUser(normalizeUser(data.user)); // ✅ ensures .id exists
    await SecureStore.setItemAsync("refresh", data.refresh);
  };

  const signup = async (name, email, password) => {
    const { data } = await axios.post(`${API_URL}/signup`, { name, email, password });
    setAccess(data.access);
    setUser(normalizeUser(data.user));
    await SecureStore.setItemAsync("refresh", data.refresh);
  };

  const checkEmail = async (email) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/forgot-password`, { email: email.trim().toLowerCase() });
      return data;

    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;
        const msg = data?.message || (status === 404 ? 'Email not found. Please try again.' : 'Request failed.');
        throw new Error(msg);
      }
      throw new Error('Network error. Please check your internet connection.');
    }

  }

  const logout = async () => {
    const refresh = await SecureStore.getItemAsync("refresh");
    await axios.post(`${API_URL}/logout`, { refresh }).catch(() => { });
    await SecureStore.deleteItemAsync("refresh");
    setUser(null);
    setAccess(null);
    setCart(null);
  };

  const value = useMemo(
    () => ({
      user,
      userId,
      access,
      cart,
      booted,
      login,
      signup,
      logout,
      checkEmail
    }),
    [user, userId, access, cart, booted]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
