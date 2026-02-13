import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
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
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await api.getCurrentUser();
      if (user && user.id) {
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (user: User) => {
    set({ user });
  },

  clearError: () => {
    set({ error: null });
  },
}));
