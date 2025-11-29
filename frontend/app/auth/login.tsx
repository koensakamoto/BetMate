import React, { useState } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import SocialAuthButton from '../../components/auth/SocialAuthButton';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppleAuth } from '../../hooks/useAppleAuth';
import { useGuestGuard } from '../../hooks/useAuthGuard';
import {
  getErrorMessage,
  hasErrorCode,
  getErrorCode,
  isNetworkError,
  isRateLimitError,
  isServerError,
  AuthErrorCode,
  AUTH_ERROR_MESSAGES,
} from '../../utils/errorUtils';

const logo = require("../../assets/images/adaptive-icon.png");

export default function Login() {
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle, loginWithApple, isLoading, error, clearError } = useAuth();
  const { signIn: googleSignIn } = useGoogleAuth();
  const { signIn: appleSignIn, isAvailable: isAppleAvailable } = useAppleAuth();

  // Redirect to app if already authenticated
  useGuestGuard('/(app)/(tabs)/group');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login({
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });
      // Navigation will be handled by auth state change
    } catch (error) {
      // Handle specific error types
      if (isNetworkError(error)) {
        Alert.alert(
          'Connection Error',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (isRateLimitError(error)) {
        Alert.alert(
          'Too Many Attempts',
          getErrorMessage(error),
          [{ text: 'OK' }]
        );
        return;
      }

      if (isServerError(error)) {
        Alert.alert(
          'Server Error',
          'Something went wrong on our end. Please try again later.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check for specific auth error codes
      const errorCode = getErrorCode(error);
      if (errorCode && AUTH_ERROR_MESSAGES[errorCode]) {
        Alert.alert(
          errorCode === AuthErrorCode.ACCOUNT_LOCKED ? 'Account Locked' :
          errorCode === AuthErrorCode.ACCOUNT_DISABLED ? 'Account Suspended' :
          errorCode === AuthErrorCode.ACCOUNT_INACTIVE ? 'Account Inactive' :
          'Login Failed',
          AUTH_ERROR_MESSAGES[errorCode],
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Login Failed',
        getErrorMessage(error),
        [{ text: 'OK' }]
      );
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    try {
      setSocialLoading(provider);

      if (provider === 'google') {
        const result = await googleSignIn();

        await loginWithGoogle({
          idToken: result.idToken,
          email: result.user.email,
          firstName: result.user.givenName || undefined,
          lastName: result.user.familyName || undefined,
          profileImageUrl: result.user.photo || undefined,
        });

        // Navigation will be handled by auth state change
      } else if (provider === 'apple') {
        // Don't check isAppleAvailable - just try the sign-in and let it fail with a better error
        const result = await appleSignIn();

        await loginWithApple({
          identityToken: result.identityToken,
          userId: result.user.id,
          email: result.user.email || undefined,
          firstName: result.user.fullName?.givenName || undefined,
          lastName: result.user.fullName?.familyName || undefined,
        });

        // Navigation will be handled by auth state change
      }
    } catch (error) {
      console.error('Social auth failed:', error);

      if (hasErrorCode(error) && error.code === 'CANCELLED') {
        // User cancelled, don't show error
        return;
      }

      Alert.alert(
        'Sign-In Failed',
        getErrorMessage(error),
        [{ text: 'OK' }]
      );
    } finally {
      setSocialLoading(null);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 12,
            paddingHorizontal: 24
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Section */}
          <View>
            {/* Hero Section */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Image
                source={logo}
                style={{ width: 100, height: 100, marginBottom: 8 }}
              />
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#ffffff',
                letterSpacing: -0.5,
                marginBottom: 4
              }}>
                Welcome back
              </Text>
              <Text style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.6)' }}>
                Sign in to your account
              </Text>
            </View>

            {/* Login Form */}
            <View>
              <AuthInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                isValid={formData.email.length > 0 && validateEmail(formData.email)}
                editable={!isLoading && socialLoading === null}
              />

              <AuthInput
                label="Password"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder="Enter your password"
                secureTextEntry={true}
                autoCapitalize="none"
                autoComplete="password"
                error={errors.password}
                showPasswordToggle={true}
                editable={!isLoading && socialLoading === null}
              />

              {/* Forgot Password */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
                <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                  <Text style={{ fontSize: 13, color: '#00D4AA', fontWeight: '600' }}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <AuthButton
                title="Sign In"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                variant="primary"
              />
            </View>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
              <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.4)', marginHorizontal: 12 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
            </View>

            {/* Social Auth - Side by Side */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <SocialAuthButton
                  provider="apple"
                  onPress={() => handleSocialAuth('apple')}
                  loading={socialLoading === 'apple'}
                  disabled={socialLoading !== null}
                  compact
                />
              </View>
              <View style={{ flex: 1 }}>
                <SocialAuthButton
                  provider="google"
                  onPress={() => handleSocialAuth('google')}
                  loading={socialLoading === 'google'}
                  disabled={socialLoading !== null}
                  compact
                />
              </View>
            </View>
          </View>

          {/* Bottom Section */}
          <View style={{ marginTop: 24 }}>
            {/* Create Account */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.6)' }}>
                New to RivalPicks?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={{ fontSize: 15, color: '#00D4AA', fontWeight: '600' }}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Legal Footer */}
            <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', lineHeight: 18 }}>
              By continuing, you agree to our{' '}
              <Text style={{ color: '#00D4AA' }} onPress={() => router.push('/legal/terms-of-service')}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={{ color: '#00D4AA' }} onPress={() => router.push('/legal/privacy-policy')}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}