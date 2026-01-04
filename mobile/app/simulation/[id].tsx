// app/simulation/[id].tsx
// Simulation detail page with working Pendulum Simulator
// Replicates frontend/src/components/SimulationDetailPage.tsx + PendulumSimulator.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Svg, { Circle, Line, Defs, RadialGradient, Stop, G } from "react-native-svg";
import {
  ArrowLeft,
  Play,
  Pause,
  Save,
  History,
  X,
  Trash2,
  Clock,
  Loader,
} from "lucide-react-native";

import { useAuth, useApp, PendulumParams, SavedExperiment } from "./../_layout";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 32, 350);

// ============================================================================
// Pendulum Simulator Component (matches frontend PendulumSimulator.tsx physics)
// ============================================================================

interface PendulumSimulatorProps {
  width?: number;
  height?: number;
  params?: PendulumParams;
  onParamsChange?: (params: PendulumParams) => void;
}

function PendulumSimulator({ width = CANVAS_SIZE, height = CANVAS_SIZE, params: externalParams, onParamsChange }: PendulumSimulatorProps) {
  // Default parameters matching frontend exactly
  const defaultParams: PendulumParams = {
    length: 200,
    mass: 20,
    gravity: 9.8,
    damping: 0.999,
    angle: Math.PI / 4,
    angularVelocity: 0,
  };

  const [params, setParams] = useState<PendulumParams>(externalParams || defaultParams);
  const [isRunning, setIsRunning] = useState(false);
  const [showTrail, setShowTrail] = useState(true);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  // Animation state
  const angleRef = useRef(params.angle);
  const angularVelocityRef = useRef(params.angularVelocity);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Sync external params
  useEffect(() => {
    if (externalParams) {
      setParams(externalParams);
      angleRef.current = externalParams.angle;
      angularVelocityRef.current = externalParams.angularVelocity;
    }
  }, [externalParams]);

  // Calculate pendulum position
  const pivotX = width / 2;
  const pivotY = 50;
  const scale = 0.6;
  const scaledLength = params.length * scale;
  const bobX = pivotX + scaledLength * Math.sin(angleRef.current);
  const bobY = pivotY + scaledLength * Math.cos(angleRef.current);
  const bobRadius = Math.max(10, Math.min(25, params.mass / 2));

  // Physics simulation (same as frontend)
  const updatePhysics = useCallback(
    (deltaTime: number) => {
      const dt = Math.min(deltaTime, 0.033); // Cap dt to prevent instability
      const g = params.gravity;
      const L = params.length / 100; // Convert to meters
      const damping = params.damping;

      // Angular acceleration: α = -(g/L) * sin(θ)
      const angularAcceleration = (-g / L) * Math.sin(angleRef.current);

      // Update angular velocity and apply damping
      angularVelocityRef.current += angularAcceleration * dt;
      angularVelocityRef.current *= damping;

      // Update angle
      angleRef.current += angularVelocityRef.current * dt;

      // Update trail
      const newX = pivotX + scaledLength * Math.sin(angleRef.current);
      const newY = pivotY + scaledLength * Math.cos(angleRef.current);
      setTrail((prev) => {
        const newTrail = [...prev, { x: newX, y: newY }];
        return newTrail.slice(-100); // Keep last 100 points
      });
    },
    [params.gravity, params.length, params.damping, pivotX, pivotY, scaledLength]
  );

  // Animation loop
  useEffect(() => {
    if (!isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      updatePhysics(deltaTime);

      // Force re-render by updating state
      setParams((prev) => ({ ...prev }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, updatePhysics]);

  // Handle parameter changes
  const handleParamChange = (key: keyof PendulumParams, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    if (key === "angle") {
      angleRef.current = value;
    }
    if (key === "angularVelocity") {
      angularVelocityRef.current = value;
    }
    onParamsChange?.(newParams);
  };

  // Update current bob position
  const currentBobX = pivotX + scaledLength * Math.sin(angleRef.current);
  const currentBobY = pivotY + scaledLength * Math.cos(angleRef.current);

  return (
    <View className="bg-white rounded-xl">
      {/* SVG Canvas */}
      <View className="bg-gray-50 rounded-t-xl overflow-hidden" style={{ width, height }}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="bobGradient" cx="30%" cy="30%" r="70%">
              <Stop offset="0%" stopColor="#14b8a6" />
              <Stop offset="100%" stopColor="#0d9488" />
            </RadialGradient>
          </Defs>

          {/* Trail */}
          {showTrail &&
            trail.map((point, index) => (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={2}
                fill={`rgba(13, 148, 136, ${0.1 + (index / trail.length) * 0.3})`}
              />
            ))}

          {/* Pivot */}
          <Circle cx={pivotX} cy={pivotY} r={8} fill="#374151" />

          {/* Rod */}
          <Line
            x1={pivotX}
            y1={pivotY}
            x2={currentBobX}
            y2={currentBobY}
            stroke="#6b7280"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Bob with gradient */}
          <Circle cx={currentBobX} cy={currentBobY} r={bobRadius} fill="url(#bobGradient)" />

          {/* Bob highlight */}
          <Circle
            cx={currentBobX - bobRadius * 0.3}
            cy={currentBobY - bobRadius * 0.3}
            r={bobRadius * 0.2}
            fill="rgba(255,255,255,0.3)"
          />
        </Svg>
      </View>

      {/* Controls */}
      <View className="p-4">
        {/* Play/Pause */}
        <View className="flex-row justify-center mb-6">
          <TouchableOpacity
            onPress={() => setIsRunning(!isRunning)}
            className={`flex-row items-center gap-2 px-8 py-3 rounded-lg ${isRunning ? "bg-orange-500" : "bg-teal-600"}`}
          >
            {isRunning ? <Pause size={20} color="white" /> : <Play size={20} color="white" />}
            <Text className="text-white font-semibold">{isRunning ? "Pause" : "Start"}</Text>
          </TouchableOpacity>
        </View>

        {/* Parameter Sliders */}
        <View className="space-y-4">
          {/* Length */}
          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700 font-medium">Length (cm)</Text>
              <Text className="text-teal-600 font-semibold">{params.length.toFixed(0)}</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-teal-500 rounded-full"
                style={{ width: `${((params.length - 50) / 250) * 100}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <TouchableOpacity onPress={() => handleParamChange("length", Math.max(50, params.length - 10))}>
                <Text className="text-teal-600 font-bold text-lg">−</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleParamChange("length", Math.min(300, params.length + 10))}>
                <Text className="text-teal-600 font-bold text-lg">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mass */}
          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700 font-medium">Mass (kg)</Text>
              <Text className="text-teal-600 font-semibold">{params.mass.toFixed(1)}</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-teal-500 rounded-full"
                style={{ width: `${((params.mass - 5) / 45) * 100}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <TouchableOpacity onPress={() => handleParamChange("mass", Math.max(5, params.mass - 5))}>
                <Text className="text-teal-600 font-bold text-lg">−</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleParamChange("mass", Math.min(50, params.mass + 5))}>
                <Text className="text-teal-600 font-bold text-lg">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Gravity */}
          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700 font-medium">Gravity (m/s²)</Text>
              <Text className="text-teal-600 font-semibold">{params.gravity.toFixed(1)}</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-teal-500 rounded-full"
                style={{ width: `${((params.gravity - 1) / 19) * 100}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <TouchableOpacity onPress={() => handleParamChange("gravity", Math.max(1, params.gravity - 1))}>
                <Text className="text-teal-600 font-bold text-lg">−</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleParamChange("gravity", Math.min(20, params.gravity + 1))}>
                <Text className="text-teal-600 font-bold text-lg">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Initial Angle */}
          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700 font-medium">Initial Angle (°)</Text>
              <Text className="text-teal-600 font-semibold">{((params.angle * 180) / Math.PI).toFixed(0)}</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-teal-500 rounded-full"
                style={{ width: `${((params.angle + Math.PI / 2) / Math.PI) * 100}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <TouchableOpacity
                onPress={() => handleParamChange("angle", Math.max(-Math.PI / 2, params.angle - Math.PI / 18))}
              >
                <Text className="text-teal-600 font-bold text-lg">−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleParamChange("angle", Math.min(Math.PI / 2, params.angle + Math.PI / 18))}
              >
                <Text className="text-teal-600 font-bold text-lg">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Trail Toggle */}
        <TouchableOpacity
          onPress={() => setShowTrail(!showTrail)}
          className={`mt-4 py-2 px-4 rounded-lg ${showTrail ? "bg-teal-100" : "bg-gray-100"}`}
        >
          <Text className={`text-center font-medium ${showTrail ? "text-teal-700" : "text-gray-600"}`}>
            {showTrail ? "Hide Trail" : "Show Trail"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Save Experiment Modal (matches frontend SaveExperimentModal.tsx)
// ============================================================================

function SaveExperimentModal({
  visible,
  onClose,
  onSave,
  params,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  params: PendulumParams;
}) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-center items-center" onPress={onClose}>
        <Pressable className="bg-white rounded-xl w-[90%] max-w-md p-6" onPress={() => {}}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-gray-900">Save Experiment</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 mb-4">Save your current pendulum configuration for later use.</Text>

          <Text className="text-sm font-medium text-gray-700 mb-2">Experiment Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Heavy pendulum test"
            placeholderTextColor="#9ca3af"
            className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-900"
          />

          <View className="bg-gray-50 rounded-lg p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Current Parameters</Text>
            <View className="space-y-1">
              <Text className="text-sm text-gray-600">• Length: {params.length.toFixed(0)} cm</Text>
              <Text className="text-sm text-gray-600">• Mass: {params.mass.toFixed(1)} kg</Text>
              <Text className="text-sm text-gray-600">• Gravity: {params.gravity.toFixed(1)} m/s²</Text>
              <Text className="text-sm text-gray-600">
                • Initial Angle: {((params.angle * 180) / Math.PI).toFixed(0)}°
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onClose} className="flex-1 py-3 border border-gray-300 rounded-lg">
              <Text className="text-center text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className={`flex-1 py-3 rounded-lg ${name.trim() ? "bg-teal-600" : "bg-gray-300"}`}
              disabled={!name.trim()}
            >
              <Text className={`text-center font-medium ${name.trim() ? "text-white" : "text-gray-500"}`}>
                Save Experiment
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// Saved Experiments List
// ============================================================================

function SavedExperimentsList({
  experiments,
  onLoad,
  onDelete,
  isLoading,
}: {
  experiments: SavedExperiment[];
  onLoad: (exp: SavedExperiment) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <View className="p-8 items-center">
        <Loader size={32} color="#0d9488" />
        <Text className="text-gray-500 mt-4">Loading experiments...</Text>
      </View>
    );
  }

  if (experiments.length === 0) {
    return (
      <View className="p-8 items-center">
        <History size={48} color="#d1d5db" />
        <Text className="text-gray-500 mt-4 text-center">No saved experiments yet.</Text>
        <Text className="text-gray-400 text-sm text-center mt-1">
          Save your current pendulum parameters to see them here.
        </Text>
      </View>
    );
  }

  return (
    <View className="p-4">
      {experiments.map((exp) => (
        <View key={exp.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-base font-semibold text-gray-900">{exp.name}</Text>
              <View className="flex-row items-center mt-1">
                <Clock size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-500 ml-1">
                  {new Date(exp.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Delete Experiment", `Are you sure you want to delete "${exp.name}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => onDelete(exp.id) },
                ]);
              }}
              className="p-2"
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <View className="bg-gray-50 rounded p-2 mb-3">
            <Text className="text-xs text-gray-600">
              L: {exp.parameters.length}cm • M: {exp.parameters.mass}kg • G: {exp.parameters.gravity}m/s² • θ:{" "}
              {((exp.parameters.angle * 180) / Math.PI).toFixed(0)}°
            </Text>
          </View>

          <TouchableOpacity onPress={() => onLoad(exp)} className="bg-teal-600 py-2 rounded-lg">
            <Text className="text-white text-center font-medium">Load Experiment</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Simulation Detail Page (main component)
// ============================================================================

export default function SimulationDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const {
    selectedSimulation,
    currentParams,
    setCurrentParams,
    loadedParams,
    setLoadedParams,
    savedExperiments,
    fetchSavedExperiments,
    isLoadingSavedExperiments,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"simulation" | "saved">("simulation");
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  // Fetch saved experiments on mount if user is logged in
  useEffect(() => {
    if (user && selectedSimulation) {
      fetchSavedExperiments(selectedSimulation.id);
    }
  }, [user, selectedSimulation]);

  // Use loaded params if available, otherwise use current params
  const effectiveParams = loadedParams || currentParams;

  const handleSaveExperiment = async (name: string) => {
    if (!user || !selectedSimulation) {
      Alert.alert("Error", "Please log in to save experiments.");
      return;
    }

    try {
      await api.post("/save-progress", {
        name,
        simulationId: selectedSimulation.id,
        data: currentParams,  // Backend expects 'data' field
      });
      Alert.alert("Success", "Experiment saved successfully!");
      fetchSavedExperiments(selectedSimulation.id);
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to save experiment");
    }
  };

  const handleLoadExperiment = (exp: SavedExperiment) => {
    // Safely load parameters with default fallbacks
    const defaultParams: PendulumParams = {
      length: 200,
      mass: 20,
      gravity: 9.8,
      damping: 0.999,
      angle: Math.PI / 4,
      angularVelocity: 0,
    };
    
    const params = exp.parameters || exp.data || {};
    const safeParams: PendulumParams = {
      length: params.length ?? defaultParams.length,
      mass: params.mass ?? defaultParams.mass,
      gravity: params.gravity ?? defaultParams.gravity,
      damping: params.damping ?? defaultParams.damping,
      angle: params.angle ?? defaultParams.angle,
      angularVelocity: params.angularVelocity ?? defaultParams.angularVelocity,
    };
    
    setLoadedParams(safeParams);
    setActiveTab("simulation");
    Alert.alert("Loaded", `Experiment "${exp.name}" loaded successfully!`);
  };

  const handleDeleteExperiment = async (expId: number) => {
    try {
      await api.delete(`/experiments/${expId}`);
      Alert.alert("Deleted", "Experiment deleted successfully!");
      if (selectedSimulation) {
        fetchSavedExperiments(selectedSimulation.id);
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to delete experiment");
    }
  };

  const handleParamsChange = (params: PendulumParams) => {
    setCurrentParams(params);
    // Clear loaded params when user changes parameters manually
    if (loadedParams) {
      setLoadedParams(null);
    }
  };

  if (!selectedSimulation) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500 text-lg">Simulation not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2 bg-teal-600 rounded-lg">
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1 ml-2">
          <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
            {selectedSimulation.title}
          </Text>
          <Text className="text-xs text-gray-500">{selectedSimulation.category || "Physics"}</Text>
        </View>
        {user && (
          <TouchableOpacity
            onPress={() => setSaveModalVisible(true)}
            className="flex-row items-center gap-1 px-3 py-2 bg-teal-600 rounded-lg"
          >
            <Save size={16} color="white" />
            <Text className="text-white font-medium">Save</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab("simulation")}
          className={`flex-1 py-3 border-b-2 ${activeTab === "simulation" ? "border-teal-600" : "border-transparent"}`}
        >
          <Text className={`text-center font-medium ${activeTab === "simulation" ? "text-teal-600" : "text-gray-500"}`}>
            Simulation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("saved")}
          className={`flex-1 py-3 border-b-2 ${activeTab === "saved" ? "border-teal-600" : "border-transparent"}`}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Text className={`font-medium ${activeTab === "saved" ? "text-teal-600" : "text-gray-500"}`}>
              Saved ({savedExperiments.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView className="flex-1">
        {activeTab === "simulation" ? (
          <View className="p-4">
            <PendulumSimulator params={effectiveParams} onParamsChange={handleParamsChange} />

            {/* Description */}
            {selectedSimulation.description && (
              <View className="bg-white rounded-xl p-4 mt-4">
                <Text className="text-base font-semibold text-gray-900 mb-2">About this Simulation</Text>
                <Text className="text-gray-600 leading-6">{selectedSimulation.description}</Text>
              </View>
            )}

            {/* Login prompt for guests */}
            {!user && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
                <Text className="text-yellow-800 font-medium mb-2">Want to save your experiments?</Text>
                <Text className="text-yellow-700 text-sm mb-3">
                  Sign in to save and load your pendulum configurations.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/auth/login")}
                  className="bg-yellow-600 py-2 rounded-lg"
                >
                  <Text className="text-white text-center font-medium">Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <SavedExperimentsList
            experiments={savedExperiments}
            onLoad={handleLoadExperiment}
            onDelete={handleDeleteExperiment}
            isLoading={isLoadingSavedExperiments}
          />
        )}
      </ScrollView>

      {/* Save Modal */}
      <SaveExperimentModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        onSave={handleSaveExperiment}
        params={currentParams}
      />
    </SafeAreaView>
  );
}
