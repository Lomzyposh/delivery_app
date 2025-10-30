// contexts/CartContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { API_URL } from "../hooks/api";

const CartContext = createContext(null);

async function safeJsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error(`Expected JSON, got: ${ct}\n${text.slice(0, 200)}...`);
  }
  const data = JSON.parse(text || "{}");
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

// ✅ normalize add-ons to match backend schema exactly
const normalizeAddons = (addons = []) =>
  (addons || [])
    .map((a) => a?.addOnId ?? a?._id ?? a?.id ?? a)
    .filter(Boolean)
    .map((id) => ({ addOnId: String(id) }));

export function CartProvider({ children }) {
  const { userId, booted } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async (uid) =>
    safeJsonFetch(`${API_URL}/cart?userId=${encodeURIComponent(String(uid))}`);

  useEffect(() => {
    if (!booted) return;

    if (!userId) {
      setCart({ userId: null, items: [], subtotal: 0 });
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchCart(userId);
        if (alive) setCart(data);
      } catch (e) {
        console.warn("Load cart failed:", e.message);
        if (alive) setCart({ userId, items: [], subtotal: 0 });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId, booted]);

  const refreshCart = async () => {
    if (!userId) return;
    setCart(await fetchCart(userId));
  };

  const addToCart = async ({ foodId, quantity = 1, addons = [], notes }) => {
    const payload = {
      userId,
      foodId,
      quantity,
      addons: normalizeAddons(addons), // ✅ now matches backend
      notes,
    };
    const data = await safeJsonFetch(`${API_URL}/cart/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setCart(data);
  };

  const setQuantity = async (itemId, quantity) => {
    const data = await safeJsonFetch(`${API_URL}/cart/items/${itemId}/quantity`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, quantity }),
    });
    setCart(data);
  };

  const replaceAddons = async (itemId, addons, notes) => {
    const data = await safeJsonFetch(`${API_URL}/cart/items/${itemId}/addons`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        addons: normalizeAddons(addons), // ✅ normalized
        ...(notes != null ? { notes } : {}),
      }),
    });
    setCart(data);
  };

  const removeItem = async (itemId) => {
    const data = await safeJsonFetch(`${API_URL}/cart/items/${itemId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setCart(data);
  };

  const clearCart = async () => {
    const data = await safeJsonFetch(`${API_URL}/cart/clear`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setCart(data);
  };

  const value = useMemo(
    () => ({
      cart,
      setCart,
      loading,
      refreshCart,
      addToCart,
      setQuantity,
      replaceAddons,
      removeItem,
      clearCart,
    }),
    [cart, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
