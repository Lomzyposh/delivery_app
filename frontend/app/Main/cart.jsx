import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const cart = () => {
    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 22 }}>Your Cart</Text>
        </View>
    )
}

export default cart

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})