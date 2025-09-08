import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  phone?: string;
  location?: string;
  avatar?: string;
  credits: number;
  joinedAt: Date;
}

export interface SignupData {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token/session on app start
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      // TODO: Check AsyncStorage for auth token
      // TODO: Validate token with backend
      // For now, simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock: No existing session
      setUser(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    try {
      setIsLoading(true);
      
      // TODO: Implement actual login API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful login
      const mockUser: User = {
        id: '1',
        name: 'John Doe',
        username: 'johnbets2024',
        email: data.email,
        bio: 'Professional sports bettor | 85% win rate | Follow for winning tips 🏆',
        phone: '+1 (555) 123-4567',
        location: 'Las Vegas, NV',
        credits: 425,
        joinedAt: new Date()
      };
      
      setUser(mockUser);
      
      // TODO: Store auth token in AsyncStorage if rememberMe is true
      
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    try {
      setIsLoading(true);
      
      // TODO: Implement actual signup API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful signup
      const newUser: User = {
        id: Date.now().toString(),
        name: data.name,
        username: data.username,
        email: data.email,
        bio: '',
        credits: 100, // Starting credits
        joinedAt: new Date()
      };
      
      setUser(newUser);
      
    } catch (error) {
      throw new Error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // TODO: Remove auth token from AsyncStorage
    // TODO: Clear any cached user data
  };

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      
      // TODO: Implement actual forgot password API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock success - would normally send email
      
    } catch (error) {
      throw new Error('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};