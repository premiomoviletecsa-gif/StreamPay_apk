import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';

export default function Upload() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setThumbnailUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Ingresa un título para el video');
      return;
    }
    if (!videoUri) {
      Alert.alert('Error', 'Selecciona un video para subir');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', price || '0');
      
      // Add video file
      const videoFile = {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video.mp4',
      };
      formData.append('video', videoFile as any);

      // Add thumbnail if selected
      if (thumbnailUri) {
        const thumbFile = {
          uri: thumbnailUri,
          type: 'image/jpeg',
          name: 'thumbnail.jpg',
        };
        formData.append('thumbnail', thumbFile as any);
      }

      await api.uploadVideo(formData);
      Alert.alert('Éxito', 'Video subido correctamente');
      router.back();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al subir el video';
      Alert.alert('Error', message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subir video</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.notLoggedIn}>
          <Ionicons name="cloud-upload-outline" size={64} color="#444" />
          <Text style={styles.notLoggedInText}>Inicia sesión para subir videos</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subir video</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Video Selection */}
          <TouchableOpacity style={styles.mediaSelector} onPress={pickVideo}>
            {videoUri ? (
              <View style={styles.mediaSelected}>
                <Ionicons name="videocam" size={32} color="#4caf50" />
                <Text style={styles.mediaSelectedText}>Video seleccionado</Text>
                <Text style={styles.mediaSelectedHint}>Toca para cambiar</Text>
              </View>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={48} color="#666" />
                <Text style={styles.mediaSelectorText}>Seleccionar video</Text>
                <Text style={styles.mediaSelectorHint}>MP4, MOV, AVI</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Thumbnail Selection */}
          <TouchableOpacity style={styles.thumbnailSelector} onPress={pickThumbnail}>
            {thumbnailUri ? (
              <Image source={{ uri: thumbnailUri }} style={styles.thumbnailPreview} />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="image-outline" size={24} color="#666" />
                <Text style={styles.thumbnailText}>Agregar miniatura</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Título del video"
              placeholderTextColor="#666"
              maxLength={100}
            />

            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción del video (opcional)"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <Text style={styles.inputLabel}>Precio</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.priceHint}>Deja en 0 para video gratuito</Text>
          </View>

          {/* Upload Button */}
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!title.trim() || !videoUri || isUploading) && styles.uploadButtonDisabled,
            ]}
            onPress={handleUpload}
            disabled={!title.trim() || !videoUri || isUploading}
          >
            {isUploading ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.uploadButtonText}>Subiendo...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.uploadButtonText}>Subir video</Text>
              </>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notLoggedInText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
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
  content: {
    padding: 16,
  },
  mediaSelector: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  mediaSelected: {
    alignItems: 'center',
  },
  mediaSelectedText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  mediaSelectedHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  mediaSelectorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  mediaSelectorHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  thumbnailSelector: {
    height: 100,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  thumbnailText: {
    color: '#666',
    fontSize: 14,
  },
  formContainer: {
    gap: 8,
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    color: '#666',
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 16,
  },
  priceHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#ff5722',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  uploadButtonDisabled: {
    backgroundColor: '#444',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
