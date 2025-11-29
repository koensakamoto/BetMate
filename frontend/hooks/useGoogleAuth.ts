import { useEffect, useState } from 'react';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// OAuth Client IDs - loaded from environment configuration via app.config.js
// Set via EAS Secrets for builds, or .env.local for local development
const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || '';
const IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleIosClientId || '';

// Type definitions for dynamically imported Google Sign-In
// These are approximations since we can't import the actual types without the native module
interface GoogleSignInUser {
  email: string;
  name: string | null;
  givenName: string | null;
  familyName: string | null;
  photo: string | null;
}

interface GoogleSignInResponse {
  data: {
    idToken: string | null;
    user: GoogleSignInUser;
  };
}

interface GoogleSignInModule {
  configure: (options: {
    webClientId: string;
    iosClientId: string;
    offlineAccess: boolean;
    scopes: string[];
  }) => void;
  hasPlayServices: (options: { showPlayServicesUpdateDialog: boolean }) => Promise<boolean>;
  signIn: () => Promise<GoogleSignInResponse>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<GoogleSignInUser | null>;
}

interface StatusCodes {
  SIGN_IN_CANCELLED: string;
  IN_PROGRESS: string;
  PLAY_SERVICES_NOT_AVAILABLE: string;
}

// Dynamically import Google Sign-In to avoid crash in Expo Go
let GoogleSignin: GoogleSignInModule | null = null;
let statusCodes: StatusCodes | null = null;
let isSuccessResponse: ((response: unknown) => response is GoogleSignInResponse) | null = null;
let isErrorWithCode: ((error: unknown) => error is { code: string }) | null = null;
let isGoogleSignInAvailable = false;

// Check if the native module is actually available (not just the JS package)
const nativeModuleAvailable = Platform.OS === 'ios'
  ? NativeModules.RNGoogleSignin != null
  : NativeModules.RNGoogleSignin != null;

if (nativeModuleAvailable) {
  try {
    const googleSignIn = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignIn.GoogleSignin;
    statusCodes = googleSignIn.statusCodes;
    isSuccessResponse = googleSignIn.isSuccessResponse;
    isErrorWithCode = googleSignIn.isErrorWithCode;
    isGoogleSignInAvailable = true;
  } catch (error) {
    isGoogleSignInAvailable = false;
  }
} else {
  isGoogleSignInAvailable = false;
}

export interface GoogleAuthResult {
  idToken: string;
  user: {
    email: string;
    name: string | null;
    givenName: string | null;
    familyName: string | null;
    photo: string | null;
  };
}

export interface GoogleAuthError {
  code: string;
  message: string;
}

export function useGoogleAuth() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAvailable, setIsAvailable] = useState(isGoogleSignInAvailable);

  useEffect(() => {
    if (isGoogleSignInAvailable) {
      configureGoogleSignIn();
    }
  }, []);

  const configureGoogleSignIn = () => {
    if (!isGoogleSignInAvailable || !GoogleSignin) {
      return;
    }

    try {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID,
        offlineAccess: true,
        scopes: ['profile', 'email'],
      });
      setIsConfigured(true);
    } catch {
      // Configuration failed - isConfigured remains false
    }
  };

  const signIn = async (): Promise<GoogleAuthResult> => {
    if (!isGoogleSignInAvailable || !GoogleSignin) {
      throw {
        code: 'NOT_AVAILABLE',
        message: 'Google Sign-In is not available in Expo Go. Please use a development build.'
      };
    }

    try {
      // Check if play services are available (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse && isSuccessResponse(response)) {
        const { data } = response;
        const idToken = data.idToken;

        if (!idToken) {
          throw new Error('No ID token received from Google');
        }

        return {
          idToken,
          user: {
            email: data.user.email,
            name: data.user.name,
            givenName: data.user.givenName,
            familyName: data.user.familyName,
            photo: data.user.photo,
          },
        };
      } else {
        throw new Error('Sign-in was cancelled');
      }
    } catch (error) {
      if (isErrorWithCode && isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes?.SIGN_IN_CANCELLED:
            throw { code: 'CANCELLED', message: 'Sign-in was cancelled' };
          case statusCodes?.IN_PROGRESS:
            throw { code: 'IN_PROGRESS', message: 'Sign-in is already in progress' };
          case statusCodes?.PLAY_SERVICES_NOT_AVAILABLE:
            throw { code: 'PLAY_SERVICES', message: 'Google Play Services not available' };
          default:
            throw { code: 'UNKNOWN', message: error instanceof Error ? error.message : 'An unknown error occurred' };
        }
      }

      throw { code: 'UNKNOWN', message: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  };

  const signOut = async (): Promise<void> => {
    if (!isGoogleSignInAvailable || !GoogleSignin) {
      return;
    }

    try {
      await GoogleSignin.signOut();
    } catch {
      // Sign-out failed silently
    }
  };

  const isSignedIn = async (): Promise<boolean> => {
    if (!isGoogleSignInAvailable || !GoogleSignin) {
      return false;
    }

    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser !== null;
    } catch {
      return false;
    }
  };

  return {
    signIn,
    signOut,
    isSignedIn,
    isConfigured,
    isAvailable,
  };
}
