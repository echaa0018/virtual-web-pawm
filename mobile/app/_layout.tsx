// app/_layout.tsx
// Root layout with providers, navigation, and API configuration

import { useEffect, useState, createContext, useContext } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

// Import global styles for NativeWind
import "../global.css";

// ============================================================================
// Types
// ============================================================================

export interface UserData {
  id: number;
  email: string;
  name: string | null;
  profileImage?: string | null;
  createdAt?: string;
}

export interface Simulation {
  id: number;
  title: string;
  description?: string;
  category?: string;
  subcategory?: string;
  image?: string;
  isNew?: boolean;
  createdAt?: string;
  config?: {
    hasSimulation?: boolean;
    [key: string]: any;
  };
}

export interface PendulumParams {
  length: number;
  mass: number;
  gravity: number;
  damping: number;
  angle: number;
  angularVelocity: number;
}

export interface SavedExperiment {
  id: number;  // Backend uses integer IDs
  name: string;
  data: PendulumParams;  // Backend uses 'data' not 'parameters'
  parameters: PendulumParams;  // We'll map 'data' to 'parameters' for consistency
  createdAt: string;
  simulationId?: number;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<UserData>) => void;
}

interface AppContextType {
  simulations: Simulation[];
  selectedSimulation: Simulation | null;
  isLoading: boolean;
  currentParams: PendulumParams;
  loadedParams: PendulumParams | null;
  savedExperiments: SavedExperiment[];
  isLoadingSavedExperiments: boolean;
  fetchSimulations: () => Promise<void>;
  selectSimulation: (simulation: Simulation | null) => void;
  setCurrentParams: (params: PendulumParams) => void;
  setLoadedParams: (params: PendulumParams | null) => void;
  saveExperiment: (name: string) => Promise<void>;
  fetchSavedExperiments: (simulationId: number) => Promise<void>;
  loadExperiment: (experiment: SavedExperiment) => void;
}

// ============================================================================
// API Configuration
// ============================================================================

// Use your computer's IP address for mobile testing
const API_BASE_URL = "http://192.168.18.22:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {}
    return config;
  },
  (error) => Promise.reject(error)
);

export { api };

// ============================================================================
// Auth Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await SecureStore.getItemAsync("token");
        const u = await SecureStore.getItemAsync("user");
        if (t && u) { setToken(t); setUser(JSON.parse(u)); }
      } catch (e) {}
      setIsLoading(false);
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    // Backend returns { token, name, email, profileImage } - construct user object
    const { token: t, name, email: userEmail, profileImage } = res.data;
    // Don't store profileImage in SecureStore (too large, causes warnings)
    const u: UserData = { id: 0, email: userEmail, name, profileImage };
    const userForStorage: UserData = { id: 0, email: userEmail, name }; // Without profileImage
    await SecureStore.setItemAsync("token", t);
    await SecureStore.setItemAsync("user", JSON.stringify(userForStorage));
    setToken(t); setUser(u);
  };

  const signUp = async (email: string, password: string, name?: string) => {
    // Register first
    await api.post("/auth/register", { email, password, name });
    // Then login to get token
    await signIn(email, password);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
    setToken(null); setUser(null);
  };

  const updateUser = (data: Partial<UserData>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      // Store without profileImage to avoid SecureStore size limit
      const { profileImage, ...userForStorage } = updated;
      SecureStore.setItemAsync("user", JSON.stringify(userForStorage));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// App Context
// ============================================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

function AppProviderInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSavedExperiments, setIsLoadingSavedExperiments] = useState(false);
  const defaultParams: PendulumParams = {
    length: 200,
    mass: 20,
    gravity: 9.8,
    damping: 0.999,
    angle: Math.PI / 4,
    angularVelocity: 0,
  };
  const [currentParams, setCurrentParams] = useState<PendulumParams>(defaultParams);
  const [loadedParams, setLoadedParams] = useState<PendulumParams | null>(null);
  const [savedExperiments, setSavedExperiments] = useState<SavedExperiment[]>([]);

  useEffect(() => { fetchSimulations(); }, []);

  const fetchSimulations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/simulations");
      setSimulations(res.data);
    } catch (e) {
      console.log("Using fallback simulations");
      setSimulations([
        { id: 1, title: "Simple Pendulum", description: "Explore simple harmonic motion with an interactive pendulum.", category: "Physics", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400", isNew: true, config: { hasSimulation: true } },
        { id: 2, title: "Wave Interference", description: "Visualize wave superposition and interference patterns.", category: "Physics", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400", config: { hasSimulation: false } },
        { id: 3, title: "Projectile Motion", description: "Study the trajectory of objects under gravity.", category: "Physics", image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=400", config: { hasSimulation: false } },
      ]);
    }
    setIsLoading(false);
  };

  const selectSimulation = (sim: Simulation | null) => {
    setSelectedSimulation(sim);
    setLoadedParams(null);
  };

  const saveExperiment = async (name: string) => {
    if (!user || !currentParams || !selectedSimulation) throw new Error("Missing data");
    await api.post("/save-progress", { 
      simulationId: selectedSimulation.id, 
      name, 
      data: currentParams  // Backend expects 'data' field
    });
  };

  const fetchSavedExperiments = async (simId: number) => {
    if (!user) return;
    setIsLoadingSavedExperiments(true);
    try {
      const res = await api.get(`/my-history/${simId}`);
      // Map 'data' field to 'parameters' for consistency with UI code
      // Ensure all required fields have default values to prevent crashes
      const experiments = res.data.map((exp: any) => {
        const rawData = exp.data || exp.parameters || {};
        const safeParams: PendulumParams = {
          length: rawData.length ?? defaultParams.length,
          mass: rawData.mass ?? defaultParams.mass,
          gravity: rawData.gravity ?? defaultParams.gravity,
          damping: rawData.damping ?? defaultParams.damping,
          angle: rawData.angle ?? defaultParams.angle,
          angularVelocity: rawData.angularVelocity ?? defaultParams.angularVelocity,
        };
        return {
          ...exp,
          parameters: safeParams,
          data: safeParams,
        };
      });
      setSavedExperiments(experiments);
    } catch (e) { setSavedExperiments([]); }
    setIsLoadingSavedExperiments(false);
  };

  const loadExperiment = (exp: SavedExperiment) => {
    // Use parameters (which has safe defaults) instead of raw data
    const safeParams: PendulumParams = {
      length: exp.parameters?.length ?? defaultParams.length,
      mass: exp.parameters?.mass ?? defaultParams.mass,
      gravity: exp.parameters?.gravity ?? defaultParams.gravity,
      damping: exp.parameters?.damping ?? defaultParams.damping,
      angle: exp.parameters?.angle ?? defaultParams.angle,
      angularVelocity: exp.parameters?.angularVelocity ?? defaultParams.angularVelocity,
    };
    setLoadedParams(safeParams);
  };

  return (
    <AppContext.Provider value={{ simulations, selectedSimulation, isLoading, isLoadingSavedExperiments, currentParams, loadedParams, savedExperiments, fetchSimulations, selectSimulation, setCurrentParams, setLoadedParams, saveExperiment, fetchSavedExperiments, loadExperiment }}>
      {children}
    </AppContext.Provider>
  );
}

// ============================================================================
// Root Layout
// ============================================================================

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProviderInner>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#fff" }, animation: "slide_from_right" }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="simulation/[id]" options={{ headerShown: true, headerTitle: "Simulation", headerBackTitle: "Back", headerTintColor: "#0d9488" }} />
            <Stack.Screen name="auth/login" options={{ presentation: "modal", headerShown: true, headerTitle: "Log In", headerTintColor: "#0d9488" }} />
            <Stack.Screen name="auth/register" options={{ presentation: "modal", headerShown: true, headerTitle: "Sign Up", headerTintColor: "#0d9488" }} />
            <Stack.Screen name="profile" options={{ presentation: "modal", headerShown: true, headerTitle: "My Profile", headerTintColor: "#0d9488" }} />
          </Stack>
        </AppProviderInner>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
