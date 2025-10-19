// app/Auth/ForgotPassword.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	Alert,
	Animated,
	Easing,
	KeyboardAvoidingView,
	Platform,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/theme';
import { usePalette } from '../../utils/palette';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export default function ForgotPassword() {
	const { checkEmail } = useAuth();
	const router = useRouter();
	const { theme, toggleTheme } = useTheme();
	const p = usePalette(theme);

	const [email, setEmail] = useState('');
	const [focused, setFocused] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState('');

	const styles = makeStyles(p, focused, !!errorMsg, loading);

	const submitForm = async () => {
		setErrorMsg('');
		const trimmed = email.trim().toLowerCase();

		if (!trimmed) {
			setErrorMsg('Email is required.');
			return;
		}
		if (!EMAIL_RE.test(trimmed)) {
			setErrorMsg('Please enter a valid email address.');
			return;
		}

		setLoading(true);
		try {
			const res = await checkEmail(trimmed);
			if (res?.success) {
				Alert.alert('Check your inbox', 'We sent a reset code to your email.');
				router.push({ pathname: '/Auth/EnterCode', params: { email: trimmed } });
			} else {
				setErrorMsg(res?.message || 'Could not send reset code. Try again.');
			}
		} catch (err) {
			setErrorMsg(err?.message || 'Network error. Try again.');
			console.log('ERR: ', err);
		} finally {
			setLoading(false);
		}
	};

	const bounce = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(bounce, {
					toValue: -10,
					duration: 500,
					easing: Easing.out(Easing.quad),
					useNativeDriver: true,
				}),
				Animated.timing(bounce, {
					toValue: 0,
					duration: 500,
					easing: Easing.in(Easing.quad),
					useNativeDriver: true,
				}),
			])
		).start();
	}, [bounce]);

	return (
		<View style={[styles.screen, { backgroundColor: p.background }]}>
			<StatusBar barStyle={p.statusBarStyle} />
			<KeyboardAvoidingView
				behavior={Platform.select({ ios: 'padding', android: undefined })}
				style={{ flex: 1, justifyContent: 'center' }}
			>
				<View style={{ margin: 10, justifyContent: "center", alignItems: "center" }} onTouchEnd={toggleTheme}>
					<Animated.Image
						source={require("../../assets/images/foodHutLogo.png")}
						style={{
							width: 120, height: 150,
							resizeMode: "contain",
							transform: [{ translateY: bounce }],
						}}
					/>
				</View>
				<View style={styles.card}>
					<Text style={styles.title}>Forgot password</Text>
					<Text style={styles.subtitle}>
						Enter your email and we&apos;ll send you a code to reset your password.
					</Text>

					{errorMsg ? (
						<View style={styles.errorBanner}>
							<Text style={styles.errorText}>{errorMsg}</Text>
						</View>
					) : null}

					<Text style={styles.label}>Email</Text>
					<TextInput
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
						placeholder="you@example.com"
						placeholderTextColor={p.sub}
						selectionColor={p.tint}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						style={styles.input}
						returnKeyType="send"
						onSubmitEditing={submitForm}
					/>

					<TouchableOpacity
						style={styles.primaryBtn}
						onPress={submitForm}
						disabled={loading}
						activeOpacity={0.8}
					>
						<Text style={styles.primaryBtnText}>
							{loading ? 'Requesting…' : 'Request reset code'}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity onPress={() => router.replace('Auth/Login')} activeOpacity={0.8}>
						<Text style={styles.hint}>Back to login</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</View>
	);
}

function makeStyles(p, focused, hasError, loading) {
	return StyleSheet.create({
		screen: {
			flex: 1,
		},
		card: {
			backgroundColor: p.card,
			borderColor: p.border,
			borderWidth: 1,
			marginHorizontal: 20,
			padding: 20,
			borderRadius: 16,
			gap: 10,
			shadowColor: '#000',
			shadowOpacity: 0.25,
			shadowRadius: 12,
			shadowOffset: { width: 0, height: 6 },
			elevation: 6,
		},
		title: {
			color: p.text,
			fontSize: 28,
			fontWeight: '800',
			letterSpacing: 0.3,
		},
		subtitle: {
			color: p.sub,
			marginBottom: 8,
			lineHeight: 20,
		},
		errorBanner: {
			backgroundColor: p.bannerBg,
			borderColor: p.error,
			borderWidth: 1,
			paddingVertical: 8,
			paddingHorizontal: 10,
			borderRadius: 10,
		},
		errorText: {
			color: p.error,
			fontWeight: '600',
		},
		label: {
			color: p.sub,
			fontWeight: '700',
			marginTop: 6,
		},
		input: {
			backgroundColor: p.field,
			color: p.text,
			borderWidth: 1.5,
			borderColor: hasError ? p.error : focused ? p.tint : p.border,
			borderRadius: 12,
			padding: 12,
		},
		primaryBtn: {
			backgroundColor: loading ? p.buttonDisabled : p.tint,
			paddingVertical: 14,
			borderRadius: 14,
			alignItems: 'center',
			marginTop: 10,
		},
		primaryBtnText: {
			color: '#fff',
			fontWeight: '800',
			letterSpacing: 0.3,
		},
		hint: {
			color: p.sub,
			textAlign: 'center',
			marginTop: 6,
		},
	});
}
