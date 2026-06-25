import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { signUp } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, name);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
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
            <Text className="text-stone-900 dark:text-stone-100 text-3xl font-extrabold">Create account</Text>
            <Text className="text-stone-400 dark:text-stone-555 text-sm mt-1">Start organizing your knowledge vault</Text>
          </View>

          {/* Form */}
          <View className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-850 shadow-sm gap-y-4">
            {error ? (
              <View className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3.5 rounded-xl flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-red-700 dark:text-red-400 text-xs font-semibold flex-1 ml-2">{error}</Text>
              </View>
            ) : null}

            {/* Name Field */}
            <View>
              <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2 px-1">Full Name</Text>
              <View className="flex-row items-center bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-850 rounded-2xl px-4 py-3">
                <Ionicons name="person-outline" size={20} color="#a8a29e" />
                <TextInput
                  placeholder="John Doe"
                  placeholderTextColor="#a8a29e"
                  value={name}
                  onChangeText={setName}
                  className="flex-1 text-stone-800 dark:text-stone-100 text-base ml-3"
                />
              </View>
            </View>

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

            {/* Confirm Password Field */}
            <View>
              <Text className="text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase tracking-wider mb-2 px-1">Confirm Password</Text>
              <View className="flex-row items-center bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-850 rounded-2xl px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="#a8a29e" />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#a8a29e"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  className="flex-1 text-stone-800 dark:text-stone-100 text-base ml-3"
                />
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className="bg-brand-500 py-4 rounded-2xl items-center justify-center shadow-lg shadow-brand-500/10 mt-2 flex-row"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
              ) : null}
              <Text className="text-white font-bold text-base">
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Switcher */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-stone-550 dark:text-stone-500 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-brand-500 font-bold text-sm">Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
