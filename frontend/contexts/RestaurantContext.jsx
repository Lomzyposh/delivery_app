import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_URL } from "../hooks/api";

const RestaurantContext = createContext();

export function RestaurantProvider({ children }) {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRestaurants = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/restaurants`);
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            const data = await res.json();
            setRestaurants(data.items);
        } catch (err) {
            console.error("❌ Error fetching restaurants:", err);
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRestaurants();
    }, [fetchRestaurants]);

    const value = {
        restaurants,
        setRestaurants,
        loading,
        error,
        refetch: fetchRestaurants,
    };

    return (
        <RestaurantContext.Provider value={value}>
            {children}
        </RestaurantContext.Provider>
    );
}

export function useRestaurants() {
    const context = useContext(RestaurantContext);
    if (!context)
        throw new Error("useRestaurants must be used within a RestaurantProvider");
    return context;
}
