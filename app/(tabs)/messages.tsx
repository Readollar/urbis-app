import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/_ctx';
import TopBar from '../../components/TopBar';

type TabType = 'Open' | 'Closed' | 'Archived';

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
  
  // Responsive Desktop Logic
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [activeTab, setActiveTab] = useState<TabType>('Open');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State to track which chat is open in the desktop Middle Pane
  const [activeChat, setActiveChat] = useState<ChatPreview | null>(null);

  const fetchConversations = async () => {
    if (!session?.user?.id) return;

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

    const conversationMap = new Map<string, any>();
    
    messages.forEach((msg) => {
      const partnerId = msg.sender_id === session.user.id ? msg.receiver_id : msg.sender_id;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          lastMessage: msg.content,
          created_at: msg.created_at,
          unread: (!msg.is_read && msg.receiver_id === session.user.id) ? 1 : 0 
        });
      } else if (!msg.is_read && msg.receiver_id === session.user.id) {
        const existing = conversationMap.get(partnerId);
        conversationMap.set(partnerId, { ...existing, unread: existing.unread + 1 });
      }
    });

    const partnerIds = Array.from(conversationMap.keys());
    
    if (partnerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', partnerIds);

      if (profiles) {
        const compiledChats: ChatPreview[] = profiles.map(profile => {
          const chatData = conversationMap.get(profile.id);
          const date = new Date(chatData.created_at);
          
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

        compiledChats.sort((a, b) => new Date(conversationMap.get(b.partnerId).created_at).getTime() - new Date(conversationMap.get(a.partnerId).created_at).getTime());
        setChats(compiledChats);
        
        // Auto-select the first chat on desktop if none is selected
        if (isDesktop && !activeChat && compiledChats.length > 0) {
          setActiveChat(compiledChats[0]);
        }
      }
    } else {
      setChats([]); 
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchConversations();
    }, [session, isDesktop])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // === RENDER HELPERS ===

  // 1. LEFT PANE: The Chat List (Works for both Mobile & Desktop)
  const renderChatList = () => (
    <View className={`${isDesktop ? 'w-[350px] border-r border-gray-100 h-full' : 'flex-1'} bg-white`}>
      <View className="px-6 pt-6 mb-6">
        <Text className="text-3xl font-bold text-[#1E3A8A] mb-2">Messages</Text>
        <Text className="text-sm text-gray-500 font-medium">Manage inquiries and rental conversations.</Text>
      </View>

      <View className="flex-row px-6 mb-6 border-b border-gray-100">
        {['Open', 'Closed', 'Archived'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as TabType)} className={`mr-6 pb-3 ${isActive ? 'border-b-2 border-[#2563EB]' : ''}`}>
              <Text className={`text-base font-bold ${isActive ? 'text-[#1E3A8A]' : 'text-gray-400'}`}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-[#1E3A8A] font-medium h-8 outline-none"
            placeholder="Search by keyword or name..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center pt-20"><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}>
          {filteredChats.map((chat) => {
            const isSelected = isDesktop && activeChat?.partnerId === chat.partnerId;
            return (
              <TouchableOpacity 
                key={chat.partnerId} activeOpacity={0.7}
                onPress={() => {
                  if (isDesktop) setActiveChat(chat);
                  else router.push(`/chat/${chat.partnerId}`);
                }}
                className={`flex-row items-center py-4 px-6 border-l-4 ${isSelected ? 'border-[#2563EB] bg-blue-50/50' : 'border-transparent hover:bg-gray-50'}`}
              >
                <View className="relative mr-4">
                  <Image source={{ uri: chat.avatar }} className="w-14 h-14 rounded-full bg-gray-200" contentFit="cover" />
                  <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                </View>
                <View className="flex-1 mr-4">
                  <Text className="font-bold text-[#1E3A8A] text-base mb-1" numberOfLines={1}>{chat.name}</Text>
                  <Text className={`text-sm ${chat.unread > 0 ? 'text-gray-800 font-semibold' : 'text-gray-500 font-medium'}`} numberOfLines={1}>{chat.lastMessage}</Text>
                </View>
                <View className="items-end justify-between h-12">
                  <Text className="text-xs font-semibold text-gray-400 mb-2">{chat.time}</Text>
                  {chat.unread > 0 ? (
                    <View className="bg-[#2563EB] w-5 h-5 rounded-full justify-center items-center"><Text className="text-white text-[10px] font-bold">{chat.unread}</Text></View>
                  ) : <View className="w-5 h-5" />}
                </View>
              </TouchableOpacity>
            )
          })}
          {chats.length === 0 && (
            <View className="mt-20 items-center px-8">
              <Ionicons name="chatbubbles-outline" size={64} color="#E5E7EB" />
              <Text className="text-gray-400 font-bold text-lg mt-4 text-center">No messages yet</Text>
            </View>
          )}
          <View className="h-20" />
        </ScrollView>
      )}
    </View>
  );

  // 2. MIDDLE PANE: The Active Chat (Desktop Only)
  const renderActiveChat = () => {
    if (!activeChat) {
      return (
        <View className="flex-1 bg-gray-50 justify-center items-center h-full">
          <Ionicons name="mail-unread-outline" size={80} color="#E5E7EB" />
          <Text className="text-xl font-bold text-gray-400 mt-4">Select a conversation</Text>
        </View>
      );
    }

    return (
      <View className="flex-1 bg-white h-full flex-col">
        {/* Chat Toolbar */}
        <View className="h-16 border-b border-gray-100 flex-row items-center justify-between px-8 bg-white">
          <View className="flex-row gap-6">
            <TouchableOpacity className="flex-row items-center"><Ionicons name="folder-open-outline" size={18} color="#2563EB" /><Text className="text-[#2563EB] font-bold text-sm ml-2">Move to Closed</Text></TouchableOpacity>
            <TouchableOpacity className="flex-row items-center"><Ionicons name="archive-outline" size={18} color="#4B5563" /><Text className="text-gray-600 font-bold text-sm ml-2">Archive</Text></TouchableOpacity>
          </View>
          <TouchableOpacity><Ionicons name="bookmark-outline" size={20} color="#EF4444" /></TouchableOpacity>
        </View>

        {/* Chat Messages Area (Placeholder for actual chat flow) */}
        <ScrollView className="flex-1 px-8 py-6 bg-[#F9FAFB]">
          {/* Mock Received Message */}
          <View className="flex-row mb-6">
            <View className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 max-w-[80%] shadow-sm">
              <View className="flex-row justify-between items-end mb-2">
                <Text className="font-bold text-[#1E3A8A] text-sm mr-4">{activeChat.name}</Text>
                <Text className="text-xs text-gray-400">11:52</Text>
              </View>
              <Text className="text-gray-600 leading-6">{activeChat.lastMessage}</Text>
            </View>
          </View>
          {/* Mock Sent Message */}
          <View className="flex-row justify-end mb-6">
            <View className="bg-blue-50 p-4 rounded-2xl rounded-tr-none border border-blue-100 max-w-[80%] shadow-sm">
              <View className="flex-row justify-between items-end mb-2">
                <Text className="font-bold text-[#2563EB] text-sm mr-4">You</Text>
                <Text className="text-xs text-blue-300">11:55</Text>
              </View>
              <Text className="text-[#1E3A8A] leading-6">Hello! Yes, the price is negotiable. Would you like to schedule an inspection?</Text>
            </View>
          </View>
        </ScrollView>

        {/* Input Area */}
        <View className="p-6 bg-white border-t border-gray-100">
          <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
            <TouchableOpacity className="p-2"><Ionicons name="attach" size={24} color="#9CA3AF" /></TouchableOpacity>
            <TextInput className="flex-1 px-4 py-3 text-[#1E3A8A] text-base outline-none" placeholder="Write a message..." placeholderTextColor="#9CA3AF" />
            <TouchableOpacity className="p-2"><Ionicons name="happy-outline" size={24} color="#9CA3AF" /></TouchableOpacity>
            <TouchableOpacity className="bg-[#2563EB] px-6 py-3 rounded-full ml-2 shadow-sm"><Text className="text-white font-bold">Send</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // 3. RIGHT PANE: The About Profile (Desktop Only)
  const renderRightPane = () => {
    if (!activeChat) return <View className="w-[320px] border-l border-gray-100 bg-gray-50 h-full" />;

    return (
      <View className="w-[320px] bg-white border-l border-gray-100 h-full flex-col">
        <View className="p-8 border-b border-gray-100 items-center">
          <Text className="font-bold text-xl text-[#1E3A8A] self-start mb-6">About</Text>
          <Image source={{ uri: activeChat.avatar }} className="w-28 h-28 rounded-full bg-gray-200 mb-4 shadow-sm" contentFit="cover" />
          <Text className="font-black text-2xl text-[#1E3A8A] mb-1 text-center">{activeChat.name}</Text>
          <Text className="text-gray-500 font-medium mb-6 text-center">Nigeria</Text>

          {/* Profile Toggles */}
          <View className="flex-row bg-gray-50 p-1 rounded-full w-full">
            <TouchableOpacity className="flex-1 bg-[#2563EB] py-2 rounded-full items-center shadow-sm"><Text className="text-white font-bold text-xs">Profile</Text></TouchableOpacity>
            <TouchableOpacity className="flex-1 py-2 rounded-full items-center"><Text className="text-gray-500 font-bold text-xs">Files</Text></TouchableOpacity>
            <TouchableOpacity className="flex-1 py-2 rounded-full items-center"><Text className="text-gray-500 font-bold text-xs">Settings</Text></TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-8 py-6">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center"><Ionicons name="person-outline" size={18} color="#1E3A8A" /><Text className="font-bold text-[#1E3A8A] ml-2">Basic information</Text></View>
            <Ionicons name="chevron-up" size={18} color="#9CA3AF" />
          </View>
          
          <View className="gap-y-4 mb-8">
            <View className="flex-row justify-between"><Text className="text-gray-400 font-medium text-sm">Name:</Text><Text className="text-[#1E3A8A] font-bold text-sm">{activeChat.name}</Text></View>
            <View className="flex-row justify-between"><Text className="text-gray-400 font-medium text-sm">Telephone:</Text><Text className="text-[#2563EB] font-bold text-sm">Requested</Text></View>
            <View className="flex-row justify-between"><Text className="text-gray-400 font-medium text-sm">Email:</Text><Text className="text-[#2563EB] font-bold text-sm">Requested</Text></View>
          </View>

          <View className="flex-row justify-between items-center border-t border-gray-100 pt-6">
            <View className="flex-row items-center"><Ionicons name="pricetag-outline" size={18} color="#1E3A8A" /><Text className="font-bold text-[#1E3A8A] ml-2">Tags</Text></View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </ScrollView>
      </View>
    );
  };

  // === MAIN RETURN ===
  return (
    <View className="flex-1 bg-white flex-col">
      <TopBar />

      {isDesktop ? (
        // DESKTOP: 3-Column Split Pane
        <View className="flex-1 flex-row w-full h-full">
          {renderChatList()}
          {renderActiveChat()}
          {renderRightPane()}
        </View>
      ) : (
        // MOBILE: Standard Full-Width List
        <View className="flex-1 w-full">
          {renderChatList()}
        </View>
      )}
    </View>
  );
}