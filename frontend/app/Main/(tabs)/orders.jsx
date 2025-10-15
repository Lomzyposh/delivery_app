import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { useTheme } from '../../../contexts/ThemeContext';

const Orders = () => {
    const router = useRouter();
    const theme = useTheme();
    const currentStyles = styles(theme);
    return (
        <View style={currentStyles.container}>
            <Text style={currentStyles.text}>Your Orders</Text>

            <TouchableOpacity style={currentStyles.button} onPress={() => router.push("/meal-details")}>
                <Text style={currentStyles.text}>Go to Order Details</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Orders

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