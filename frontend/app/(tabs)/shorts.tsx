import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { Video as VideoType } from '../../src/types';
import EmptyState from '../../src/components/EmptyState';
import { useAuthStore } from '../../src/store/authStore';

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = height - 140; // Account for tab bar and safe area

interface ShortItemProps {
  video: VideoType;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

const ShortItem: React.FC<ShortItemProps> = ({ video, isActive, onLike, onComment, onShare }) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
      setIsPlaying(true);
    } else {
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const videoUrl = `${api.getBaseUrl()}/api/index.php?action=streamVideo&id=${video.id}`;

  return (
    <View style={styles.shortItem}>
      <TouchableOpacity style={styles.videoContainer} onPress={togglePlay} activeOpacity={1}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isActive}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ff5722" />
          </View>
        )}
        {!isPlaying && !isLoading && (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={64} color="rgba(255,255,255,0.8)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Right side actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Ionicons name="heart-outline" size={32} color="#fff" />
          <Text style={styles.actionText}>{video.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={28} color="#fff" />
          <Text style={styles.actionText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <View style={styles.creatorInfo}>
          <View style={styles.creatorAvatar}>
            <Ionicons name="person" size={16} color="#888" />
          </View>
          <Text style={styles.creatorName}>@{video.creatorName}</Text>
        </View>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        {video.description && (
          <Text style={styles.videoDescription} numberOfLines={1}>{video.description}</Text>
        )}
      </View>
    </View>
  );
};

export default function Shorts() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [shorts, setShorts] = useState<VideoType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    loadShorts();
  }, []);

  const loadShorts = async () => {
    try {
      const data = await api.getShorts();
      setShorts(data || []);
    } catch (error) {
      console.error('Error loading shorts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleLike = async (videoId: string) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    try {
      await api.likeVideo(videoId);
      loadShorts();
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );
  }

  if (shorts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="flash-outline"
          title="No hay Shorts"
          message="Aún no hay videos cortos disponibles"
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shorts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ShortItem
            video={item}
            isActive={index === activeIndex}
            onLike={() => handleLike(item.id)}
            onComment={() => router.push(`/watch/${item.id}`)}
            onShare={() => {}}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortItem: {
    width,
    height: ITEM_HEIGHT,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  bottomInfo: {
    position: 'absolute',
    left: 12,
    right: 70,
    bottom: 20,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  creatorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoDescription: {
    color: '#ccc',
    fontSize: 13,
  },
});
