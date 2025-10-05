import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const saved = () => {
    return (
        <View style={styles.container}>
            <Text>saved</Text>
        </View>
    )
}

export default saved

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})