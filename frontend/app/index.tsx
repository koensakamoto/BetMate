import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AuthLoadingScreen from '../components/auth/AuthLoadingScreen';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen message="Loading..." />;
  }

  // Redirect based on auth state
  if (user) {
    return <Redirect href="/(app)/(tabs)/group" />;
  }

  return <Redirect href="/auth/login" />;
}
