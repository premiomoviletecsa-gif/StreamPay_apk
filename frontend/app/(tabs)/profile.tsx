import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { Video, Transaction } from '../../src/types';
import VideoCard from '../../src/components/VideoCard';
import EmptyState from '../../src/components/EmptyState';

export default function Profile() {
  const router = useRouter();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myVideos, setMyVideos] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'transactions'>('videos');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [transData, videosData] = await Promise.all([
        api.getTransactions(),
        api.getUserVideos(),
      ]);
      setTransactions(transData || []);
      setMyVideos(videosData || []);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    checkAuth();
    loadData();
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

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'PURCHASE': return 'Compra de video';
      case 'DEPOSIT': return 'Depósito';
      case 'MARKETPLACE': return 'Compra en tienda';
      case 'VIP': return 'Suscripción VIP';
      case 'TRANSFER_SENT': return 'Transferencia enviada';
      case 'TRANSFER_RECV': return 'Transferencia recibida';
      default: return type;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE': return 'play-circle';
      case 'DEPOSIT': return 'add-circle';
      case 'MARKETPLACE': return 'storefront';
      case 'VIP': return 'star';
      case 'TRANSFER_SENT': return 'arrow-up-circle';
      case 'TRANSFER_RECV': return 'arrow-down-circle';
      default: return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'TRANSFER_RECV':
        return '#4caf50';
      default:
        return '#ff5722';
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#444" />
          <Text style={styles.notLoggedInTitle}>Inicia sesión</Text>
          <Text style={styles.notLoggedInText}>
            Accede a tu perfil, historial y más
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButtonAlt}
            onPress={() => router.push('/setup')}
          >
            <Ionicons name="settings-outline" size={18} color="#888" />
            <Text style={styles.settingsButtonAltText}>Configurar servidor</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUrl = user?.avatarUrl ? api.getAvatarUrl(user.avatarUrl) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ff5722"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
            {user?.role === 'ADMIN' && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.username}>@{user?.username}</Text>
          {user?.vipExpiry && user.vipExpiry > Date.now() / 1000 && (
            <View style={styles.vipBadge}>
              <Ionicons name="star" size={14} color="#ffc107" />
              <Text style={styles.vipText}>VIP</Text>
            </View>
          )}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balanceAmount}>${user?.balance?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/upload')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="cloud-upload" size={24} color="#ff5722" />
            </View>
            <Text style={styles.actionText}>Subir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/watch-later')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="time" size={24} color="#ff5722" />
            </View>
            <Text style={styles.actionText}>Ver luego</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/vip')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="star" size={24} color="#ffc107" />
            </View>
            <Text style={styles.actionText}>VIP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/transfer')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="swap-horizontal" size={24} color="#ff5722" />
            </View>
            <Text style={styles.actionText}>Transferir</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
            onPress={() => setActiveTab('videos')}
          >
            <Text style={[styles.tabText, activeTab === 'videos' && styles.tabTextActive]}>
              Mis Videos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
            onPress={() => setActiveTab('transactions')}
          >
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
              Transacciones
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'videos' ? (
          myVideos.length > 0 ? (
            <View style={styles.videosContainer}>
              {myVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPress={() => router.push(`/watch/${video.id}`)}
                  horizontal
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="videocam-outline"
              title="Sin videos"
              message="Aún no has subido ningún video"
              actionText="Subir video"
              onAction={() => router.push('/upload')}
            />
          )
        ) : (
          transactions.length > 0 ? (
            <View style={styles.transactionsContainer}>
              {transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={[styles.transactionIcon, { backgroundColor: `${getTransactionColor(tx.type)}20` }]}>
                    <Ionicons
                      name={getTransactionIcon(tx.type) as any}
                      size={20}
                      color={getTransactionColor(tx.type)}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>{formatTransactionType(tx.type)}</Text>
                    {tx.videoTitle && (
                      <Text style={styles.transactionDetail}>{tx.videoTitle}</Text>
                    )}
                    <Text style={styles.transactionDate}>
                      {new Date(tx.timestamp * 1000).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: getTransactionColor(tx.type) }
                  ]}>
                    {tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECV' ? '+' : '-'}${Math.abs(Number(tx.amount)).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="Sin transacciones"
              message="Aún no tienes transacciones"
            />
          )
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ff4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  notLoggedInText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
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
  settingsButtonAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
  },
  settingsButtonAltText: {
    color: '#888',
    fontSize: 14,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ff5722',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  vipText: {
    color: '#ffc107',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#888',
    fontSize: 12,
  },
  balanceAmount: {
    color: '#4caf50',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: '#aaa',
    fontSize: 12,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#ff5722',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  videosContainer: {
    marginTop: 16,
  },
  transactionsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDetail: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  transactionDate: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
  },
  logoutText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '500',
  },
});
