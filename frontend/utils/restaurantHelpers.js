// utils/restaurantHelpers.js
export function isOpenNow(openHours = [], now = new Date(), tz = "Africa/Lagos") {
    try {
        const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: tz }).format(now);
        const hhmm = new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz
        }).format(now); // -> "08:23"
        const slot = openHours.find(d => d.day === dayName);
        if (!slot || slot.isClosed) return false;
        return hhmm >= slot.open && hhmm <= slot.close;
    } catch { return false; }
}

export function haversineKm(lat1, lon1, lat2, lon2) {
    if ([lat1, lon1, lat2, lon2].some(v => v == null)) return null;
    const R = 6371;
    const toRad = d => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function estimateDeliveryFee(deliveryFee = {}, distanceKm = 0) {
    const base = Number(deliveryFee.base ?? 0);
    const perKm = Number(deliveryFee.perKm ?? 0);
    return Math.max(0, Math.round(base + perKm * Math.max(0, distanceKm)));
}
