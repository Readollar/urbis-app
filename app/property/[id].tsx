import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const { width } = Dimensions.get('window');

export default function PropertyDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Inspection Flow States
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('Wed, Feb 18');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');

  useEffect(() => {
    async function fetchDetails() {
      const { data } = await supabase.from('properties').select('*, profiles(full_name, avatar_url)').eq('id', id).single();
      if (data) setProperty(data);
      setLoading(false);
    }
    fetchDetails();
  }, [id]);

  if (loading) return <View className="flex-1 bg-white justify-center items-center"><ActivityIndicator color="#2563EB" size="large" /></View>;
  if (!property) return <View className="flex-1 bg-white justify-center items-center"><Text className="text-gray-500 font-bold text-lg">Property not found.</Text></View>;

  const isShortLet = property.type === 'short_let'; 
  const pricingLabel = isShortLet ? '/ night' : property.type === 'land_plot' ? 'total' : '/ year';
  const ctaText = isShortLet ? 'Book Short-let' : 'Schedule Inspection';

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveImageIndex(Math.round(index));
  };

  const images = property.images && property.images.length > 0 ? property.images : ['https://via.placeholder.com/800x600'];

  const handleConfirmInspection = () => {
    setShowInspectionModal(false);
    setTimeout(() => setShowSuccessModal(true), 300); // Small delay for smooth modal transition
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* HERO IMAGE CAROUSEL */}
        <View className="relative h-[350px] w-full bg-gray-100">
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
            {images.map((img: string, index: number) => (
              <Image key={index} source={{ uri: img }} style={{ width, height: 350 }} contentFit="cover" />
            ))}
          </ScrollView>
          <View className="absolute bottom-4 w-full flex-row justify-center gap-2">
            {images.map((_: any, index: number) => (
              <View key={index} className={`h-2 rounded-full ${index === activeImageIndex ? 'w-6 bg-blue-600' : 'w-2 bg-white/70'}`} />
            ))}
          </View>
          <SafeAreaView className="absolute w-full flex-row justify-between px-6 pt-4">
            <TouchableOpacity onPress={() => router.back()} className="bg-white p-2.5 rounded-full shadow-sm"><Ionicons name="arrow-back" size={20} color="#1A1A1A" /></TouchableOpacity>
            <View className="flex-row gap-3">
              <TouchableOpacity className="bg-white p-2.5 rounded-full shadow-sm"><Ionicons name="heart-outline" size={20} color="#EF4444" /></TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* PROPERTY INFO */}
        <View className="px-6 py-6">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-4">
              <Text className="text-2xl leading-tight font-bold text-blue-900 mb-2">{property.title}</Text>
              <View className="flex-row items-center">
                <Ionicons name="location" size={16} color="#9CA3AF" />
                <Text className="text-gray-500 font-medium text-sm ml-1">{property.city ? `${property.city}, ` : ''}{property.state || 'Nigeria'}</Text>
              </View>
            </View>
            <View className="bg-green-50 px-2 py-1 rounded-lg border border-green-100 mt-1">
              <Text className="text-green-600 font-bold text-[10px] tracking-wider">VERIFIED</Text>
            </View>
          </View>

          <View className="flex-row border-y border-gray-100 py-4 my-4 justify-between px-2">
            <View className="items-center"><Ionicons name="bed-outline" size={22} color="#4B5563" /><Text className="text-xs font-semibold text-gray-600 mt-1">3 Beds</Text></View>
            <View className="items-center"><Ionicons name="water-outline" size={22} color="#4B5563" /><Text className="text-xs font-semibold text-gray-600 mt-1">2 Baths</Text></View>
            <View className="items-center"><Ionicons name="car-outline" size={22} color="#4B5563" /><Text className="text-xs font-semibold text-gray-600 mt-1">Parking</Text></View>
            <View className="items-center"><Ionicons name="flash-outline" size={22} color="#4B5563" /><Text className="text-xs font-semibold text-gray-600 mt-1">Power</Text></View>
          </View>

          <View className="flex-row items-center mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <View className="w-12 h-12 rounded-full bg-gray-200 mr-4 overflow-hidden">
              <Image source={{ uri: property.profiles?.avatar_url || 'https://via.placeholder.com/100' }} className="w-full h-full" contentFit="cover" />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Listed By Partner</Text>
              <Text className="text-blue-900 font-bold text-base">{property.profiles?.full_name || 'Urbis Verified Host'}</Text>
            </View>
            <TouchableOpacity className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center" onPress={() => router.push(`/chat/${property.owner_id}`)}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>

          <Text className="text-lg font-bold text-blue-900 mb-2">About this property</Text>
          <Text className="text-gray-600 leading-6 text-sm mb-28">{property.description || 'A premium verified listing on the Urbis platform. Contact the host for more detailed information and to schedule a viewing.'}</Text>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 flex-row justify-between items-center shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <View>
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Price</Text>
          <View className="flex-row items-baseline">
            <Text className="text-xl font-bold text-blue-900">₦{property.price.toLocaleString()}</Text>
            <Text className="text-gray-500 font-bold text-xs ml-1">{pricingLabel}</Text>
          </View>
        </View>
        <TouchableOpacity className="bg-blue-600 px-6 py-3 rounded-full shadow-sm" onPress={() => setShowInspectionModal(true)}>
          <Text className="text-white font-bold text-base">{ctaText}</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL 1: SCHEDULE INSPECTION */}
      <Modal visible={showInspectionModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[32px] px-6 pt-4 pb-10">
            <View className="flex-row justify-between items-center mb-6 mt-2">
              <View className="w-10" />
              <Text className="text-xl font-bold text-blue-900">Schedule Inspection</Text>
              <TouchableOpacity onPress={() => setShowInspectionModal(false)} className="bg-gray-100 p-2 rounded-full"><Ionicons name="close" size={20} color="#1A1A1A" /></TouchableOpacity>
            </View>

            <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              {['Mon, Feb 16', 'Tue, Feb 17', 'Wed, Feb 18', 'Thu, Feb 19'].map((date) => (
                <TouchableOpacity 
                  key={date} onPress={() => setSelectedDate(date)}
                  className={`mr-3 px-5 py-3 rounded-2xl border ${selectedDate === date ? 'bg-blue-50 border-blue-600' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`font-bold ${selectedDate === date ? 'text-blue-600' : 'text-gray-600'}`}>{date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Time</Text>
            <View className="flex-row flex-wrap gap-3 mb-8">
              {['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'].map((time) => (
                <TouchableOpacity 
                  key={time} onPress={() => setSelectedTime(time)}
                  className={`px-5 py-3 rounded-xl border ${selectedTime === time ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`font-bold ${selectedTime === time ? 'text-white' : 'text-gray-600'}`}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity className="bg-blue-600 py-4 rounded-full flex-row justify-center items-center shadow-md shadow-blue-500/30" onPress={handleConfirmInspection}>
              <Text className="text-white font-bold text-lg">Confirm Inspection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: SUCCESS SCREEN (Inspired by Image) */}
      <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
        <View className="flex-1 bg-white justify-center items-center px-6">
          <View className="w-24 h-24 bg-green-100 rounded-full justify-center items-center mb-6">
            <View className="w-16 h-16 bg-green-500 rounded-full justify-center items-center shadow-sm shadow-green-500/50">
              <Ionicons name="checkmark-sharp" size={40} color="white" />
            </View>
          </View>
          <Text className="text-3xl font-black text-blue-900 mb-2 text-center">Inspection Confirmed!</Text>
          <Text className="text-gray-500 text-center mb-10 px-4 leading-6">Your inspection has been scheduled successfully. The partner has been notified.</Text>

          <View className="w-full bg-gray-50 p-4 rounded-3xl border border-gray-100 mb-8">
            <View className="flex-row items-center mb-4">
              <Image source={{ uri: property.images?.[0] }} className="w-16 h-16 rounded-xl mr-4" contentFit="cover" />
              <View className="flex-1">
                <Text className="font-bold text-blue-900 text-base mb-1" numberOfLines={1}>{property.title}</Text>
                <Text className="text-gray-500 text-xs mb-1">{property.city}, {property.state}</Text>
                <Text className="text-blue-600 font-bold text-sm">₦{property.price.toLocaleString()}{pricingLabel}</Text>
              </View>
            </View>
            <View className="border-t border-gray-200 pt-4 flex-row items-center">
              <Ionicons name="calendar" size={20} color="#4B5563" />
              <Text className="ml-2 font-bold text-gray-700">{selectedDate} at {selectedTime}</Text>
            </View>
          </View>

          <TouchableOpacity className="w-full bg-blue-600 py-4 rounded-full flex-row justify-center items-center shadow-md shadow-blue-500/30" onPress={() => { setShowSuccessModal(false); router.push('/(tabs)/explore'); }}>
            <Text className="text-white font-bold text-lg">Back to Explore</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}