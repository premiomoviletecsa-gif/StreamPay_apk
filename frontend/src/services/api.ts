import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, Video, Comment, MarketplaceItem, Transaction, Notification, VipPlan, Category, UserInteraction, MarketplaceReview } from '../types';

const DEFAULT_SERVER_URL = 'http://192.168.43.101';
const SERVER_URL_KEY = '@streampay_server_url';
const SESSION_TOKEN_KEY = '@streampay_session_token';
const USER_ID_KEY = '@streampay_user_id';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

class ApiService {
  private client: AxiosInstance;
  private baseUrl: string = DEFAULT_SERVER_URL;
  private sessionToken: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.initializeFromStorage();
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth header
    this.client.interceptors.request.use((config) => {
      if (this.sessionToken) {
        config.headers['Authorization'] = `Bearer ${this.sessionToken}`;
      }
      return config;
    });

    // Response interceptor to handle API response format
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any>>) => {
        const data = response.data;
        if (data.success === false) {
          throw new Error(data.error || 'Error desconocido');
        }
        // Return the data field from the response
        response.data = data.data;
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Session expired
          this.clearSession();
        }
        throw error;
      }
    );
  }

  private async initializeFromStorage() {
    try {
      const [storedUrl, storedToken, storedUserId] = await Promise.all([
        AsyncStorage.getItem(SERVER_URL_KEY),
        AsyncStorage.getItem(SESSION_TOKEN_KEY),
        AsyncStorage.getItem(USER_ID_KEY),
      ]);
      if (storedUrl) {
        this.baseUrl = storedUrl;
        this.updateBaseUrl(storedUrl);
      }
      if (storedToken) {
        this.sessionToken = storedToken;
      }
      if (storedUserId) {
        this.userId = storedUserId;
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  private updateBaseUrl(url: string) {
    this.baseUrl = url;
    this.client.defaults.baseURL = `${url}/api`;
  }

  private getDeviceId(): string {
    return `${Platform.OS}_${Platform.Version}_mobile`;
  }

  async setServerUrl(url: string): Promise<void> {
    const cleanUrl = url.replace(/\/$/, '');
    await AsyncStorage.setItem(SERVER_URL_KEY, cleanUrl);
    this.updateBaseUrl(cleanUrl);
  }

  async getServerUrl(): Promise<string> {
    const url = await AsyncStorage.getItem(SERVER_URL_KEY);
    return url || DEFAULT_SERVER_URL;
  }

  async setSessionToken(token: string): Promise<void> {
    this.sessionToken = token;
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
  }

  async setUserId(id: string): Promise<void> {
    this.userId = id;
    await AsyncStorage.setItem(USER_ID_KEY, id);
  }

  async clearSession(): Promise<void> {
    this.sessionToken = null;
    this.userId = null;
    await AsyncStorage.multiRemove([SESSION_TOKEN_KEY, USER_ID_KEY]);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getUserId(): string | null {
    return this.userId;
  }

  // Auth endpoints - Using POST like the PWA
  async login(username: string, password: string): Promise<User> {
    const response = await this.client.post('/index.php?action=login', {
      username,
      password,
      deviceId: this.getDeviceId(),
    });
    const user = response.data as User;
    if (user.sessionToken) {
      await this.setSessionToken(user.sessionToken);
    }
    if (user.id) {
      await this.setUserId(user.id);
    }
    return user;
  }

  async register(username: string, password: string): Promise<User> {
    const response = await this.client.post('/index.php?action=register', {
      username,
      password,
      deviceId: this.getDeviceId(),
    });
    const user = response.data as User;
    if (user.sessionToken) {
      await this.setSessionToken(user.sessionToken);
    }
    if (user.id) {
      await this.setUserId(user.id);
    }
    return user;
  }

  async logout(): Promise<void> {
    if (this.userId) {
      try {
        await this.client.post('/index.php?action=logout', {
          userId: this.userId,
        });
      } catch (e) {
        // Ignore errors on logout
      }
    }
    await this.clearSession();
  }

  async getUser(userId?: string): Promise<User | null> {
    const id = userId || this.userId;
    if (!id) return null;
    try {
      const response = await this.client.get('/index.php', {
        params: { action: 'get_user', userId: id },
      });
      return response.data as User;
    } catch {
      return null;
    }
  }

  async heartbeat(): Promise<User | null> {
    if (!this.userId) return null;
    try {
      const response = await this.client.get('/index.php', {
        params: { action: 'heartbeat', userId: this.userId },
      });
      return response.data as User;
    } catch {
      return null;
    }
  }

  // Videos endpoints - Using snake_case like the PWA
  async getVideos(page: number = 0, limit: number = 40, folder: string = '', search: string = '', category: string = ''): Promise<{ videos: Video[], total: number, hasMore: boolean }> {
    const offset = page * limit;
    const response = await this.client.get('/index.php', {
      params: {
        action: 'get_videos',
        limit,
        offset,
        folder,
        search,
        category,
      },
    });
    return response.data;
  }

  async getVideo(id: string): Promise<Video | null> {
    const response = await this.client.get('/index.php', {
      params: { action: 'get_video', id },
    });
    return response.data as Video;
  }

  async getShorts(page: number = 0, limit: number = 20): Promise<{ videos: Video[], total: number, hasMore: boolean }> {
    const offset = page * limit;
    const response = await this.client.get('/index.php', {
      params: { action: 'get_videos', limit, offset, shorts: 1 },
    });
    return response.data;
  }

  async getVideosByCreator(userId: string): Promise<Video[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'get_videos_by_creator', userId },
    });
    return response.data as Video[];
  }

  async getRelatedVideos(videoId: string): Promise<Video[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'get_related_videos', videoId },
    });
    return response.data as Video[];
  }

  async purchaseVideo(videoId: string): Promise<void> {
    if (!this.userId) throw new Error('No autenticado');
    await this.client.post('/index.php?action=purchase_video', {
      userId: this.userId,
      videoId,
    });
  }

  async hasPurchased(videoId: string): Promise<boolean> {
    if (!this.userId) return false;
    const response = await this.client.get('/index.php', {
      params: { action: 'has_purchased', userId: this.userId, videoId },
    });
    return (response.data as { hasPurchased: boolean }).hasPurchased;
  }

  getStreamUrl(videoId: string): string {
    return `${this.baseUrl}/api/index.php?action=stream&id=${videoId}&token=${this.sessionToken}`;
  }

  // Interactions
  async rateVideo(videoId: string, type: 'like' | 'dislike' | 'view'): Promise<UserInteraction> {
    const response = await this.client.post('/index.php?action=rate_video', {
      userId: this.userId,
      videoId,
      type,
    });
    return response.data as UserInteraction;
  }

  async getComments(videoId: string): Promise<Comment[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'get_comments', id: videoId },
    });
    return response.data as Comment[];
  }

  async addComment(videoId: string, text: string): Promise<Comment> {
    if (!this.userId) throw new Error('No autenticado');
    const response = await this.client.post('/index.php?action=add_comment', {
      userId: this.userId,
      videoId,
      text,
    });
    return response.data as Comment;
  }

  // Marketplace
  async getMarketplaceItems(): Promise<MarketplaceItem[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'get_marketplace_items' },
    });
    return response.data as MarketplaceItem[];
  }

  async getMarketplaceItem(id: string): Promise<MarketplaceItem | null> {
    const response = await this.client.get('/index.php', {
      params: { action: 'get_marketplace_item', id },
    });
    return response.data as MarketplaceItem;
  }

  async checkoutCart(cart: any[], shippingDetails: any): Promise<void> {
    if (!this.userId) throw new Error('No autenticado');
    await this.client.post('/index.php?action=checkout_cart', {
      userId: this.userId,
      cart,
      shippingDetails,
    });
  }

  async getReviews(itemId: string): Promise<MarketplaceReview[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'get_reviews', itemId },
    });
    return response.data as MarketplaceReview[];
  }

  async addReview(itemId: string, rating: number, comment: string): Promise<void> {
    if (!this.userId) throw new Error('No autenticado');
    await this.client.post('/index.php?action=add_review', {
      itemId,
      userId: this.userId,
      rating,
      comment,
    });
  }

  // User Profile
  async getUserTransactions(): Promise<Transaction[]> {
    if (!this.userId) return [];
    const response = await this.client.get('/index.php', {
      params: { action: 'get_user_transactions', userId: this.userId },
    });
    return response.data as Transaction[];
  }

  async getUserActivity(): Promise<{ watched: string[], liked: string[] }> {
    if (!this.userId) return { watched: [], liked: [] };
    const response = await this.client.get('/index.php', {
      params: { action: 'get_user_activity', userId: this.userId },
    });
    return response.data;
  }

  async updateProfile(data: any): Promise<void> {
    if (!this.userId) throw new Error('No autenticado');
    await this.client.post('/index.php?action=update_user_profile', {
      userId: this.userId,
      ...data,
    });
  }

  async transferBalance(targetUsername: string, amount: number): Promise<void> {
    if (!this.userId) throw new Error('No autenticado');
    await this.client.post('/index.php?action=transfer_balance', {
      userId: this.userId,
      targetUsername,
      amount,
    });
  }

  // Subscriptions
  async toggleSubscribe(creatorId: string): Promise<{ isSubscribed: boolean }> {
    if (!this.userId) throw new Error('No autenticado');
    const response = await this.client.post('/index.php?action=toggle_subscribe', {
      userId: this.userId,
      creatorId,
    });
    return response.data as { isSubscribed: boolean };
  }

  async checkSubscription(creatorId: string): Promise<boolean> {
    if (!this.userId) return false;
    const response = await this.client.get('/index.php', {
      params: { action: 'check_subscription', userId: this.userId, creatorId },
    });
    return (response.data as { isSubscribed: boolean }).isSubscribed;
  }

  // VIP
  async getSystemSettings(): Promise<any> {
    const response = await this.client.get('/index.php', {
      params: { action: 'get_system_settings' },
    });
    return response.data;
  }

  async purchaseVipInstant(plan: VipPlan): Promise<void> {
    if (!this.userId) throw new Error('No autenticado');
    await this.client.post('/index.php?action=purchase_vip_instant', {
      userId: this.userId,
      plan,
    });
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    if (!this.userId) return [];
    const response = await this.client.get('/index.php', {
      params: { action: 'get_notifications', userId: this.userId },
    });
    return response.data as Notification[];
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.client.post('/index.php?action=mark_notification_read', { id });
  }

  async markAllNotificationsRead(): Promise<void> {
    if (!this.userId) return;
    await this.client.post('/index.php?action=mark_all_notifications_read', {
      userId: this.userId,
    });
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      // Try to get system settings as a ping
      const response = await this.client.get('/index.php', {
        params: { action: 'get_system_settings' },
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }

  // URL helpers
  getThumbnailUrl(video: Video): string {
    const thumb = video.thumbnailUrl || video.thumbnail;
    if (!thumb) return '';
    if (thumb.startsWith('http') || thumb.startsWith('data:')) {
      return thumb;
    }
    return `${this.baseUrl}/${thumb}`;
  }

  getAvatarUrl(avatarUrl?: string): string {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')) {
      return avatarUrl;
    }
    return `${this.baseUrl}/${avatarUrl}`;
  }

  getMarketplaceImageUrl(imageUrl?: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    return `${this.baseUrl}/${imageUrl}`;
  }
}

export const api = new ApiService();
export default api;
