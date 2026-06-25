import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { login } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-stone-50 dark:bg-stone-950"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-3xl bg-brand-500 items-center justify-center shadow-lg shadow-brand-500/20 mb-4">
              <Text className="text-white text-3xl font-black">B</Text>
            </View>
            <Text className="text-stone-900 dark:text-stone-100 text-3xl font-extrabold">Welcome back</Text>
            <Text className="text-stone-400 dark:text-stone-500 text-sm mt-1">Log in to access your vault</Text>
          </View>

          {/* Form */}
          <View className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-850 shadow-sm gap-y-4">
            {error ? (
              <View className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3.5 rounded-xl flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-red-700 dark:text-red-400 text-xs font-semibold flex-1 ml-2">{error}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View>
              <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2 px-1">Email Address</Text>
              <View className="flex-row items-center bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-850 rounded-2xl px-4 py-3">
                <Ionicons name="mail-outline" size={20} color="#a8a29e" />
                <TextInput
                  placeholder="name@domain.com"
                  placeholderTextColor="#a8a29e"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  className="flex-1 text-stone-800 dark:text-stone-100 text-base ml-3"
                />
              </View>
            </View>

            {/* Password Field */}
            <View>
              <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2 px-1">Password</Text>
              <View className="flex-row items-center bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-850 rounded-2xl px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="#a8a29e" />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#a8a29e"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  className="flex-1 text-stone-800 dark:text-stone-100 text-base ml-3"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#a8a29e" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-brand-500 py-4 rounded-2xl items-center justify-center shadow-lg shadow-brand-500/10 mt-2 flex-row"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
              ) : null}
              <Text className="text-white font-bold text-base">
                {loading ? 'Logging in...' : 'Log In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Signup Switcher */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-stone-550 dark:text-stone-500 text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text className="text-brand-500 font-bold text-sm">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
