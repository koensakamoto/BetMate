import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';

export default function Signup() {
  const insets = useSafeAreaInsets();
  const { signup, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service to continue.');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      await signup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      // Navigation will be handled by auth state change
    } catch (error) {
      Alert.alert(
        'Signup Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
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
        <AuthHeader
          title="Create Account"
          subtitle="Join the betting community"
          showBackButton={true}
          onBackPress={() => router.back()}
        />

        <View style={{ paddingHorizontal: 20 }}>
          {/* Signup Form */}
          <View style={{ marginBottom: 16 }}>
            <AuthInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              placeholder="Enter your first name"
              autoCapitalize="words"
              error={errors.firstName}
              isValid={formData.firstName.trim().length >= 2}
              maxLength={50}
            />

            <AuthInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              placeholder="Enter your last name"
              autoCapitalize="words"
              error={errors.lastName}
              isValid={formData.lastName.trim().length >= 2}
              maxLength={50}
            />

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

            <AuthInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              placeholder="Confirm your password"
              secureTextEntry={true}
              autoCapitalize="none"
              error={errors.confirmPassword}
              isValid={formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword}
            />

            {/* Terms Acceptance */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: 20
              }}
            >
              <TouchableOpacity
                onPress={() => setAcceptTerms(!acceptTerms)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 3,
                  borderWidth: 1.5,
                  borderColor: acceptTerms ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: acceptTerms ? '#00D4AA' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  marginTop: 1
                }}
              >
                {acceptTerms && (
                  <MaterialIcons name="check" size={12} color="#000000" />
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 18
                }}>
                  I agree to the{' '}
                  <Text
                    style={{ color: '#00D4AA', fontWeight: '500', textDecorationLine: 'underline' }}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push('/terms-of-service');
                    }}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={{ color: '#00D4AA', fontWeight: '500', textDecorationLine: 'underline' }}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push('/privacy-policy');
                    }}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>

            {/* Create Account Button */}
            <AuthButton
              title="Create Account"
              onPress={handleSignup}
              loading={isLoading}
              disabled={isLoading}
              variant="primary"
            />
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}