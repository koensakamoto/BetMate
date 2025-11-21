import React, { useState } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import SocialAuthButton from '../../components/auth/SocialAuthButton';

const icon = require("../../assets/images/icon.png");

export default function Login() {
  const insets = useSafeAreaInsets();
  const { login, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
        password: formData.password,
        rememberMe
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

  const handleSocialAuth = async (provider: 'google') => {
    try {
      // TODO: Implement actual social authentication
      console.log(`Authenticating with ${provider}`);
    } catch (error) {
      console.error('Social auth failed:', error);
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
        <View 
          style={{ 
            flex: 1,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 24,
            justifyContent: 'space-between'
          }}
        >
          {/* Top Section */}
          <View>
            {/* Hero Section */}
            <View style={{
              alignItems: 'center',
              marginBottom: 32
            }}>
              {/* Logo */}
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 15,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <Image 
                  source={icon}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10
                  }}
                />
              </View>
              
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

              {/* Remember Me & Forgot Password */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24
              }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={{
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    borderWidth: 1.5,
                    borderColor: rememberMe ? '#00D4AA' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: rememberMe ? '#00D4AA' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 6
                  }}>
                    {rememberMe && (
                      <MaterialIcons name="check" size={10} color="#000000" />
                    )}
                  </View>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: '500'
                  }}>
                    Remember me
                  </Text>
                </TouchableOpacity>

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
            <View>
              <SocialAuthButton
                provider="google"
                onPress={() => handleSocialAuth('google')}
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
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}