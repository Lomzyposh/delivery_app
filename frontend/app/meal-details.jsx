import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation, useRouter } from 'expo-router';
import FoodDetailHeader from '../components/FoodDetailsHeader';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../hooks/api';

const FoodDetailsDemo = () => {
    const [meal, setMeal] = useState(null);
    const [pageLoading, setLoading] = useState(true);
    const { theme } = useTheme();
    const currentStyles = styles(theme);

    const { cart, loading, addToCart, setQuantity, removeItem } = useCart();

    const mealId = '68dbd64b1813daf29d3998d5';

    const navigation = useNavigation();
    const router = useRouter();


    const [addons, setAddons] = useState(null);
    const [selectedAddonsIds, setSelectedAddonsIds] = useState([]);

    const toggleAddOn = (id) => {
        setSelectedAddonsIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        const fetchMeal = async () => {
            try {
                const res = await fetch(`${API_URL}/mealDetails/${mealId}`);
                if (!res.ok) {
                    console.log('Meal fetch failed. HTTP', res.status);
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setMeal(data);
                setAddons(data.addons || []);
            } catch (err) {
                console.log('ErrorX fetching meal: ', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMeal();
    }, []);

    const line = useMemo(() => {
        if (!cart?.items?.length) return null;
        return cart.items.find((i) => String(i.foodId) === String(mealId)) || null;
    }, [cart, mealId]);

    const payloadAddons = useMemo(
        () => selectedAddonsIds.map((id) => ({ addOnId: id })),
        [selectedAddonsIds]
    );

    const onAdd = async () => {
        await addToCart({ foodId: mealId, quantity: 1, addons: payloadAddons });
    };

    const onInc = async () => {
        if (!line) return onAdd();
        await setQuantity(line._id, (line.quantity || 1) + 1);
    };

    const onDec = async () => {
        if (!line) return;
        const q = (line.quantity || 1) - 1;
        if (q <= 0) {
            await removeItem(line._id);
        } else {
            await setQuantity(line._id, q);
        }
    };

    const formatPrice = (p) => {
        if (p == null) return '';
        const num = Number(p);
        // If you store cents, uncomment next line:
        // const dollars = num / 100;
        const dollars = num; // or keep as-is if already in dollars
        return dollars.toFixed(2);
    };

    if (pageLoading || !meal) {
        return (
            <View style={currentStyles.loaderBox}>
                <ActivityIndicator size={50} color="#4CAF50" />
            </View>
        );
    }

    const GetAddons = ({ addonsArr }) => {
        if (addonsArr == null) {
            return (
                <View style={currentStyles.loaderBox}>
                    <ActivityIndicator size={50} color="#4CAF50" />
                </View>
            );
        }
        if (!addonsArr.length) {
            return <Text style={{ color: '#666' }}>No add-ons for this item.</Text>;
        }
        return (
            <ScrollView style={{ marginBottom: 80 }}>
                {addonsArr.map((item, index) => {
                    // Prefer Mongo's _id; fallback to item.id if your API sends that
                    const id = item._id || item.id;
                    const selected = selectedAddonsIds.includes(id);
                    return (
                        <TouchableOpacity
                            key={id || index}
                            onPress={() => toggleAddOn(id)}
                            style={[currentStyles.addOnItem, selected && currentStyles.addOnSelected]}
                        >
                            <Text style={currentStyles.addOnName}>{item.name}</Text>
                            <Text style={currentStyles.addOnPrice}>+ #{formatPrice(item.price)}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    return (
        <View style={currentStyles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={currentStyles.imageCont}>
                    <Image
                        source={{ uri: meal?.image }}
                        style={currentStyles.image}
                        contentFit="cover"
                    />
                    <FoodDetailHeader foodId={mealId} />
                </View>

                <View style={currentStyles.content}>
                    <Text style={currentStyles.title}>{meal.name} - {meal.category}</Text>
                    <Text style={currentStyles.price}>NGN #{formatPrice(meal.price)}</Text>
                    <Text style={currentStyles.desc}>{meal.description}</Text>

                    {/* Add-ons */}
                    <Text style={currentStyles.addOnHeader}>Add-ons</Text>
                    <GetAddons addonsArr={addons} />
                </View>
            </ScrollView>

            {!line ? (
                <View style={currentStyles.bottomBar}>
                    <TouchableOpacity style={currentStyles.addToCartBtn} onPress={onAdd}>
                        <Ionicons name="cart-outline" size={22} color={currentStyles.text} />
                        <Text style={currentStyles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={[currentStyles.bottomBar, { borderTopWidth: 0, backgroundColor: theme.background }]}>
                    <View style={currentStyles.qtyWrap}>
                        <TouchableOpacity onPress={onDec} style={[currentStyles.qtyBtn, currentStyles.pill]}>
                            <Text style={currentStyles.qtyTxt}>−</Text>
                        </TouchableOpacity>
                        <Text style={currentStyles.qtyVal}>{line.quantity}</Text>
                        <TouchableOpacity onPress={onInc} style={[currentStyles.qtyBtn, currentStyles.pill]}>
                            <Text style={currentStyles.qtyTxt}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

export default FoodDetailsDemo;

const styles = (theme) => StyleSheet.create({
    loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, backgroundColor: theme.background },
    image: { width: '100%', height: 300, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    content: { paddingHorizontal: 20, paddingTop: 20 },
    title: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 5 },
    price: { fontSize: 18, color: '#ff6600', fontWeight: '600', marginBottom: 8 },
    desc: { fontSize: 15, color: theme.text, lineHeight: 22, marginBottom: 25 },
    addOnHeader: { fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 12 },
    addOnItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, marginBottom: 10, color: theme.text
    },
    addOnSelected: { backgroundColor: theme.card, borderColor: '#ff6600' },
    addOnName: { fontSize: 16, color: theme.text },
    addOnPrice: { fontSize: 16, fontWeight: '600', color: '#ff6600' },
    imageCont: { flex: 1, width: '100%' },
    bottomBar: {
        // width: '100%',
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingVertical: 15,
        backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: '#eee',
    },
    addToCartBtn: {
        backgroundColor: '#ff6600', flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', borderRadius: 25, paddingVertical: 15, gap: 8,
    },
    addToCartText: { color: theme.text, fontSize: 17, fontWeight: '700' },
    qtyWrap: { flexDirection: "row", alignItems: "center", gap: 16, justifyContent: "center" },
    qtyBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#d1d5db" },
    pill: { borderRadius: 9999 },
    qtyTxt: { fontSize: 22, fontWeight: "800", color: theme.text },
    qtyVal: { fontSize: 18, fontWeight: "700", minWidth: 24, textAlign: "center", color: '#ff6600' },
});
