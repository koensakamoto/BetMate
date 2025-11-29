import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import { authService } from '../../services/auth/authService';
import {
  isNetworkError,
  isRateLimitError,
  isServerError,
  getErrorMessage,
} from '../../utils/errorUtils';

// Common weak passwords to check against
const COMMON_PASSWORDS = [
  'password', '123456', 'password123', 'admin', 'qwerty',
  'letmein', 'welcome', 'monkey', 'dragon', 'master',
  '12345678', 'abc123', 'iloveyou', 'trustno1', 'sunshine'
];

const MAX_PASSWORD_LENGTH = 128;

export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

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

  const checkPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
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

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(newPassword));
  }, [newPassword]);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const isValid = await authService.validateResetToken(token);
        setIsTokenValid(isValid);
      } catch (error) {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`;
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain a lowercase letter';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain an uppercase letter';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain a number';
    }
    if (isCommonPassword(password)) {
      return 'This password is too common. Please choose a more secure password.';
    }
    if (hasSequentialPattern(password) || hasRepeatedChars(password)) {
      return 'Password contains predictable patterns. Please choose a stronger password.';
    }
    return null;
  };

  const handleResetPassword = async () => {
    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await authService.resetPassword(token, newPassword);
      setIsSuccess(true);
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

      // Check for "same as old password" error
      const errorMessage = getErrorMessage(error);
      if (errorMessage.toLowerCase().includes('same as') || errorMessage.toLowerCase().includes('current password')) {
        setError('New password cannot be the same as your current password');
        return;
      }

      Alert.alert(
        'Reset Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16 }}>Validating reset link...</Text>
      </View>
    );
  }

  // Invalid or expired token
  if (!isTokenValid) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

        <View style={{
          flex: 1,
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24
          }}>
            <MaterialIcons name="error-outline" size={40} color="#EF4444" />
          </View>

          <Text style={{
            fontSize: 24,
            fontWeight: '600',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: 16
          }}>
            Invalid or Expired Link
          </Text>

          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 40,
            paddingHorizontal: 20
          }}>
            This password reset link is invalid or has expired. Please request a new one.
          </Text>

          <View style={{ width: '100%', gap: 16 }}>
            <AuthButton
              title="Request New Link"
              onPress={() => router.replace('/auth/forgot-password')}
              variant="primary"
            />

            <AuthButton
              title="Back to Login"
              onPress={() => router.replace('/auth/login')}
              variant="outline"
            />
          </View>
        </View>
      </View>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

        <View style={{
          flex: 1,
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24
          }}>
            <MaterialIcons name="check" size={40} color="#22C55E" />
          </View>

          <Text style={{
            fontSize: 24,
            fontWeight: '600',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: 16
          }}>
            Password Reset!
          </Text>

          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 40,
            paddingHorizontal: 20
          }}>
            Your password has been successfully reset. You can now log in with your new password.
          </Text>

          <View style={{ width: '100%' }}>
            <AuthButton
              title="Go to Login"
              onPress={() => router.replace('/auth/login')}
              variant="primary"
            />
          </View>
        </View>
      </View>
    );
  }

  // Reset password form
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0a0a0f' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader
          title="Create New Password"
          subtitle="Enter your new password below"
          showBackButton={true}
          onBackPress={() => router.back()}
        />

        <View>
          <AuthInput
            label="New Password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (error) setError('');
            }}
            placeholder="Enter new password"
            secureTextEntry
            autoCapitalize="none"
            showPasswordToggle={true}
            maxLength={MAX_PASSWORD_LENGTH}
            error={error && !error.includes('match') ? error : ''}
            editable={!isLoading}
          />

          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
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

          <AuthInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (error) setError('');
            }}
            placeholder="Confirm new password"
            secureTextEntry
            autoCapitalize="none"
            showPasswordToggle={true}
            maxLength={MAX_PASSWORD_LENGTH}
            error={error === 'Passwords do not match' ? error : ''}
            editable={!isLoading}
          />

          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: 20,
            lineHeight: 18
          }}>
            Password must be at least 8 characters and contain a lowercase letter, uppercase letter, and number.
          </Text>

          <AuthButton
            title="Reset Password"
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
            variant="primary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
