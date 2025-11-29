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
import { getErrorMessage, hasErrorCode } from '../../utils/errorUtils';

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
        email: formData.email,
        password: formData.password
      });
      // Navigation will be handled by auth state change
    } catch (error) {
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    try {
      setSocialLoading(provider);

      if (provider === 'google') {
        console.log('🔄 [LOGIN] Starting Google sign-in...');
        const result = await googleSignIn();

        console.log('✅ [LOGIN] Google sign-in successful, logging in...');
        await loginWithGoogle({
          idToken: result.idToken,
          email: result.user.email,
          firstName: result.user.givenName || undefined,
          lastName: result.user.familyName || undefined,
          profileImageUrl: result.user.photo || undefined,
        });

        console.log('✅ [LOGIN] Google login complete!');
        // Navigation will be handled by auth state change
      } else if (provider === 'apple') {
        // Don't check isAppleAvailable - just try the sign-in and let it fail with a better error
        console.log('🔄 [LOGIN] Starting Apple sign-in...');
        const result = await appleSignIn();

        console.log('✅ [LOGIN] Apple sign-in successful, logging in...');
        await loginWithApple({
          identityToken: result.identityToken,
          userId: result.user.id,
          email: result.user.email || undefined,
          firstName: result.user.fullName?.givenName || undefined,
          lastName: result.user.fullName?.familyName || undefined,
        });

        console.log('✅ [LOGIN] Apple login complete!');
        // Navigation will be handled by auth state change
      }
    } catch (error) {
      console.error('❌ [LOGIN] Social auth failed:', error);

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
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 24,
            justifyContent: 'space-between'
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Section */}
          <View>
            {/* Hero Section */}
            <View style={{
              alignItems: 'center',
              marginBottom: 32
            }}>
              {/* Logo */}
              <Image
                source={logo}
                style={{
                  width: 110,
                  height: 110,
                  marginBottom: 4
                }}
              />
              
              {/* Welcome Text */}
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#ffffff',
                textAlign: 'center',
                letterSpacing: -0.5,
                marginBottom: 6
              }}>
                Welcome back
              </Text>
              
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center'
              }}>
                Sign in to your account
              </Text>
            </View>

            {/* Login Form */}
            <View style={{ marginBottom: 20 }}>
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
              />

              {/* Forgot Password */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: 20
              }}>
                <TouchableOpacity
                  onPress={() => router.push('/auth/forgot-password')}
                >
                  <Text style={{
                    fontSize: 13,
                    color: '#00D4AA',
                    fontWeight: '600'
                  }}>
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
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 20
            }}>
              <View style={{
                flex: 1,
                height: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)'
              }} />
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.4)',
                marginHorizontal: 12,
                fontWeight: '500'
              }}>
                or
              </Text>
              <View style={{
                flex: 1,
                height: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)'
              }} />
            </View>

            {/* Social Auth */}
            <View style={{ gap: 12, marginBottom: 24 }}>
              <SocialAuthButton
                provider="apple"
                onPress={() => handleSocialAuth('apple')}
                loading={socialLoading === 'apple'}
                disabled={socialLoading !== null}
              />
              <SocialAuthButton
                provider="google"
                onPress={() => handleSocialAuth('google')}
                loading={socialLoading === 'google'}
                disabled={socialLoading !== null}
              />
            </View>
          </View>

          {/* Create Account Section - Compact Bottom Card */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            padding: 16
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 2
                }}>
                  New to RivalPicks?
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Join the betting community
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/auth/signup')}
                style={{
                  backgroundColor: 'rgba(0, 212, 170, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(0, 212, 170, 0.3)',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  marginLeft: 12
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#00D4AA'
                }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}