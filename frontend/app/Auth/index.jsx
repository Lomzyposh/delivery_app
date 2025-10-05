import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import OnboardingScreen from '../../components/Onboarding'

const index = () => {
    return (
        <OnboardingScreen buttonPosition="bottom" indicatorStyle="dash" />
    )
}

export default index

const styles = StyleSheet.create({})