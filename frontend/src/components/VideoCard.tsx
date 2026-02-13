import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from '../types';
import api from '../services/api';

const { width } = Dimensions.get('window');

interface VideoCardProps {
  video: Video;
  onPress: () => void;
  horizontal?: boolean;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatViews = (views: number): string => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 365) return `hace ${Math.floor(days / 365)} año(s)`;
  if (days > 30) return `hace ${Math.floor(days / 30)} mes(es)`;
  if (days > 0) return `hace ${days} día(s)`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `hace ${hours}h`;
  return 'hace un momento';
};

export const VideoCard: React.FC<VideoCardProps> = ({ video, onPress, horizontal = false }) => {
  const thumbnailUrl = api.getThumbnailUrl(video);
  const avatarUrl = api.getAvatarUrl(video.creatorAvatarUrl);

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.horizontalContainer} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.horizontalThumbnailContainer}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.horizontalThumbnail}
            resizeMode="cover"
          />
          {video.duration > 0 && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
            </View>
          )}
          {video.price > 0 && (
            <View style={styles.priceBadge}>
              <Ionicons name="lock-closed" size={10} color="#fff" />
              <Text style={styles.priceText}>${video.price}</Text>
            </View>
          )}
        </View>
        <View style={styles.horizontalInfo}>
          <Text style={styles.horizontalTitle} numberOfLines={2}>{video.title}</Text>
          <Text style={styles.horizontalMeta}>
            {video.creatorName} • {formatViews(video.views)} vistas
          </Text>
          <Text style={styles.horizontalMeta}>{formatTimeAgo(video.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        {video.duration > 0 && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
          </View>
        )}
        {video.price > 0 && (
          <View style={styles.priceBadge}>
            <Ionicons name="lock-closed" size={10} color="#fff" />
            <Text style={styles.priceText}>${video.price}</Text>
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={16} color="#666" />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
          <Text style={styles.meta}>
            {video.creatorName} • {formatViews(video.views)} vistas • {formatTimeAgo(video.createdAt)}
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={18} color="#aaa" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  meta: {
    color: '#aaa',
    fontSize: 12,
  },
  menuButton: {
    padding: 4,
  },
  // Horizontal styles
  horizontalContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  horizontalThumbnailContainer: {
    width: 160,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  horizontalThumbnail: {
    width: '100%',
    height: '100%',
  },
  horizontalInfo: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  horizontalTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  horizontalMeta: {
    color: '#aaa',
    fontSize: 12,
  },
});

export default VideoCard;
