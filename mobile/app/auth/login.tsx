// app/auth/login.tsx
// Login screen - replicates frontend AuthModal login functionality

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react-native";

import { useAuth } from "./../_layout";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.response?.data?.error || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <View className="px-4 py-3 flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="flex-1 px-6 justify-center">
            {/* Logo */}
            <View className="items-center mb-8">
              <Image 
                source={require("../../assets/HoushouIcon.jpg")} 
                className="w-16 h-16 rounded-2xl mb-4"
                resizeMode="cover"
              />
              <Text className="text-2xl font-bold text-gray-900">Welcome Back</Text>
              <Text className="text-gray-500 mt-1">Sign in to continue to Virtual Lab</Text>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Email Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
                <View className={`flex-row items-center border rounded-lg px-4 py-3 ${errors.email ? "border-red-500" : "border-gray-300"}`}>
                  <Mail size={20} color="#9ca3af" />
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    className="flex-1 ml-3 text-gray-900"
                  />
                </View>
                {errors.email && <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>}
              </View>

              {/* Password Input */}
              <View className="mt-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
                <View className={`flex-row items-center border rounded-lg px-4 py-3 ${errors.password ? "border-red-500" : "border-gray-300"}`}>
                  <Lock size={20} color="#9ca3af" />
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    className="flex-1 ml-3 text-gray-900"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color="#9ca3af" />
                    ) : (
                      <Eye size={20} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password && <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity className="mt-2 self-end">
                <Text className="text-teal-600 text-sm">Forgot password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                className={`mt-6 py-4 rounded-lg ${isLoading ? "bg-teal-400" : "bg-teal-600"}`}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  {isLoading ? "Signing in..." : "Sign In"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-gray-400 text-sm">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center">
              <Text className="text-gray-600">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/auth/register")}>
                <Text className="text-teal-600 font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
