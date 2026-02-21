import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/_ctx';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../components/TopBar';

export default function ProfileScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('Loading...');
  const [isVerified, setIsVerified] = useState(false); 
  const [stats, setStats] = useState({ saved: 0, inspections: 0, listings: 0 });

  useEffect(() => {
    async function loadProfileData() {
      if (!userId) return;
      
      const { data: profile } = await supabase.from('profiles').select('avatar_url, full_name, is_verified, role').eq('id', userId).single();
      if (profile) {
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.is_verified) setIsVerified(true);
      }

      const { count: savedCount } = await supabase.from('saved_properties').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: listingCount } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('owner_id', userId);
      
      setStats({
        saved: savedCount || 0,
        inspections: 0, 
        listings: profile?.role === 'partner' ? (listingCount || 0) : 0,
      });
    }
    loadProfileData();
  }, [userId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const ProfileMenuItem = ({ icon, label, destructive = false }: { icon: any, label: string, destructive?: boolean }) => (
    <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-100">
      <View className="flex-row items-center">
        <View className={`w-10 h-10 rounded-full items-center justify-center ${destructive ? 'bg-red-50' : 'bg-gray-50'}`}>
          <Ionicons name={icon} size={20} color={destructive ? '#EF4444' : '#4B5563'} />
        </View>
        <Text className={`font-semibold text-base ml-4 ${destructive ? 'text-red-500' : 'text-[#1E3A8A]'}`}>{label}</Text>
      </View>
      {!destructive && <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <View className="px-6 pt-6 mb-8 flex-row justify-between items-center">
          <Text className="font-bold text-3xl text-[#1E3A8A]">Profile</Text>
          <TouchableOpacity onPress={handleSignOut}><Text className="font-bold text-[#2563EB]">Sign Out</Text></TouchableOpacity>
        </View>
        
        <View className="px-6 mb-8">
          <View className="flex-row items-center">
            <View className="w-20 h-20 rounded-full bg-gray-100 mr-4 overflow-hidden border border-gray-200">
              <Image source={{ uri: avatarUrl || 'https://via.placeholder.com/200' }} className="w-full h-full" contentFit="cover" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-xl text-[#1E3A8A] mb-1">{fullName}</Text>
              {isVerified ? (
                <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-full self-start border border-green-100">
                  <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                  <Text className="text-green-700 font-bold text-[10px] ml-1 uppercase tracking-wider">Verified</Text>
                </View>
              ) : (
                <TouchableOpacity className="flex-row items-center bg-orange-50 px-2 py-1 rounded-full self-start border border-orange-100">
                  <Ionicons name="alert-circle" size={12} color="#EA580C" />
                  <Text className="text-orange-700 font-bold text-[10px] ml-1 uppercase tracking-wider">Get Verified</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* THE STATS ROW */}
        <View className="px-6 mb-8 flex-row justify-between">
          <View className="flex-1 items-center bg-gray-50 py-4 rounded-2xl mr-2 border border-gray-100">
            <Text className="text-2xl font-black text-[#1E3A8A]">{stats.saved}</Text>
            <Text className="text-xs font-bold text-gray-400 mt-1">Saved</Text>
          </View>
          <View className="flex-1 items-center bg-gray-50 py-4 rounded-2xl mx-1 border border-gray-100">
            <Text className="text-2xl font-black text-[#1E3A8A]">{stats.inspections}</Text>
            <Text className="text-xs font-bold text-gray-400 mt-1">Inspections</Text>
          </View>
          <View className="flex-1 items-center bg-gray-50 py-4 rounded-2xl ml-2 border border-gray-100">
            <Text className="text-2xl font-black text-[#1E3A8A]">{stats.listings}</Text>
            <Text className="text-xs font-bold text-gray-400 mt-1">Listings</Text>
          </View>
        </View>

        <View className="px-6 pb-20">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Account Settings</Text>
          <View className="bg-white rounded-3xl mb-6">
            <ProfileMenuItem icon="person-outline" label="Personal Information" />
            {!isVerified && <ProfileMenuItem icon="shield-checkmark-outline" label="Verify Identity" />}
            <ProfileMenuItem icon="notifications-outline" label="Notifications" />
          </View>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Support</Text>
          <View className="bg-white rounded-3xl mb-6">
            <ProfileMenuItem icon="help-circle-outline" label="Help Center" />
            <ProfileMenuItem icon="document-text-outline" label="Terms of Service" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}