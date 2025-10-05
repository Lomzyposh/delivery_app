import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const API_URL = "http://192.168.121.224:5000";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(null);
  const [booted, setBooted] = useState(false);

  // Load refresh token on app start
  useEffect(() => {
    (async () => {
      const refresh = await SecureStore.getItemAsync("refresh");
      console.log("🔑 Refresh token from SecureStore:", refresh);

      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/refresh`, { refresh });
          setAccess(data.access);

          const payload = JSON.parse(atob(data.access.split(".")[1]));
          setUser({ id: payload.sub, role: payload.role });

        } catch {
          await SecureStore.deleteItemAsync("refresh");
        }
      }
      setBooted(true);
    })();
  }, []);

  // attach token to all axios requests
  axios.interceptors.request.use((config) => {
    if (access) config.headers.Authorization = `Bearer ${access}`;
    return config;
  });

  // auto-refresh when token expires
  axios.interceptors.response.use(
    (res) => res,
    async (err) => {
      if (err.response?.status === 401) {
        const refresh = await SecureStore.getItemAsync("refresh");
        if (refresh) {
          try {
            const { data } = await axios.post(`${API_URL}/refresh`, { refresh });
            setAccess(data.access);
            err.config.headers.Authorization = `Bearer ${data.access}`;
            return axios(err.config); // retry once
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

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_URL}/login`, { email, password });
    setUser(data.user);
    setAccess(data.access);
    console.log('Saving Refresh: ', data.refresh);
    await SecureStore.setItemAsync("refresh", data.refresh);
    const saved = await SecureStore.getItemAsync("refresh");
    console.log("📦 Saved refresh token:", saved);
  };

  const signup = async (name, email, password) => {
    const { data } = await axios.post(`${API_URL}/signup`, { name, email, password });
    setUser(data.user);
    setAccess(data.access);
    await SecureStore.setItemAsync("refresh", data.refresh);
  };

  const logout = async () => {
    const refresh = await SecureStore.getItemAsync("refresh");
    await axios.post(`${API_URL}/logout`, { refresh }).catch(() => { });
    await SecureStore.deleteItemAsync("refresh");
    setUser(null);
    setAccess(null);
  };

  return (
    <AuthContext.Provider value={{ user, access, booted, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
