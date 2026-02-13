import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, MarketplaceItem } from '../types';

const CART_KEY = '@streampay_cart';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  addItem: (item: MarketplaceItem) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  addItem: async (item: MarketplaceItem) => {
    const { items } = get();
    const existingItem = items.find(i => i.id === item.id);
    
    let newItems: CartItem[];
    if (existingItem) {
      newItems = items.map(i => 
        i.id === item.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      newItems = [...items, { ...item, quantity: 1 }];
    }
    
    set({ items: newItems });
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(newItems));
  },

  removeItem: async (itemId: string) => {
    const { items } = get();
    const newItems = items.filter(i => i.id !== itemId);
    set({ items: newItems });
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(newItems));
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const { items } = get();
    if (quantity <= 0) {
      return get().removeItem(itemId);
    }
    const newItems = items.map(i => 
      i.id === itemId ? { ...i, quantity } : i
    );
    set({ items: newItems });
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(newItems));
  },

  clearCart: async () => {
    set({ items: [] });
    await AsyncStorage.removeItem(CART_KEY);
  },

  loadCart: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(CART_KEY);
      if (stored) {
        set({ items: JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
