import React, { useState, useEffect } from 'react';
import { Text, View, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AuthButton from '../../components/auth/AuthButton';
import { userService } from '../../services/user/userService';

export default function VerifyEmailChange() {
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [isValidating, setIsValidating] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newEmail, setNewEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const result = await userService.validateEmailChangeToken(token);
        setIsTokenValid(result.valid);
        if (result.valid && result.pendingEmail) {
          setPendingEmail(result.pendingEmail);
        }
      } catch (err) {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleConfirmEmailChange = async () => {
    if (!token) {
      setError('Invalid token');
      return;
    }

    try {
      setIsConfirming(true);
      setError(null);
      const result = await userService.confirmEmailChange(token);

      if (result.success) {
        setIsSuccess(true);
        setNewEmail(result.email);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm email change');
    } finally {
      setIsConfirming(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, marginTop: 16 }}>
          Validating verification link...
        </Text>
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
            This email verification link is invalid or has expired. Please request a new email change from your profile settings.
          </Text>

          <View style={{ width: '100%', gap: 16 }}>
            <AuthButton
              title="Go to Profile"
              onPress={() => router.replace('/(app)/(tabs)/profile')}
              variant="primary"
            />

            <AuthButton
              title="Go to Home"
              onPress={() => router.replace('/(app)/(tabs)/group')}
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
            Email Changed!
          </Text>

          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 12,
            paddingHorizontal: 20
          }}>
            Your email address has been successfully changed to:
          </Text>

          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#00D4AA',
            textAlign: 'center',
            marginBottom: 40
          }}>
            {newEmail}
          </Text>

          <View style={{ width: '100%' }}>
            <AuthButton
              title="Go to Profile"
              onPress={() => router.replace('/(app)/(tabs)/profile')}
              variant="primary"
            />
          </View>
        </View>
      </View>
    );
  }

  // Confirmation screen
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
          backgroundColor: 'rgba(0, 212, 170, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24
        }}>
          <MaterialIcons name="mail" size={40} color="#00D4AA" />
        </View>

        <Text style={{
          fontSize: 24,
          fontWeight: '600',
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: 16
        }}>
          Confirm Email Change
        </Text>

        <Text style={{
          fontSize: 16,
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 12,
          paddingHorizontal: 20
        }}>
          You are about to change your email address to:
        </Text>

        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#00D4AA',
          textAlign: 'center',
          marginBottom: 40
        }}>
          {pendingEmail}
        </Text>

        {error && (
          <View style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 0.5,
            borderColor: 'rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            width: '100%'
          }}>
            <Text style={{
              color: '#EF4444',
              fontSize: 14,
              textAlign: 'center'
            }}>
              {error}
            </Text>
          </View>
        )}

        <View style={{ width: '100%', gap: 16 }}>
          <AuthButton
            title="Confirm Email Change"
            onPress={handleConfirmEmailChange}
            loading={isConfirming}
            disabled={isConfirming}
            variant="primary"
          />

          <AuthButton
            title="Cancel"
            onPress={() => router.replace('/(app)/(tabs)/profile')}
            variant="outline"
            disabled={isConfirming}
          />
        </View>
      </View>
    </View>
  );
}
