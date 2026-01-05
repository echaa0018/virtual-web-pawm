// app/profile.tsx
// User profile screen - replicates frontend UserProfile.tsx

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  User,
  Mail,
  Edit2,
  Save,
  X,
  LogOut,
  Camera,
  Clock,
} from "lucide-react-native";

import { useAuth } from "./_layout";
import { updateProfile } from "../lib/supabase";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  const handlePickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to change your profile picture.");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Compress to avoid SecureStore size limits
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfileImage(base64Image);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert("Remove Photo", "Are you sure you want to remove your profile picture?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setProfileImage(null),
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User ID not found");
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile = await updateProfile(user.id, { 
        name: editName.trim(),
        profile_image: profileImage,
      });
      
      updateUser({ 
        name: updatedProfile.name,
        profileImage: updatedProfile.profile_image
      });
      
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      console.error("Update error:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          signOut();
          router.replace("/");
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500 text-lg mb-4">Please sign in to view your profile</Text>
        <TouchableOpacity onPress={() => router.push("/auth/login")} className="px-6 py-3 bg-teal-600 rounded-lg">
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const getInitials = () => {
    const displayName = user.name || user.email.split("@")[0];
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-2">My Profile</Text>
        <View className="flex-1" />
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} className="p-2">
            <Edit2 size={20} color="#0d9488" />
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                setIsEditing(false);
                setEditName(user.name || "");
                setProfileImage(user.profileImage || null);
              }}
              className="p-2"
            >
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveProfile} disabled={isSaving} className="p-2">
              <Save size={20} color="#0d9488" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView className="flex-1">
        {/* Profile Card */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-6 shadow-sm">
          {/* Avatar */}
          <View className="items-center mb-6">
            <View className="relative">
              {profileImage ? (
                <Image source={{ uri: profileImage }} className="w-32 h-32 rounded-full" />
              ) : (
                <View className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 items-center justify-center">
                  <Text className="text-white text-4xl font-bold">{getInitials()}</Text>
                </View>
              )}
              
              {/* Camera button - always visible in edit mode */}
              {isEditing && (
                <TouchableOpacity 
                  onPress={handlePickImage}
                  className="absolute bottom-0 right-0 bg-teal-600 w-10 h-10 rounded-full items-center justify-center shadow-lg"
                >
                  <Camera size={20} color="white" />
                </TouchableOpacity>
              )}
              
              {/* Remove photo button - visible in edit mode when there's an image */}
              {isEditing && profileImage && (
                <TouchableOpacity 
                  onPress={handleRemoveImage}
                  className="absolute top-0 right-0 bg-red-500 w-7 h-7 rounded-full items-center justify-center shadow-lg"
                >
                  <X size={14} color="white" />
                </TouchableOpacity>
              )}
            </View>
            
            {isEditing && (
              <Text className="text-sm text-gray-500 mt-3">Tap camera to change photo</Text>
            )}
          </View>

          {/* User Info */}
          <View className="space-y-4">
            {/* Name */}
            <View>
              <Text className="text-xs text-gray-500 uppercase tracking-wider mb-1">Full Name</Text>
              {isEditing ? (
                <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
                  <User size={18} color="#9ca3af" />
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Your name"
                    placeholderTextColor="#9ca3af"
                    className="flex-1 ml-3 text-gray-900"
                  />
                </View>
              ) : (
                <Text className="text-lg font-medium text-gray-900">
                  {user.name || user.email.split("@")[0]}
                </Text>
              )}
            </View>

            {/* Email */}
            <View className="mt-4">
              <Text className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email Address</Text>
              <View className="flex-row items-center">
                <Mail size={16} color="#9ca3af" />
                <Text className="text-gray-600 ml-2">{user.email}</Text>
              </View>
              {isEditing && (
                <Text className="text-xs text-gray-400 mt-1">Email cannot be changed</Text>
              )}
            </View>

            {/* Member Since */}
            <View className="mt-4">
              <Text className="text-xs text-gray-500 uppercase tracking-wider mb-1">Member Since</Text>
              <View className="flex-row items-center">
                <Clock size={16} color="#9ca3af" />
                <Text className="text-gray-600 ml-2">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently joined"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="mx-4 mb-8 mt-6 flex-row items-center justify-center gap-2 py-4 border border-red-200 rounded-xl bg-red-50"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}