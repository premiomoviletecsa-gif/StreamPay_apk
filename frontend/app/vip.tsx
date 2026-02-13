import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../src/services/api';
import { VipPlan } from '../src/types';
import { useAuthStore } from '../src/store/authStore';
import EmptyState from '../src/components/EmptyState';

export default function VipStore() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.getVipPlans();
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading VIP plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (plan: VipPlan) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if ((user?.balance || 0) < plan.price) {
      Alert.alert('Saldo insuficiente', 'No tienes suficiente saldo para este plan');
      return;
    }

    Alert.alert(
      'Comprar plan VIP',
      `¿Deseas comprar el plan "${plan.name}" por $${plan.price}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprar',
          onPress: async () => {
            setPurchasing(plan.id);
            try {
              const result = await api.purchaseVip(plan.id);
              if (result.success) {
                if (user) {
                  updateUser({ ...user, balance: result.newBalance });
                }
                Alert.alert('Éxito', 'Plan VIP activado correctamente');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo completar la compra');
            } finally {
              setPurchasing(null);
            }
          },
        },
      ]
    );
  };

  const isVipActive = user?.vipExpiry && user.vipExpiry > Date.now() / 1000;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff5722" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planes VIP</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* VIP Status */}
        {isVipActive && (
          <View style={styles.statusCard}>
            <Ionicons name="star" size={32} color="#ffc107" />
            <Text style={styles.statusTitle}>Eres VIP</Text>
            <Text style={styles.statusExpiry}>
              Expira: {new Date((user?.vipExpiry || 0) * 1000).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Beneficios VIP</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text style={styles.benefitText}>Acceso ilimitado a contenido premium</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text style={styles.benefitText}>Sin anuncios</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text style={styles.benefitText}>Descargas offline</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text style={styles.benefitText}>Soporte prioritario</Text>
          </View>
        </View>

        {/* Plans */}
        {plans.length > 0 ? (
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  plan.highlight && styles.planCardHighlighted,
                ]}
                onPress={() => handlePurchase(plan)}
                disabled={purchasing === plan.id}
              >
                {plan.highlight && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MÁS POPULAR</Text>
                  </View>
                )}
                <View style={styles.planIconContainer}>
                  <Ionicons
                    name={plan.type === 'ACCESS' ? 'star' : 'wallet'}
                    size={32}
                    color={plan.highlight ? '#ffc107' : '#ff5722'}
                  />
                </View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>${plan.price}</Text>
                {plan.type === 'ACCESS' && plan.durationDays && (
                  <Text style={styles.planDuration}>{plan.durationDays} días</Text>
                )}
                {plan.type === 'BALANCE' && plan.bonusPercent && (
                  <Text style={styles.planBonus}>+{plan.bonusPercent}% bonus</Text>
                )}
                {purchasing === plan.id ? (
                  <ActivityIndicator color="#ff5722" style={styles.planLoader} />
                ) : (
                  <View style={styles.planButton}>
                    <Text style={styles.planButtonText}>Comprar</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="star-outline"
            title="Sin planes disponibles"
            message="No hay planes VIP configurados actualmente"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statusCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  statusTitle: {
    color: '#ffc107',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statusExpiry: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  benefitsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  benefitsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    color: '#ccc',
    fontSize: 14,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  planCardHighlighted: {
    borderColor: '#ffc107',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  planPrice: {
    color: '#ff5722',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  planDuration: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  planBonus: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  planLoader: {
    marginTop: 16,
  },
  planButton: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  planButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
