import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/_ctx';
import TopBar from '../../components/TopBar';

export default function HomesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('citizen');
  const [myProperties, setMyProperties] = useState<any[]>([]);

  const fetchUserData = async () => {
    if (!session?.user?.id) return;

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role) setUserRole(profile.role);

    if (profile?.role === 'partner' || profile?.role === 'admin') {
      const { data: properties } = await supabase.from('properties').select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false });
      if (properties) setMyProperties(properties);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchUserData(); }, [session]));

  const onRefresh = () => { setRefreshing(true); fetchUserData(); };

  if (loading) return <View className="flex-1 bg-white justify-center items-center"><ActivityIndicator color="#2563EB" size="large" /></View>;

  // CITIZEN VIEW
  if (userRole === 'citizen') {
    return (
      <View className="flex-1 bg-white">
        <TopBar />
        {/* We use flexGrow: 1 here so the ScrollView takes up the full screen height */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="w-full"
          contentContainerStyle={{ flexGrow: 1 }} 
        >
          {/* Main Wrapper */}
          <View className="flex-1 w-full px-6 pt-6 pb-20">
            
            {/* TOP-LEFT ALIGNED HEADER */}
            <View>
              <Text className="text-3xl font-bold text-[#1E3A8A] mb-2">Host on Urbis</Text>
              <Text className="text-sm text-gray-500 font-medium leading-5 mb-8">
                Turn your property into extra income. Join thousands of verified hosts across Nigeria.
              </Text>
            </View>
            
            {/* CENTERED CONTENT WRAPPER */}
            {/* flex-1 pushes this container to take up remaining height, and justify-center centers the card vertically */}
            <View className="flex-1 justify-center items-center">
              <View className="bg-blue-50 rounded-3xl p-10 items-center border border-blue-100 w-full max-w-2xl">
                <View className="bg-white w-24 h-24 rounded-full justify-center items-center mb-6 shadow-sm border border-gray-100">
                  <Ionicons name="home" size={40} color="#2563EB" />
                </View>
                <Text className="text-2xl font-bold text-[#1E3A8A] text-center mb-4">List your space</Text>
                <Text className="text-gray-600 text-center mb-10 leading-6 text-base">
                  Whether it's a duplex in Lekki, an apartment in Ibadan, or a short-let in Abuja, you can list it here.
                </Text>
                
                <TouchableOpacity 
                  className="bg-[#2563EB] w-full max-w-xs py-4 rounded-full shadow-md shadow-blue-500/30" 
                  onPress={() => router.push('/add-property')}
                >
                  <Text className="text-white font-bold text-lg text-center">Become a Partner</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </View>
    );
  }

  // ADVANCED PARTNER VIEW
  const verifiedCount = myProperties.filter(p => p.status === 'verified').length;

  return (
    <View className="flex-1 bg-white">
      <TopBar />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="w-full"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        <View className="w-full max-w-5xl px-6 pt-6 pb-20">
          
          {/* HEADER SECTION */}
          <View className="mb-6 flex-row justify-between items-end">
            <View>
              <Text className="text-3xl font-bold text-[#1E3A8A] mb-1">Host Dashboard</Text>
              <Text className="text-sm text-gray-500 font-medium">Manage your portfolio.</Text>
            </View>
            <TouchableOpacity className="bg-[#2563EB] w-10 h-10 rounded-full justify-center items-center shadow-sm" onPress={() => router.push('/add-property')}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* DASHBOARD STATS */}
          <View className="mb-6 flex-row gap-3">
            <View className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Listings</Text>
              <Text className="text-3xl font-black text-[#1E3A8A]">{myProperties.length}</Text>
            </View>
            <View className="flex-1 bg-green-50 p-4 rounded-2xl border border-green-100">
              <Text className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Verified</Text>
              <Text className="text-3xl font-black text-green-700">{verifiedCount}</Text>
            </View>
          </View>

          {/* PROPERTY LIST */}
          {myProperties.length === 0 ? (
            <View className="flex-1 justify-center items-center pt-10">
              <Ionicons name="business-outline" size={64} color="#E5E7EB" />
              <Text className="text-lg font-bold text-gray-400 mt-4 text-center">No properties listed yet</Text>
              <Text className="text-sm text-gray-400 mt-2 text-center">Tap the + button to add your first flat, land, or short-let.</Text>
            </View>
          ) : (
            <View>
              {myProperties.map((property) => (
                <TouchableOpacity 
                  key={property.id} 
                  activeOpacity={0.8} 
                  onPress={() => router.push(`/property/${property.id}`)} 
                  className="flex-row bg-white rounded-2xl mb-4 border border-gray-100 p-4 shadow-sm items-center"
                >
                  <Image source={{ uri: property.images?.[0] || 'https://via.placeholder.com/200' }} className="w-20 h-20 rounded-xl bg-gray-100 mr-4" contentFit="cover" />
                  <View className="flex-1">
                    <Text className="font-bold text-[#1E3A8A] text-base mb-1" numberOfLines={1}>{property.title}</Text>
                    <Text className="text-[#2563EB] font-bold mb-1">₦{property.price.toLocaleString()}</Text>
                    <View className="flex-row items-center justify-between mt-1">
                      <Text className={`text-[10px] font-bold uppercase ${property.status === 'verified' ? 'text-green-500' : 'text-orange-400'}`}>{property.status}</Text>
                      <Text className="text-xs text-gray-400 font-medium">{property.type.replace('_', ' ')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}