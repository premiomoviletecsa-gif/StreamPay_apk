import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import api from '../services/api';

const OFFLINE_USER_KEY = '@streampay_offline_user';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await api.login(username, password);
      if (user && user.id) {
        user.balance = Number(user.balance || 0);
        // Save offline user for recovery
        await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ error: 'Credenciales inválidas', isLoading: false });
      return false;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Error al iniciar sesión';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await api.register(username, password);
      if (user && user.id) {
        user.balance = Number(user.balance || 0);
        await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ error: 'Error al registrar', isLoading: false });
      return false;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Error al registrar';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await AsyncStorage.removeItem(OFFLINE_USER_KEY);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Try to get user from API
      const userId = api.getUserId();
      if (userId) {
        const user = await api.getUser(userId);
        if (user && user.id) {
          user.balance = Number(user.balance || 0);
          await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      
      // Fallback to offline user
      const offlineData = await AsyncStorage.getItem(OFFLINE_USER_KEY);
      if (offlineData) {
        const offlineUser = JSON.parse(offlineData);
        set({ user: offlineUser, isAuthenticated: true, isLoading: false });
        return;
      }
      
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      // Try offline user on error
      try {
        const offlineData = await AsyncStorage.getItem(OFFLINE_USER_KEY);
        if (offlineData) {
          const offlineUser = JSON.parse(offlineData);
          set({ user: offlineUser, isAuthenticated: true, isLoading: false });
          return;
        }
      } catch {}
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  refreshUser: async () => {
    const userId = api.getUserId();
    if (!userId) return;
    
    try {
      const user = await api.heartbeat();
      if (user) {
        user.balance = Number(user.balance || 0);
        const currentUser = get().user;
        if (currentUser && (user.balance !== currentUser.balance || user.vipExpiry !== currentUser.vipExpiry)) {
          await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
          set({ user });
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  },

  updateUser: (user: User) => {
    user.balance = Number(user.balance || 0);
    set({ user });
    AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user)).catch(() => {});
  },

  clearError: () => {
    set({ error: null });
  },
}));
