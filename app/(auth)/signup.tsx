import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, useWindowDimensions, Platform, ScrollView } from 'react-native';
import { supabase } from '../../utils/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Responsive logic
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  async function createAccount() {
    setFeedback({ message: '', type: '' });

    if (!fullName || !email || !password) {
      setFeedback({ message: 'Please fill out all required fields.', type: 'error' });
      return;
    }

    setLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setFeedback({ message: authError.message, type: 'error' });
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          role: 'citizen', 
          is_verified: false,
        });

      if (profileError) {
        setFeedback({ message: 'Auth succeeded, but profile creation failed.', type: 'error' });
      } else {
        if (authData.session === null) {
          setFeedback({ message: 'Success! Please check your email to confirm your account.', type: 'success' });
        } else {
          setFeedback({ message: 'Account created successfully! Redirecting...', type: 'success' });
          setTimeout(() => {
            router.replace('/(tabs)/explore');
          }, 1500); 
        }
      }
    }
    setLoading(false);
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
            Join thousands of users discovering verified homes and managing properties seamlessly.
          </Text>
        </View>
      )}

      {/* FORM PANEL (Mobile: Full Width | Desktop: Right Half) */}
      <View className="flex-1 justify-center items-center bg-white px-6">
        
        {/* The max-w-md class perfectly centers and constrains the form */}
        <View className="w-full max-w-md py-12">
          
          <TouchableOpacity onPress={() => router.back()} className="mb-8 self-start p-2 -ml-2 bg-gray-50 rounded-full">
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          <Text className="font-bold text-4xl text-urbis-text mb-2">Join Urbis.</Text>
          <Text className="font-semibold text-lg text-urbis-muted mb-10">Create your account to get started.</Text>

          <View className="mb-4">
            <Text className="font-semibold text-urbis-text mb-2 ml-1">Full Name</Text>
            <TextInput
              className="bg-urbis-surface px-4 py-4 rounded-2xl font-semibold text-urbis-text border border-gray-100"
              placeholder="Enter your legal full name"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

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

          <View className="mb-6">
            <Text className="font-semibold text-urbis-text mb-2 ml-1">Password</Text>
            <TextInput
              className="bg-urbis-surface px-4 py-4 rounded-2xl font-semibold text-urbis-text border border-gray-100"
              placeholder="Create a strong password"
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
            className="bg-urbis-primary py-4 rounded-full items-center mb-4 shadow-md shadow-blue-500/20 mt-2"
            onPress={createAccount}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white text-lg">Create Account</Text>}
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}