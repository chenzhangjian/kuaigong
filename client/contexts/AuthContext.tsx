import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/utils/api';

interface User {
  id: string;
  phone: string;
  nickname: string;
  avatarUrl?: string;
  userType: 'worker' | 'employer';
  rating: number;
  skills?: string[];
  bio?: string;
  totalOrders: number;
  completedOrders: number;
  balance: number;
  isVerified: boolean;
  isOnline?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  userType: 'worker' | 'employer' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<'worker' | 'employer' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUserType = await AsyncStorage.getItem('userType');

      if (storedToken) {
        api.setToken(storedToken);
        setToken(storedToken);
        setUserType(storedUserType as 'worker' | 'employer');

        // 获取用户信息
        const userData = await api.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Load auth error:', error);
      await AsyncStorage.multiRemove(['token', 'userType']);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, userData: User) => {
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('userType', userData.userType);
    api.setToken(newToken);
    setToken(newToken);
    setUser(userData);
    setUserType(userData.userType);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'userType']);
    api.setToken(null);
    setToken(null);
    setUser(null);
    setUserType(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    userType,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
