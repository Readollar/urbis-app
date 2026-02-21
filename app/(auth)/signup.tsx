import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../utils/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  async function createAccount() {
    setFeedback({ message: '', type: '' });

    if (!fullName || !email || !password) {
      setFeedback({ message: 'Please fill out all required fields.', type: 'error' });
      return;
    }

    setLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password 
    });

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
          role: 'citizen', // Keeping the database enum value here for backend functionality
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
    <View className="flex-1 bg-white justify-center px-6">
      <TouchableOpacity onPress={() => router.back()} className="absolute top-16 left-6 z-10">
        <Ionicons name="arrow-back" size={28} color="#1A1A1A" />
      </TouchableOpacity>

      <Text className="font-bold text-4xl text-urbis-text mb-2 mt-12">Join Urbis.</Text>
      <Text className="font-semibold text-lg text-urbis-muted mb-10">Create your account to get started.</Text>

      <View className="mb-4">
        <Text className="font-semibold text-urbis-text mb-2 ml-1">Full Name</Text>
        <TextInput
          className="bg-urbis-surface px-4 py-4 rounded-2xl font-semibold text-urbis-text"
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
          className="bg-urbis-surface px-4 py-4 rounded-2xl font-semibold text-urbis-text"
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
          className="bg-urbis-surface px-4 py-4 rounded-2xl font-semibold text-urbis-text"
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
        className="bg-urbis-primary py-4 rounded-full items-center mb-4"
        onPress={createAccount}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white text-lg">Create Account</Text>}
      </TouchableOpacity>
    </View>
  );
}