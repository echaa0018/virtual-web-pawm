// app/index.tsx
// Home screen - replicates frontend/src/components/Homepage.tsx

import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Grid3x3,
  List,
  Plus,
  Minus,
  Microscope,
} from "lucide-react-native";

import { useAuth, useApp, Simulation } from "./_layout";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================================================
// Image With Fallback Component
// ============================================================================

function ImageWithFallback({ src, alt, style, className }: { src?: string; alt: string; style?: any; className?: string }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <View style={style} className={`bg-gray-200 items-center justify-center ${className}`}>
        <Microscope size={48} color="#9ca3af" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: src }}
      style={style}
      className={className}
      onError={() => setError(true)}
      resizeMode="cover"
    />
  );
}

// ============================================================================
// Header Component (matches frontend Header.tsx)
// ============================================================================

function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getDisplayInfo = () => {
    if (!user) return { displayName: "", initials: "" };
    const displayName = user.name || user.email.split("@")[0];
    const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return { displayName, initials };
  };

  const { displayName, initials } = getDisplayInfo();

  return (
    <View className="bg-white border-b border-gray-200 px-4 py-4">
      <View className="flex-row items-center justify-between">
        {/* Logo and Brand */}
        <TouchableOpacity className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-lg bg-teal-600 items-center justify-center">
            <Microscope size={24} color="#ffffff" />
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-900">Houshou</Text>
            <Text className="text-xs text-teal-600 font-medium">Interactive Physics Simulations</Text>
          </View>
        </TouchableOpacity>

        {/* Right Side */}
        {user ? (
          <TouchableOpacity onPress={() => setIsProfileOpen(true)} className="flex-row items-center gap-2">
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} className="w-12 h-12 rounded-full" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-teal-100 items-center justify-center border-2 border-white">
                <Text className="text-teal-700 font-bold text-lg">{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => router.push("/auth/login")} className="px-3 py-2">
              <Text className="text-gray-700 font-medium">Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/auth/register")} className="px-4 py-2 bg-teal-600 rounded-lg">
              <Text className="text-white font-medium">Sign Up Free</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Profile Modal */}
      <Modal visible={isProfileOpen} transparent animationType="fade" onRequestClose={() => setIsProfileOpen(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setIsProfileOpen(false)}>
          <View className="absolute right-4 top-20 w-56 bg-white rounded-lg shadow-lg overflow-hidden">
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-sm font-medium text-gray-900">{displayName}</Text>
              <Text className="text-xs text-gray-500">{user?.email}</Text>
            </View>
            <TouchableOpacity onPress={() => { setIsProfileOpen(false); router.push("/profile"); }} className="flex-row items-center gap-2 px-4 py-3">
              <User size={16} color="#374151" />
              <Text className="text-sm text-gray-700">My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center gap-2 px-4 py-3">
              <Settings size={16} color="#374151" />
              <Text className="text-sm text-gray-700">Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center gap-2 px-4 py-3 border-b border-gray-100">
              <HelpCircle size={16} color="#374151" />
              <Text className="text-sm text-gray-700">Help & Support</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsProfileOpen(false); signOut(); }} className="flex-row items-center gap-2 px-4 py-3">
              <LogOut size={16} color="#dc2626" />
              <Text className="text-sm text-red-600">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================================================
// Hero Banner (matches frontend HeroBanner.tsx)
// ============================================================================

function HeroBanner() {
  return (
    <View className="relative h-48 overflow-hidden">
      <ImageWithFallback
        src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=300&fit=crop"
        alt="Hero background"
        style={{ position: "absolute", width: "100%", height: "100%" }}
        className="opacity-60"
      />
      <View className="absolute inset-0 bg-gradient-to-b from-blue-400/80 to-blue-600/80" />
      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-4xl font-bold mb-2">Virtual Lab</Text>
        <Text className="text-white text-lg opacity-90">Interactive Science Simulations</Text>
      </View>
    </View>
  );
}

// ============================================================================
// Filter Sidebar (matches frontend FilterSidebar.tsx)
// ============================================================================

function FilterDrawer({
  visible,
  onClose,
  selectedCategories,
  onCategoriesChange,
}: {
  visible: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const subjects = ["Physics", "Mathematics", "Chemistry"];

  const toggleCategory = (cat: string) => {
    onCategoriesChange(
      selectedCategories.includes(cat)
        ? selectedCategories.filter((c) => c !== cat)
        : [...selectedCategories, cat]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <View className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">Filters</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4">
            <TouchableOpacity onPress={() => setExpanded(!expanded)} className="flex-row items-center justify-between mb-4">
              <Text className="text-sm tracking-wider text-gray-800">SUBJECT ({selectedCategories.length})</Text>
              {expanded ? <Minus size={16} color="#374151" /> : <Plus size={16} color="#374151" />}
            </TouchableOpacity>
            {expanded && subjects.map((subject) => (
              <TouchableOpacity key={subject} onPress={() => toggleCategory(subject)} className="flex-row items-center gap-3 mb-3">
                <View className={`w-5 h-5 rounded border ${selectedCategories.includes(subject) ? "bg-teal-600 border-teal-600" : "border-gray-300"} items-center justify-center`}>
                  {selectedCategories.includes(subject) && <Text className="text-white text-xs">✓</Text>}
                </View>
                <Text className="text-gray-700">{subject}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View className="p-4 border-t border-gray-200">
            <TouchableOpacity onPress={onClose} className="bg-teal-600 py-3 rounded-lg items-center">
              <Text className="text-white font-semibold">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// Simulation Card (matches frontend SimulationCard.tsx)
// ============================================================================

function SimulationCard({ simulation, viewMode, onPress }: { simulation: Simulation; viewMode: "grid" | "list"; onPress: () => void }) {
  const isDisabled = !simulation.config?.hasSimulation;

  if (viewMode === "list") {
    return (
      <TouchableOpacity
        onPress={isDisabled ? undefined : onPress}
        activeOpacity={isDisabled ? 1 : 0.7}
        className={`bg-white border border-gray-200 rounded-lg overflow-hidden flex-row mb-3 ${isDisabled ? "opacity-50" : ""}`}
      >
        <View className="relative w-32 h-24 bg-gray-100">
          <ImageWithFallback src={simulation.image} alt={simulation.title} style={{ width: "100%", height: "100%" }} />
          {simulation.isNew && !isDisabled && (
            <View className="absolute top-2 right-2 bg-red-600 px-2 py-0.5">
              <Text className="text-white text-xs font-bold">NEW</Text>
            </View>
          )}
          {isDisabled && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <View className="bg-gray-800 px-2 py-1 rounded-full">
                <Text className="text-white text-xs">Coming Soon</Text>
              </View>
            </View>
          )}
        </View>
        <View className="flex-1 p-3 justify-center">
          <Text className={`text-base font-medium ${isDisabled ? "text-gray-400" : "text-gray-900"}`}>{simulation.title}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      activeOpacity={isDisabled ? 1 : 0.7}
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${isDisabled ? "opacity-50" : ""}`}
      style={{ width: (SCREEN_WIDTH - 48) / 2 }}
    >
      <View className="relative aspect-[4/3] bg-gray-100">
        <ImageWithFallback src={simulation.image} alt={simulation.title} style={{ width: "100%", height: "100%" }} />
        {simulation.isNew && !isDisabled && (
          <View className="absolute top-2 right-2 bg-red-600 px-2 py-0.5">
            <Text className="text-white text-xs font-bold">NEW</Text>
          </View>
        )}
        {isDisabled && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <View className="bg-gray-800 px-2 py-1 rounded-full">
              <Text className="text-white text-xs">Coming Soon</Text>
            </View>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className={`text-sm font-medium ${isDisabled ? "text-gray-400" : "text-gray-900"}`} numberOfLines={2}>{simulation.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// Results Grid (matches frontend ResultsGrid.tsx)
// ============================================================================

function ResultsGrid({
  simulations,
  selectedCategories,
}: {
  simulations: Simulation[];
  selectedCategories: string[];
}) {
  const router = useRouter();
  const { selectSimulation } = useApp();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alphabetical">("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<string[]>(selectedCategories);

  // Filter
  const filtered = simulations.filter((sim) => {
    const catMatch = localCategories.length === 0 || localCategories.includes(sim.category || "Physics");
    const searchMatch = sim.title.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (sortBy === "newest") return dateB - dateA;
    if (sortBy === "oldest") return dateA - dateB;
    return a.title.localeCompare(b.title);
  });

  const handleSimClick = (sim: Simulation) => {
    selectSimulation(sim);
    router.push(`/simulation/${sim.id}`);
  };

  return (
    <View className="flex-1 p-4">
      {/* Search Bar */}
      <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-2 mb-4">
        <Search size={18} color="#9ca3af" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search simulations..."
          placeholderTextColor="#9ca3af"
          className="flex-1 ml-3 text-gray-900"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <X size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Controls Row */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => setFilterOpen(true)} className="flex-row items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
          <Menu size={16} color="#374151" />
          <Text className="text-gray-700 text-sm">Filters</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => setViewMode("grid")} className={`p-2 rounded ${viewMode === "grid" ? "bg-teal-100" : ""}`}>
            <Grid3x3 size={18} color={viewMode === "grid" ? "#0d9488" : "#6b7280"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode("list")} className={`p-2 rounded ${viewMode === "list" ? "bg-teal-100" : ""}`}>
            <List size={18} color={viewMode === "list" ? "#0d9488" : "#6b7280"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Count */}
      <Text className="text-gray-600 text-sm mb-4">{sorted.length} simulation{sorted.length !== 1 ? "s" : ""} found</Text>

      {/* Grid / List */}
      {viewMode === "grid" ? (
        <View className="flex-row flex-wrap gap-4">
          {sorted.map((sim) => (
            <SimulationCard key={sim.id} simulation={sim} viewMode="grid" onPress={() => handleSimClick(sim)} />
          ))}
        </View>
      ) : (
        <View>
          {sorted.map((sim) => (
            <SimulationCard key={sim.id} simulation={sim} viewMode="list" onPress={() => handleSimClick(sim)} />
          ))}
        </View>
      )}

      {/* Filter Drawer */}
      <FilterDrawer visible={filterOpen} onClose={() => setFilterOpen(false)} selectedCategories={localCategories} onCategoriesChange={setLocalCategories} />
    </View>
  );
}

// ============================================================================
// Footer (matches frontend Footer.tsx)
// ============================================================================

function Footer() {
  const year = new Date().getFullYear();
  return (
    <View className="bg-gray-800 px-4 py-8">
      <Text className="text-white text-lg font-semibold mb-2">Virtual Lab</Text>
      <Text className="text-gray-400 text-sm mb-4">
        Interactive Physics, Mathematics, and Chemistry simulations for hands-on learning.
      </Text>
      <Text className="text-gray-500 text-xs">© {year} PhET Interactive Simulations. All rights reserved.</Text>
    </View>
  );
}

// ============================================================================
// Home Screen
// ============================================================================

export default function HomeScreen() {
  const { simulations, isLoading, fetchSimulations } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSimulations();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Header />
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
      >
        <HeroBanner />
        <ResultsGrid simulations={simulations} selectedCategories={[]} />
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}
