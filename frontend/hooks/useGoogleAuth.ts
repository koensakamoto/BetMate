import { useEffect, useState } from 'react';
import { Platform, NativeModules } from 'react-native';

// Web client ID from Firebase Console
const WEB_CLIENT_ID = '46395801472-6u4laj3io3ls67jephok6ls6r47v6c84.apps.googleusercontent.com';

// Dynamically import Google Sign-In to avoid crash in Expo Go
let GoogleSignin: any = null;
let statusCodes: any = null;
let isSuccessResponse: any = null;
let isErrorWithCode: any = null;
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
    console.log('✅ [GoogleAuth] Native module available');
  } catch (error) {
    console.warn('⚠️ [GoogleAuth] Failed to load Google Sign-In module:', error);
    isGoogleSignInAvailable = false;
  }
} else {
  console.warn('⚠️ [GoogleAuth] Native module not available - Google Sign-In disabled (this is expected in Expo Go)');
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
      console.warn('⚠️ [GoogleAuth] Google Sign-In not available in this environment');
      return;
    }

    try {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
        scopes: ['profile', 'email'],
      });
      setIsConfigured(true);
      console.log('✅ [GoogleAuth] Configured successfully');
    } catch (error) {
      console.error('❌ [GoogleAuth] Configuration failed:', error);
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
      console.log('🔄 [GoogleAuth] Starting sign-in...');

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

        console.log('✅ [GoogleAuth] Sign-in successful:', data.user.email);

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
      console.error('❌ [GoogleAuth] Sign-in failed:', error);

      if (isErrorWithCode && isErrorWithCode(error)) {
        switch ((error as any).code) {
          case statusCodes?.SIGN_IN_CANCELLED:
            throw { code: 'CANCELLED', message: 'Sign-in was cancelled' };
          case statusCodes?.IN_PROGRESS:
            throw { code: 'IN_PROGRESS', message: 'Sign-in is already in progress' };
          case statusCodes?.PLAY_SERVICES_NOT_AVAILABLE:
            throw { code: 'PLAY_SERVICES', message: 'Google Play Services not available' };
          default:
            throw { code: 'UNKNOWN', message: (error as any).message || 'An unknown error occurred' };
        }
      }

      throw { code: 'UNKNOWN', message: 'An unexpected error occurred' };
    }
  };

  const signOut = async (): Promise<void> => {
    if (!isGoogleSignInAvailable || !GoogleSignin) {
      return;
    }

    try {
      await GoogleSignin.signOut();
      console.log('✅ [GoogleAuth] Signed out successfully');
    } catch (error) {
      console.error('❌ [GoogleAuth] Sign-out failed:', error);
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
