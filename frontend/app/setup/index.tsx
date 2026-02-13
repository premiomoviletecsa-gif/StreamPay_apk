import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useServerStore } from '../../src/store/serverStore';

export default function ServerSetup() {
  const router = useRouter();
  const { serverUrl, setServerUrl, isLoading, error, clearError } = useServerStore();
  const [url, setUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setUrl(serverUrl);
  }, [serverUrl]);

  const handleConnect = async () => {
    if (!url.trim()) return;
    setTesting(true);
    clearError();
    
    const success = await setServerUrl(url.trim());
    setTesting(false);
    
    if (success) {
      router.replace('/auth/login');
    }
  };

  const handleSkip = () => {
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="server" size={48} color="#ff5722" />
            </View>
            <Text style={styles.title}>StreamPay</Text>
            <Text style={styles.subtitle}>Configura tu servidor</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Dirección del servidor</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="globe-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="http://192.168.43.101"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
            <Text style={styles.hint}>
              Ingresa la dirección IP de tu servidor StreamPay local
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#ff4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, (!url.trim() || testing) && styles.buttonDisabled]}
              onPress={handleConnect}
              disabled={!url.trim() || testing}
            >
              {testing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="link" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Conectar</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Configurar después</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={18} color="#666" />
            <Text style={styles.infoText}>
              Asegúrate de que tu dispositivo esté conectado a la misma red que el servidor NAS
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  formContainer: {
    marginBottom: 32,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 16,
  },
  hint: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: '#ff5722',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
  },
  skipText: {
    color: '#888',
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
});
