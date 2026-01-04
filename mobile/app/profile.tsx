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
import {
  ArrowLeft,
  User,
  Mail,
  Edit2,
  Save,
  X,
  LogOut,
  Camera,
  Trash2,
  Clock,
  Beaker,
} from "lucide-react-native";

import { useAuth, useApp, api, SavedExperiment } from "./_layout";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [experiments, setExperiments] = useState<SavedExperiment[]>([]);
  const [loadingExperiments, setLoadingExperiments] = useState(true);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      fetchAllExperiments();
    }
  }, [user]);

  const fetchAllExperiments = async () => {
    try {
      setLoadingExperiments(true);
      // Fetch experiments for simulation ID 1 (Simple Pendulum)
      // Backend requires simulationId in the path
      const res = await api.get("/my-history/1");
      // Map 'data' field to 'parameters' for consistency
      const mapped = res.data.map((exp: any) => ({
        ...exp,
        parameters: exp.data || exp.parameters || {}
      }));
      setExperiments(mapped);
    } catch (error) {
      console.error("Error fetching experiments:", error);
    } finally {
      setLoadingExperiments(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.put("/user/profile", { name: editName.trim() });
      updateUser(res.data);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      console.error("Update error:", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExperiment = async (exp: SavedExperiment) => {
    Alert.alert("Delete Experiment", `Are you sure you want to delete "${exp.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/experiments/${exp.id}`);
            setExperiments((prev) => prev.filter((e) => e.id !== exp.id));
            Alert.alert("Deleted", "Experiment deleted successfully!");
          } catch (error: any) {
            Alert.alert("Error", error.response?.data?.error || "Failed to delete experiment");
          }
        },
      },
    ]);
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
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} className="w-24 h-24 rounded-full" />
            ) : (
              <View className="w-24 h-24 rounded-full bg-teal-100 items-center justify-center">
                <Text className="text-teal-700 text-3xl font-bold">{getInitials()}</Text>
              </View>
            )}
            {isEditing && (
              <TouchableOpacity className="absolute bottom-0 right-1/3 bg-teal-600 w-8 h-8 rounded-full items-center justify-center">
                <Camera size={16} color="white" />
              </TouchableOpacity>
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

        {/* Saved Experiments Section */}
        <View className="mx-4 mt-6 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            My Saved Experiments ({experiments.length})
          </Text>

          {loadingExperiments ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Text className="text-gray-500">Loading experiments...</Text>
            </View>
          ) : experiments.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Beaker size={48} color="#d1d5db" />
              <Text className="text-gray-500 mt-4 text-center">No saved experiments yet</Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                Run a simulation and save your experiments to see them here.
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {experiments.map((exp) => (
                <View key={exp.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-base font-medium text-gray-900">{exp.name}</Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {new Date(exp.createdAt).toLocaleDateString()} at{" "}
                        {new Date(exp.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteExperiment(exp)} className="p-2">
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View className="bg-gray-50 rounded-lg p-3 mt-3">
                    <Text className="text-xs font-medium text-gray-700 mb-1">Parameters</Text>
                    <Text className="text-xs text-gray-600">
                      Length: {exp.parameters.length}cm • Mass: {exp.parameters.mass}kg • Gravity:{" "}
                      {exp.parameters.gravity}m/s² • Angle:{" "}
                      {((exp.parameters.angle * 180) / Math.PI).toFixed(0)}°
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="mx-4 mb-8 mt-4 flex-row items-center justify-center gap-2 py-4 border border-red-200 rounded-xl bg-red-50"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
