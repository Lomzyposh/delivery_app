import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { AuthProvider } from '../contexts/AuthContext'

const _layout = () => {
    return (
        <AuthProvider>
            <Stack>
                <Stack.Screen
                    name='index'
                    options={{
                        headerShown: false
                    }}
                />
            </Stack>
        </AuthProvider>
    )
}

export default _layout

const styles = StyleSheet.create({})