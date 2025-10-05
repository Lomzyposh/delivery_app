import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors } from '../constants/theme'
import InfiniteDotsLoader from './InfiniteDotsLoader'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'


const LoadingScreen = () => {
    const { user, booted } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!booted) return;

        const timer = setTimeout(() => {
            if (user) {
                router.replace('/Main/Home'); 
            } else {
                router.replace('/Auth');       // not logged in
            }
        }, 3000)

        return () => clearTimeout(timer);
    }, [booted, user, router]);

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/images/foodLogo.png')}
                style={styles.loaderLogo}
            />
            <Text style={styles.text}>Food Delivery</Text>
            <InfiniteDotsLoader
                dotCount={4}
                dotSize={12}
                dotSpacing={10}
                color="white"
                duration={700}
                scaleRange={[0.35, 1]}
            />
        </View>
    )
}

export default LoadingScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.tintColorLight
    },
    text: {
        color: '#fff',
        fontFamily: 'cursive',
        fontSize: 50,
        fontWeight: 'bolder',

    },
    loaderLogo: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    }
})