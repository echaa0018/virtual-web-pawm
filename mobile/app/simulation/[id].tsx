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

import { useAuth, useApp, PendulumParams, SavedExperiment, GraphPlotterParams, PHMeterParams, ProjectileMotionParams } from "./../_layout";
import { saveExperiment, deleteExperiment } from "../../lib/supabase";

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

  // Merge external params with defaults to ensure all fields exist
  const [params, setParams] = useState<PendulumParams>({ ...defaultParams, ...externalParams });
  const [isRunning, setIsRunning] = useState(false);
  const [showTrail, setShowTrail] = useState(true);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  // Local input states (only commit on blur/submit)
  const [lengthInput, setLengthInput] = useState(String(Math.round(params.length)));
  const [massInput, setMassInput] = useState(String(params.mass.toFixed(1)));
  const [gravityInput, setGravityInput] = useState(String(params.gravity.toFixed(1)));
  const [angleInput, setAngleInput] = useState(String(Math.round((params.angle * 180) / Math.PI)));

  // Animation state
  const angleRef = useRef(params.angle);
  const angularVelocityRef = useRef(params.angularVelocity);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Sync external params
  useEffect(() => {
    if (externalParams) {
      const mergedParams = { ...defaultParams, ...externalParams };
      if (JSON.stringify(mergedParams) !== JSON.stringify(params)) {
        setParams(mergedParams);
        angleRef.current = mergedParams.angle;
        angularVelocityRef.current = mergedParams.angularVelocity;
        // Sync input states
        setLengthInput(String(Math.round(mergedParams.length)));
        setMassInput(String(mergedParams.mass.toFixed(1)));
        setGravityInput(String(mergedParams.gravity.toFixed(1)));
        setAngleInput(String(Math.round((mergedParams.angle * 180) / Math.PI)));
      }
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
      // Use fixed timestep for stability
      const fixedDt = 0.016;
      const steps = Math.min(Math.floor(deltaTime / fixedDt) + 1, 4);
      
      const g = params.gravity;
      const L = params.length / 100; // Convert to meters

      for (let i = 0; i < steps; i++) {
        // Angular acceleration: α = -(g/L) * sin(θ)
        const angularAcceleration = (-g / L) * Math.sin(angleRef.current);

        // Update angular velocity
        angularVelocityRef.current += angularAcceleration * fixedDt;
        
        // Apply very light damping per step
        angularVelocityRef.current *= 0.9995;

        // Update angle
        angleRef.current += angularVelocityRef.current * fixedDt;
      }
    },
    [params.gravity, params.length]
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

      // Update trail
      const newX = pivotX + scaledLength * Math.sin(angleRef.current);
      const newY = pivotY + scaledLength * Math.cos(angleRef.current);
      setTrail((prev) => {
        const newTrail = [...prev, { x: newX, y: newY }];
        return newTrail.slice(-50); // Keep last 50 points (reduced for performance)
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, updatePhysics, pivotX, pivotY, scaledLength]);

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

        {/* Parameter Inputs */}
        <View className="space-y-4">
          {/* Length */}
          <View>
            <Text className="text-gray-700 font-medium mb-2">Length (cm)</Text>
            <TextInput
              value={lengthInput}
              onChangeText={setLengthInput}
              onEndEditing={() => {
                const val = parseInt(lengthInput) || 200;
                handleParamChange("length", Math.max(50, Math.min(300, val)));
                setLengthInput(String(Math.max(50, Math.min(300, val))));
              }}
              onSubmitEditing={() => {
                const val = parseInt(lengthInput) || 200;
                handleParamChange("length", Math.max(50, Math.min(300, val)));
                setLengthInput(String(Math.max(50, Math.min(300, val))));
              }}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              editable={!isRunning}
            />
            <Text className="text-xs text-gray-500 mt-1">Range: 50 - 300 cm</Text>
          </View>

          {/* Mass */}
          <View>
            <Text className="text-gray-700 font-medium mb-2">Mass (kg)</Text>
            <TextInput
              value={massInput}
              onChangeText={setMassInput}
              onEndEditing={() => {
                const val = parseFloat(massInput) || 20;
                handleParamChange("mass", Math.max(5, Math.min(50, val)));
                setMassInput(String(Math.max(5, Math.min(50, val)).toFixed(1)));
              }}
              onSubmitEditing={() => {
                const val = parseFloat(massInput) || 20;
                handleParamChange("mass", Math.max(5, Math.min(50, val)));
                setMassInput(String(Math.max(5, Math.min(50, val)).toFixed(1)));
              }}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              editable={!isRunning}
            />
            <Text className="text-xs text-gray-500 mt-1">Range: 5 - 50 kg</Text>
          </View>

          {/* Gravity */}
          <View>
            <Text className="text-gray-700 font-medium mb-2">Gravity (m/s²)</Text>
            <TextInput
              value={gravityInput}
              onChangeText={setGravityInput}
              onEndEditing={() => {
                const val = parseFloat(gravityInput) || 9.8;
                handleParamChange("gravity", Math.max(1, Math.min(25, val)));
                setGravityInput(String(Math.max(1, Math.min(25, val)).toFixed(1)));
              }}
              onSubmitEditing={() => {
                const val = parseFloat(gravityInput) || 9.8;
                handleParamChange("gravity", Math.max(1, Math.min(25, val)));
                setGravityInput(String(Math.max(1, Math.min(25, val)).toFixed(1)));
              }}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              editable={!isRunning}
            />
            <Text className="text-xs text-gray-500 mt-1">Moon: 1.6 | Earth: 9.8 | Jupiter: 24.8</Text>
          </View>

          {/* Initial Angle */}
          <View>
            <Text className="text-gray-700 font-medium mb-2">Initial Angle (°)</Text>
            <TextInput
              value={angleInput}
              onChangeText={setAngleInput}
              onEndEditing={() => {
                const degrees = parseInt(angleInput) || 45;
                const clampedDegrees = Math.max(-90, Math.min(90, degrees));
                const radians = (clampedDegrees * Math.PI) / 180;
                handleParamChange("angle", radians);
                setAngleInput(String(clampedDegrees));
              }}
              onSubmitEditing={() => {
                const degrees = parseInt(angleInput) || 45;
                const clampedDegrees = Math.max(-90, Math.min(90, degrees));
                const radians = (clampedDegrees * Math.PI) / 180;
                handleParamChange("angle", radians);
                setAngleInput(String(clampedDegrees));
              }}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              editable={!isRunning}
            />
            <Text className="text-xs text-gray-500 mt-1">Range: -90° to 90°</Text>
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
// Graph Plotter Simulator Component
// ============================================================================

interface GraphPlotterSimulatorProps {
  params?: GraphPlotterParams;
  onParamsChange?: (params: GraphPlotterParams) => void;
}

function GraphPlotterSimulator({ params: externalParams, onParamsChange }: GraphPlotterSimulatorProps) {
  const defaultParams: GraphPlotterParams = {
    expression: 'Math.sin(x) * x',
    zoom: 30,
  };

  const [params, setParams] = useState<GraphPlotterParams>(defaultParams);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (externalParams && externalParams.expression && 
        (externalParams.expression !== params.expression || externalParams.zoom !== params.zoom)) {
      setParams(externalParams);
    }
  }, [externalParams]);

  const handleExpressionChange = (expression: string) => {
    const newParams = { ...params, expression };
    setParams(newParams);
    setError(null);
    onParamsChange?.(newParams);
  };

  const handleZoomChange = (delta: number) => {
    const newZoom = Math.max(10, Math.min(100, params.zoom + delta));
    const newParams = { ...params, zoom: newZoom };
    setParams(newParams);
    onParamsChange?.(newParams);
  };

  const examples = [
    { label: 'sin(x)', value: 'Math.sin(x)' },
    { label: 'cos(x)', value: 'Math.cos(x)' },
    { label: 'x²', value: 'x*x/10' },
    { label: 'x·sin(x)', value: 'Math.sin(x) * x' },
    { label: '1/x', value: '1/x' },
  ];

  // Simple visualization message (actual plotting would require Canvas/WebView)
  return (
    <View className="bg-white rounded-xl">
      <View className="bg-gray-50 rounded-t-xl p-6 items-center" style={{ minHeight: 250 }}>
        <Text className="text-2xl font-bold text-teal-600 mb-4">📈 Function Plotter</Text>
        <View className="bg-white rounded-lg p-4 border-2 border-teal-500 w-full">
          <Text className="text-lg font-mono text-gray-800 text-center mb-2">
            f(x) = {params.expression}
          </Text>
          <Text className="text-sm text-gray-600 text-center">
            Zoom: {params.zoom}x
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mt-4 text-center">
          This function would be plotted on a graph.{'\n'}
          For full visualization, use the web app.
        </Text>
      </View>

      <View className="p-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Function Expression</Text>
        <TextInput
          value={params.expression}
          onChangeText={handleExpressionChange}
          placeholder="Math.sin(x)"
          placeholderTextColor="#9ca3af"
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-900 font-mono"
        />

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        <Text className="text-sm font-medium text-gray-700 mb-2">Quick Examples</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {examples.map((example) => (
            <TouchableOpacity
              key={example.value}
              onPress={() => handleExpressionChange(example.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg"
            >
              <Text className="text-sm text-gray-700">{example.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-sm font-medium text-gray-700 mb-2">Zoom: {params.zoom}</Text>
        <View className="flex-row justify-center gap-4 mb-4">
          <TouchableOpacity
            onPress={() => handleZoomChange(-10)}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg"
          >
            <Text className="text-gray-700 font-bold">-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setParams({ ...params, zoom: 30 })}
            className="px-6 py-2 bg-teal-600 rounded-lg"
          >
            <Text className="text-white font-medium">Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleZoomChange(10)}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg"
          >
            <Text className="text-gray-700 font-bold">+</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Text className="text-xs text-blue-800">
            <Text className="font-semibold">💡 Tips:</Text> Use Math.sin(x), Math.cos(x), x*x for powers, 1/x, etc.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// pH Meter Simulator Component
// ============================================================================

interface PHMeterSimulatorProps {
  params?: PHMeterParams;
  onParamsChange?: (params: PHMeterParams) => void;
}

function PHMeterSimulator({ params: externalParams, onParamsChange }: PHMeterSimulatorProps) {
  const defaultParams: PHMeterParams = { ph: 7 };
  // Merge external params with defaults
  const [params, setParams] = useState<PHMeterParams>({ ...defaultParams, ...externalParams });
  // Local input state for pH
  const [phInput, setPhInput] = useState(String((params.ph ?? 7).toFixed(1)));

  useEffect(() => {
    if (externalParams) {
      const mergedParams = { ...defaultParams, ...externalParams };
      if (mergedParams.ph !== params.ph) {
        setParams(mergedParams);
        setPhInput(String(mergedParams.ph.toFixed(1)));
      }
    }
  }, [externalParams]);

  // Sync input when params change from presets/color scale
  useEffect(() => {
    setPhInput(String(params.ph.toFixed(1)));
  }, [params.ph]);

  const handlePhChange = (ph: number) => {
    const newParams = { ph: Math.max(0, Math.min(14, ph)) };
    setParams(newParams);
    onParamsChange?.(newParams);
  };

  const getLiquidColor = (ph: number): string => {
    if (ph < 3) return '#ef4444'; // red
    if (ph < 5) return '#fb923c'; // orange
    if (ph < 7) return '#fde047'; // yellow
    if (ph === 7) return '#22c55e'; // green
    if (ph < 10) return '#14b8a6'; // teal
    if (ph < 12) return '#3b82f6'; // blue
    return '#a855f7'; // purple
  };

  const getSubstanceName = (ph: number): string => {
    if (ph <= 1) return 'Battery Acid';
    if (ph <= 2) return 'Lemon Juice';
    if (ph <= 4) return 'Tomato Juice';
    if (ph <= 6) return 'Milk';
    if (ph === 7) return 'Pure Water';
    if (ph <= 9) return 'Baking Soda';
    if (ph <= 11) return 'Ammonia Solution';
    if (ph <= 13) return 'Bleach';
    return 'Drain Cleaner';
  };

  const getAcidityLevel = (ph: number): string => {
    if (ph < 3) return 'Strongly Acidic';
    if (ph < 6) return 'Weakly Acidic';
    if (ph === 7) return 'Neutral';
    if (ph < 11) return 'Weakly Basic';
    return 'Strongly Basic';
  };

  return (
    <View className="bg-white rounded-xl">
      <View className="bg-gray-50 rounded-t-xl p-6 items-center" style={{ minHeight: 300 }}>
        {/* Beaker Visualization */}
        <View className="items-center mb-6">
          <View
            className="border-4 border-gray-400 rounded-b-2xl overflow-hidden"
            style={{ width: 120, height: 160, backgroundColor: '#f9fafb' }}
          >
            {/* Liquid */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70%',
                backgroundColor: getLiquidColor(params.ph),
                opacity: 0.8,
              }}
            />
            {/* pH Probe */}
            <View
              style={{
                position: 'absolute',
                top: -10,
                left: '50%',
                marginLeft: -4,
                width: 8,
                height: '80%',
                backgroundColor: '#1f2937',
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
              }}
            />
          </View>
        </View>

        {/* Digital Display */}
        <View className="bg-gray-800 px-6 py-3 rounded-lg mb-3">
          <Text className="text-3xl font-bold text-green-400 font-mono">
            pH {(params.ph ?? 7).toFixed(1)}
          </Text>
        </View>

        <Text className="text-lg font-medium text-teal-600">{getSubstanceName(params.ph ?? 7)}</Text>
        <Text className="text-sm font-semibold text-gray-700">{getAcidityLevel(params.ph ?? 7)}</Text>
      </View>

      <View className="p-4">
        <Text className="text-sm font-medium text-gray-700 mb-3">pH Level Adjuster</Text>

        {/* pH Input Field */}
        <View className="mb-4">
          <TextInput
            value={phInput}
            onChangeText={setPhInput}
            onEndEditing={() => {
              const val = parseFloat(phInput);
              if (!isNaN(val)) {
                handlePhChange(Math.max(0, Math.min(14, val)));
              } else {
                setPhInput(String(params.ph.toFixed(1)));
              }
            }}
            onSubmitEditing={() => {
              const val = parseFloat(phInput);
              if (!isNaN(val)) {
                handlePhChange(Math.max(0, Math.min(14, val)));
              } else {
                setPhInput(String(params.ph.toFixed(1)));
              }
            }}
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white text-center text-xl font-bold"
          />
        </View>

        {/* pH Color Scale */}
        <View className="mb-4">
          <View 
            className="h-8 rounded-lg overflow-hidden mb-2" 
            style={{
              flexDirection: 'row',
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((ph) => (
              <TouchableOpacity
                key={ph}
                style={{
                  flex: 1,
                  backgroundColor: getLiquidColor(ph),
                  borderWidth: Math.abs((params.ph ?? 7) - ph) < 0.5 ? 2 : 0,
                  borderColor: '#000',
                }}
                onPress={() => handlePhChange(ph)}
              />
            ))}
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-gray-500">0 (Acidic)</Text>
            <Text className="text-xs text-gray-500">7 (Neutral)</Text>
            <Text className="text-xs text-gray-500">14 (Basic)</Text>
          </View>
        </View>

        {/* Quick Presets */}
        <View className="flex-row justify-center gap-2 mb-4 flex-wrap">
          <TouchableOpacity onPress={() => handlePhChange(1)} className="px-3 py-1.5 bg-red-100 rounded-lg">
            <Text className="text-red-700 text-xs font-medium">Acidic (1)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePhChange(7)} className="px-3 py-1.5 bg-green-100 rounded-lg">
            <Text className="text-green-700 text-xs font-medium">Neutral (7)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePhChange(13)} className="px-3 py-1.5 bg-purple-100 rounded-lg">
            <Text className="text-purple-700 text-xs font-medium">Basic (13)</Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Text className="text-xs text-blue-800">
            <Text className="font-semibold">ℹ️ pH Scale:</Text> 0-6 Acidic, 7 Neutral, 8-14 Basic
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Projectile Motion Simulator Component
// ============================================================================

interface ProjectileSimulatorProps {
  params?: ProjectileMotionParams;
  onParamsChange?: (params: ProjectileMotionParams) => void;
}

interface ProjectileState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  landed: boolean;
  maxHeight: number;
  landingDistance: number;
  flightTime: number;
}

function ProjectileMotionSimulator({ params: externalParams, onParamsChange }: ProjectileSimulatorProps) {
  const defaultParams: ProjectileMotionParams = {
    angle: 45,
    velocity: 50,
    gravity: 9.8,
    airResistance: 0,
    height: 0,
  };

  // Merge external params with defaults to ensure all fields exist
  const [params, setParams] = useState<ProjectileMotionParams>({ ...defaultParams, ...externalParams });
  const [isRunning, setIsRunning] = useState(false);
  const [projectile, setProjectile] = useState<ProjectileState | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Local input states (only commit on blur/submit)
  const [angleInput, setAngleInput] = useState(String(Math.round(params.angle)));
  const [velocityInput, setVelocityInput] = useState(String(Math.round(params.velocity)));
  const [gravityInput, setGravityInput] = useState(String(params.gravity.toFixed(1)));
  const [airResistanceInput, setAirResistanceInput] = useState(String(Math.round(params.airResistance)));
  const [heightInput, setHeightInput] = useState(String(Math.round(params.height)));

  // Canvas dimensions for mobile
  const CANVAS_WIDTH = CANVAS_SIZE;
  const CANVAS_HEIGHT = CANVAS_SIZE * 0.75;
  const SCALE = 3; // pixels per meter (increased for better visibility)
  const GROUND_Y = CANVAS_HEIGHT - 30;

  useEffect(() => {
    if (externalParams) {
      const mergedParams = { ...defaultParams, ...externalParams };
      if (JSON.stringify(mergedParams) !== JSON.stringify(params)) {
        setParams(mergedParams);
        reset();
        // Sync input states
        setAngleInput(String(Math.round(mergedParams.angle)));
        setVelocityInput(String(Math.round(mergedParams.velocity)));
        setGravityInput(String(mergedParams.gravity.toFixed(1)));
        setAirResistanceInput(String(Math.round(mergedParams.airResistance)));
        setHeightInput(String(Math.round(mergedParams.height)));
      }
    }
  }, [externalParams]);

  const handleParamChange = (key: keyof ProjectileMotionParams, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange?.(newParams);
  };

  const launch = useCallback(() => {
    const angleRad = (params.angle * Math.PI) / 180;
    const vx = params.velocity * Math.cos(angleRad);
    const vy = -params.velocity * Math.sin(angleRad);

    setProjectile({
      x: 30,
      y: GROUND_Y - params.height * SCALE,
      vx: vx * SCALE,
      vy: vy * SCALE,
      trail: [],
      landed: false,
      maxHeight: params.height,
      landingDistance: 0,
      flightTime: 0,
    });
    timeRef.current = 0;
    setIsRunning(true);
  }, [params, GROUND_Y, SCALE]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setProjectile(null);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    timeRef.current = 0;
  }, []);

  // Physics animation loop
  useEffect(() => {
    if (!isRunning || !projectile || projectile.landed) {
      return;
    }

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const realDeltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Use fixed physics timestep
      const fixedDt = 0.016;
      const steps = Math.min(Math.floor(realDeltaTime / fixedDt) + 1, 4);
      
      for (let i = 0; i < steps; i++) {
        timeRef.current += fixedDt;
      }

      setProjectile((prev) => {
        if (!prev || prev.landed) return prev;
        
        let currentX = prev.x;
        let currentY = prev.y;
        let currentVx = prev.vx;
        let currentVy = prev.vy;
        let currentMaxHeight = prev.maxHeight;
        let newTrail = [...prev.trail];
        
        for (let step = 0; step < steps; step++) {
          let ax = 0;
          let ay = params.gravity * SCALE;

          // Air resistance
          if (params.airResistance > 0) {
            const speed = Math.sqrt(currentVx * currentVx + currentVy * currentVy);
            if (speed > 0) {
              const dragFactor = params.airResistance * 0.001;
              ax -= dragFactor * currentVx * speed;
              ay -= dragFactor * currentVy * speed;
            }
          }

          currentVx += ax * fixedDt;
          currentVy += ay * fixedDt;
          currentX += currentVx * fixedDt;
          currentY += currentVy * fixedDt;
          
          // Update height tracking
          const stepHeight = (GROUND_Y - currentY) / SCALE + params.height;
          if (stepHeight > currentMaxHeight) {
            currentMaxHeight = stepHeight;
          }
          
          // Trail every 2 steps
          if (step % 2 === 0) {
            newTrail = [...newTrail.slice(-100), { x: currentX, y: currentY }];
          }
        }
        
        const newX = currentX;
        const newY = currentY;
        const newVx = currentVx;
        const newVy = currentVy;

        const currentHeight = (GROUND_Y - newY) / SCALE + params.height;

        // Check landing
        if (newY >= GROUND_Y) {
          return {
            ...prev,
            x: newX,
            y: GROUND_Y,
            vx: 0,
            vy: 0,
            landed: true,
            maxHeight: Math.max(prev.maxHeight, currentHeight),
            landingDistance: (newX - 30) / SCALE,
            flightTime: timeRef.current,
            trail: [...prev.trail, { x: newX, y: GROUND_Y }],
          };
        }

        // Out of bounds
        if (newX > CANVAS_WIDTH + 50) {
          return {
            ...prev,
            landed: true,
            landingDistance: (newX - 30) / SCALE,
            flightTime: timeRef.current,
          };
        }

        return {
          ...prev,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          maxHeight: currentMaxHeight,
          trail: newTrail,
          flightTime: timeRef.current,
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, projectile, params, GROUND_Y, SCALE, CANVAS_WIDTH]);

  // Stop when landed
  useEffect(() => {
    if (projectile?.landed) {
      setIsRunning(false);
    }
  }, [projectile?.landed]);

  const platformX = 30;
  const platformY = GROUND_Y - params.height * SCALE;
  const angleRad = (params.angle * Math.PI) / 180;
  const cannonLength = 25;

  return (
    <View className="bg-white rounded-xl">
      {/* SVG Canvas */}
      <View className="bg-gradient-to-b from-sky-100 to-sky-50 rounded-t-xl overflow-hidden" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          <Defs>
            <RadialGradient id="projectileGradient" cx="30%" cy="30%" r="70%">
              <Stop offset="0%" stopColor="#ef4444" />
              <Stop offset="100%" stopColor="#b91c1c" />
            </RadialGradient>
          </Defs>

          {/* Sky background */}
          <Circle cx={CANVAS_WIDTH / 2} cy={0} r={CANVAS_HEIGHT} fill="#e0f4ff" />

          {/* Ground */}
          <Line x1={0} y1={GROUND_Y} x2={CANVAS_WIDTH} y2={GROUND_Y} stroke="#22c55e" strokeWidth={60} />

          {/* Distance markers */}
          {[0, 25, 50, 75, 100].map((dist) => {
            const x = 30 + dist * SCALE;
            if (x < CANVAS_WIDTH - 20) {
              return (
                <G key={dist}>
                  <Line x1={x} y1={GROUND_Y} x2={x} y2={GROUND_Y + 8} stroke="#16a34a" strokeWidth={1} />
                </G>
              );
            }
            return null;
          })}

          {/* Platform */}
          <Line x1={platformX} y1={platformY} x2={platformX} y2={GROUND_Y + 5} stroke="#6b7280" strokeWidth={8} />

          {/* Cannon */}
          <G transform={`translate(${platformX}, ${platformY}) rotate(${-params.angle})`}>
            <Line x1={0} y1={0} x2={cannonLength} y2={0} stroke="#374151" strokeWidth={10} strokeLinecap="round" />
            <Circle cx={0} cy={0} r={8} fill="#1f2937" />
          </G>

          {/* Trail */}
          {projectile && projectile.trail.length > 1 && projectile.trail.map((point, index) => {
            if (index % 2 === 0) {
              const opacity = 0.2 + (index / projectile.trail.length) * 0.4;
              return (
                <Circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  fill={`rgba(239, 68, 68, ${opacity})`}
                />
              );
            }
            return null;
          })}

          {/* Projectile */}
          {projectile && (
            <>
              {/* Shadow */}
              <Circle cx={projectile.x} cy={GROUND_Y + 3} r={6} fill="rgba(0,0,0,0.2)" />
              {/* Ball */}
              <Circle cx={projectile.x} cy={projectile.y} r={10} fill="url(#projectileGradient)" />
              {/* Shine */}
              <Circle cx={projectile.x - 3} cy={projectile.y - 3} r={3} fill="rgba(255,255,255,0.4)" />
            </>
          )}

          {/* Velocity preview arrow (when not running) */}
          {!isRunning && !projectile && (
            <>
              <Line
                x1={platformX}
                y1={platformY}
                x2={platformX + params.velocity * 0.6 * Math.cos(angleRad)}
                y2={platformY - params.velocity * 0.6 * Math.sin(angleRad)}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="4,4"
              />
            </>
          )}
        </Svg>
      </View>

      {/* Results Panel */}
      {projectile?.landed && (
        <View className="bg-green-50 p-3 border-b border-green-200">
          <Text className="text-green-800 font-semibold mb-2 text-center">🎯 Results</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-xs text-green-600">Distance</Text>
              <Text className="text-lg font-bold text-green-800">{projectile.landingDistance.toFixed(1)}m</Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-green-600">Max Height</Text>
              <Text className="text-lg font-bold text-green-800">{projectile.maxHeight.toFixed(1)}m</Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-green-600">Flight Time</Text>
              <Text className="text-lg font-bold text-green-800">{projectile.flightTime.toFixed(2)}s</Text>
            </View>
          </View>
        </View>
      )}

      {/* Controls */}
      <View className="p-4">
        {/* Launch/Reset Button */}
        <View className="flex-row justify-center mb-6">
          {!isRunning && !projectile?.landed ? (
            <TouchableOpacity
              onPress={launch}
              className="flex-row items-center gap-2 px-8 py-3 rounded-lg bg-teal-600"
            >
              <Play size={20} color="white" />
              <Text className="text-white font-semibold">Launch 🚀</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={reset}
              className="flex-row items-center gap-2 px-8 py-3 rounded-lg bg-orange-500"
            >
              <Text className="text-white font-semibold">🔄 Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Parameter Controls */}
        <View className="space-y-4">
          {/* Angle */}
          <View>
            <Text className="text-gray-700 font-medium mb-2">Launch Angle (°)</Text>
            <TextInput
              value={angleInput}
              onChangeText={setAngleInput}
              onEndEditing={() => {
                const val = parseInt(angleInput) || 45;
                const clamped = Math.max(5, Math.min(85, val));
                handleParamChange("angle", clamped);
                setAngleInput(String(clamped));
              }}
              onSubmitEditing={() => {
                const val = parseInt(angleInput) || 45;
                const clamped = Math.max(5, Math.min(85, val));
                handleParamChange("angle", clamped);
                setAngleInput(String(clamped));
              }}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              editable={!isRunning}
            />
            <Text className="text-xs text-gray-500 mt-1">Range: 5° - 85° (Optimal: 45°)</Text>
          </View>

          {/* Velocity */}
          <View>
            <Text className="text-gray-700 font-medium mb-2">Initial Velocity (m/s)</Text>
            <TextInput
              value={velocityInput}
              onChangeText={setVelocityInput}
              onEndEditing={() => {
                const val = parseInt(velocityInput) || 50;
                const clamped = Math.max(10, Math.min(100, val));
                handleParamChange("velocity", clamped);
                setVelocityInput(String(clamped));
              }}
              onSubmitEditing={() => {
                const val = parseInt(velocityInput) || 50;
                const clamped = Math.max(10, Math.min(100, val));
                handleParamChange("velocity", clamped);
                setVelocityInput(String(clamped));
              }}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              editable={!isRunning}
            />
            <Text className="text-xs text-gray-500 mt-1">Range: 10 - 100 m/s</Text>
          </View>

          {/* Gravity */}
          <View>
            <Text className="text-gray-700 font-medium mb-2">Gravity (m/s²)</Text>
            <TextInput
              value={gravityInput}
              onChangeText={setGravityInput}
              onEndEditing={() => {
                const val = parseFloat(gravityInput) || 9.8;
                const clamped = Math.max(1, Math.min(25, val));
                handleParamChange("gravity", clamped);
                setGravityInput(String(clamped.toFixed(1)));
              }}
              onSubmitEditing={() => {
                const val = parseFloat(gravityInput) || 9.8;
                const clamped = Math.max(1, Math.min(25, val));
                handleParamChange("gravity", clamped);
                setGravityInput(String(clamped.toFixed(1)));
              }}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              editable={!isRunning}
            />
            <Text className="text-xs text-gray-500 mt-1">Moon: 1.6 | Earth: 9.8 | Jupiter: 24.8</Text>
          </View>

          {/* Air Resistance */}
          <View>
            <Text className="text-gray-700 font-medium mb-2">Air Resistance (%)</Text>
            <TextInput
              value={airResistanceInput}
              onChangeText={setAirResistanceInput}
              onEndEditing={() => {
                const val = parseInt(airResistanceInput) || 0;
                const clamped = Math.max(0, Math.min(50, val));
                handleParamChange("airResistance", clamped);
                setAirResistanceInput(String(clamped));
              }}
              onSubmitEditing={() => {
                const val = parseInt(airResistanceInput) || 0;
                const clamped = Math.max(0, Math.min(50, val));
                handleParamChange("airResistance", clamped);
                setAirResistanceInput(String(clamped));
              }}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              editable={!isRunning}
            />
            <Text className="text-xs text-gray-500 mt-1">Range: 0% (vacuum) - 50% (heavy)</Text>
          </View>

          {/* Initial Height */}
          <View>
            <Text className="text-gray-700 font-medium mb-2">Initial Height (m)</Text>
            <TextInput
              value={heightInput}
              onChangeText={setHeightInput}
              onEndEditing={() => {
                const val = parseInt(heightInput) || 0;
                const clamped = Math.max(0, Math.min(30, val));
                handleParamChange("height", clamped);
                setHeightInput(String(clamped));
              }}
              onSubmitEditing={() => {
                const val = parseInt(heightInput) || 0;
                const clamped = Math.max(0, Math.min(30, val));
                handleParamChange("height", clamped);
                setHeightInput(String(clamped));
              }}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              editable={!isRunning}
            />
            <Text className="text-xs text-gray-500 mt-1">Range: 0 - 30 m</Text>
          </View>
        </View>

        {/* Theoretical Calculations */}
        <View className="bg-gray-50 rounded-lg p-3 mt-4 border border-gray-200">
          <Text className="text-xs font-semibold text-gray-600 mb-1">Theoretical (no air):</Text>
          <Text className="text-xs text-gray-500">
            Max Range: {(((params.velocity ?? 50) ** 2 * Math.sin(2 * (params.angle ?? 45) * Math.PI / 180)) / (params.gravity ?? 9.8)).toFixed(1)}m
          </Text>
          <Text className="text-xs text-gray-500">
            Max Height: {(((params.velocity ?? 50) ** 2 * Math.sin((params.angle ?? 45) * Math.PI / 180) ** 2) / (2 * (params.gravity ?? 9.8)) + (params.height ?? 0)).toFixed(1)}m
          </Text>
        </View>

        {/* Info Box */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <Text className="text-xs text-blue-800">
            <Text className="font-semibold">📚 Physics:</Text> Projectile motion follows a parabolic path. 
            The optimal angle for max range (no air resistance) is 45°. Air resistance reduces range and changes trajectory.
          </Text>
        </View>
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
  simulationType,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  params: PendulumParams | GraphPlotterParams | PHMeterParams | ProjectileMotionParams;
  simulationType?: string;
}) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName("");
      onClose();
    }
  };

  const renderParams = () => {
    if (!params) return null;
    
    if ('length' in params) {
      // PendulumParams
      const p = params as PendulumParams;
      return (
        <>
          <Text className="text-sm text-gray-600">• Length: {p.length?.toFixed(0) || 0} cm</Text>
          <Text className="text-sm text-gray-600">• Mass: {p.mass?.toFixed(1) || 0} kg</Text>
          <Text className="text-sm text-gray-600">• Gravity: {p.gravity?.toFixed(1) || 0} m/s²</Text>
          <Text className="text-sm text-gray-600">
            • Initial Angle: {p.angle ? ((p.angle * 180) / Math.PI).toFixed(0) : 0}°
          </Text>
        </>
      );
    } else if ('expression' in params) {
      // GraphPlotterParams
      const p = params as GraphPlotterParams;
      return (
        <>
          <Text className="text-sm text-gray-600">• Expression: {p.expression || 'N/A'}</Text>
          <Text className="text-sm text-gray-600">• Zoom: {p.zoom || 30}</Text>
        </>
      );
    } else if ('ph' in params) {
      // PHMeterParams
      const p = params as PHMeterParams;
      return (
        <Text className="text-sm text-gray-600">• pH Level: {p.ph?.toFixed(1) || '7.0'}</Text>
      );
    } else if ('velocity' in params && 'airResistance' in params) {
      // ProjectileMotionParams
      const p = params as ProjectileMotionParams;
      return (
        <>
          <Text className="text-sm text-gray-600">• Angle: {p.angle || 45}°</Text>
          <Text className="text-sm text-gray-600">• Velocity: {p.velocity || 50} m/s</Text>
          <Text className="text-sm text-gray-600">• Gravity: {p.gravity?.toFixed(1) || 9.8} m/s²</Text>
          <Text className="text-sm text-gray-600">• Air Resistance: {p.airResistance || 0}%</Text>
          <Text className="text-sm text-gray-600">• Height: {p.height || 0} m</Text>
        </>
      );
    }
    return <Text className="text-sm text-gray-600">No parameters to display</Text>;
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
              {renderParams()}
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
              {'length' in exp.parameters
                ? `L: ${(exp.parameters as PendulumParams).length}cm • M: ${(exp.parameters as PendulumParams).mass}kg • G: ${(exp.parameters as PendulumParams).gravity}m/s² • θ: ${(((exp.parameters as PendulumParams).angle * 180) / Math.PI).toFixed(0)}°`
                : 'expression' in exp.parameters
                ? `f(x) = ${(exp.parameters as GraphPlotterParams).expression} • Zoom: ${(exp.parameters as GraphPlotterParams).zoom}`
                : 'velocity' in exp.parameters && 'airResistance' in exp.parameters
                ? `θ: ${(exp.parameters as ProjectileMotionParams).angle}° • v₀: ${(exp.parameters as ProjectileMotionParams).velocity}m/s • g: ${(exp.parameters as ProjectileMotionParams).gravity}m/s²`
                : `pH: ${(exp.parameters as PHMeterParams).ph.toFixed(1)}`}
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

  // Initialize default params based on simulation type
  useEffect(() => {
    if (selectedSimulation && !currentParams) {
      const title = selectedSimulation.title?.toLowerCase() || '';
      const component = selectedSimulation.config?.component || '';
      
      if (title.includes('pendulum') || component === 'PendulumSimulator') {
        const defaultPendulumParams: PendulumParams = {
          length: 200,
          mass: 20,
          gravity: 9.8,
          damping: 0.999,
          angle: Math.PI / 4,
          angularVelocity: 0,
        };
        setCurrentParams(defaultPendulumParams);
      } else if (title.includes('graph') || title.includes('math') || title.includes('function') || component === 'GraphPlotterSimulator') {
        const defaultGraphParams: GraphPlotterParams = {
          expression: 'Math.sin(x) * x',
          zoom: 30,
        };
        setCurrentParams(defaultGraphParams);
      } else if (title.includes('ph') || title.includes('chem') || title.includes('scale') || component === 'PHMeterSimulator') {
        const defaultPHParams: PHMeterParams = {
          ph: 7,
        };
        setCurrentParams(defaultPHParams);
      } else if (title.includes('projectile') || title.includes('motion') || component === 'ProjectileMotionSimulator') {
        const defaultProjectileParams: ProjectileMotionParams = {
          angle: 45,
          velocity: 50,
          gravity: 9.8,
          airResistance: 0,
          height: 0,
        };
        setCurrentParams(defaultProjectileParams);
      }
    }
  }, [selectedSimulation]);

  // Fetch saved experiments on mount if user is logged in
  useEffect(() => {
    if (user && selectedSimulation) {
      fetchSavedExperiments(selectedSimulation.id);
    }
  }, [user, selectedSimulation]);

  // Use loaded params if available, otherwise use current params
  const effectiveParams = loadedParams || currentParams;

  const handleSaveExperiment = async (name: string) => {
    if (!user || !selectedSimulation || !currentParams) {
      Alert.alert("Error", "Please log in to save experiments.");
      return;
    }

    try {
      await saveExperiment(selectedSimulation.id, name, currentParams as Record<string, any>);
      Alert.alert("Success", "Experiment saved successfully!");
      fetchSavedExperiments(selectedSimulation.id);
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save experiment");
    }
  };

  const handleLoadExperiment = (exp: SavedExperiment) => {
    // Load parameters based on type
    const params = exp.parameters || exp.data || {};
    setLoadedParams(params);
    setActiveTab("simulation");
    Alert.alert("Loaded", `Experiment "${exp.name}" loaded successfully!`);
  };

  const handleDeleteExperiment = async (expId: number) => {
    try {
      await deleteExperiment(expId);
      Alert.alert("Deleted", "Experiment deleted successfully!");
      if (selectedSimulation) {
        fetchSavedExperiments(selectedSimulation.id);
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      Alert.alert("Error", error.message || "Failed to delete experiment");
    }
  };

  const handleParamsChange = (params: PendulumParams | GraphPlotterParams | PHMeterParams | ProjectileMotionParams) => {
    setCurrentParams(params);
    // Clear loaded params when user changes parameters manually
    if (loadedParams) {
      setLoadedParams(null);
    }
  };

  // Determine which simulator to render based on the simulation title/config
  const renderSimulator = () => {
    const title = selectedSimulation?.title?.toLowerCase() || '';
    const component = selectedSimulation?.config?.component || '';

    if (title.includes('pendulum') || component === 'PendulumSimulator') {
      return (
        <PendulumSimulator params={(effectiveParams as unknown) as PendulumParams} onParamsChange={handleParamsChange} />
      );
    } else if (title.includes('graph') || title.includes('math') || title.includes('function') || component === 'GraphPlotterSimulator') {
      return (
        <GraphPlotterSimulator params={(effectiveParams as unknown) as GraphPlotterParams} onParamsChange={handleParamsChange} />
      );
    } else if (title.includes('ph') || title.includes('chem') || title.includes('scale') || component === 'PHMeterSimulator') {
      return (
        <PHMeterSimulator params={(effectiveParams as unknown) as PHMeterParams} onParamsChange={handleParamsChange} />
      );
    } else if (title.includes('projectile') || title.includes('motion') || component === 'ProjectileMotionSimulator') {
      return (
        <ProjectileMotionSimulator params={(effectiveParams as unknown) as ProjectileMotionParams} onParamsChange={handleParamsChange} />
      );
    } else {
      return (
        <View className="bg-white rounded-xl p-8 items-center">
          <Text className="text-gray-500 text-center">Simulation component not available for this type.</Text>
        </View>
      );
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
            {renderSimulator()}

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
        params={currentParams as PendulumParams | GraphPlotterParams | PHMeterParams | ProjectileMotionParams}
        simulationType={selectedSimulation?.config?.component}
      />
    </SafeAreaView>
  );
}
