import React, { useEffect, useRef, useState } from 'react';

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
  const [angle, setAngle] = useState(Math.PI / 4); // radians
  const [angularVelocity, setAngularVelocity] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const animationFrameRef = useRef<number>();

  // Load initial params when provided (from saved experiment)
  useEffect(() => {
    if (initialParams) {
      setLength(initialParams.length);
      setMass(initialParams.mass);
      setGravity(initialParams.gravity);
      setAngle(Math.PI / 4); // Reset angle
      setAngularVelocity(0); // Reset velocity
      setIsRunning(false); // Stop simulation
    }
  }, [initialParams]);

  useEffect(() => {
    onParametersChange?.({ length, mass, gravity });
  }, [length, mass, gravity, onParametersChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = 80;

    const draw = () => {
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
        const trailLength = 20;
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
      ctx.fillStyle = '#1f2937';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Angle: ${(angle * 180 / Math.PI).toFixed(1)}°`, 20, 30);
      ctx.fillText(`Angular Velocity: ${angularVelocity.toFixed(2)} rad/s`, 20, 50);
      
      const period = 2 * Math.PI * Math.sqrt(length / 100 / gravity);
      ctx.fillText(`Period: ${period.toFixed(2)}s`, canvas.width - 150, 30);
    };

    draw();

    if (isRunning) {
      const animate = () => {
        // Pendulum physics simulation
        const angularAcceleration = -(gravity / (length / 100)) * Math.sin(angle);
        
        setAngularVelocity(v => {
          const newVelocity = v + angularAcceleration * 0.016;
          return newVelocity * 0.999; // Damping
        });
        
        setAngle(a => a + angularVelocity * 0.016);
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [angle, angularVelocity, length, mass, gravity, isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setAngle(Math.PI / 4);
    setAngularVelocity(0);
  };

  return (
    <div className="space-y-6">
      {/* Canvas */}
      <div className="bg-gradient-to-b from-sky-100 to-sky-50 rounded-lg overflow-hidden border-2 border-gray-300">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full"
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              String Length: {length} cm
            </label>
            <input
              type="range"
              min="100"
              max="300"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              disabled={isRunning}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100 cm</span>
              <span>300 cm</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mass: {mass} kg
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              disabled={isRunning}
            />
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
              Gravity: {gravity} m/s²
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={gravity}
              onChange={(e) => setGravity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              disabled={isRunning}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Moon (1.6)</span>
              <span>Earth (9.8)</span>
              <span>Jupiter (24.8)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Angle: {(angle * 180 / Math.PI).toFixed(0)}°
            </label>
            <input
              type="range"
              min="-90"
              max="90"
              value={angle * 180 / Math.PI}
              onChange={(e) => setAngle(Number(e.target.value) * Math.PI / 180)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              disabled={isRunning}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-90°</span>
              <span>0°</span>
              <span>90°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
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
        <button
          onClick={handleReset}
          className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📚 Pendulum Physics</h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          A simple pendulum consists of a mass (bob) suspended from a fixed point by a string. 
          The period of oscillation depends on the length of the string and gravity, but is 
          independent of the mass. The formula for period is T = 2π√(L/g), where L is the length 
          and g is gravitational acceleration.
        </p>
      </div>
    </div>
  );
}
