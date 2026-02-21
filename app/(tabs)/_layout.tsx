import { Tabs, Redirect, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/_ctx';
import { ActivityIndicator, View, Text, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';

// Custom Sidebar Component for Desktop/Web
function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const NavItem = ({ icon, label, route }: { icon: any, label: string, route: string }) => {
    const isActive = pathname.includes(route);
    return (
      <TouchableOpacity
        onPress={() => router.push(route)}
        className={`flex-row items-center px-6 py-4 my-1 rounded-2xl ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}
      >
        <Ionicons name={icon} size={24} color={isActive ? '#2563EB' : '#9CA3AF'} />
        <Text className={`ml-4 font-bold text-base ${isActive ? 'text-[#2563EB]' : 'text-gray-500'}`}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="w-64 bg-white border-r border-gray-100 h-full py-8 px-4 shadow-[5px_0_15px_rgba(0,0,0,0.02)] z-50">
      {/* Sidebar Logo */}
      <View className="flex-row items-center px-4 mb-12">
        <Ionicons name="home" size={28} color="#1A1A1A" />
        <Text className="text-3xl font-black text-gray-900 tracking-tight ml-2">Urbis</Text>
      </View>

      {/* Navigation Links */}
      <NavItem icon="search" label="Explore" route="/explore" />
      <NavItem icon="heart-outline" label="Shortlist" route="/saved" />
      <NavItem icon="home-outline" label="My Homes" route="/homes" />
      <NavItem icon="chatbubble-outline" label="Messages" route="/messages" />
      <NavItem icon="person-outline" label="Profile" route="/profile" />
    </View>
  );
}

export default function TabLayout() {
  const { session, isLoading } = useAuth();
  
  // Magic logic for responsiveness
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <View className="flex-1 flex-row bg-white">
      {/* Only show sidebar if on a wide screen */}
      {isDesktop && <DesktopSidebar />}
      
      {/* Main Content Area */}
      <View className="flex-1">
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#2563EB', 
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarLabelStyle: {
              fontFamily: 'Urbanist_600SemiBold',
              fontSize: 10,
              marginTop: -2,
            },
            // Hide the bottom tab bar if we are showing the desktop sidebar
            tabBarStyle: isDesktop ? { display: 'none' } : {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
              height: 65,
              paddingBottom: 8,
              paddingTop: 8,
              elevation: 0, 
            },
            headerShown: false, 
          }}>
            <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} /> }} />
            <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={24} color={color} /> }} />
            <Tabs.Screen name="homes" options={{ title: 'Homes', tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> }} />
            <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color }) => <Ionicons name="chatbubble-outline" size={24} color={color} /> }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} /> }} />
          </Tabs>
      </View>
    </View>
  );
}