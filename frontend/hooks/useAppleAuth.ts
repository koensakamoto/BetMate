import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export interface AppleAuthResult {
  identityToken: string;
  user: {
    id: string;
    email: string | null;
    fullName: {
      givenName: string | null;
      familyName: string | null;
    } | null;
  };
}

export interface AppleAuthError {
  code: string;
  message: string;
}

export function useAppleAuth() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    // Apple Sign-In is only available on iOS
    if (Platform.OS !== 'ios') {
      setIsAvailable(false);
      return;
    }

    try {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAvailable(available);
    } catch {
      // On iOS 13+, Apple Sign-In should be available even if isAvailableAsync fails
      // Let's set it to true and let the sign-in fail with a better error if needed
      if (Platform.OS === 'ios') {
        setIsAvailable(true);
      } else {
        setIsAvailable(false);
      }
    }
  };

  const signIn = async (): Promise<AppleAuthResult> => {
    if (Platform.OS !== 'ios') {
      throw {
        code: 'NOT_AVAILABLE',
        message: 'Apple Sign-In is only available on iOS devices.'
      };
    }

    try {
      // Double-check availability right before sign-in
      const available = await AppleAuthentication.isAvailableAsync();

      if (!available) {
        throw {
          code: 'NOT_AVAILABLE',
          message: 'Apple Sign-In is not available on this device. Please ensure you are signed into iCloud with an Apple ID.'
        };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Note: Apple only provides full name and email on FIRST sign-in
      // Subsequent sign-ins will have null for these values
      // The backend should store this info on first sign-in
      return {
        identityToken: credential.identityToken,
        user: {
          id: credential.user,
          email: credential.email,
          fullName: credential.fullName ? {
            givenName: credential.fullName.givenName,
            familyName: credential.fullName.familyName,
          } : null,
        },
      };
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw { code: 'CANCELLED', message: 'Sign-in was cancelled' };
      }

      if (error.code === 'ERR_REQUEST_FAILED') {
        throw { code: 'FAILED', message: 'Sign-in request failed' };
      }

      if (error.code === 'ERR_REQUEST_NOT_HANDLED') {
        throw { code: 'NOT_HANDLED', message: 'Sign-in request not handled' };
      }

      throw {
        code: error.code || 'UNKNOWN',
        message: error.message || 'An unexpected error occurred'
      };
    }
  };

  return {
    signIn,
    isAvailable,
  };
}
