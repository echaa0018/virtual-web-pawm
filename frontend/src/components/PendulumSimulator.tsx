import { useEffect, useRef, useState } from 'react';

interface PendulumParams {
  length: number;
  mass: number;
  gravity: number;
}

interface PendulumSimulatorProps {
  onParametersChange?: (params: PendulumParams) => void;
  initialParams?: PendulumParams | null;
}

export function PendulumSimulator({ onParametersChange, initialParams }: PendulumSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [length, setLength] = useState(200); // pixels
  const [mass, setMass] = useState(20); // kg
  const [gravity, setGravity] = useState(9.8); // m/s²
  const [isRunning, setIsRunning] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Use refs for physics state to avoid re-render loops
  const angleRef = useRef(Math.PI / 4);
  const angularVelocityRef = useRef(0);
  const [angleDisplay, setAngleDisplay] = useState(45); // For slider display only

  // Local input states for controlled inputs (only commit on blur/enter)
  const [lengthInput, setLengthInput] = useState(String(length));
  const [massInput, setMassInput] = useState(String(mass));
  const [gravityInput, setGravityInput] = useState(String(gravity));
  const [angleInput, setAngleInput] = useState(String(45));

  // Helper to update angle (ref + display)
  const setAngle = (radians: number) => {
    angleRef.current = radians;
    setAngleDisplay(Math.round(radians * 180 / Math.PI));
    setAngleInput(String(Math.round(radians * 180 / Math.PI)));
  };

  // Load initial params when provided (from saved experiment)
  useEffect(() => {
    if (initialParams) {
      setLength(initialParams.length || 200);
      setMass(initialParams.mass || 20);
      setGravity(initialParams.gravity || 9.8);
      angleRef.current = Math.PI / 4; // Reset angle
      angularVelocityRef.current = 0; // Reset velocity
      setAngleDisplay(45);
      setIsRunning(false); // Stop simulation
      // Sync input states
      setLengthInput(String(initialParams.length || 200));
      setMassInput(String(initialParams.mass || 20));
      setGravityInput(String(initialParams.gravity || 9.8));
      setAngleInput(String(45));
    }
  }, [initialParams]);

  // Sync input states when actual values change (e.g., from slider)
  useEffect(() => { setLengthInput(String(length)); }, [length]);
  useEffect(() => { setMassInput(String(mass)); }, [mass]);
  useEffect(() => { setGravityInput(String(gravity)); }, [gravity]);

  useEffect(() => {
    onParametersChange?.({ length, mass, gravity });
  }, [length, mass, gravity]);

  // Drawing effect - separate from physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = 80;

    const draw = () => {
      const angle = angleRef.current;
      const angularVelocity = angularVelocityRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ceiling
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, 0, canvas.width, centerY - 20);
      
      // Draw pivot point
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Calculate pendulum bob position
      const bobX = centerX + length * Math.sin(angle);
      const bobY = centerY + length * Math.cos(angle);

      // Draw string
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Draw pendulum bob
      const bobRadius = Math.max(10, mass * 0.8);
      const gradient = ctx.createRadialGradient(bobX - 5, bobY - 5, 0, bobX, bobY, bobRadius);
      gradient.addColorStop(0, '#fbbf24');
      gradient.addColorStop(1, '#f59e0b');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add shine effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(bobX - 3, bobY - 3, bobRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.ellipse(bobX, canvas.height - 10, bobRadius * 1.2, bobRadius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw motion trail
      if (isRunning) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const trailLength = 5; 
        
        for (let i = 0; i < trailLength; i++) {
          const trailAngle = angle - angularVelocity * i * 0.016;
          const trailX = centerX + length * Math.sin(trailAngle);
          const trailY = centerY + length * Math.cos(trailAngle);
          if (i === 0) {
            ctx.moveTo(trailX, trailY);
          } else {
            ctx.lineTo(trailX, trailY);
          }
        }
        ctx.stroke();
      }

      // Display information
      ctx.fillStyle = '#dce5f1ff';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Angle: ${(angle * 180 / Math.PI).toFixed(1)}°`, 20, 30);
      ctx.fillText(`Angular Velocity: ${angularVelocity.toFixed(2)} rad/s`, 20, 50);
      
      const period = 2 * Math.PI * Math.sqrt(length / 100 / gravity);
      ctx.fillText(`Period: ${period.toFixed(2)}s`, canvas.width - 150, 30);
    };

    // Initial draw
    draw();

    // Animation loop (only runs when isRunning is true)
    if (isRunning) {
      let lastTime = performance.now();

      const animate = (currentTime: number) => {
        const realDeltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        // Use fixed physics timestep with accumulator for stability
        const fixedDt = 0.016; // 60Hz physics
        const steps = Math.min(Math.floor(realDeltaTime / fixedDt) + 1, 4); // Max 4 steps per frame
        
        for (let i = 0; i < steps; i++) {
          // Pendulum physics using refs (no state updates in the loop)
          const g = gravity;
          const L = length / 100; // Convert pixels to meters (length in cm)
          
          // Calculate angular acceleration: α = -(g/L) * sin(θ)
          const angularAcceleration = -(g / L) * Math.sin(angleRef.current);
          
          // Update angular velocity: ω = ω + α * dt
          angularVelocityRef.current += angularAcceleration * fixedDt;
          
          // Apply very light damping (per step, not per frame)
          angularVelocityRef.current *= 0.9995;
          
          // Update angle: θ = θ + ω * dt
          angleRef.current += angularVelocityRef.current * fixedDt;
        }

        draw();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [length, mass, gravity, isRunning]);

  return (
    <div className="space-y-6">
      {/* Canvas - CENTERED with mx-auto */}
      <div className="bg-gradient-to-b from-sky-100 to-sky-50 rounded-lg overflow-hidden border-2 border-gray-300 shadow-md max-w-3xl mx-auto">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-auto"
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              String Length (cm)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="100"
                max="300"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                disabled={isRunning}
              />
              <input
                type="number"
                min="100"
                max="300"
                value={lengthInput}
                onChange={(e) => setLengthInput(e.target.value)}
                onBlur={() => setLength(Math.max(100, Math.min(300, Number(lengthInput) || 200)))}
                onKeyDown={(e) => e.key === 'Enter' && setLength(Math.max(100, Math.min(300, Number(lengthInput) || 200)))}
                className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100 cm</span>
              <span>300 cm</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mass (kg)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="50"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                disabled={isRunning}
              />
              <input
                type="number"
                min="5"
                max="50"
                value={massInput}
                onChange={(e) => setMassInput(e.target.value)}
                onBlur={() => setMass(Math.max(5, Math.min(50, Number(massInput) || 20)))}
                onKeyDown={(e) => e.key === 'Enter' && setMass(Math.max(5, Math.min(50, Number(massInput) || 20)))}
                className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 kg</span>
              <span>50 kg</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gravity (m/s²)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="20"
                step="0.1"
                value={gravity}
                onChange={(e) => setGravity(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                disabled={isRunning}
              />
              <input
                type="number"
                min="1"
                max="20"
                step="0.1"
                value={gravityInput}
                onChange={(e) => setGravityInput(e.target.value)}
                onBlur={() => setGravity(Math.max(1, Math.min(20, Number(gravityInput) || 9.8)))}
                onKeyDown={(e) => e.key === 'Enter' && setGravity(Math.max(1, Math.min(20, Number(gravityInput) || 9.8)))}
                className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Moon (1.6)</span>
              <span>Earth (9.8)</span>
              <span>Jupiter (24.8)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Angle (°)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="-90"
                max="90"
                value={angleDisplay}
                onChange={(e) => setAngle(Number(e.target.value) * Math.PI / 180)}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                disabled={isRunning}
              />
              <input
                type="number"
                min="-90"
                max="90"
                value={angleInput}
                onChange={(e) => setAngleInput(e.target.value)}
                onBlur={() => setAngle(Math.max(-90, Math.min(90, Number(angleInput) || 45)) * Math.PI / 180)}
                onKeyDown={(e) => e.key === 'Enter' && setAngle(Math.max(-90, Math.min(90, Number(angleInput) || 45)) * Math.PI / 180)}
                className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-90°</span>
              <span>0°</span>
              <span>90°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 max-w-4xl mx-auto">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex-1 px-6 py-3 rounded-lg transition-colors ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
        >
          {isRunning ? 'Pause' : 'Start'} Simulation
        </button>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
        <h3 className="font-medium text-blue-900 mb-2">📚 Pendulum Physics</h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          A simple pendulum consists of a mass (bob) suspended from a fixed point by a string. 
          The period of oscillation depends on the length of the string and gravity, but is 
          independent of the mass. The formula for period is T = 2π√(L/g).
        </p>
      </div>
    </div>
  );
}