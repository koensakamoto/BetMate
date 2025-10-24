import React, { useState } from 'react';
import { Text, View, ScrollView, StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
  const { forgotPassword, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (error) {
      Alert.alert(
        'Reset Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) setError('');
  };

  if (isSuccess) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0a0a0f"
          translucent={true}
        />
        
        <View style={{ 
          flex: 1,
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Success Icon */}
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

          {/* Success Content */}
          <Text style={{
            fontSize: 24,
            fontWeight: '600',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: 16
          }}>
            Check Your Email
          </Text>

          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 8,
            paddingHorizontal: 20
          }}>
            We&apos;ve sent a password reset link to
          </Text>

          <Text style={{
            fontSize: 16,
            color: '#00D4AA',
            fontWeight: '500',
            textAlign: 'center',
            marginBottom: 40
          }}>
            {email}
          </Text>

          <View style={{ width: '100%', gap: 16 }}>
            <AuthButton
              title="Back to Login"
              onPress={() => router.replace('/auth/login')}
              variant="primary"
            />

            <AuthButton
              title="Resend Email"
              onPress={handleResetPassword}
              variant="outline"
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            lineHeight: 18,
            marginTop: 32,
            paddingHorizontal: 40
          }}>
            Didn&apos;t receive the email? Check your spam folder or try resending.
          </Text>
        </View>
      </View>
    );
  }

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
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader
          title="Reset Password"
          subtitle="Enter your email and we'll send you a link to reset your password"
          showBackButton={true}
          onBackPress={() => router.back()}
        />

        <View style={{ paddingHorizontal: 20 }}>
          {/* Reset Form */}
          <View style={{ marginBottom: 32 }}>
            <AuthInput
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={error}
              isValid={email.length > 0 && validateEmail(email)}
            />

            <AuthButton
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={isLoading}
              disabled={isLoading || !email.trim()}
              variant="primary"
            />
          </View>

          {/* Info Section */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-start'
            }}>
              <MaterialIcons 
                name="info-outline" 
                size={20} 
                color="rgba(255, 255, 255, 0.6)" 
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#ffffff',
                  marginBottom: 8
                }}>
                  What happens next?
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 18
                }}>
                  We&apos;ll send you a secure link to reset your password. The link will expire in 24 hours for your security.
                </Text>
              </View>
            </View>
          </View>

          {/* Back to Login */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 32
          }}>
            <Text style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Remember your password?{' '}
            </Text>
            <AuthButton
              title="Back to Login"
              onPress={() => router.back()}
              variant="outline"
              size="small"
              fullWidth={false}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}