import React from 'react';
import { View, TouchableOpacity, Alert, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { RootStackParamList } from '../types/navigation';
import { useImagesStore } from '../store/imagesStore';
import { deleteImage } from '../services/images';

export default function ImageViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ImageViewer'>>();
  const { imageId } = route.params;

  const image = useImagesStore(state => state.images.find(img => img.id === imageId));

  const handleDelete = () => {
    Alert.alert(
      "Delete Image",
      "Are you sure you want to delete this image? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await deleteImage(imageId);
            navigation.goBack();
          }
        }
      ]
    );
  };

  if (!image) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Image not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 px-4 py-2 bg-stone-800 rounded-full">
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const imageUrls = [{
    url: image.imageUrl,
  }];

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Transparent Header overlay */}
        <View className="absolute top-0 left-0 right-0 z-50 flex-row justify-between items-center p-4 mt-12 px-6">
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleDelete} 
            className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <ImageViewer 
          imageUrls={imageUrls}
          enableSwipeDown
          onSwipeDown={() => navigation.goBack()}
          renderIndicator={() => <View />} // Hide standard page indicator since it's just 1 image
          loadingRender={() => <ActivityIndicator size="large" color="#fff" />}
          backgroundColor="black"
        />
        
        {/* Bottom Metadata overlay */}
        {(image.title || image.description) && (
          <View className="absolute bottom-0 left-0 right-0 p-6 pb-12 bg-black/60">
            {!!image.title && <Text className="text-white font-bold text-lg mb-1">{image.title}</Text>}
            {!!image.description && <Text className="text-stone-300 text-sm">{image.description}</Text>}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
