import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PersonalInfoScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-6 pt-12 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#1E3A8A] ml-4">Personal Information</Text>
      </View>

      <ScrollView className="flex-1 w-full max-w-4xl px-6 pt-8">
        <Text className="text-gray-500 mb-8">Update your legal name, contact details, and account preferences here. (Feature coming soon!)</Text>
        
        {/* Placeholder UI */}
        <View className="bg-gray-50 p-6 rounded-2xl border border-gray-100 items-center">
           <Ionicons name="construct-outline" size={48} color="#9CA3AF" />
           <Text className="text-lg font-bold text-[#1E3A8A] mt-4">Under Construction</Text>
        </View>
      </ScrollView>
    </View>
  );
}