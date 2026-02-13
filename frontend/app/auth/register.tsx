import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function Register() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleRegister = async () => {
    setLocalError('');
    clearError();

    if (!username.trim()) {
      setLocalError('Ingresa un nombre de usuario');
      return;
    }
    if (username.length < 3) {
      setLocalError('El usuario debe tener al menos 3 caracteres');
      return;
    }
    if (!password.trim()) {
      setLocalError('Ingresa una contraseña');
      return;
    }
    if (password.length < 4) {
      setLocalError('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    const success = await register(username.trim(), password);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const displayError = localError || error;

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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para comenzar</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Nombre de usuario"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar contraseña"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            {displayError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#ff4444" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

            <Link href="/auth/login" asChild>
              <TouchableOpacity style={styles.loginLink}>
                <Text style={styles.loginText}>
                  ¿Ya tienes cuenta? <Text style={styles.loginHighlight}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </Link>
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
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  formContainer: {
    gap: 16,
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
  eyeButton: {
    padding: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: '#ff5722',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    padding: 12,
  },
  loginText: {
    color: '#888',
    fontSize: 14,
  },
  loginHighlight: {
    color: '#ff5722',
    fontWeight: '600',
  },
});
