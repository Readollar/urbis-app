import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/_ctx';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../../utils/cloudinary'; 
import TopBar from '../../components/TopBar';

interface ProfileStats {
  saved: number;
  inspections: number;
  listings: number;
}

export default function ProfileScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('Loading...');
  const [isVerified, setIsVerified] = useState<boolean>(false); 
  const [stats, setStats] = useState<ProfileStats>({ saved: 0, inspections: 0, listings: 0 });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string, type: 'error' | 'success' | '' }>({ message: '', type: '' });

  useEffect(() => {
    let isMounted = true; 

    async function loadProfileData() {
      if (!userId) return;
      
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url, full_name, is_verified, role')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        if (isMounted && profile) {
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
          if (profile.full_name) setFullName(profile.full_name);
          if (profile.is_verified) setIsVerified(true);
        }

        const [savedRes, listingRes] = await Promise.all([
          supabase.from('saved_properties').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('properties').select('id', { count: 'exact', head: true }).eq('owner_id', userId)
        ]);
        
        if (isMounted) {
          setStats({
            saved: savedRes.count || 0,
            inspections: 0, 
            listings: profile?.role === 'partner' ? (listingRes.count || 0) : 0,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfileData();
    return () => { isMounted = false; };
  }, [userId]);

  const handleAvatarUpdate = async () => {
    try {
      setFeedback({ message: '', type: '' });
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], 
        quality: 0.7, 
      });

      if (result.canceled || !result.assets[0].uri) return;

      setUploadingAvatar(true);
      const uri = result.assets[0].uri;
      
      const cloudinaryUrl = await uploadToCloudinary(uri);
      if (!cloudinaryUrl) throw new Error('Failed to upload image to cloud storage.');

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: cloudinaryUrl })
        .eq('id', userId);

      if (error) throw error;

      setAvatarUrl(cloudinaryUrl);
      setFeedback({ message: 'Profile picture updated successfully.', type: 'success' });

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'An unknown error occurred.';
      setFeedback({ message: msg, type: 'error' });
    } finally {
      setUploadingAvatar(false);
      setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const ProfileMenuItem = ({ icon, label, onPress, destructive = false }: { icon: any, label: string, onPress: () => void, destructive?: boolean }) => (
    <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between py-4 border-b border-gray-100 active:opacity-70">
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
      <ScrollView showsVerticalScrollIndicator={false} className="w-full">
        
        {/* Removed self-center and increased max-width to align left cleanly */}
        <View className="w-full max-w-4xl px-6 pt-6 pb-20">
          
          <View className="mb-8 flex-row justify-between items-center">
            <Text className="font-bold text-3xl text-[#1E3A8A]">Profile</Text>
            <TouchableOpacity onPress={handleSignOut}>
              <Text className="font-bold text-[#2563EB]">Sign Out</Text>
            </TouchableOpacity>
          </View>
          
          {feedback.message !== '' && (
            <View className={`mb-6 p-4 rounded-xl border ${feedback.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <Text className={`font-semibold text-center ${feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                {feedback.message}
              </Text>
            </View>
          )}
          
          <View className="mb-8">
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={handleAvatarUpdate} 
                disabled={uploadingAvatar}
                className="w-20 h-20 rounded-full bg-gray-100 mr-4 overflow-hidden border border-gray-200 justify-center items-center relative"
              >
                <Image source={{ uri: avatarUrl || 'https://via.placeholder.com/200' }} className="w-full h-full" contentFit="cover" />
                {uploadingAvatar && (
                  <View className="absolute w-full h-full bg-black/40 justify-center items-center">
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
                {!uploadingAvatar && (
                  <View className="absolute bottom-0 w-full h-6 bg-black/40 justify-center items-center">
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              <View className="flex-1">
                <Text className="font-bold text-xl text-[#1E3A8A] mb-1">{loading ? 'Loading...' : fullName}</Text>
                {isVerified ? (
                  <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-full self-start border border-green-100">
                    <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                    <Text className="text-green-700 font-bold text-[10px] ml-1 uppercase tracking-wider">Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={() => router.push('/settings/verify')} 
                    className="flex-row items-center bg-orange-50 px-2 py-1 rounded-full self-start border border-orange-100"
                  >
                    <Ionicons name="alert-circle" size={12} color="#EA580C" />
                    <Text className="text-orange-700 font-bold text-[10px] ml-1 uppercase tracking-wider">Get Verified</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View className="mb-8 flex-row gap-3">
            <View className="flex-1 items-center bg-gray-50 py-4 rounded-2xl border border-gray-100">
              <Text className="text-2xl font-black text-[#1E3A8A]">{stats.saved}</Text>
              <Text className="text-xs font-bold text-gray-400 mt-1">Saved</Text>
            </View>
            <View className="flex-1 items-center bg-gray-50 py-4 rounded-2xl border border-gray-100">
              <Text className="text-2xl font-black text-[#1E3A8A]">{stats.inspections}</Text>
              <Text className="text-xs font-bold text-gray-400 mt-1">Inspections</Text>
            </View>
            <View className="flex-1 items-center bg-gray-50 py-4 rounded-2xl border border-gray-100">
              <Text className="text-2xl font-black text-[#1E3A8A]">{stats.listings}</Text>
              <Text className="text-xs font-bold text-gray-400 mt-1">Listings</Text>
            </View>
          </View>

          <View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Account Settings</Text>
            <View className="bg-white rounded-3xl mb-8">
              <ProfileMenuItem icon="person-outline" label="Personal Information" onPress={() => router.push('/settings/personal')} />
              <ProfileMenuItem icon="wallet-outline" label="Payments & Payouts" onPress={() => router.push('/settings/payments')} />
              {!isVerified && <ProfileMenuItem icon="shield-checkmark-outline" label="Verify Identity" onPress={() => router.push('/settings/verify')} />}
              <ProfileMenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/settings/notifications')} />
            </View>

            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Support</Text>
            <View className="bg-white rounded-3xl mb-6">
              <ProfileMenuItem icon="help-circle-outline" label="Help Center" onPress={() => router.push('/settings/help')} />
              <ProfileMenuItem icon="document-text-outline" label="Terms of Service" onPress={() => router.push('/settings/terms')} />
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}