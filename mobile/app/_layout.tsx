// app/_layout.tsx
// Root layout with providers, navigation, and Supabase configuration

import { useEffect, useState, createContext, useContext } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase, getProfile, getSimulations, getSavedExperiments, saveExperiment as supabaseSaveExperiment, Profile, Simulation as SupabaseSimulation, SimulationState, PendulumParams } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";

// Import global styles for NativeWind
import "../global.css";

// ============================================================================
// Types
// ============================================================================

export interface UserData {
  id: string;
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

export { PendulumParams };

export interface SavedExperiment {
  id: number;
  name: string;
  data: PendulumParams;
  parameters: PendulumParams;
  createdAt: string;
  simulationId?: number;
}

interface AuthContextType {
  user: UserData | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<UserData>) => void;
  refreshUser: () => Promise<void>;
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
// Auth Context (Supabase)
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      const profile = await getProfile(authUser.id);
      const userData: UserData = {
        id: authUser.id,
        email: authUser.email || '',
        name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || null,
        profileImage: profile?.profile_image,
        createdAt: profile?.created_at,
      };
      setUser(userData);
    } catch (e) {
      console.error("Failed to load user profile", e);
      // Still set basic user info even if profile fetch fails
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || null,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Session will be set by onAuthStateChange listener
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || email.split('@')[0] }
      }
    });
    if (error) throw error;
    // If email confirmation is disabled, user will be signed in automatically
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  const updateUser = (data: Partial<UserData>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await loadUserProfile(authUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// App Context (Supabase)
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

  useEffect(() => { fetchSimulationsFromSupabase(); }, []);

  const fetchSimulationsFromSupabase = async () => {
    setIsLoading(true);
    try {
      const data = await getSimulations();
      // Map Supabase snake_case to camelCase for UI
      const mapped: Simulation[] = data.map((sim) => ({
        id: sim.id,
        title: sim.title,
        description: sim.description || undefined,
        category: sim.category || undefined,
        subcategory: sim.subcategory || undefined,
        image: sim.image || undefined,
        isNew: sim.is_new,
        createdAt: sim.created_at,
        config: sim.config,
      }));
      setSimulations(mapped);
    } catch (e) {
      console.log("Using fallback simulations");
      setSimulations([
        { id: 1, title: "Simple Pendulum", description: "Explore simple harmonic motion with an interactive pendulum.", category: "Physics", image: "/simple-pendulum.jpg", isNew: true, config: { hasSimulation: true } },
        { id: 2, title: "Wave Interference", description: "Visualize wave superposition and interference patterns.", category: "Physics", image: "/wave-interference.jpg", config: { hasSimulation: false } },
        { id: 3, title: "Projectile Motion", description: "Study the trajectory of objects under gravity.", category: "Physics", image: "/projectile-motion.webp", config: { hasSimulation: false } },
      ]);
    }
    setIsLoading(false);
  };

  const selectSimulation = (sim: Simulation | null) => {
    setSelectedSimulation(sim);
    setLoadedParams(null);
  };

  const saveExperimentHandler = async (name: string) => {
    if (!user || !currentParams || !selectedSimulation) throw new Error("Missing data");
    await supabaseSaveExperiment(selectedSimulation.id, name, currentParams);
  };

  const fetchSavedExperimentsFromSupabase = async (simId: number) => {
    if (!user) return;
    setIsLoadingSavedExperiments(true);
    try {
      const data = await getSavedExperiments(simId);
      // Map Supabase data to SavedExperiment format
      const experiments: SavedExperiment[] = data.map((exp) => {
        const rawData = exp.data || {};
        const safeParams: PendulumParams = {
          length: rawData.length ?? defaultParams.length,
          mass: rawData.mass ?? defaultParams.mass,
          gravity: rawData.gravity ?? defaultParams.gravity,
          damping: rawData.damping ?? defaultParams.damping,
          angle: rawData.angle ?? defaultParams.angle,
          angularVelocity: rawData.angularVelocity ?? defaultParams.angularVelocity,
        };
        return {
          id: exp.id,
          name: exp.name,
          data: safeParams,
          parameters: safeParams,
          createdAt: exp.created_at,
          simulationId: exp.simulation_id,
        };
      });
      setSavedExperiments(experiments);
    } catch (e) { 
      console.error("Failed to fetch saved experiments:", e);
      setSavedExperiments([]); 
    }
    setIsLoadingSavedExperiments(false);
  };

  const loadExperiment = (exp: SavedExperiment) => {
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
    <AppContext.Provider value={{ 
      simulations, 
      selectedSimulation, 
      isLoading, 
      isLoadingSavedExperiments, 
      currentParams, 
      loadedParams, 
      savedExperiments, 
      fetchSimulations: fetchSimulationsFromSupabase, 
      selectSimulation, 
      setCurrentParams, 
      setLoadedParams, 
      saveExperiment: saveExperimentHandler, 
      fetchSavedExperiments: fetchSavedExperimentsFromSupabase, 
      loadExperiment 
    }}>
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
            <Stack.Screen name="simulation/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ presentation: "modal", headerShown: true, headerTitle: "Log In", headerTintColor: "#0d9488" }} />
            <Stack.Screen name="auth/register" options={{ presentation: "modal", headerShown: true, headerTitle: "Sign Up", headerTintColor: "#0d9488" }} />
            <Stack.Screen name="profile" options={{ presentation: "modal", headerShown: true, headerTitle: "My Profile", headerTintColor: "#0d9488" }} />
          </Stack>
        </AppProviderInner>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
