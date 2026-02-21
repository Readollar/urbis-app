// components/TopBar.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TopBar() {
  return (
    // SafeAreaView ensures the header doesn't hide behind the phone's status bar
    <SafeAreaView edges={['top']} className="bg-white">
      <View className="flex-row justify-between items-center px-6 py-4 mb-1 bg-white border-b border-gray-50">
        
        {/* LOGO AREA */}
        <View className="flex-row items-center">
          <Ionicons name="home" size={24} color="#1A1A1A" />
          <Text className="text-2xl font-black text-gray-900 tracking-tight ml-2">Urbis</Text>
        </View>

        {/* HAMBURGER MENU */}
        <TouchableOpacity className="p-1">
          <Ionicons name="menu" size={30} color="#1A1A1A" />
        </TouchableOpacity>
        
      </View>
    </SafeAreaView>
  );
}