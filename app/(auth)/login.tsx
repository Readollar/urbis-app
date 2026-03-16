import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { supabase } from '../../utils/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Responsive logic
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  async function signInWithEmail() {
    setFeedback({ message: '', type: '' });

    if (!email || !password) {
      setFeedback({ message: 'Please enter both your email and password.', type: 'error' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      let friendlyError = error.message;
      if (friendlyError.includes('Invalid login credentials')) {
        friendlyError = 'Incorrect email or password. Please try again.';
      }
      setFeedback({ message: friendlyError, type: 'error' });
      setLoading(false);
    } else {
      setFeedback({ message: 'Welcome back! Redirecting...', type: 'success' });
      setTimeout(() => {
        router.replace('/(tabs)/explore'); 
      }, 500);
    }
  }

  return (
    <View className="flex-1 flex-row bg-white">
      
      {/* DESKTOP SPLIT: Left Branding Panel */}
      {isDesktop && (
        <View className="flex-1 bg-[#1E3A8A] justify-center items-center p-12">
          <View className="bg-white/10 p-6 rounded-[40px] mb-8 border border-white/20">
            <Ionicons name="home" size={80} color="#FFFFFF" />
          </View>
          <Text className="text-white text-5xl font-black mt-2 text-center tracking-tight">Urbis</Text>
          <Text className="text-blue-200 text-xl font-medium mt-6 text-center max-w-md leading-8">
            The smartest way to find, list, and manage premium properties across Nigeria.
          </Text>
        </View>
      )}

      {/* FORM PANEL (Mobile: Full Width | Desktop: Right Half) */}
      <View className="flex-1 justify-center items-center px-6 bg-white">
        
        {/* The max-w-md class ensures the form never gets too wide on big screens */}
        <View className="w-full max-w-md">
          
          {/* Mobile Logo (Only shows on phones so they still see the brand) */}
          {!isDesktop && (
            <View className="mb-8 flex-row items-center">
              <Ionicons name="home" size={32} color="#1E3A8A" />
              <Text className="text-3xl font-black text-[#1E3A8A] ml-2 tracking-tight">Urbis</Text>
            </View>
          )}

          <Text className="font-bold text-4xl text-urbis-text mb-2">Welcome back.</Text>
          <Text className="font-semibold text-lg text-urbis-muted mb-10">Sign in to your account.</Text>

          <View className="mb-4">
            <Text className="font-semibold text-urbis-text mb-2 ml-1">Email Address</Text>
            <TextInput
              className="bg-urbis-surface px-4 py-4 rounded-2xl font-semibold text-urbis-text border border-gray-100"
              placeholder="e.g. name@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="mb-8">
            <Text className="font-semibold text-urbis-text mb-2 ml-1">Password</Text>
            <TextInput
              className="bg-urbis-surface px-4 py-4 rounded-2xl font-semibold text-urbis-text border border-gray-100"
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {feedback.message !== '' && (
            <View className={`mb-6 p-4 rounded-xl border ${feedback.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-teal-50 border-teal-200'}`}>
              <Text className={`font-semibold text-center ${feedback.type === 'error' ? 'text-red-600' : 'text-urbis-primary'}`}>
                {feedback.message}
              </Text>
            </View>
          )}

          <TouchableOpacity 
            className="bg-urbis-primary py-4 rounded-full items-center mb-6 shadow-md shadow-blue-500/20"
            onPress={signInWithEmail}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white text-lg">Sign In</Text>}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-2">
            <Text className="text-gray-500 font-semibold text-lg">New to Urbis? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} disabled={loading}>
              <Text className="font-bold text-urbis-primary text-lg">Create an Account</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </View>
  );
}