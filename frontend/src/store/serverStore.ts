import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const SERVER_CONFIGURED_KEY = '@streampay_server_configured';

interface ServerState {
  serverUrl: string;
  isConfigured: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  setServerUrl: (url: string) => Promise<boolean>;
  checkConnection: () => Promise<boolean>;
  loadConfig: () => Promise<void>;
  clearError: () => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  serverUrl: 'http://192.168.43.101',
  isConfigured: false,
  isConnected: false,
  isLoading: true,
  error: null,

  setServerUrl: async (url: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.setServerUrl(url);
      const isConnected = await api.testConnection();
      
      if (isConnected) {
        await AsyncStorage.setItem(SERVER_CONFIGURED_KEY, 'true');
        set({ serverUrl: url, isConfigured: true, isConnected: true, isLoading: false });
        return true;
      } else {
        set({ error: 'No se pudo conectar al servidor', isLoading: false });
        return false;
      }
    } catch (error: any) {
      set({ error: error.message || 'Error de conexión', isLoading: false });
      return false;
    }
  },

  checkConnection: async () => {
    try {
      const isConnected = await api.testConnection();
      set({ isConnected });
      return isConnected;
    } catch {
      set({ isConnected: false });
      return false;
    }
  },

  loadConfig: async () => {
    set({ isLoading: true });
    try {
      const [serverUrl, isConfigured] = await Promise.all([
        api.getServerUrl(),
        AsyncStorage.getItem(SERVER_CONFIGURED_KEY),
      ]);
      
      set({ 
        serverUrl, 
        isConfigured: isConfigured === 'true',
        isLoading: false 
      });

      if (isConfigured === 'true') {
        const isConnected = await api.testConnection();
        set({ isConnected });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
