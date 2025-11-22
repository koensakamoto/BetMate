import { useEffect, useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';

// Web client ID from Firebase Console
const WEB_CLIENT_ID = '46395801472-6u4laj3io3ls67jephok6ls6r47v6c84.apps.googleusercontent.com';

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

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const configureGoogleSignIn = () => {
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
    try {
      console.log('🔄 [GoogleAuth] Starting sign-in...');

      // Check if play services are available (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
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

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            throw { code: 'CANCELLED', message: 'Sign-in was cancelled' };
          case statusCodes.IN_PROGRESS:
            throw { code: 'IN_PROGRESS', message: 'Sign-in is already in progress' };
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            throw { code: 'PLAY_SERVICES', message: 'Google Play Services not available' };
          default:
            throw { code: 'UNKNOWN', message: error.message || 'An unknown error occurred' };
        }
      }

      throw { code: 'UNKNOWN', message: 'An unexpected error occurred' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await GoogleSignin.signOut();
      console.log('✅ [GoogleAuth] Signed out successfully');
    } catch (error) {
      console.error('❌ [GoogleAuth] Sign-out failed:', error);
    }
  };

  const isSignedIn = async (): Promise<boolean> => {
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
  };
}
