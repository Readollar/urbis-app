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

  // New function to handle un-saving directly from this screen
  const removeSavedProperty = async (propertyId: string) => {
    if (!session?.user?.id) return;
    
    // Optimistically update the UI instantly
    setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
    
    // Delete from database
    await supabase
      .from('saved_properties')
      .delete()
      .match({ user_id: session.user.id, property_id: propertyId });
  };

  return (
    <View className="flex-1 bg-white">
      <TopBar />
      
      {/* Wrapped everything in the ScrollView to match Explore's layout behavior */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSavedProperties(); }} tintColor="#2563EB" />}
      >
        {/* HEADER - Added pt-6 for desktop safety and updated to deep blue */}
        <View className="px-6 mb-6 pt-6">
          <Text className="text-3xl font-bold text-[#1E3A8A] mb-2">Saved Homes</Text>
          <Text className="text-sm text-gray-500 font-medium leading-5">
            Properties you've kept an eye on for your next move.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#2563EB" className="mt-10" />
        ) : savedProperties.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="heart-dislike-outline" size={64} color="#E5E7EB" />
            <Text className="text-lg font-bold text-gray-400 mt-4">No saved properties yet</Text>
            <Text className="text-sm text-gray-400 mt-2 text-center px-8">
              Tap the heart icon on any property in the Explore tab to save it here.
            </Text>
            <TouchableOpacity 
              className="mt-8 bg-[#2563EB] px-8 py-4 rounded-full shadow-md shadow-blue-500/30"
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text className="text-white font-bold text-base">Start Exploring</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-6">
            {savedProperties.map((property) => (
              <TouchableOpacity 
                key={property.id} 
                activeOpacity={0.9}
                onPress={() => router.push(`/property/${property.id}`)}
                className="bg-white rounded-3xl mb-6 border border-gray-100 overflow-hidden shadow-sm w-full"
              >
                {/* Updated to h-48 to match Explore cards perfectly */}
                <View className="relative h-48 w-full bg-gray-100">
                  <Image 
                    source={{ uri: property.images?.[0] || 'https://via.placeholder.com/600' }} 
                    className="w-full h-full"
                    contentFit="cover"
                  />
                  <TouchableOpacity 
                    onPress={(e) => { 
                      e.stopPropagation(); 
                      removeSavedProperty(property.id); 
                    }}
                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-sm"
                  >
                    <Ionicons name="heart" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View className="p-4">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {property.type.replace('_', ' ')} • VERIFIED
                    </Text>
                  </View>
                  <View className="flex-row items-baseline mb-2">
                    <Text className="text-xl font-bold text-[#1E3A8A]">₦{property.price.toLocaleString()}</Text>
                    <Text className="text-xs text-gray-500 font-medium"> 
                      {property.type === 'short_let' ? '/ night' : property.type === 'land_plot' ? ' total' : ' / year'}
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                    <Text className="text-xs text-gray-500 ml-1 font-medium" numberOfLines={1}>
                      {property.city ? `${property.city}, ` : ''}{property.state || 'Nigeria'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <View className="h-10" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}