import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../utils/supabase';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [feedback, setFeedback] = useState({ message: '', type: '' });

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
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="font-bold text-4xl text-urbis-text mb-2">Welcome to Urbis.</Text>
      <Text className="font-semibold text-lg text-urbis-muted mb-10">Sign in to your account.</Text>

      <View className="mb-4">
        <Text className="font-semibold text-urbis-text mb-2 ml-1">Email Address</Text>
        <TextInput
          className="bg-urbis-surface px-4 py-4 rounded-2xl font-semibold text-urbis-text"
          placeholder="e.g. name@email.com"
          placeholderTextColor="#9CA3AF" // Standard gray-400 for placeholders
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View className="mb-8">
        <Text className="font-semibold text-urbis-text mb-2 ml-1">Password</Text>
        <TextInput
          className="bg-urbis-surface px-4 py-4 rounded-2xl font-semibold text-urbis-text"
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
        className="bg-urbis-primary py-4 rounded-full items-center mb-4"
        onPress={signInWithEmail}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white text-lg">Sign In</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/signup')} disabled={loading}>
        <Text className="font-bold text-urbis-primary text-center text-lg mt-2">Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
}