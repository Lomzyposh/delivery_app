import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native'
import React from 'react'
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';

const EnterCode = () => {
    const { email } = useLocalSearchParams();
    const [code, setCode] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();


    const API_URL = "http://192.168.121.224:5000";

    const verifyCode = async () => {
        console.log("Verifying...");
        if (!code) {
            setErrorMsg("Code Required");
            return;
        }
        try {
            const res = await axios.post(`${API_URL}/api/verify-reset-code`, { email, code });
            if (res.data.success) {
                Alert.alert("Success", "Code Correct");
                router.push({ pathname: '/Auth/ResetPassword', params: { email, code } });
            } else {
                setErrorMsg(res.data.message);
            }

        } catch (err) {
            setErrorMsg(err.message || 'Network error. Try again.');
            console.log('ERR: ', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            {!!errorMsg && <Text style={{ color: 'red', marginTop: 4 }}>{errorMsg}</Text>}

            <Text style={styles.heading}>Enter Verification Code</Text>
            <Text style={styles.sub}>We sent a code to: </Text>
            <Text style={styles.email}>{email}</Text>
            <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType='number-pad'
                style={{ width: '50%', borderWidth: 1, marginTop: 8, marginBottom: 12, padding: 10, borderRadius: 8 }}
                placeholder="Otp Code"
            />

            <Button
                title='Verify'
                onPress={verifyCode}
                disabled={loading}
            />
        </View>
    )
}

export default EnterCode

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    heading: { fontSize: 24, fontWeight: '700', marginBottom: 10 },
    sub: { color: '#666' },
    email: { fontWeight: '600', color: '#1a73e8', marginTop: 5 },
})