import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/services/api';
import { MarketplaceItem, MarketplaceReview } from '../../src/types';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';

export default function MarketplaceItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const { addItem } = useCartStore();

  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    if (!id) return;
    try {
      const [itemData, reviewsData] = await Promise.all([
        api.getMarketplaceItem(id),
        api.getMarketplaceReviews(id),
      ]);
      setItem(itemData);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading item:', error);
      Alert.alert('Error', 'No se pudo cargar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!item) return;
    addItem(item);
    Alert.alert('Éxito', 'Producto agregado al carrito');
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!item) return;

    if ((user?.balance || 0) < item.price) {
      Alert.alert('Saldo insuficiente', 'No tienes suficiente saldo para comprar este producto');
      return;
    }

    Alert.alert(
      'Comprar producto',
      `¿Deseas comprar "${item.title}" por $${item.price}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprar',
          onPress: async () => {
            setPurchasing(true);
            try {
              const result = await api.purchaseMarketplaceItem(item.id, 1);
              if (result.success) {
                if (user) {
                  updateUser({ ...user, balance: result.newBalance });
                }
                Alert.alert('Éxito', 'Compra realizada correctamente');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo completar la compra');
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff5722" />
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff4444" />
          <Text style={styles.errorText}>Producto no encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const images = item.images || [];
  const currentImage = images[selectedImageIndex] 
    ? api.getMarketplaceImageUrl(images[selectedImageIndex])
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/cart')}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {currentImage ? (
            <Image source={{ uri: currentImage }} style={styles.mainImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={64} color="#444" />
            </View>
          )}
          {item.discountPercent && item.discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{item.discountPercent}%</Text>
            </View>
          )}
        </View>

        {/* Image Thumbnails */}
        {images.length > 1 && (
          <ScrollView horizontal style={styles.thumbnailsContainer}>
            {images.map((img, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.thumbnail,
                  selectedImageIndex === index && styles.thumbnailActive,
                ]}
                onPress={() => setSelectedImageIndex(index)}
              >
                <Image
                  source={{ uri: api.getMarketplaceImageUrl(img) }}
                  style={styles.thumbnailImage}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{item.title}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>${item.price}</Text>
            {item.originalPrice && item.originalPrice > item.price && (
              <Text style={styles.originalPrice}>${item.originalPrice}</Text>
            )}
          </View>

          {/* Rating */}
          {item.rating !== undefined && (
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= item.rating! ? 'star' : 'star-outline'}
                  size={18}
                  color="#ffc107"
                />
              ))}
              <Text style={styles.ratingText}>
                {item.rating.toFixed(1)} ({item.reviewCount} reseñas)
              </Text>
            </View>
          )}

          {/* Seller */}
          <TouchableOpacity
            style={styles.sellerContainer}
            onPress={() => router.push(`/channel/${item.sellerId}`)}
          >
            <View style={styles.sellerAvatar}>
              {item.sellerAvatarUrl ? (
                <Image
                  source={{ uri: api.getAvatarUrl(item.sellerAvatarUrl) }}
                  style={styles.sellerAvatarImage}
                />
              ) : (
                <Ionicons name="person" size={20} color="#888" />
              )}
            </View>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{item.sellerName}</Text>
                {item.isVerifiedSeller && (
                  <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                )}
              </View>
              <Text style={styles.sellerLabel}>Vendedor</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          {/* Details */}
          <View style={styles.detailsContainer}>
            {item.condition && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Condición:</Text>
                <Text style={styles.detailValue}>{item.condition}</Text>
              </View>
            )}
            {item.stock !== undefined && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Disponible:</Text>
                <Text style={styles.detailValue}>{item.stock} unidades</Text>
              </View>
            )}
            {item.category && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Categoría:</Text>
                <Text style={styles.detailValue}>{item.category}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Descripción</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={styles.reviewsContainer}>
              <Text style={styles.reviewsTitle}>Reseñas ({reviews.length})</Text>
              {reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUsername}>{review.username}</Text>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={12}
                          color="#ffc107"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.timestamp * 1000).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={24} color="#ff5722" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={handleBuyNow}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buyButtonText}>Comprar ahora</Text>
          )}
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#ff5722',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#ff5722',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  thumbnailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#ff5722',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  price: {
    color: '#ff5722',
    fontSize: 28,
    fontWeight: 'bold',
  },
  originalPrice: {
    color: '#666',
    fontSize: 18,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  ratingText: {
    color: '#888',
    fontSize: 14,
    marginLeft: 8,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  sellerLabel: {
    color: '#888',
    fontSize: 13,
  },
  detailsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#888',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
  },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
  reviewsContainer: {
    marginTop: 24,
  },
  reviewsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reviewItem: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewUsername: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
  reviewDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0c0c0c',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    gap: 12,
  },
  cartButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#ff5722',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
