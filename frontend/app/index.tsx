import { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useServerStore } from '../src/store/serverStore';

export default function Index() {
  const router = useRouter();
  const { isConfigured, isLoading } = useServerStore();

  useEffect(() => {
    // Esperar a que la configuración termine de cargar
    if (!isLoading) {
      // Usar setTimeout para asegurar que la navegación ocurra después del render
      const timer = setTimeout(() => {
        if (isConfigured) {
          // Servidor ya configurado, ir a las tabs principales
          router.replace('/(tabs)');
        } else {
          // Primera vez, mostrar configuración del servidor
          router.replace('/setup');
        }
      }, 1500); // Mostrar splash por 1.5 segundos

      return () => clearTimeout(timer);
    }
  }, [isLoading, isConfigured]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/app-image.png')}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
