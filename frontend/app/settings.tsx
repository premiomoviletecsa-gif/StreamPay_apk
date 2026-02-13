import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useServerStore } from '../src/store/serverStore';
import { useAuthStore } from '../src/store/authStore';

export default function Settings() {
  const router = useRouter();
  const { serverUrl, setServerUrl, isConnected, checkConnection } = useServerStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [newServerUrl, setNewServerUrl] = useState(serverUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNewServerUrl(serverUrl);
  }, [serverUrl]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    const connected = await checkConnection();
    setIsTesting(false);
    Alert.alert(
      connected ? 'Conexión exitosa' : 'Error de conexión',
      connected 
        ? 'El servidor responde correctamente'
        : 'No se pudo conectar al servidor'
    );
  };

  const handleSaveServer = async () => {
    if (!newServerUrl.trim()) {
      Alert.alert('Error', 'Ingresa una URL válida');
      return;
    }
    setIsSaving(true);
    const success = await setServerUrl(newServerUrl.trim());
    setIsSaving(false);
    if (success) {
      Alert.alert('Éxito', 'Servidor actualizado correctamente');
    } else {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Server Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servidor</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Estado:</Text>
            <View style={[
              styles.statusIndicator,
              isConnected ? styles.statusConnected : styles.statusDisconnected
            ]} />
            <Text style={[
              styles.statusText,
              isConnected ? styles.statusConnectedText : styles.statusDisconnectedText
            ]}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>

          <Text style={styles.inputLabel}>Dirección del servidor</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="globe-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              value={newServerUrl}
              onChangeText={setNewServerUrl}
              placeholder="http://192.168.1.100"
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, isTesting && styles.buttonDisabled]}
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator color="#ff5722" size="small" />
              ) : (
                <>
                  <Ionicons name="pulse" size={18} color="#ff5722" />
                  <Text style={styles.secondaryButtonText}>Probar</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
              onPress={handleSaveServer}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuenta</Text>
            
            <View style={styles.accountInfo}>
              <View style={styles.accountAvatar}>
                <Ionicons name="person" size={24} color="#888" />
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountUsername}>@{user?.username}</Text>
                <Text style={styles.accountBalance}>Saldo: ${user?.balance?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/watch-later')}>
              <Ionicons name="time-outline" size={22} color="#fff" />
              <Text style={styles.menuItemText}>Ver más tarde</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/vip')}>
              <Ionicons name="star-outline" size={22} color="#ffc107" />
              <Text style={styles.menuItemText}>Planes VIP</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/transfer')}>
              <Ionicons name="swap-horizontal-outline" size={22} color="#fff" />
              <Text style={styles.menuItemText}>Transferir saldo</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ff4444" />
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Aplicación</Text>
            <Text style={styles.aboutValue}>StreamPay Mobile</Text>
          </View>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Versión</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    color: '#888',
    fontSize: 14,
    marginRight: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#4caf50',
  },
  statusDisconnected: {
    backgroundColor: '#ff4444',
  },
  statusText: {
    fontSize: 14,
  },
  statusConnectedText: {
    color: '#4caf50',
  },
  statusDisconnectedText: {
    color: '#ff4444',
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0c',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff5722',
  },
  secondaryButtonText: {
    color: '#ff5722',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ff5722',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountUsername: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountBalance: {
    color: '#4caf50',
    fontSize: 14,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    marginTop: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  aboutLabel: {
    color: '#888',
    fontSize: 14,
  },
  aboutValue: {
    color: '#fff',
    fontSize: 14,
  },
});
