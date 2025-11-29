import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import SocialAuthButton from '../../components/auth/SocialAuthButton';
import CompleteProfileModal from '../../components/auth/CompleteProfileModal';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppleAuth } from '../../hooks/useAppleAuth';
import { useGuestGuard } from '../../hooks/useAuthGuard';
import { getErrorMessage, hasErrorCode } from '../../utils/errorUtils';

export default function Signup() {
  const insets = useSafeAreaInsets();
  const { signup, loginWithGoogle, loginWithApple, isLoading, error, clearError, refreshUser } = useAuth();
  const { signIn: googleSignIn } = useGoogleAuth();
  const { signIn: appleSignIn, isAvailable: isAppleAvailable } = useAppleAuth();

  // Redirect to app if already authenticated
  useGuestGuard('/(app)/(tabs)/group');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const checkPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(formData.password));
  }, [formData.password]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters, lowercase letters, numbers, and underscores only';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 75) {
      newErrors.password = 'Password should include uppercase, lowercase, and numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    try {
      setSocialLoading(provider);

      if (provider === 'google') {
        console.log('🔄 [SIGNUP] Starting Google sign-in...');
        const result = await googleSignIn();

        console.log('✅ [SIGNUP] Google sign-in successful, logging in...');
        await loginWithGoogle({
          idToken: result.idToken,
          email: result.user.email,
          firstName: result.user.givenName || undefined,
          lastName: result.user.familyName || undefined,
          profileImageUrl: result.user.photo || undefined,
        });

        console.log('✅ [SIGNUP] Google login complete!');
        // Navigation will be handled by auth state change
      } else if (provider === 'apple') {
        // Don't check isAppleAvailable - just try the sign-in and let it fail with a better error
        console.log('🔄 [SIGNUP] Starting Apple sign-in...');
        const result = await appleSignIn();

        console.log('✅ [SIGNUP] Apple sign-in successful, logging in...');
        await loginWithApple({
          identityToken: result.identityToken,
          userId: result.user.id,
          email: result.user.email || undefined,
          firstName: result.user.fullName?.givenName || undefined,
          lastName: result.user.fullName?.familyName || undefined,
        });

        console.log('✅ [SIGNUP] Apple login complete!');
        // Navigation will be handled by auth state change
      }
    } catch (error) {
      console.error('❌ [SIGNUP] Social auth failed:', error);

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

  const handleSignup = async () => {
    console.log('🚀 [SIGNUP] Starting signup process');

    if (!validateForm()) {
      console.log('❌ [SIGNUP] Form validation failed');
      return;
    }

    const signupData = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password
    };

    console.log('📝 [SIGNUP] Form data prepared:', {
      username: signupData.username,
      email: signupData.email,
      passwordLength: signupData.password.length
    });

    try {
      console.log('🔄 [SIGNUP] Calling signup function...');
      await signup(signupData);
      console.log('✅ [SIGNUP] Signup successful!');
      // Show profile completion modal
      setShowProfileModal(true);
    } catch (error) {
      console.error('❌ [SIGNUP] Signup failed with error:', error);

      Alert.alert(
        'Signup Failed',
        getErrorMessage(error),
        [{ text: 'OK' }]
      );
    }
  };


  const updateField = (field: keyof typeof formData, value: string) => {
    let processedValue = value;
    
    // Special processing for username
    if (field === 'username') {
      processedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return '#EF4444';
    if (passwordStrength < 75) return '#F59E0B';
    return '#22C55E';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Fair';
    return 'Strong';
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#0a0a0f' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 20 }}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20
            }}
          >
            <MaterialIcons
              name="arrow-back"
              size={18}
              color="#ffffff"
            />
          </TouchableOpacity>

          {/* Title */}
          <Text style={{
            fontSize: 28,
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: -0.5,
            marginBottom: 24
          }}>
            Create Account
          </Text>
          {/* Signup Form */}
          <View style={{ marginBottom: 16 }}>
            <AuthInput
              label="Username"
              value={formData.username}
              onChangeText={(text) => updateField('username', text)}
              placeholder="Enter your username"
              autoCapitalize="none"
              error={errors.username}
              isValid={formData.username.length > 0 && validateUsername(formData.username)}
              maxLength={20}
            />

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
              placeholder="Create a password"
              secureTextEntry={true}
              autoCapitalize="none"
              error={errors.password}
              showPasswordToggle={true}
            />

            {/* Password Strength Indicator */}
            {formData.password.length > 0 && (
              <View style={{ marginBottom: 14, marginTop: -10 }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4
                }}>
                  <Text style={{
                    fontSize: 11,
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    Password strength
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: getPasswordStrengthColor(),
                    fontWeight: '600'
                  }}>
                    {getPasswordStrengthText()}
                  </Text>
                </View>
                <View style={{
                  height: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 1.5
                }}>
                  <View style={{
                    height: 3,
                    width: `${passwordStrength}%`,
                    backgroundColor: getPasswordStrengthColor(),
                    borderRadius: 1.5
                  }} />
                </View>
              </View>
            )}

            {/* Create Account Button */}
            <AuthButton
              title="Create Account"
              onPress={handleSignup}
              loading={isLoading}
              disabled={isLoading}
              variant="primary"
            />

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
            <View style={{ gap: 12 }}>
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

            {/* Already have account */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 24,
              marginBottom: 16
            }}>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={{
                  fontSize: 14,
                  color: '#00D4AA',
                  fontWeight: '600'
                }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Terms - applies to all signup methods */}
            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.5)',
              textAlign: 'center',
              lineHeight: 18
            }}>
              By signing up, you agree to our{' '}
              <Text
                style={{ color: '#00D4AA', textDecorationLine: 'underline' }}
                onPress={() => router.push('/(app)/settings/terms-of-service')}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                style={{ color: '#00D4AA', textDecorationLine: 'underline' }}
                onPress={() => router.push('/(app)/settings/privacy-policy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Profile Completion Modal */}
      <CompleteProfileModal
        visible={showProfileModal}
        onComplete={async () => {
          setShowProfileModal(false);
          await refreshUser();
          // Navigation handled by auth state change
        }}
        onSkip={() => {
          setShowProfileModal(false);
          // Navigation handled by auth state change
        }}
      />
    </KeyboardAvoidingView>
  );
}