import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useCartStore } from '../../src/store/cartStore';

export default function TabLayout() {
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ff5722',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#0c0c0c',
          borderTopColor: '#1a1a1a',
          borderTopWidth: 1,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 8,
        },
        headerStyle: {
          backgroundColor: '#0c0c0c',
          borderBottomColor: '#1a1a1a',
          borderBottomWidth: 1,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shorts"
        options={{
          title: 'Shorts',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flash' : 'flash-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Tienda',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={24} color={color} />
              {itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ff5722',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
