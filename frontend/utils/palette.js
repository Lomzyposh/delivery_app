export function usePalette(theme) {
    return React.useMemo(
        () => ({
            background: theme?.background ?? "#0b0c10",
            card: theme?.card ?? "#121319",
            text: theme?.text ?? "#ECEEF1",
            sub: theme?.sub ?? "#9aa0a9",
            border: theme?.border ?? "#242934",
            field: theme?.field ?? "#1a1c23",
            tint: theme?.tint ?? "#ff5900ff",
            lightTint: '#fb9a32ff',
            error: theme?.error ?? (Colors?.light?.error || "#E11D48"),
            success: theme?.success ?? (Colors?.light?.success || "#16a34a"),
            buttonDisabled: theme?.buttonDisabled ?? "#3b3d44",
            shadow: theme?.shadow ?? "rgba(0,0,0,0.4)",
            ripple: theme?.ripple ?? "rgba(255,255,255,0.08)",
            emptyBadge: theme?.emptyBadge ?? "#242934",
            price: theme?.price ?? "#22c55e",
        }),
        [theme]
    );
}