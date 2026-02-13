import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/services/api';
import { Video as VideoType, Comment, UserInteraction } from '../../src/types';
import { useAuthStore } from '../../src/store/authStore';
import VideoCard from '../../src/components/VideoCard';

const { width } = Dimensions.get('window');

export default function Watch() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const { user, isAuthenticated, updateUser } = useAuthStore();

  const [video, setVideo] = useState<VideoType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<VideoType[]>([]);
  const [interaction, setInteraction] = useState<UserInteraction | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadVideoData();
  }, [id]);

  const loadVideoData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [videoData, commentsData, videosData] = await Promise.all([
        api.getVideo(id),
        api.getComments(id),
        api.getVideos(),
      ]);

      setVideo(videoData);
      setComments(commentsData || []);
      setRelatedVideos((videosData || []).filter((v: VideoType) => v.id !== id).slice(0, 5));

      if (isAuthenticated) {
        const [purchaseData, interactionData] = await Promise.all([
          api.checkVideoPurchase(id),
          api.getInteraction(id),
        ]);
        setIsPurchased(purchaseData?.purchased || videoData.price === 0);
        setInteraction(interactionData);
      } else {
        setIsPurchased(videoData.price === 0);
      }
    } catch (error) {
      console.error('Error loading video:', error);
      Alert.alert('Error', 'No se pudo cargar el video');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!video) return;

    if ((user?.balance || 0) < video.price) {
      Alert.alert('Saldo insuficiente', 'No tienes suficiente saldo para comprar este video');
      return;
    }

    Alert.alert(
      'Comprar video',
      `¿Deseas comprar "${video.title}" por $${video.price}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprar',
          onPress: async () => {
            setPurchasing(true);
            try {
              const result = await api.purchaseVideo(video.id);
              if (result.success) {
                setIsPurchased(true);
                if (user) {
                  updateUser({ ...user, balance: result.newBalance });
                }
                Alert.alert('Éxito', 'Video desbloqueado correctamente');
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

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!video) return;
    try {
      const result = await api.likeVideo(video.id);
      setInteraction(result);
      setVideo({ ...video, likes: result.newLikeCount || video.likes });
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleDislike = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!video) return;
    try {
      const result = await api.dislikeVideo(video.id);
      setInteraction(result);
      setVideo({ ...video, dislikes: result.newDislikeCount || video.dislikes });
    } catch (error) {
      console.error('Error disliking video:', error);
    }
  };

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!newComment.trim() || !video) return;
    try {
      const comment = await api.addComment(video.id, newComment.trim());
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el comentario');
    }
  };

  const handleAddToWatchLater = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!video) return;
    try {
      await api.addToWatchLater(video.id);
      Alert.alert('Éxito', 'Video agregado a Ver más tarde');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el video');
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
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

  if (!video) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff4444" />
          <Text style={styles.errorText}>Video no encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const videoUrl = isPurchased
    ? `${api.getBaseUrl()}/api/index.php?action=streamVideo&id=${video.id}`
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView}>
          {/* Video Player */}
          <View style={styles.videoContainer}>
            <TouchableOpacity style={styles.backButtonHeader} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {isPurchased && videoUrl ? (
              <Video
                ref={videoRef}
                source={{ uri: videoUrl }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={false}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                  if (status.isLoaded) {
                    setIsPlaying(status.isPlaying);
                  }
                }}
              />
            ) : (
              <View style={styles.lockedVideoContainer}>
                <Image
                  source={{ uri: api.getThumbnailUrl(video) }}
                  style={styles.lockedThumbnail}
                  blurRadius={10}
                />
                <View style={styles.lockedOverlay}>
                  <Ionicons name="lock-closed" size={48} color="#fff" />
                  <Text style={styles.lockedPrice}>${video.price}</Text>
                  <Text style={styles.lockedText}>Video de pago</Text>
                  <TouchableOpacity
                    style={styles.purchaseButton}
                    onPress={handlePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="cart" size={20} color="#fff" />
                        <Text style={styles.purchaseButtonText}>Comprar video</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Video Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{video.title}</Text>
            <Text style={styles.stats}>
              {formatViews(video.views)} vistas • {new Date(video.createdAt * 1000).toLocaleDateString()}
            </Text>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, interaction?.liked && styles.actionButtonActive]}
                onPress={handleLike}
              >
                <Ionicons
                  name={interaction?.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={22}
                  color={interaction?.liked ? '#ff5722' : '#fff'}
                />
                <Text style={[styles.actionText, interaction?.liked && styles.actionTextActive]}>
                  {video.likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, interaction?.disliked && styles.actionButtonActive]}
                onPress={handleDislike}
              >
                <Ionicons
                  name={interaction?.disliked ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={22}
                  color={interaction?.disliked ? '#ff5722' : '#fff'}
                />
                <Text style={[styles.actionText, interaction?.disliked && styles.actionTextActive]}>
                  {video.dislikes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleAddToWatchLater}>
                <Ionicons name="time-outline" size={22} color="#fff" />
                <Text style={styles.actionText}>Guardar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={22} color="#fff" />
                <Text style={styles.actionText}>Compartir</Text>
              </TouchableOpacity>
            </View>

            {/* Creator */}
            <TouchableOpacity
              style={styles.creatorContainer}
              onPress={() => router.push(`/channel/${video.creatorId}`)}
            >
              <View style={styles.creatorAvatar}>
                {video.creatorAvatarUrl ? (
                  <Image
                    source={{ uri: api.getAvatarUrl(video.creatorAvatarUrl) }}
                    style={styles.creatorAvatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={24} color="#888" />
                )}
              </View>
              <View style={styles.creatorInfo}>
                <Text style={styles.creatorName}>{video.creatorName}</Text>
                <Text style={styles.creatorLabel}>Ver canal</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>

            {/* Description */}
            {video.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Descripción</Text>
                <Text style={styles.description}>{video.description}</Text>
              </View>
            )}

            {/* Comments Section */}
            <TouchableOpacity
              style={styles.commentsHeader}
              onPress={() => setShowComments(!showComments)}
            >
              <Text style={styles.commentsTitle}>Comentarios ({comments.length})</Text>
              <Ionicons
                name={showComments ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>

            {showComments && (
              <View style={styles.commentsContainer}>
                {/* Add Comment */}
                <View style={styles.addCommentContainer}>
                  <TextInput
                    style={styles.commentInput}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Escribe un comentario..."
                    placeholderTextColor="#666"
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      !newComment.trim() && styles.sendButtonDisabled,
                    ]}
                    onPress={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <Ionicons name="send" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Comments List */}
                {comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      {comment.userAvatarUrl ? (
                        <Image
                          source={{ uri: api.getAvatarUrl(comment.userAvatarUrl) }}
                          style={styles.commentAvatarImage}
                        />
                      ) : (
                        <Ionicons name="person" size={16} color="#888" />
                      )}
                    </View>
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUsername}>{comment.username}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                      <Text style={styles.commentDate}>
                        {new Date(comment.timestamp * 1000).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Related Videos */}
            {relatedVideos.length > 0 && (
              <View style={styles.relatedContainer}>
                <Text style={styles.relatedTitle}>Videos relacionados</Text>
                {relatedVideos.map((relatedVideo) => (
                  <VideoCard
                    key={relatedVideo.id}
                    video={relatedVideo}
                    onPress={() => router.push(`/watch/${relatedVideo.id}`)}
                    horizontal
                  />
                ))}
              </View>
            )}
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
  scrollView: {
    flex: 1,
  },
  videoContainer: {
    width,
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  backButtonHeader: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  lockedVideoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedThumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedPrice: {
    color: '#ff5722',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 12,
  },
  lockedText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ff5722',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  stats: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionButtonActive: {
    opacity: 1,
  },
  actionText: {
    color: '#aaa',
    fontSize: 12,
  },
  actionTextActive: {
    color: '#ff5722',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  creatorLabel: {
    color: '#888',
    fontSize: 13,
  },
  descriptionContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
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
    lineHeight: 20,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  commentsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentsContainer: {
    paddingBottom: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#444',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  commentText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  commentDate: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  relatedContainer: {
    marginTop: 16,
  },
  relatedTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
});
