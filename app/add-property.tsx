import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { supabase } from '../utils/supabase';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useAuth } from '../context/_ctx';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROPERTY_TYPES = [
  { label: 'Flat / Apartment', value: 'flat' },
  { label: 'Duplex', value: 'duplex' },
  { label: 'Short-let', value: 'short_let' }, 
  { label: 'Self Contain', value: 'self_con' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Land Plot', value: 'land_plot' },
];

export default function AddPropertyScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('flat');
  const [city, setCity] = useState('');
  const [stateLoc, setStateLoc] = useState(''); 
  const [images, setImages] = useState<string[]>([]);
  
  // Production UX States
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string, type: 'error' | 'success' | '' }>({ message: '', type: '' });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3], 
      quality: 0.7, 
    });

    if (!result.canceled && result.assets[0].uri) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handlePublish = async () => {
    setFeedback({ message: '', type: '' });

    if (!title || !price || !city || !stateLoc || images.length === 0) {
      setFeedback({ message: 'Please fill in all required fields and add at least one image.', type: 'error' });
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];
      for (const uri of images) {
        const url = await uploadToCloudinary(uri);
        if (url) uploadedUrls.push(url);
      }

      if (uploadedUrls.length === 0) {
        throw new Error('Failed to upload images securely.');
      }

      const { error } = await supabase.from('properties').insert({
        owner_id: session?.user?.id,
        title,
        description,
        price: parseInt(price.replace(/,/g, '')), 
        type,
        city,
        state: stateLoc,
        images: uploadedUrls,
        status: 'verified', 
        latitude: 9.0765 + (Math.random() * 0.1 - 0.05), 
        longitude: 7.3986 + (Math.random() * 0.1 - 0.05),
      });

      if (error) throw error;

      setFeedback({ message: 'Success! Your property is now live on Urbis.', type: 'success' });
      
      // Delay routing to let user see success message
      setTimeout(() => {
        router.back();
      }, 1500);

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to publish property.';
      setFeedback({ message: msg, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <Ionicons name="close" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#1E3A8A]">List Property</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} className="w-full">
          
          {/* DESKTOP CONSTRAINT WRAPPER */}
          <View className="w-full max-w-2xl self-center px-6 pt-6 pb-32">
            
            {/* INLINE FEEDBACK UI */}
            {feedback.message !== '' && (
              <View className={`mb-6 p-4 rounded-xl border ${feedback.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <Text className={`font-bold text-center ${feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                  {feedback.message}
                </Text>
              </View>
            )}

            {/* IMAGE UPLOAD SECTION */}
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Photos (Required)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
              {images.map((uri, index) => (
                <View key={index} className="relative mr-4">
                  <Image source={{ uri }} className="w-32 h-32 rounded-2xl bg-gray-100 border border-gray-200" contentFit="cover" />
                  <TouchableOpacity 
                    className="absolute -top-2 -right-2 bg-white rounded-full shadow-sm"
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity 
                onPress={pickImage}
                className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 justify-center items-center bg-gray-50 hover:bg-gray-100"
              >
                <Ionicons name="camera" size={32} color="#9CA3AF" />
                <Text className="text-gray-400 font-bold mt-2 text-xs uppercase tracking-wider">Add Photo</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* BASIC INFO */}
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Basic Info</Text>
            
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 ml-1">Title</Text>
              <TextInput
                className="bg-gray-50 px-4 py-4 rounded-2xl text-[#1E3A8A] font-bold border border-gray-200 outline-none"
                placeholder="e.g. Luxury 3-Bed Duplex"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 ml-1">Price (₦)</Text>
              <TextInput
                className="bg-gray-50 px-4 py-4 rounded-2xl text-[#1E3A8A] font-bold border border-gray-200 outline-none"
                placeholder="e.g. 2500000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
              <Text className="text-xs font-bold text-gray-400 ml-2 mt-2 uppercase tracking-wider">
                {type === 'short_let' ? 'Price per night' : type === 'land_plot' ? 'Total asking price' : 'Price per year'}
              </Text>
            </View>

            <View className="mb-8">
              <Text className="text-gray-700 font-semibold mb-2 ml-1">Description</Text>
              <TextInput
                className="bg-gray-50 px-4 py-4 rounded-2xl text-[#1E3A8A] font-medium border border-gray-200 outline-none"
                placeholder="Describe the amenities, condition, and rules..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* PROPERTY CATEGORY */}
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Category</Text>
            <View className="flex-row flex-wrap gap-2 mb-8">
              {PROPERTY_TYPES.map((pt) => (
                <TouchableOpacity
                  key={pt.value}
                  onPress={() => setType(pt.value)}
                  className={`px-4 py-2.5 rounded-full border ${type === pt.value ? 'bg-blue-50 border-[#2563EB]' : 'bg-white border-gray-300'}`}
                >
                  <Text className={`font-bold text-sm ${type === pt.value ? 'text-[#2563EB]' : 'text-gray-600'}`}>{pt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* LOCATION */}
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Location</Text>
            <View className="flex-row gap-4 mb-10">
              <View className="flex-1">
                <Text className="text-gray-700 font-semibold mb-2 ml-1">City</Text>
                <TextInput
                  className="bg-gray-50 px-4 py-4 rounded-2xl text-[#1E3A8A] font-bold border border-gray-200 outline-none"
                  placeholder="e.g. Ibadan"
                  placeholderTextColor="#9CA3AF"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-semibold mb-2 ml-1">State</Text>
                <TextInput
                  className="bg-gray-50 px-4 py-4 rounded-2xl text-[#1E3A8A] font-bold border border-gray-200 outline-none"
                  placeholder="e.g. Oyo"
                  placeholderTextColor="#9CA3AF"
                  value={stateLoc}
                  onChangeText={setStateLoc}
                />
              </View>
            </View>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* STICKY BOTTOM BUTTON (Centered for Desktop) */}
      <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-5 items-center">
        <TouchableOpacity 
          className="bg-[#2563EB] w-full max-w-2xl py-4 rounded-full flex-row justify-center items-center shadow-md shadow-blue-500/30"
          onPress={handlePublish}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-lg">Publish Listing</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}