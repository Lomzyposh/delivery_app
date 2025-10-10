import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

const tint = "#ff7f50";              // accent (orange/coral)
const barBg = "rgba(20,20,22,0.85)"; // translucent dark
const iconDefault = "#9BA1A6";
const textLight = "#ECEDEE";

const Home = () => {
    const { user, logout } = useAuth();
    const theme = useTheme();
    const currentStyles = styles(theme);

    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/Auth/Login');
    }


    return (
        <View style={currentStyles.container}>
            <Text style={currentStyles.text}>Home</Text>
            <TouchableOpacity onPress={handleLogout}>
                <Text>{user ? 'Logout' : 'Login'}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Home;

const styles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background

    },
    text: {
        color: theme.text
    }
})
