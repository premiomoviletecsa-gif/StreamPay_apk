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
      let serverUrl = 'http://192.168.43.101';
      let isConfiguredStr: string | null = null;
      
      try {
        const [url, configured] = await Promise.all([
          api.getServerUrl(),
          AsyncStorage.getItem(SERVER_CONFIGURED_KEY),
        ]);
        serverUrl = url;
        isConfiguredStr = configured;
      } catch (storageError) {
        console.error('Error loading from storage:', storageError);
      }
      
      const isConfigured = isConfiguredStr === 'true';
      
      set({ 
        serverUrl, 
        isConfigured,
        isLoading: false 
      });

      // Solo intentar conexión si ya está configurado, en segundo plano
      if (isConfigured) {
        api.testConnection().then(isConnected => {
          set({ isConnected });
        }).catch(() => {
          set({ isConnected: false });
        });
      }
    } catch (error) {
      console.error('Error in loadConfig:', error);
      set({ isLoading: false, isConfigured: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
