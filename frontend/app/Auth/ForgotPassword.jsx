import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

const ForgotPassword = () => {
    const { checkEmail } = useAuth();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();

    const submitForm = async () => {
        setErrorMsg('');

        const trimmed = email.trim().toLowerCase();
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

        if (!trimmed) {
            setErrorMsg('Email is required.');
            return;
        }
        if (!isValidEmail) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            const res = await checkEmail(trimmed);
            if (res?.success) {
                Alert.alert('Check your inbox', 'We sent a reset code to your email.');

                router.push({
                    pathname: '/Auth/EnterCode',
                    params: { email: trimmed }
                });
            } else {
                setErrorMsg(res?.message || 'Could not send reset code. Try again.');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Network error. Try again.');
            console.log('ERR: ', err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <View style={{ padding: 20 }}>
            <Text>Email</Text>

            {!!errorMsg && <Text style={{ color: 'red', marginTop: 4 }}>{errorMsg}</Text>}

            <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, marginTop: 8, marginBottom: 12, padding: 10, borderRadius: 8 }}
                placeholder="you@example.com"
            />

            <Button
                title={loading ? 'Verifying...' : 'Continue'}
                onPress={submitForm}
                disabled={loading}
            />

            <Button
                title='Otp Form'
                onPress={() => router.push({
                    pathname: '/Auth/EnterCode',
                    params: { email: email }
                })}
                disabled={loading}
            />
        </View>
    );
};

export default ForgotPassword;

const styles = StyleSheet.create({});
