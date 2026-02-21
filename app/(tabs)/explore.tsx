import { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, TextInput, ScrollView, SafeAreaView, Modal, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/_ctx'; 
import TopBar from '../../components/TopBar';

let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

const QUICK_FILTERS = ['All', 'Apartment', 'Duplex', 'Short-let', 'Commercial'];

export default function ExploreScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  // Data States
  const [properties, setProperties] = useState<any[]>([]);
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('Citizen');
  
  // UI States
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [activePill, setActivePill] = useState('All');

  // Active Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Advanced Filters (from Modal)
  const [filters, setFilters] = useState({
    flat: true,
    duplex: true,
    short_let: true,
    self_con: true,
    commercial: true,
    land_plot: true,
  });

  const currentHour = new Date().getHours();
  let timeOfDayGreeting = 'Good evening,';
  let timeEmoji = '🌙';
  if (currentHour < 12) {
    timeOfDayGreeting = 'Good morning,';
    timeEmoji = '🌅';
  } else if (currentHour < 17) {
    timeOfDayGreeting = 'Good afternoon,';
    timeEmoji = '☀️';
  }

  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      if (session?.user?.id) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
        if (profile?.full_name) setFirstName(profile.full_name.split(' ')[0]);

        const { data: saved } = await supabase.from('saved_properties').select('property_id').eq('user_id', session.user.id);
        if (saved) setSavedPropertyIds(new Set(saved.map(s => s.property_id)));
      }

      const { data, error } = await supabase.from('properties').select('*, profiles(full_name, avatar_url)').eq('status', 'verified');
      if (!error && data) setProperties(data);
      setLoading(false);
    }
    fetchInitialData();
  }, [session]);

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSaveProperty = async (propertyId: string) => {
    if (!session?.user?.id) return;
    const newSaved = new Set(savedPropertyIds);
    if (newSaved.has(propertyId)) {
      newSaved.delete(propertyId);
      await supabase.from('saved_properties').delete().match({ user_id: session.user.id, property_id: propertyId });
    } else {
      newSaved.add(propertyId);
      await supabase.from('saved_properties').insert({ user_id: session.user.id, property_id: propertyId });
    }
    setSavedPropertyIds(newSaved);
  };

  const displayedProperties = useMemo(() => {
    return properties.filter((p) => {
      // 1. Text Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = p.title.toLowerCase().includes(searchLower) || (p.city && p.city.toLowerCase().includes(searchLower)) || (p.state && p.state.toLowerCase().includes(searchLower));
      
      // 2. Advanced Category Filter (Modal)
      const matchesType = filters[p.type as keyof typeof filters] === true;
      
      // 3. Quick Pill Filter
      let matchesPill = true;
      if (activePill === 'Apartment') matchesPill = p.type === 'flat' || p.type === 'self_con';
      if (activePill === 'Duplex') matchesPill = p.type === 'duplex';
      if (activePill === 'Short-let') matchesPill = p.type === 'short_let';
      if (activePill === 'Commercial') matchesPill = p.type === 'commercial' || p.type === 'land_plot';

      // 4. Budget
      const min = minPrice ? parseInt(minPrice) : 0;
      const max = maxPrice ? parseInt(maxPrice) : Infinity;
      const matchesBudget = p.price >= min && p.price <= max;

      return matchesSearch && matchesType && matchesBudget && matchesPill;
    });
  }, [properties, searchQuery, filters, minPrice, maxPrice, activePill]);

  const featuredProperties = displayedProperties.slice(0, 3);
  const otherProperties = displayedProperties.slice(3);

  const PropertyCard = ({ property, isHorizontal = false }: { property: any, isHorizontal?: boolean }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => router.push(`/property/${property.id}`)}
      className={`bg-white rounded-3xl mb-6 border border-gray-100 overflow-hidden shadow-sm ${isHorizontal ? 'w-72 mr-4' : 'w-full'}`}
    >
      <View className="relative h-48 w-full bg-gray-100">
        <Image source={{ uri: property.images?.[0] || 'https://via.placeholder.com/600' }} className="w-full h-full" contentFit="cover" />
        <TouchableOpacity 
          onPress={(e) => { e.stopPropagation(); toggleSaveProperty(property.id); }}
          className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-sm"
        >
          <Ionicons name={savedPropertyIds.has(property.id) ? "heart" : "heart-outline"} size={20} color={savedPropertyIds.has(property.id) ? "#EF4444" : "#9CA3AF"} />
        </TouchableOpacity>
      </View>
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{property.type.replace('_', ' ')} • VERIFIED</Text>
        </View>
        <View className="flex-row items-baseline mb-2">
          <Text className="text-xl font-bold text-[#1E3A8A]">₦{property.price.toLocaleString()}</Text>
          <Text className="text-xs text-gray-500 font-medium"> {property.type === 'short_let' ? '/ night' : property.type === 'land_plot' ? ' total' : ' / year'}</Text>
        </View>
        <View className="flex-row items-center mb-3">
          <Ionicons name="location-outline" size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-500 ml-1 font-medium" numberOfLines={1}>{property.city ? `${property.city}, ` : ''}{property.state || 'Nigeria'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (viewMode === 'map') {
    return (
      <View className="flex-1 bg-white">
        {Platform.OS !== 'web' && (
          <MapView style={StyleSheet.absoluteFillObject} initialRegion={{ latitude: 9.0765, longitude: 7.3986, latitudeDelta: 5.0, longitudeDelta: 5.0 }}>
            {displayedProperties.map((property) => (
              <Marker key={property.id} coordinate={{ latitude: property.latitude, longitude: property.longitude }}>
                <View className="px-3 py-1 bg-blue-600 rounded-full border-2 border-white shadow-sm">
                  <Text className="text-white font-bold text-xs">₦{(property.price / 1000000).toFixed(1)}M</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        )}
        <SafeAreaView className="absolute top-12 w-full px-6 flex-row justify-between">
            <TouchableOpacity onPress={() => setViewMode('list')} className="bg-white p-3 rounded-full shadow-md"><Ionicons name="arrow-back" size={24} color="#1A1A1A" /></TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <TopBar /> 
      <ScrollView showsVerticalScrollIndicator={false} className="pt-4">
        
        <View className="px-6 mb-6">
          <Text className="text-sm text-gray-500 font-semibold">{timeOfDayGreeting}</Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-3xl font-bold text-[#1E3A8A]">{firstName}!</Text>
            <Text className="text-4xl ml-2">{timeEmoji}</Text>
          </View>
          <Text className="text-sm text-gray-500 font-medium leading-5 mt-1">Ready to start your next adventure? Start exploring properties now.</Text>
        </View>

        <View className="px-6 flex-row items-center bg-gray-50 rounded-2xl mx-6 px-4 py-3 mb-6 border border-gray-100">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-[#1E3A8A] font-medium h-8"
            placeholder="Search state, city, location..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => setShowFilters(true)} className="p-2">
            <Ionicons name="options-outline" size={20} color="#2563EB" /> 
          </TouchableOpacity>
        </View>

        {/* QUICK FILTER PILLS (RenterNest Style) */}
        <View className="mb-8">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6">
            {QUICK_FILTERS.map((pill) => {
              const isActive = activePill === pill;
              return (
                <TouchableOpacity 
                  key={pill}
                  onPress={() => setActivePill(pill)}
                  className={`mr-3 px-5 py-2 rounded-full border ${isActive ? 'bg-[#1E3A8A] border-[#1E3A8A]' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-600'}`}>{pill}</Text>
                </TouchableOpacity>
              )
            })}
            <View className="w-6" />
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator color="#2563EB" className="mt-10" />
        ) : displayedProperties.length === 0 ? (
          <View className="items-center justify-center py-12"><Text className="text-gray-400 font-bold text-lg">No properties found</Text></View>
        ) : (
          <>
            {/* FEATURED PROPERTY */}
            <View className="pl-6 mb-4">
              <Text className="text-xl font-bold text-[#1E3A8A] mb-4">Featured Property</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-4">
                {featuredProperties.map(property => <PropertyCard key={property.id} property={property} isHorizontal={true} />)}
                <View className="w-6" />
              </ScrollView>
            </View>

            {/* POPULAR SEARCHES */}
            {otherProperties.length > 0 && (
              <View className="px-6">
                <Text className="text-xl font-bold text-[#1E3A8A] mb-4">Popular Searches</Text>
                {otherProperties.map(property => <PropertyCard key={property.id} property={property} />)}
              </View>
            )}
          </>
        )}
        <View className="h-10" />
      </ScrollView>

      {/* FILTER MODAL */}
      <Modal visible={showFilters} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-[40px] px-6 pt-4 pb-10 h-[85%]">
            <View className="flex-row justify-between items-center mb-6 mt-2">
              <View className="w-10" />
              <Text className="text-2xl font-bold text-center text-[#1E3A8A]">Refine your search</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} className="bg-gray-100 p-2 rounded-full"><Ionicons name="close" size={20} color="#1A1A1A" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row bg-gray-50 rounded-full p-1 mb-2 border border-gray-200">
                <TouchableOpacity onPress={() => { setViewMode('list'); setShowFilters(false); }} className={`flex-1 py-3 rounded-full items-center ${viewMode === 'list' ? 'bg-white shadow-sm border-blue-500' : ''}`}><Text className={`font-semibold ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-500'}`}>List View</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setViewMode('map'); setShowFilters(false); }} className={`flex-1 py-3 rounded-full items-center ${viewMode === 'map' ? 'bg-white shadow-sm border-blue-500' : ''}`}><Text className={`font-semibold ${viewMode === 'map' ? 'text-blue-600' : 'text-gray-500'}`}>Map View</Text></TouchableOpacity>
              </View>
              <Text className="text-center text-xs text-gray-400 font-medium mb-6">Browse properties in {viewMode} view</Text>
              <View className="h-[1px] bg-gray-100 mb-6" />
              <Text className="font-bold text-[#1E3A8A] text-lg mb-4">Property type</Text>
              <View className="mb-6 flex-row flex-wrap gap-x-2 gap-y-3">
                {[ { key: 'flat', label: 'Apartments' }, { key: 'duplex', label: 'Duplex' }, { key: 'short_let', label: 'Short-let' }, { key: 'self_con', label: 'Self Contain' }, { key: 'commercial', label: 'Commercial' }, { key: 'land_plot', label: 'Land Plot' } ].map((item) => {
                  const isActive = filters[item.key as keyof typeof filters];
                  return (
                    <TouchableOpacity key={item.key} className={`flex-row items-center py-2 px-4 rounded-full border ${isActive ? 'bg-blue-50 border-[#2563EB]' : 'bg-white border-gray-300'}`} onPress={() => toggleFilter(item.key as keyof typeof filters)}>
                      <Text className={`font-bold text-sm ${isActive ? 'text-[#2563EB]' : 'text-gray-600'}`}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text className="font-bold text-[#1E3A8A] text-lg mb-4 mt-2">Budget range (₦)</Text>
              <View className="flex-row gap-4 mb-8">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Minimum</Text>
                  <TextInput className="bg-gray-50 px-4 py-4 rounded-2xl text-[#1E3A8A] font-bold border border-gray-200" placeholder="e.g. 0" keyboardType="numeric" value={minPrice} onChangeText={setMinPrice} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Maximum</Text>
                  <TextInput className="bg-gray-50 px-4 py-4 rounded-2xl text-[#1E3A8A] font-bold border border-gray-200" placeholder="e.g. 5000000" keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} />
                </View>
              </View>
            </ScrollView>
            <View className="pt-4 border-t border-gray-100">
              <TouchableOpacity className="bg-[#2563EB] py-4 rounded-full flex-row justify-center items-center shadow-md shadow-blue-500/30" onPress={() => setShowFilters(false)}>
                <Text className="text-white font-bold text-lg">Apply filter ({displayedProperties.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}