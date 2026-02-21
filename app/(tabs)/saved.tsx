import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/_ctx';
import TopBar from '../../components/TopBar';

export default function SavedScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedProperties = async () => {
    if (!session?.user?.id) return;
    
    const { data, error } = await supabase
      .from('saved_properties')
      .select(`id, property_id, properties (*, profiles (full_name, avatar_url))`)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedProperties = data.map((item: any) => ({
        ...item.properties,
        saved_id: item.id
      }));
      setSavedProperties(formattedProperties);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSavedProperties();
    }, [session])
  );

  return (
    <View className="flex-1 bg-white">
      <TopBar />
      <View className="px-6 mb-4">
        <Text className="text-3xl font-bold text-blue-900 mb-2">Saved Homes</Text>
        <Text className="text-sm text-gray-500 font-medium leading-5">
          Properties you've kept an eye on for your next move.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#2563EB" className="mt-10" />
      ) : savedProperties.length === 0 ? (
        <View className="flex-1 justify-center items-center pb-20">
          <Ionicons name="heart-dislike-outline" size={64} color="#E5E7EB" />
          <Text className="text-lg font-bold text-gray-400 mt-4">No saved properties yet</Text>
          <Text className="text-sm text-gray-400 mt-2 text-center px-8">
            Tap the heart icon on any property in the Explore tab to save it here.
          </Text>
          <TouchableOpacity 
            className="mt-8 bg-blue-50 px-6 py-3 rounded-full"
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text className="text-blue-600 font-bold">Start Exploring</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} className="px-6"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSavedProperties(); }} tintColor="#2563EB" />}
        >
          {savedProperties.map((property) => (
            <TouchableOpacity 
              key={property.id} 
              activeOpacity={0.9}
              onPress={() => router.push(`/property/${property.id}`)}
              className="bg-white rounded-3xl mb-6 border border-gray-100 overflow-hidden shadow-sm"
            >
              <View className="relative h-56 w-full bg-gray-100">
                <Image 
                  source={{ uri: property.images?.[0] || 'https://via.placeholder.com/600' }} 
                  className="w-full h-full"
                  contentFit="cover"
                />
                <TouchableOpacity className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-sm">
                  <Ionicons name="heart" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View className="p-5">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {property.type.replace('_', ' ')} • VERIFIED
                  </Text>
                </View>
                <View className="flex-row items-baseline mb-2">
                  <Text className="text-2xl font-bold text-blue-900">₦{property.price.toLocaleString()}</Text>
                  <Text className="text-sm text-gray-500 font-medium"> 
                    {property.type === 'hotel_room' ? '/ night' : property.type === 'land_plot' ? ' total' : ' / year'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                  <Text className="text-xs text-gray-500 ml-1 font-medium" numberOfLines={1}>
                    {property.city ? `${property.city}, ` : ''}{property.state || 'Nigeria'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <View className="h-10" />
        </ScrollView>
      )}
    </View>
  );
}