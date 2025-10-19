import React, { useEffect, useRef } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Animated } from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons, FontAwesome } from "@expo/vector-icons"; // for icons
import { Colors, fonts } from "../constants/theme";
import { useRouter } from "expo-router";

const Onboarding2 = () => {
    const router = useRouter();

    const goToMain = () => router.replace("/Main");
    const goToLogin = () => router.replace("/Auth/Login");

    const fallAnim = useRef(new Animated.Value(-300)).current;

    useEffect(() => {
        Animated.spring(fallAnim, {
            toValue: 0,
            useNativeDriver: true,
            speed: 2,
            bounciness: 18,

        }).start();
    }, []);

    return (
        <View style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.container}>
                    <Text style={styles.title} adjustsFontSizeToFit>Welcome to Food Hut</Text>
                    <Animated.Image
                        source={require("../assets/images/burger.png")}
                        style={[styles.image, { transform: [{ translateY: fallAnim }] }]}
                    />

                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity style={styles.primaryButton} onPress={goToLogin}>
                            <MaterialIcons name="email" size={22} color={Colors.tintColorLight} style={{ marginRight: 8 }} />
                            <Text style={styles.primaryText}>Continue with Email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={goToMain}>
                            <MaterialIcons name="navigate-next" size={22} color='#fff' style={{ marginRight: 8 }} />
                            <Text style={styles.secondaryText}>Skip for Now</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.terms}>
                        By tapping “Continue with Email”, you agree to Food Zone’s{" "}
                        <Text style={{ fontWeight: "bold" }}>Terms & Conditions</Text> and{" "}
                        <Text style={{ fontWeight: "bold" }}>Privacy Policy</Text>.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default Onboarding2;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.tintColorLight || "#E53935",
    },

    scroll: {
        flexGrow: 1,
        justifyContent: "space-between",
    },

    container: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 25,
        paddingVertical: 40,
    },

    image: {
        width: "80%",
        // backgroundColor: '#000',
        height: undefined,
        aspectRatio: 1,
        resizeMode: "contain",
        marginTop: 200,
    },

    title: {
        fontSize: 50,
        color: "#fff",
        textAlign: "center",
        letterSpacing: 3,
        marginBottom: 50,
        position: 'absolute',
        top: 105,
        fontFamily: fonts.fredoka,
        textTransform: 'uppercase'
    },

    buttonsContainer: {
        width: "100%",
        alignItems: "center",
        marginBottom: 50,
    },

    primaryButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "90%",
        backgroundColor: "#fff",
        borderRadius: 30,
        paddingVertical: 15,
        marginBottom: 15,
    },

    primaryText: {
        color: Colors.tintColorLight || "#E53935",
        fontWeight: "bold",
        fontSize: 16,
    },

    secondaryButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "90%",
        borderRadius: 30,
        paddingVertical: 15,
        borderWidth: 1.5,
        borderColor: "#fff",
    },

    secondaryText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },

    terms: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        paddingHorizontal: 15,
        lineHeight: 18,
        marginTop: 25,
    },
});