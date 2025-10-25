// contexts/FavoritesContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { API_URL } from "../hooks/api";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
    const { userId, booted } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!booted) return;
        if (!userId) { setFavorites([]); setReady(true); return; }

        (async () => {
            try {
                const { data } = await axios.post(`${API_URL}/api/favorites/list`, { userId });
                setFavorites((data.foodIds || []).map(String));
            } catch (e) {
                console.log("load favorites failed:", e.message);
            } finally {
                setReady(true);
            }
        })();
    }, [booted, userId]);

    const isFavorite = (foodId) => favorites.includes(String(foodId));

    const toggleFavorite = async (foodId) => {
        const fid = String(foodId);
        const wasFav = isFavorite(fid);

        setFavorites(prev => wasFav ? prev.filter(id => id !== fid) : [...prev, fid]);

        try {
            if (wasFav) {
                await axios.post(`${API_URL}/api/favorites/remove`, { userId, foodId: fid });
            } else {
                await axios.post(`${API_URL}/api/favorites/add`, { userId, foodId: fid });
            }
        } catch (e) {
            setFavorites(prev => wasFav ? [...prev, fid] : prev.filter(id => id !== fid));
        }
    };

    const value = useMemo(() => ({ ready, favorites, isFavorite, toggleFavorite }), [ready, favorites]);
    return <FavoritesContext.Provider value={value}>
        {children}
    </FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
