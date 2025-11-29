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
import {
  getErrorMessage,
  hasErrorCode,
  getErrorCode,
  ERROR_CODE_TO_FIELD,
  REGISTRATION_ERROR_MESSAGES,
  RegistrationErrorCode,
  isNetworkError,
  isRateLimitError,
  isServerError,
} from '../../utils/errorUtils';

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

  // Common weak passwords to check against
  const COMMON_PASSWORDS = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', 'dragon', 'master',
    '12345678', 'abc123', 'iloveyou', 'trustno1', 'sunshine'
  ];

  const MAX_PASSWORD_LENGTH = 128;

  const isCommonPassword = (password: string): boolean => {
    const lower = password.toLowerCase();
    return COMMON_PASSWORDS.some(weak => lower.includes(weak));
  };

  const hasSequentialPattern = (password: string): boolean => {
    const lower = password.toLowerCase();
    return /123|abc|qwe|asd/.test(lower);
  };

  const hasRepeatedChars = (password: string): boolean => {
    return /(.)\1{2,}/.test(password);
  };

  const passwordContainsUserInfo = (password: string, username: string, email: string): boolean => {
    const lowerPassword = password.toLowerCase();

    // Check if password contains username (if username is at least 3 chars)
    if (username.length >= 3 && lowerPassword.includes(username.toLowerCase())) {
      return true;
    }

    // Check if password contains email local part (before @)
    const emailLocal = email.split('@')[0]?.toLowerCase();
    if (emailLocal && emailLocal.length >= 3 && lowerPassword.includes(emailLocal)) {
      return true;
    }

    // Check if password contains full email
    if (email.length >= 3 && lowerPassword.includes(email.toLowerCase())) {
      return true;
    }

    return false;
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
    } else if (formData.password.length > MAX_PASSWORD_LENGTH) {
      newErrors.password = `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`;
    } else if (passwordStrength < 75) {
      newErrors.password = 'Password should include uppercase, lowercase, and numbers';
    } else if (passwordContainsUserInfo(formData.password, formData.username, formData.email)) {
      newErrors.password = 'Password cannot contain your username or email';
    } else if (isCommonPassword(formData.password)) {
      newErrors.password = 'This password is too common. Please choose a more secure password.';
    } else if (hasSequentialPattern(formData.password) || hasRepeatedChars(formData.password)) {
      newErrors.password = 'Password contains predictable patterns. Please choose a stronger password.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    const signupData = {
      username: formData.username.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password
    };

    try {
      await signup(signupData);
      // Show profile completion modal
      setShowProfileModal(true);
    } catch (error) {
      console.error('Signup failed with error:', error);

      // Check for field-specific errors
      const errorCode = getErrorCode(error);
      if (errorCode && ERROR_CODE_TO_FIELD[errorCode]) {
        // Show inline error for the specific field
        const fieldName = ERROR_CODE_TO_FIELD[errorCode];
        const errorMessage = REGISTRATION_ERROR_MESSAGES[errorCode] || getErrorMessage(error);

        setErrors(prev => ({ ...prev, [fieldName]: errorMessage }));

        // For email already exists, offer to sign in
        if (errorCode === RegistrationErrorCode.EMAIL_ALREADY_EXISTS) {
          Alert.alert(
            'Account Exists',
            'An account with this email already exists. Would you like to sign in instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign In', onPress: () => router.push('/auth/login') }
            ]
          );
        }
        return;
      }

      // Handle network/server errors with alert
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

      // Generic fallback
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
          flexGrow: 1,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8
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
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12
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
            fontSize: 26,
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: -0.5,
            marginBottom: 24
          }}>
            Create Account
          </Text>
          {/* Signup Form */}
          <View>
            <AuthInput
              label="Username"
              value={formData.username}
              onChangeText={(text) => updateField('username', text)}
              placeholder="Enter your username"
              autoCapitalize="none"
              error={errors.username}
              isValid={formData.username.length > 0 && validateUsername(formData.username)}
              maxLength={20}
              editable={!isLoading && !socialLoading}
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
              editable={!isLoading && !socialLoading}
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
              maxLength={MAX_PASSWORD_LENGTH}
              editable={!isLoading && !socialLoading}
            />

            {/* Password Strength Indicator */}
            {formData.password.length > 0 && (
              <View style={{ marginBottom: 12, marginTop: -10 }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4
                }}>
                  <Text style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)' }}>
                    Password strength
                  </Text>
                  <Text style={{ fontSize: 11, color: getPasswordStrengthColor(), fontWeight: '600' }}>
                    {getPasswordStrengthText()}
                  </Text>
                </View>
                <View style={{ height: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1.5 }}>
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
            <View style={{ marginTop: 8 }}>
              <AuthButton
                title="Create Account"
                onPress={handleSignup}
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
                  disabled={socialLoading !== null || isLoading}
                  compact
                />
              </View>
              <View style={{ flex: 1 }}>
                <SocialAuthButton
                  provider="google"
                  onPress={() => handleSocialAuth('google')}
                  loading={socialLoading === 'google'}
                  disabled={socialLoading !== null || isLoading}
                  compact
                />
              </View>
            </View>
          </View>
        </View>

        {/* Bottom section - Sign in link and terms */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.6)' }}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={{ fontSize: 15, color: '#00D4AA', fontWeight: '600' }}>Sign In</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', lineHeight: 18 }}>
            By signing up, you agree to our{' '}
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