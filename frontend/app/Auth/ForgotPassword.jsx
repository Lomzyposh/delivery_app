import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function ForgotPassword() {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleRequest = async () => {
		if (!email) return Alert.alert('Missing email', 'Please enter your email');
		setLoading(true);
		try {
			// TODO: call backend endpoint to request reset code
			Alert.alert('Requested', `A reset code was requested for ${email}`);
			// router.push('/Auth/ResetPassword');
		} catch (e) {
			Alert.alert('Error', e.message || 'Request failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Forgot password</Text>
			<Text style={styles.subtitle}>Enter your email and we'll send you a code to reset your password.</Text>

			<Text style={styles.label}>Email</Text>
			<TextInput
				value={email}
				onChangeText={setEmail}
				autoCapitalize="none"
				keyboardType="email-address"
				style={styles.input}
				placeholder="you@example.com"
			/>

			<TouchableOpacity style={styles.connectButton} onPress={handleRequest} disabled={loading}>
				<Text style={styles.connectText}>{loading ? 'Requesting...' : 'Request reset code'}</Text>
			</TouchableOpacity>

			<TouchableOpacity onPress={() => router.replace('Auth/Login')}>
				<Text style={styles.hint}>Back to login</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		padding: 20,
		justifyContent: 'center',
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	subtitle: {
		marginBottom: 20,
		color: '#444',
	},
	label: { fontWeight: '600' },
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 10,
		padding: 12,
		marginTop: 5,
		marginBottom: 10,
	},
	connectButton: {
		backgroundColor: '#FF5A00',
		padding: 15,
		borderRadius: 15,
		alignItems: 'center',
		marginBottom: 20,
	},
	connectText: { color: '#fff', fontWeight: 'bold' },
	hint: { color: '#666', textAlign: 'center' },
});
