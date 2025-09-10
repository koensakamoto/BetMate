import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { debugLog } from '../config/env';

/**
 * Hook to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export const useAuthGuard = (redirectPath: string = '/auth/login') => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect while auth status is still loading
    if (isLoading) return;
    
    if (!isAuthenticated) {
      debugLog('Auth guard: User not authenticated, redirecting to login');
      router.replace(redirectPath);
    }
  }, [isAuthenticated, isLoading, redirectPath]);

  return {
    isAuthenticated,
    isLoading,
    isProtected: !isLoading && isAuthenticated,
  };
};

/**
 * Hook to redirect authenticated users away from auth pages
 * Useful for login/signup pages
 */
export const useGuestGuard = (redirectPath: string = '/(tabs)') => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect while auth status is still loading
    if (isLoading) return;
    
    if (isAuthenticated) {
      debugLog('Guest guard: User authenticated, redirecting to main app');
      router.replace(redirectPath);
    }
  }, [isAuthenticated, isLoading, redirectPath]);

  return {
    isAuthenticated,
    isLoading,
    isGuest: !isLoading && !isAuthenticated,
  };
};