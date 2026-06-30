import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, ActivityIndicator, Image, Alert, Platform 
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';
import { updateProfile, uploadProfilePicture } from '../services/profile';
import { logout } from '../services/auth';

export default function ProfileScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { profile, isLoading } = useProfileStore();
  const { user } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Edit state
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [branch, setBranch] = useState(profile?.branch || '');
  const [semester, setSemester] = useState(profile?.semester || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // Reset local state when edit is canceled
  const cancelEdit = () => {
    setDisplayName(profile?.displayName || '');
    setCollege(profile?.college || '');
    setBranch(profile?.branch || '');
    setSemester(profile?.semester || '');
    setBio(profile?.bio || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profile || !user) return;
    setIsSaving(true);
    try {
      await updateProfile(user.uid, {
        displayName,
        college,
        branch,
        semester,
        bio
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const pickAndUploadImage = async () => {
    if (!profile || !user) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        const uri = result.assets[0].uri;
        
        // Upload to Cloudinary
        const secureUrl = await uploadProfilePicture(uri);
        
        // Update Firestore & Store
        await updateProfile(user.uid, { photoURL: secureUrl });
      }
    } catch (error) {
      console.error('Image pick/upload error', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() }
    ]);
  };

  const C = {
    bg: isDark ? '#1c1917' : '#ffffff', // bg-stone-900 : bg-white
    surface: isDark ? '#292524' : '#f5f5f4', // bg-stone-800 : bg-stone-100
    border: isDark ? '#44403c' : '#e7e5e4', // border-stone-700 : border-stone-200
    text: isDark ? '#f5f5f4' : '#1c1917', // text-stone-100 : text-stone-900
    subtext: isDark ? '#a8a29e' : '#78716c', // text-stone-400 : text-stone-500
    brand: '#8b5cf6', // violet-500
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.brand} />
      </View>
    );
  }

  if (!profile || !user) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Text style={{ color: C.subtext, fontSize: 16 }}>No profile found. Are you logged in?</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.bg }]} contentContainerStyle={styles.content}>
      
      {/* ── AVATAR ── */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickAndUploadImage} disabled={isUploading}>
          <View style={[styles.avatarContainer, { borderColor: C.brand }]}>
            {profile.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={50} color={C.subtext} />
            )}
            {isUploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="camera" size={14} color="#ffffff" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={[styles.nameTitle, { color: C.text }]}>{profile.displayName || 'Anonymous User'}</Text>
        <Text style={[styles.emailSub, { color: C.subtext }]}>{profile.email || 'No email associated'}</Text>
      </View>

      {/* ── INFO & EDIT FORM ── */}
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: C.text }]}>Personal Information</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={[styles.actionText, { color: C.brand }]}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={cancelEdit}>
                <Text style={[styles.actionText, { color: C.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                <Text style={[styles.actionText, { color: C.brand, fontWeight: '700' }]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: C.subtext }]}>Display Name</Text>
          {isEditing ? (
            <TextInput 
              style={[styles.input, { color: C.text, backgroundColor: C.bg, borderColor: C.border }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={C.subtext}
            />
          ) : (
            <Text style={[styles.value, { color: C.text }]}>{profile.displayName || '-'}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: C.subtext }]}>College / University</Text>
          {isEditing ? (
            <TextInput 
              style={[styles.input, { color: C.text, backgroundColor: C.bg, borderColor: C.border }]}
              value={college}
              onChangeText={setCollege}
              placeholder="e.g. MIT"
              placeholderTextColor={C.subtext}
            />
          ) : (
            <Text style={[styles.value, { color: C.text }]}>{profile.college || '-'}</Text>
          )}
        </View>

        <View style={styles.rowGroup}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: C.subtext }]}>Branch / Major</Text>
            {isEditing ? (
              <TextInput 
                style={[styles.input, { color: C.text, backgroundColor: C.bg, borderColor: C.border }]}
                value={branch}
                onChangeText={setBranch}
                placeholder="e.g. Computer Science"
                placeholderTextColor={C.subtext}
              />
            ) : (
              <Text style={[styles.value, { color: C.text }]}>{profile.branch || '-'}</Text>
            )}
          </View>
          
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: C.subtext }]}>Semester</Text>
            {isEditing ? (
              <TextInput 
                style={[styles.input, { color: C.text, backgroundColor: C.bg, borderColor: C.border }]}
                value={semester}
                onChangeText={setSemester}
                placeholder="e.g. 6th"
                placeholderTextColor={C.subtext}
              />
            ) : (
              <Text style={[styles.value, { color: C.text }]}>{profile.semester || '-'}</Text>
            )}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: C.subtext }]}>Bio</Text>
          {isEditing ? (
            <TextInput 
              style={[styles.input, styles.textArea, { color: C.text, backgroundColor: C.bg, borderColor: C.border }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Write a short bio..."
              placeholderTextColor={C.subtext}
              multiline
              numberOfLines={3}
            />
          ) : (
            <Text style={[styles.value, { color: C.text }]}>{profile.bio || '-'}</Text>
          )}
        </View>

      </View>

      {/* ── LOGOUT BUTTON ── */}
      {!isEditing && (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  
  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { 
    width: 100, height: 100, borderRadius: 50, borderWidth: 3, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' 
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarOverlay: { 
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', alignItems: 'center' 
  },
  editIconBadge: { 
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#8b5cf6', 
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#ffffff'
  },
  nameTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  emailSub: { fontSize: 14, fontWeight: '500' },

  // Card
  card: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  actionText: { fontSize: 15, fontWeight: '600' },

  // Form
  formGroup: { marginBottom: 16 },
  rowGroup: { flexDirection: 'row', gap: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, fontWeight: '500', minHeight: 24 },
  input: { 
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, 
    fontSize: 16, fontWeight: '500' 
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  // Logout
  logoutBtn: { 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    padding: 16, borderRadius: 14, gap: 8, backgroundColor: '#fef2f2' // tailwind red-50
  },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '700' }
});
