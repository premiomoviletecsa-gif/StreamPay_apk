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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';

export default function Transfer() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!recipient.trim()) {
      Alert.alert('Error', 'Ingresa el nombre de usuario del destinatario');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    if (amountNum > (user?.balance || 0)) {
      Alert.alert('Error', 'Saldo insuficiente');
      return;
    }

    Alert.alert(
      'Confirmar transferencia',
      `¿Deseas transferir $${amountNum.toFixed(2)} a @${recipient}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Transferir',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await api.transferBalance(recipient.trim(), amountNum);
              if (result.success) {
                if (user) {
                  updateUser({ ...user, balance: result.newBalance });
                }
                Alert.alert('Éxito', 'Transferencia realizada correctamente');
                setRecipient('');
                setAmount('');
              }
            } catch (error: any) {
              const message = error.response?.data?.error || 'No se pudo completar la transferencia';
              Alert.alert('Error', message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transferir</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.notLoggedIn}>
          <Ionicons name="log-in-outline" size={64} color="#444" />
          <Text style={styles.notLoggedInText}>Inicia sesión para transferir</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transferir</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balanceAmount}>${user?.balance?.toFixed(2) || '0.00'}</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Destinatario</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                value={recipient}
                onChangeText={setRecipient}
                placeholder="Nombre de usuario"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.inputLabel}>Monto</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.transferButton,
                (!recipient.trim() || !amount.trim() || isLoading) && styles.transferButtonDisabled,
              ]}
              onPress={handleTransfer}
              disabled={!recipient.trim() || !amount.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.transferButtonText}>Enviar</Text>
                </>
              )}
            </TouchableOpacity>
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
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notLoggedInText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  loginButton: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#888',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#4caf50',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
  },
  formContainer: {
    gap: 16,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  currencySymbol: {
    color: '#666',
    fontSize: 20,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 16,
  },
  transferButton: {
    flexDirection: 'row',
    backgroundColor: '#ff5722',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  transferButtonDisabled: {
    backgroundColor: '#444',
  },
  transferButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
