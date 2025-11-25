import { useEffect, useState } from 'react';
import { Platform, NativeModules } from 'react-native';

// OAuth Client IDs from Firebase Console
const WEB_CLIENT_ID = '46395801472-bl69o6cbgtnek5e8uljom7bm02biqpt3.apps.googleusercontent.com';
const IOS_CLIENT_ID = '46395801472-6u4laj3io3ls67jephok6ls6r47v6c84.apps.googleusercontent.com';

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
      console.log('🔧 [GoogleAuth] Configuring with:');
      console.log('  - webClientId:', WEB_CLIENT_ID);
      console.log('  - iosClientId:', IOS_CLIENT_ID);
      console.log('  - Expected URL scheme:', `com.googleusercontent.apps.${IOS_CLIENT_ID.split('.')[0]}`);
      console.log('  - Platform:', Platform.OS);

      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID,
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
      console.log('🔄 [GoogleAuth] isConfigured:', isConfigured);
      console.log('🔄 [GoogleAuth] Current config - webClientId:', WEB_CLIENT_ID);
      console.log('🔄 [GoogleAuth] Current config - iosClientId:', IOS_CLIENT_ID);

      // Check if play services are available (Android only)
      console.log('🔄 [GoogleAuth] Checking play services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('🔄 [GoogleAuth] Play services check passed');

      // Sign in
      console.log('🔄 [GoogleAuth] Calling GoogleSignin.signIn()...');
      const response = await GoogleSignin.signIn();
      console.log('🔄 [GoogleAuth] signIn response received:', JSON.stringify(response, null, 2));

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
    } catch (error: any) {
      console.error('❌ [GoogleAuth] Sign-in failed:', error);
      console.error('❌ [GoogleAuth] Error details:', {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });

      if (isErrorWithCode && isErrorWithCode(error)) {
        console.log('❌ [GoogleAuth] Error has code:', error.code);
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

      throw { code: 'UNKNOWN', message: error?.message || 'An unexpected error occurred' };
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
