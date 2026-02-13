/**
 * Global Type Definitions for StreamPay Mobile
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum VideoCategory {
  PERSONAL = 'PERSONAL',
  GENERAL = 'GENERAL',
  MOVIES = 'MOVIES',
  SERIES = 'SERIES',
  SPORTS = 'SPORTS',
  MUSIC = 'MUSIC',
  OTHER = 'OTHER'
}

export interface Category {
  id: string;
  name: string;
  price: number;
  autoSub: boolean;
  parent?: string | null;
  sortOrder?: 'LATEST' | 'ALPHA' | 'RANDOM';
}

export interface User {
  id: string;
  username: string;
  role: UserRole | string;
  balance: number;
  sessionToken?: string;
  avatarUrl?: string;
  lastActive?: number;
  lastDeviceId?: string;
  watchLater: string[];
  autoPurchaseLimit: number;
  defaultPrices?: Record<string, number>;
  shippingDetails?: any;
  vipExpiry?: number;
  is_verified_seller?: boolean | number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  parent_category?: string;
  collection?: string;
  duration: number;
  thumbnailUrl: string;
  videoUrl: string;
  creatorId: string;
  creatorName: string;
  creatorRole?: string;
  creatorAvatarUrl?: string;
  createdAt: number;
  views: number;
  likes: number;
  dislikes: number;
  isLocal?: boolean | number | string;
  is_audio?: boolean | number;
  transcode_status?: 'NONE' | 'WAITING' | 'PROCESSING' | 'FAILED' | 'DONE';
  reason?: string;
  transcode_progress?: number;
  size_fmt?: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl?: string;
  text: string;
  timestamp: number;
}

export interface UserInteraction {
  liked: boolean;
  disliked: boolean;
  watched: boolean;
  newLikeCount?: number;
  newDislikeCount?: number;
}

export interface Transaction {
  id: string;
  type: 'PURCHASE' | 'DEPOSIT' | 'MARKETPLACE' | 'VIP' | 'TRANSFER_SENT' | 'TRANSFER_RECV';
  amount: number | string;
  buyerId?: string;
  buyerName?: string;
  videoTitle?: string;
  timestamp: number;
  recipientName?: string;
  senderName?: string;
  creatorId?: string;
  adminFee?: number | string;
  isExternal?: boolean | number;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  type: 'SALE' | 'UPLOAD' | 'SYSTEM';
  link: string;
  isRead: boolean;
  timestamp: number;
  metadata?: any;
  avatarUrl?: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  category?: string;
  condition?: string;
  sellerId: string;
  sellerName: string;
  images?: string[];
  status?: 'ACTIVO' | 'AGOTADO' | 'ELIMINADO';
  createdAt: number;
  discountPercent?: number;
  rating?: number;
  reviewCount?: number;
  sellerAvatarUrl?: string;
  isVerifiedSeller?: boolean | number;
}

export interface MarketplaceReview {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl?: string;
  rating: number;
  comment: string;
  timestamp: number;
}

export interface CartItem extends MarketplaceItem {
  quantity: number;
}

export interface VipPlan {
  id: string;
  name: string;
  price: number;
  type: 'ACCESS' | 'BALANCE';
  durationDays?: number;
  bonusPercent?: number;
  highlight?: boolean;
}

export interface SystemSettings {
  categories: Category[];
  videoCommission: number;
  marketCommission: number;
  vipPlans?: VipPlan[];
  paymentInstructions?: string;
  currencyConversion?: number;
}

export interface ServerConfig {
  baseUrl: string;
  isConfigured: boolean;
}
