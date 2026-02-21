import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/_ctx';
import TopBar from '../../components/TopBar'; // <-- Imported TopBar

type TabType = 'Open' | 'Closed' | 'Archived';

// Define the shape of our compiled chat list items
interface ChatPreview {
  partnerId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('Open');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    if (!session?.user?.id) return;

    // 1. Fetch all messages involving the current user, ordered by newest first
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false });

    if (error || !messages) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // 2. Group messages by the "other person" to create a unique list of conversations
    const conversationMap = new Map<string, any>();
    
    messages.forEach((msg) => {
      // Determine who the *other* person in the chat is
      const partnerId = msg.sender_id === session.user.id ? msg.receiver_id : msg.sender_id;
      
      // If we haven't seen this conversation yet, this is the newest message
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          lastMessage: msg.content,
          created_at: msg.created_at,
          unread: (!msg.is_read && msg.receiver_id === session.user.id) ? 1 : 0 // Basic unread logic
        });
      } else if (!msg.is_read && msg.receiver_id === session.user.id) {
        // Increment unread count if we find older unread messages
        const existing = conversationMap.get(partnerId);
        conversationMap.set(partnerId, { ...existing, unread: existing.unread + 1 });
      }
    });

    // 3. Fetch the profiles for all the unique conversational partners
    const partnerIds = Array.from(conversationMap.keys());
    
    if (partnerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', partnerIds);

      if (profiles) {
        // 4. Merge the profile data with the conversation data
        const compiledChats: ChatPreview[] = profiles.map(profile => {
          const chatData = conversationMap.get(profile.id);
          const date = new Date(chatData.created_at);
          
          // Format time: If today, show HH:MM. If older, show Date.
          const isToday = new Date().toDateString() === date.toDateString();
          const timeString = isToday 
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

          return {
            partnerId: profile.id,
            name: profile.full_name || 'Urbis User',
            avatar: profile.avatar_url || 'https://via.placeholder.com/150',
            lastMessage: chatData.lastMessage,
            time: timeString,
            unread: chatData.unread,
          };
        });

        // Sort by most recent message
        compiledChats.sort((a, b) => new Date(conversationMap.get(b.partnerId).created_at).getTime() - new Date(conversationMap.get(a.partnerId).created_at).getTime());
        setChats(compiledChats);
      }
    } else {
      setChats([]); // No messages yet
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  // Re-fetch when the user navigates back to this tab
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchConversations();
    }, [session])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  // Search filter
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-white">
      
      {/* 1. Added TopBar globally at the top of the view */}
      <TopBar />

      {/* HEADER */}
      {/* 2. Added pt-6 for top padding below the TopBar */}
      <View className="px-6 mb-6">
        <Text className="text-3xl font-bold text-blue-900 mb-2">Messages</Text>
        <Text className="text-sm text-gray-500 font-medium">
          Manage inquiries and rental conversations.
        </Text>
      </View>

      {/* TABS (Open, Closed, Archived) */}
      <View className="flex-row px-6 mb-6 border-b border-gray-100">
        {['Open', 'Closed', 'Archived'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab as TabType)}
              className={`mr-6 pb-3 ${isActive ? 'border-b-2 border-blue-600' : ''}`}
            >
              <Text className={`text-base font-bold ${isActive ? 'text-blue-900' : 'text-gray-400'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SEARCH BAR */}
      <View className="px-6 mb-2">
        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-gray-900 font-medium h-8"
            placeholder="Search by keyword or name..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* CHAT LIST */}
      {loading ? (
        <View className="flex-1 justify-center items-center pt-20">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        >
          {filteredChats.map((chat) => (
            <TouchableOpacity 
              key={chat.partnerId} 
              activeOpacity={0.7}
              onPress={() => router.push(`/chat/${chat.partnerId}`)}
              className="flex-row items-center py-4 px-6 border-l-4 border-transparent"
            >
              <View className="relative mr-4">
                <Image 
                  source={{ uri: chat.avatar }} 
                  className="w-14 h-14 rounded-full bg-gray-200"
                  contentFit="cover"
                />
                <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
              </View>

              <View className="flex-1 mr-4">
                <Text className="font-bold text-blue-900 text-base mb-1" numberOfLines={1}>
                  {chat.name}
                </Text>
                <Text className={`text-sm ${chat.unread > 0 ? 'text-gray-800 font-semibold' : 'text-gray-500 font-medium'}`} numberOfLines={1}>
                  {chat.lastMessage}
                </Text>
              </View>

              <View className="items-end justify-between h-12">
                <Text className="text-xs font-semibold text-gray-400 mb-2">
                  {chat.time}
                </Text>
                {chat.unread > 0 ? (
                  <View className="bg-blue-600 w-5 h-5 rounded-full justify-center items-center">
                    <Text className="text-white text-[10px] font-bold">{chat.unread}</Text>
                  </View>
                ) : (
                  <View className="w-5 h-5" />
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          {chats.length === 0 && (
            <View className="mt-20 items-center px-8">
              <Ionicons name="chatbubbles-outline" size={64} color="#E5E7EB" />
              <Text className="text-gray-400 font-bold text-lg mt-4 text-center">No messages yet</Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                When you contact a host or receive an inquiry, it will appear here.
              </Text>
            </View>
          )}
          
          <View className="h-20" />
        </ScrollView>
      )}
    </View>
  );
}