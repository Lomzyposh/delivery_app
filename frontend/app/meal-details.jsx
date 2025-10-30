import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator, Animated } from 'react-native';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import FoodDetailHeader from '../components/FoodDetailsHeader';
import { API_URL } from '../hooks/api';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';

/* ---------- helpers ---------- */
const canonicalAddonIds = (addons = []) =>
    (addons || [])
        .map(a => a?.addOnId ?? a?._id ?? a?.id ?? a)
        .filter(Boolean)
        .map(String)
        .sort();

const sameAddonSet = (a = [], b = []) => {
    const A = canonicalAddonIds(a);
    const B = canonicalAddonIds(b);
    if (A.length !== B.length) return false;
    for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
    return true;
};

export default function FoodDetailsDemo() {
    const params = useLocalSearchParams();
    const rawId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
    const mealId = useMemo(() => String(rawId || ''), [rawId]);

    const [meal, setMeal] = useState(null);
    const [pageLoading, setLoading] = useState(true);
    const [addons, setAddons] = useState(null);
    const [selectedAddonsIds, setSelectedAddonsIds] = useState([]);
    const [busy, setBusy] = useState(false);

    const { theme } = useTheme();
    const s = styles(theme);
    const { cart, loading: cartLoading, addToCart, setQuantity, removeItem } = useCart();

    // ---- toast state ----
    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const toastAnim = useRef(new Animated.Value(0)).current;

    const showToast = useCallback((msg) => {
        setToastMsg(msg);
        setToastVisible(true);
        Animated.timing(toastAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setTimeout(() => {
                Animated.timing(toastAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => setToastVisible(false));
            }, 1500);
        });
    }, [toastAnim]);

    // -------------- addons + meal fetch ------------------
    const toggleAddOn = (id) => {
        setSelectedAddonsIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        if (!mealId) return;
        const fetchMeal = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/mealDetails/${encodeURIComponent(mealId)}`);
                const data = res.ok ? await res.json() : null;
                setMeal(data);
                setAddons(Array.isArray(data?.addons) ? data.addons : []);
            } catch {
                setMeal(null);
                setAddons([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMeal();
    }, [mealId]);

    const payloadAddons = useMemo(
        () => selectedAddonsIds.map((id) => ({ addOnId: String(id) })),
        [selectedAddonsIds]
    );

    const matchingLine = useMemo(() => {
        if (!cart?.items?.length || !mealId) return null;
        const mid = String(mealId);
        for (const it of cart.items) {
            const f = it?.foodId;
            const fid = typeof f === 'string' ? f : f?._id ?? f?.id;
            if (fid && String(fid) === mid && sameAddonSet(it.addons, payloadAddons)) {
                return it;
            }
        }
        return null;
    }, [cart, mealId, payloadAddons]);

    const onAdd = useCallback(async () => {
        if (!mealId || busy) return;
        setBusy(true);
        try {
            if (matchingLine) {
                await setQuantity(matchingLine._id, (matchingLine.quantity || 1) + 1);
                showToast('Quantity updated');
            } else {
                await addToCart({ foodId: mealId, quantity: 1, addons: payloadAddons });
                showToast('Added to cart');
            }
        } catch (e) {
            console.warn('Add to cart failed:', e?.message || e);
        } finally {
            setBusy(false);
        }
    }, [mealId, matchingLine, addToCart, setQuantity, payloadAddons, busy, showToast]);

    const onInc = useCallback(async () => {
        if (busy) return;
        if (!matchingLine) return onAdd();
        setBusy(true);
        try {
            await setQuantity(matchingLine._id, (matchingLine.quantity || 1) + 1);
            showToast('Quantity increased');
        } finally {
            setBusy(false);
        }
    }, [matchingLine, setQuantity, onAdd, busy, showToast]);

    const onDec = useCallback(async () => {
        if (busy || !matchingLine) return;
        const q = (matchingLine.quantity || 1) - 1;
        setBusy(true);
        try {
            if (q <= 0) {
                await removeItem(matchingLine._id);
                showToast('Item removed');
            } else {
                await setQuantity(matchingLine._id, q);
                showToast('Quantity decreased');
            }
        } finally {
            setBusy(false);
        }
    }, [matchingLine, setQuantity, removeItem, busy, showToast]);

    const formatPrice = (p) => Number(p ?? 0).toLocaleString();

    if (pageLoading) {
        return (
            <View style={s.loaderBox}>
                <ActivityIndicator size={50} color={theme.tint || '#ff6600'} />
            </View>
        );
    }

    const GetAddons = ({ addonsArr }) => {
        if (!addonsArr?.length)
            return <Text style={{ color: theme.sub || '#666' }}>No add-ons available.</Text>;

        return (
            <ScrollView style={{ marginBottom: 80 }}>
                {addonsArr.map((item) => {
                    const id = item._id || item.id;
                    const selected = selectedAddonsIds.includes(id);
                    return (
                        <TouchableOpacity
                            key={String(id)}
                            onPress={() => toggleAddOn(id)}
                            disabled={busy || cartLoading}
                            style={[
                                s.addOnItem,
                                selected && s.addOnSelected,
                                (busy || cartLoading) && { opacity: 0.6 },
                            ]}
                        >
                            <Text style={s.addOnName}>{item.name}</Text>
                            <Text style={s.addOnPrice}>+ ₦{formatPrice(item.price)}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    return (
        <View style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.imageCont}>
                    <Image source={{ uri: meal?.image }} style={s.image} contentFit="cover" />
                    <FoodDetailHeader foodId={mealId} />
                </View>

                <View style={s.content}>
                    <Text style={s.title}>{meal.name}</Text>
                    <Text style={s.price}>₦{formatPrice(meal.price)}</Text>
                    <Text style={s.desc}>{meal.description}</Text>

                    <Text style={s.addOnHeader}>Add-ons</Text>
                    <GetAddons addonsArr={addons} />
                </View>
            </ScrollView>

            {!matchingLine ? (
                <View style={s.bottomBar}>
                    <TouchableOpacity
                        style={[s.addToCartBtn, (busy || cartLoading) && { opacity: 0.6 }]}
                        onPress={onAdd}
                        disabled={busy || cartLoading}
                    >
                        {busy ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="cart-outline" size={22} color="#fff" />
                        )}
                        <Text style={s.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={[s.bottomBar, { borderTopWidth: 0, backgroundColor: theme.background }]}>
                    <View style={s.qtyWrap}>
                        <TouchableOpacity
                            onPress={onDec}
                            style={[s.qtyBtn, s.pill, (busy || cartLoading) && { opacity: 0.6 }]}
                            disabled={busy || cartLoading}
                        >
                            <Text style={s.qtyTxt}>−</Text>
                        </TouchableOpacity>
                        <Text style={s.qtyVal}>{matchingLine.quantity}</Text>
                        <TouchableOpacity
                            onPress={onInc}
                            style={[s.qtyBtn, s.pill, (busy || cartLoading) && { opacity: 0.6 }]}
                            disabled={busy || cartLoading}
                        >
                            <Text style={s.qtyTxt}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ---- custom toast ---- */}
            {toastVisible && (
                <Animated.View
                    style={[
                        s.toastBox,
                        {
                            opacity: toastAnim,
                            transform: [
                                {
                                    translateY: toastAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={s.toastText}>{toastMsg}</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = (theme) =>
    StyleSheet.create({
        loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
        container: { flex: 1, backgroundColor: theme.background },
        image: {
            width: '100%',
            height: 300,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            backgroundColor: theme.field,
        },
        content: { paddingHorizontal: 20, paddingTop: 20 },
        title: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 5 },
        price: { fontSize: 18, color: theme.tint || '#ff6600', fontWeight: '600', marginBottom: 8 },
        desc: { fontSize: 15, color: theme.text, lineHeight: 22, marginBottom: 25 },
        addOnHeader: { fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 12 },
        addOnItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border || '#ddd',
            backgroundColor: theme.card,
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
        },
        addOnSelected: { backgroundColor: theme.field, borderColor: theme.tint || '#ff6600' },
        addOnName: { fontSize: 16, color: theme.text },
        addOnPrice: { fontSize: 16, fontWeight: '600', color: theme.tint || '#ff6600' },
        imageCont: { flex: 1, width: '100%' },
        bottomBar: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingVertical: 15,
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: theme.border || '#eee',
        },
        addToCartBtn: {
            backgroundColor: theme.tint || '#ff6600',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 25,
            paddingVertical: 15,
            gap: 8,
        },
        addToCartText: { color: theme.onTint || '#fff', fontSize: 17, fontWeight: '700' },
        qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 16, justifyContent: 'center' },
        qtyBtn: {
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.border || '#d1d5db',
            backgroundColor: theme.card,
        },
        pill: { borderRadius: 9999 },
        qtyTxt: { fontSize: 22, fontWeight: '800', color: theme.text },
        qtyVal: { fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center', color: theme.tint || '#ff6600' },

        // --- toast style ---
        toastBox: {
            position: 'absolute',
            bottom: 90,
            left: 20,
            right: 20,
            backgroundColor: theme.tint || '#ff6600',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 12,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 4,
        },
        toastText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    });