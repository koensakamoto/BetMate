import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';
import { authService } from '../services/auth/authService';
import { ApiError } from '../services/api/baseClient';

export default function ChangePassword() {
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;

    // Character variety
    if (/[a-z]/.test(password)) strength += 12.5;
    if (/[A-Z]/.test(password)) strength += 12.5;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    if (strength <= 25) return { strength, label: 'Weak', color: '#EF4444' };
    if (strength <= 50) return { strength, label: 'Fair', color: '#F59E0B' };
    if (strength <= 75) return { strength, label: 'Good', color: '#00D4AA' };
    return { strength, label: 'Strong', color: '#22C55E' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  // Prevent back navigation while loading
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (isLoading) {
          console.log('Back button pressed while loading - prevented');
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      });

      return () => backHandler.remove();
    }
  }, [isLoading]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Current password validation
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else {
      // Password complexity validation
      const hasUppercase = /[A-Z]/.test(formData.newPassword);
      const hasLowercase = /[a-z]/.test(formData.newPassword);
      const hasNumber = /[0-9]/.test(formData.newPassword);

      const missing = [];
      if (!hasUppercase) missing.push('uppercase letter');
      if (!hasLowercase) missing.push('lowercase letter');
      if (!hasNumber) missing.push('number');

      if (missing.length > 0) {
        newErrors.newPassword = `Password must contain: ${missing.join(', ')}`;
      } else if (formData.newPassword === formData.currentPassword) {
        newErrors.newPassword = 'New password must be different from current password';
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors({}); // Clear any previous errors

      console.log('Attempting to change password...');
      await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      console.log('Password change successful!');

      // Success - navigate back with success message
      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.log('Password change error caught:', error);

      let errorMessage = 'Failed to change password. Please try again.';

      // Extract error message from ApiError or general error
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log('Error message:', errorMessage);

      // Check if it's a current password error
      if (errorMessage.toLowerCase().includes('current password')) {
        console.log('Setting current password error');
        setErrors({ currentPassword: errorMessage });
      } else if (errorMessage.toLowerCase().includes('password must contain')) {
        // Password complexity error
        console.log('Setting new password complexity error');
        setErrors({ newPassword: errorMessage });
      } else if (errorMessage.toLowerCase().includes('same as current')) {
        console.log('Setting same password error');
        setErrors({ newPassword: errorMessage });
      } else {
        // Generic error - show inline on current password field
        console.log('Setting generic error on current password field');
        setErrors({ currentPassword: errorMessage });
      }
    } finally {
      setIsLoading(false);
      console.log('Password change attempt complete');
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear confirm password error if typing in new password
    if (field === 'newPassword' && errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />

      {/* Solid background behind status bar */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: '#0a0a0f',
        zIndex: 1
      }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1, marginTop: insets.top }}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 24
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 40,
            paddingVertical: 8
          }}>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={isLoading}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 20,
                opacity: isLoading ? 0.5 : 1
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="arrow-back"
                size={20}
                color="rgba(255, 255, 255, 0.9)"
              />
            </TouchableOpacity>

            <View>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#ffffff'
              }}>
                Change Password
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: 4
              }}>
                Update your account password
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={{
            backgroundColor: 'rgba(0, 212, 170, 0.08)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 32,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 212, 170, 0.2)',
            flexDirection: 'row',
            alignItems: 'flex-start'
          }}>
            <MaterialIcons
              name="info-outline"
              size={20}
              color="#00D4AA"
              style={{ marginRight: 12, marginTop: 2 }}
            />
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 20,
              flex: 1
            }}>
              Password must be at least 8 characters and include uppercase letters, lowercase letters, and numbers.
            </Text>
          </View>

          {/* Current Password */}
          <AuthInput
            label="Current Password"
            value={formData.currentPassword}
            onChangeText={(text) => updateField('currentPassword', text)}
            placeholder="Enter your current password"
            secureTextEntry={true}
            showPasswordToggle={true}
            error={errors.currentPassword}
            autoCapitalize="none"
          />

          {/* New Password */}
          <AuthInput
            label="New Password"
            value={formData.newPassword}
            onChangeText={(text) => updateField('newPassword', text)}
            placeholder="Enter your new password"
            secureTextEntry={true}
            showPasswordToggle={true}
            error={errors.newPassword}
            autoCapitalize="none"
          />

          {/* Password Strength Indicator */}
          {formData.newPassword.length > 0 && (
            <View style={{ marginTop: -12, marginBottom: 20 }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <Text style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Password Strength
                </Text>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: passwordStrength.color
                }}>
                  {passwordStrength.label}
                </Text>
              </View>
              <View style={{
                height: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <View style={{
                  height: '100%',
                  width: `${passwordStrength.strength}%`,
                  backgroundColor: passwordStrength.color,
                  borderRadius: 2
                }} />
              </View>
            </View>
          )}

          {/* Confirm Password */}
          <AuthInput
            label="Confirm New Password"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            placeholder="Re-enter your new password"
            secureTextEntry={true}
            showPasswordToggle={true}
            error={errors.confirmPassword}
            isValid={formData.confirmPassword.length > 0 && formData.confirmPassword === formData.newPassword}
            autoCapitalize="none"
          />

          {/* Change Password Button */}
          <AuthButton
            title="Change Password"
            onPress={handleChangePassword}
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading}
          />

          {/* Security Tips */}
          <View style={{
            marginTop: 32,
            padding: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.08)'
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 12
            }}>
              Password Tips
            </Text>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialIcons
                  name="check-circle"
                  size={16}
                  color="rgba(255, 255, 255, 0.5)"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 18,
                  flex: 1
                }}>
                  Use at least 8 characters for better security
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialIcons
                  name="check-circle"
                  size={16}
                  color="rgba(255, 255, 255, 0.5)"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 18,
                  flex: 1
                }}>
                  Mix uppercase and lowercase letters
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialIcons
                  name="check-circle"
                  size={16}
                  color="rgba(255, 255, 255, 0.5)"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 18,
                  flex: 1
                }}>
                  Include at least one number
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialIcons
                  name="check-circle"
                  size={16}
                  color="rgba(255, 255, 255, 0.5)"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 18,
                  flex: 1
                }}>
                  Avoid using easily guessable passwords
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
