// ResetPassword.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../hooks/api';

export default function ResetPassword() {
    const params = useLocalSearchParams();
    const emailParam = params.email;
    const email = Array.isArray(emailParam) ? emailParam[0] : emailParam;

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleReset() {
        if (!email) return setMsg('Missing email.');
        if (!password || password.length < 8) return setMsg('Password must be at least 8 characters.');
        if (password !== confirm) return setMsg('Passwords do not match.');

        setMsg('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/reset-password`, {
                email,
                newPassword: password,
            });
            if (res.data?.success) {
                Alert.alert('Success', 'Password reset successfully.');
            } else {
                setMsg(res.data?.message || 'Reset failed.');
            }
        } catch (e) {
            setMsg(e?.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.wrap}>
            {!!msg && <Text style={{ color: 'crimson', marginBottom: 8 }}>{msg}</Text>}

            <Text>Email</Text>
            <TextInput editable={false} value={email} style={styles.input} />
            <Text>New Password</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
            <Text>Confirm Password</Text>
            <TextInput value={confirm} onChangeText={setConfirm} secureTextEntry style={styles.input} />

            <Button title={loading ? 'Please wait…' : 'Reset Password'} onPress={handleReset} disabled={loading} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, padding: 20, justifyContent: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
});
