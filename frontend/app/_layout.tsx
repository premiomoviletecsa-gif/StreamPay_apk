import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useServerStore } from '../src/store/serverStore';
import { useAuthStore } from '../src/store/authStore';
import { useCartStore } from '../src/store/cartStore';

export default function RootLayout() {
  const { loadConfig } = useServerStore();
  const { checkAuth } = useAuthStore();
  const { loadCart } = useCartStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadConfig();
        await checkAuth();
        await loadCart();
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    initialize();
  }, []);

  // No bloquear la navegación, dejar que index.tsx maneje la redirección
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0c0c0c' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ headerShown: false }} />
        <Stack.Screen name="watch/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="channel/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="marketplace/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="marketplace/create" options={{ headerShown: false }} />
        <Stack.Screen name="cart" options={{ headerShown: false }} />
        <Stack.Screen name="vip" options={{ headerShown: false }} />
        <Stack.Screen name="upload" options={{ headerShown: false }} />
        <Stack.Screen name="watch-later" options={{ headerShown: false }} />
        <Stack.Screen name="transfer" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
