import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Video, Comment, MarketplaceItem, Transaction, Notification, VipPlan, Category, UserInteraction, MarketplaceReview } from '../types';

const DEFAULT_SERVER_URL = 'http://192.168.43.101';
const SERVER_URL_KEY = '@streampay_server_url';
const SESSION_TOKEN_KEY = '@streampay_session_token';

class ApiService {
  private client: AxiosInstance;
  private baseUrl: string = DEFAULT_SERVER_URL;
  private sessionToken: string | null = null;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.initializeFromStorage();
  }

  private async initializeFromStorage() {
    try {
      const [storedUrl, storedToken] = await Promise.all([
        AsyncStorage.getItem(SERVER_URL_KEY),
        AsyncStorage.getItem(SESSION_TOKEN_KEY),
      ]);
      if (storedUrl) {
        this.baseUrl = storedUrl;
        this.updateBaseUrl(storedUrl);
      }
      if (storedToken) {
        this.sessionToken = storedToken;
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  private updateBaseUrl(url: string) {
    this.baseUrl = url;
    this.client.defaults.baseURL = `${url}/api`;
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

  async clearSession(): Promise<void> {
    this.sessionToken = null;
    await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private getParams() {
    return this.sessionToken ? { sessionToken: this.sessionToken } : {};
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<User> {
    const response = await this.client.get('/index.php', {
      params: { action: 'login', username, password },
    });
    if (response.data.sessionToken) {
      await this.setSessionToken(response.data.sessionToken);
    }
    return response.data;
  }

  async register(username: string, password: string): Promise<User> {
    const response = await this.client.get('/index.php', {
      params: { action: 'register', username, password },
    });
    if (response.data.sessionToken) {
      await this.setSessionToken(response.data.sessionToken);
    }
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.get('/index.php', {
      params: { action: 'logout', ...this.getParams() },
    });
    await this.clearSession();
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.sessionToken) return null;
    try {
      const response = await this.client.get('/index.php', {
        params: { action: 'getUser', ...this.getParams() },
      });
      return response.data;
    } catch {
      return null;
    }
  }

  // Videos endpoints
  async getVideos(category?: string, search?: string, page: number = 1): Promise<Video[]> {
    const response = await this.client.get('/index.php', {
      params: { 
        action: 'getVideos', 
        category, 
        search, 
        page,
        ...this.getParams() 
      },
    });
    return response.data;
  }

  async getVideo(id: string): Promise<Video> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getVideo', id, ...this.getParams() },
    });
    return response.data;
  }

  async getShorts(): Promise<Video[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getShorts', ...this.getParams() },
    });
    return response.data;
  }

  async purchaseVideo(videoId: string): Promise<{ success: boolean; newBalance: number }> {
    const response = await this.client.get('/index.php', {
      params: { action: 'purchaseVideo', videoId, ...this.getParams() },
    });
    return response.data;
  }

  async checkVideoPurchase(videoId: string): Promise<{ purchased: boolean }> {
    const response = await this.client.get('/index.php', {
      params: { action: 'checkPurchase', videoId, ...this.getParams() },
    });
    return response.data;
  }

  async getVideoUrl(videoId: string): Promise<string> {
    return `${this.baseUrl}/api/index.php?action=streamVideo&id=${videoId}&sessionToken=${this.sessionToken}`;
  }

  // Interactions
  async likeVideo(videoId: string): Promise<UserInteraction> {
    const response = await this.client.get('/index.php', {
      params: { action: 'likeVideo', videoId, ...this.getParams() },
    });
    return response.data;
  }

  async dislikeVideo(videoId: string): Promise<UserInteraction> {
    const response = await this.client.get('/index.php', {
      params: { action: 'dislikeVideo', videoId, ...this.getParams() },
    });
    return response.data;
  }

  async getInteraction(videoId: string): Promise<UserInteraction> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getInteraction', videoId, ...this.getParams() },
    });
    return response.data;
  }

  async getComments(videoId: string): Promise<Comment[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getComments', videoId, ...this.getParams() },
    });
    return response.data;
  }

  async addComment(videoId: string, text: string): Promise<Comment> {
    const response = await this.client.get('/index.php', {
      params: { action: 'addComment', videoId, text, ...this.getParams() },
    });
    return response.data;
  }

  // Watch Later
  async addToWatchLater(videoId: string): Promise<void> {
    await this.client.get('/index.php', {
      params: { action: 'addWatchLater', videoId, ...this.getParams() },
    });
  }

  async removeFromWatchLater(videoId: string): Promise<void> {
    await this.client.get('/index.php', {
      params: { action: 'removeWatchLater', videoId, ...this.getParams() },
    });
  }

  async getWatchLater(): Promise<Video[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getWatchLater', ...this.getParams() },
    });
    return response.data;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getCategories', ...this.getParams() },
    });
    return response.data;
  }

  // Marketplace
  async getMarketplaceItems(category?: string, search?: string): Promise<MarketplaceItem[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getMarketplaceItems', category, search, ...this.getParams() },
    });
    return response.data;
  }

  async getMarketplaceItem(id: string): Promise<MarketplaceItem> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getMarketplaceItem', id, ...this.getParams() },
    });
    return response.data;
  }

  async createMarketplaceItem(item: Partial<MarketplaceItem>): Promise<MarketplaceItem> {
    const response = await this.client.post('/index.php', item, {
      params: { action: 'createMarketplaceItem', ...this.getParams() },
    });
    return response.data;
  }

  async updateMarketplaceItem(id: string, item: Partial<MarketplaceItem>): Promise<MarketplaceItem> {
    const response = await this.client.post('/index.php', item, {
      params: { action: 'updateMarketplaceItem', id, ...this.getParams() },
    });
    return response.data;
  }

  async deleteMarketplaceItem(id: string): Promise<void> {
    await this.client.get('/index.php', {
      params: { action: 'deleteMarketplaceItem', id, ...this.getParams() },
    });
  }

  async purchaseMarketplaceItem(itemId: string, quantity: number = 1): Promise<{ success: boolean; newBalance: number }> {
    const response = await this.client.get('/index.php', {
      params: { action: 'purchaseMarketplaceItem', itemId, quantity, ...this.getParams() },
    });
    return response.data;
  }

  async getMarketplaceReviews(itemId: string): Promise<MarketplaceReview[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getMarketplaceReviews', itemId, ...this.getParams() },
    });
    return response.data;
  }

  async addMarketplaceReview(itemId: string, rating: number, comment: string): Promise<MarketplaceReview> {
    const response = await this.client.get('/index.php', {
      params: { action: 'addMarketplaceReview', itemId, rating, comment, ...this.getParams() },
    });
    return response.data;
  }

  // User Profile
  async getTransactions(): Promise<Transaction[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getTransactions', ...this.getParams() },
    });
    return response.data;
  }

  async getUserVideos(userId?: string): Promise<Video[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getUserVideos', userId, ...this.getParams() },
    });
    return response.data;
  }

  async updateProfile(data: { avatarUrl?: string }): Promise<User> {
    const response = await this.client.post('/index.php', data, {
      params: { action: 'updateProfile', ...this.getParams() },
    });
    return response.data;
  }

  async transferBalance(recipientUsername: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
    const response = await this.client.get('/index.php', {
      params: { action: 'transfer', recipientUsername, amount, ...this.getParams() },
    });
    return response.data;
  }

  // VIP
  async getVipPlans(): Promise<VipPlan[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getVipPlans', ...this.getParams() },
    });
    return response.data;
  }

  async purchaseVip(planId: string): Promise<{ success: boolean; newBalance: number }> {
    const response = await this.client.get('/index.php', {
      params: { action: 'purchaseVip', planId, ...this.getParams() },
    });
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getNotifications', ...this.getParams() },
    });
    return response.data;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.client.get('/index.php', {
      params: { action: 'markNotificationRead', notificationId, ...this.getParams() },
    });
  }

  // Channel
  async getChannel(userId: string): Promise<{ user: User; videos: Video[] }> {
    const response = await this.client.get('/index.php', {
      params: { action: 'getChannel', userId, ...this.getParams() },
    });
    return response.data;
  }

  // Upload
  async uploadVideo(formData: FormData): Promise<Video> {
    const response = await this.client.post('/index.php', formData, {
      params: { action: 'uploadVideo', ...this.getParams() },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/index.php', {
        params: { action: 'ping' },
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }

  // Get thumbnail URL
  getThumbnailUrl(video: Video): string {
    if (video.thumbnailUrl?.startsWith('http')) {
      return video.thumbnailUrl;
    }
    return `${this.baseUrl}/${video.thumbnailUrl}`;
  }

  // Get avatar URL
  getAvatarUrl(avatarUrl?: string): string {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')) {
      return avatarUrl;
    }
    return `${this.baseUrl}/${avatarUrl}`;
  }

  // Get marketplace image URL
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
