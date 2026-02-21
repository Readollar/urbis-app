import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/_ctx';

export default function ChatThreadScreen() {
  const { id: receiverId } = useLocalSearchParams(); // The ID of the person we are chatting with
  const router = useRouter();
  const { session } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!session?.user?.id || !receiverId) return;

    // 1. Fetch the profile of the person we are chatting with
    async function fetchReceiver() {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', receiverId)
        .single();
      if (data) setReceiverProfile(data);
    }

    // 2. Fetch historical messages between these two users
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session?.user?.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session?.user?.id})`)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data);
      setLoading(false);
      
      // Auto-scroll to bottom on load
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }

    fetchReceiver();
    fetchMessages();

    // 3. Subscribe to Real-Time new messages
    const messageSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${session.user.id}` // Only listen for incoming messages to me
      }, (payload) => {
        // If the message is from the person I'm currently chatting with, append it
        if (payload.new.sender_id === receiverId) {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [session, receiverId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !session?.user?.id) return;

    const newMessage = {
      sender_id: session.user.id,
      receiver_id: receiverId,
      content: inputText.trim(),
    };

    // Optimistically update UI so it feels instant
    setMessages((prev) => [...prev, { ...newMessage, id: 'temp-id', created_at: new Date().toISOString() }]);
    setInputText('');
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // Send to database
    const { error } = await supabase.from('messages').insert(newMessage);
    if (error) {
      console.error("Failed to send:", error.message);
      // In a production app, we would show an error toast here and remove the optimistic message
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 shadow-sm bg-white z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        
        {loading ? (
          <ActivityIndicator color="#0D9488" className="ml-4" />
        ) : (
          <View className="flex-row items-center flex-1">
            <Image 
              source={{ uri: receiverProfile?.avatar_url || 'https://via.placeholder.com/100' }} 
              className="w-10 h-10 rounded-full bg-gray-200 mr-3"
            />
            <View>
              <Text className="font-bold text-lg text-urbis-text leading-tight">
                {receiverProfile?.full_name || 'Urbis User'}
              </Text>
              <Text className="text-xs text-urbis-primary font-semibold uppercase tracking-wider">
                {receiverProfile?.role || 'Citizen'}
              </Text>
            </View>
          </View>
        )}
        <TouchableOpacity className="p-2">
          <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* CHAT MESSAGES AREA */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-4 pt-4 bg-urbis-surface"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && !loading ? (
            <View className="items-center justify-center mt-20">
              <Text className="text-gray-400 font-medium text-center">No messages yet. Start the conversation!</Text>
            </View>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_id === session?.user?.id;
              
              // Simple time formatting (e.g., "14:30")
              const timeString = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <View key={msg.id || index} className={`mb-4 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                  <View className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-urbis-primary rounded-tr-sm' : 'bg-white border border-gray-100 rounded-tl-sm shadow-sm'}`}>
                    <Text className={`text-base ${isMe ? 'text-white' : 'text-urbis-text'}`}>
                      {msg.content}
                    </Text>
                  </View>
                  <Text className={`text-[10px] text-gray-400 mt-1 font-medium ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                    {timeString}
                  </Text>
                </View>
              );
            })
          )}
          <View className="h-4" /> {/* Bottom padding */}
        </ScrollView>

        {/* MESSAGE INPUT BOX */}
        <View className="flex-row items-center px-4 py-3 bg-white border-t border-gray-100">
          <TouchableOpacity className="p-2 mr-2">
            <Ionicons name="add-circle-outline" size={28} color="#9CA3AF" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 bg-urbis-surface rounded-full px-4 py-3 pt-3 text-urbis-text font-medium max-h-32"
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            className={`p-3 ml-2 rounded-full ${inputText.trim() ? 'bg-urbis-primary' : 'bg-gray-200'}`}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color={inputText.trim() ? "#FFFFFF" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}