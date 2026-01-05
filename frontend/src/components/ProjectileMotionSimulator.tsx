import { useEffect, useRef, useState, useCallback } from 'react';

interface ProjectileParams {
  angle: number;       // Launch angle in degrees
  velocity: number;    // Initial velocity in m/s
  gravity: number;     // Gravity in m/s²
  airResistance: number; // Air resistance coefficient (0 = none)
  height: number;      // Initial height in meters
}

interface ProjectileMotionSimulatorProps {
  onParametersChange?: (params: ProjectileParams) => void;
  initialParams?: ProjectileParams | null;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  landed: boolean;
  maxHeight: number;
  landingX: number;
}

export function ProjectileMotionSimulator({ onParametersChange, initialParams }: ProjectileMotionSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(50);
  const [gravity, setGravity] = useState(9.8);
  const [airResistance, setAirResistance] = useState(0);
  const [height, setHeight] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef<number>(0);

  // Local input states for controlled inputs (only commit on blur/enter)
  const [angleInput, setAngleInput] = useState(String(angle));
  const [velocityInput, setVelocityInput] = useState(String(velocity));
  const [gravityInput, setGravityInput] = useState(String(gravity));
  const [airResistanceInput, setAirResistanceInput] = useState(String(airResistance));
  const [heightInput, setHeightInput] = useState(String(height));

  // Scale factor: pixels per meter
  const SCALE = 5;
  const GROUND_Y = 420;

  // Load initial params when provided (from saved experiment)
  useEffect(() => {
    if (initialParams) {
      setAngle(initialParams.angle || 45);
      setVelocity(initialParams.velocity || 50);
      setGravity(initialParams.gravity || 9.8);
      setAirResistance(initialParams.airResistance || 0);
      setHeight(initialParams.height || 1);
      setIsRunning(false);
      setProjectile(null);
      // Sync input states
      setAngleInput(String(initialParams.angle || 45));
      setVelocityInput(String(initialParams.velocity || 50));
      setGravityInput(String(initialParams.gravity || 9.8));
      setAirResistanceInput(String(initialParams.airResistance || 0));
      setHeightInput(String(initialParams.height || 1));
    }
  }, [initialParams]);

  // Sync input states when actual values change (e.g., from slider)
  useEffect(() => { setAngleInput(String(angle)); }, [angle]);
  useEffect(() => { setVelocityInput(String(velocity)); }, [velocity]);
  useEffect(() => { setGravityInput(String(gravity)); }, [gravity]);
  useEffect(() => { setAirResistanceInput(String(airResistance)); }, [airResistance]);
  useEffect(() => { setHeightInput(String(height)); }, [height]);

  // Notify parent of parameter changes
  useEffect(() => {
    onParametersChange?.({ angle, velocity, gravity, airResistance, height });
  }, [angle, velocity, gravity, airResistance, height]);

  // Launch the projectile
  const launch = useCallback(() => {
    const angleRad = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(angleRad);
    const vy = -velocity * Math.sin(angleRad); // Negative because canvas Y is inverted

    setProjectile({
      x: 50,
      y: GROUND_Y - height * SCALE,
      vx: vx * SCALE,
      vy: vy * SCALE,
      trail: [],
      landed: false,
      maxHeight: height,
      landingX: 0,
    });
    timeRef.current = 0;
    setIsRunning(true);
  }, [angle, velocity, height]);

  // Reset the simulation
  const reset = useCallback(() => {
    setIsRunning(false);
    setProjectile(null);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(1, '#E0F4FF');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, GROUND_Y);

      // Draw ground
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

      // Draw grass texture
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, GROUND_Y);
        ctx.lineTo(i + 5, GROUND_Y - 8);
        ctx.stroke();
      }

      // Draw launch platform
      const platformX = 50;
      const platformY = GROUND_Y - height * SCALE;
      
      // Platform base
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(platformX - 15, platformY, 30, height * SCALE + 10);
      
      // Cannon/launcher
      const angleRad = (angle * Math.PI) / 180;
      const cannonLength = 40;
      
      ctx.save();
      ctx.translate(platformX, platformY);
      ctx.rotate(-angleRad);
      
      // Cannon body
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, -8, cannonLength, 16);
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Cannon opening
      ctx.fillStyle = '#111827';
      ctx.fillRect(cannonLength - 5, -6, 10, 12);
      
      ctx.restore();

      // Draw scale markers
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      for (let i = 0; i <= 150; i += 25) {
        const x = 50 + i * SCALE;
        if (x < canvas.width - 20) {
          ctx.fillStyle = '#9ca3af';
          ctx.fillRect(x, GROUND_Y, 1, 10);
          ctx.fillStyle = '#6b7280';
          ctx.fillText(`${i}m`, x - 8, GROUND_Y + 25);
        }
      }

      // Draw projectile trail
      if (projectile && projectile.trail.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 2;
        
        projectile.trail.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();

        // Draw trail dots
        projectile.trail.forEach((point, index) => {
          if (index % 3 === 0) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(239, 68, 68, ${0.2 + (index / projectile.trail.length) * 0.5})`;
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // Draw projectile
      if (projectile) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(projectile.x, GROUND_Y + 5, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ball
        const gradient = ctx.createRadialGradient(
          projectile.x - 3, projectile.y - 3, 0,
          projectile.x, projectile.y, 12
        );
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(0.7, '#dc2626');
        gradient.addColorStop(1, '#b91c1c');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(projectile.x - 3, projectile.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Landing marker
        if (projectile.landed && projectile.landingX > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(projectile.landingX, GROUND_Y - 20);
          ctx.lineTo(projectile.landingX - 8, GROUND_Y);
          ctx.lineTo(projectile.landingX + 8, GROUND_Y);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Draw velocity preview arrow (when not running)
      if (!isRunning && !projectile) {
        const arrowLength = velocity * 0.8;
        const arrowAngle = (angle * Math.PI) / 180;
        const startX = platformX;
        const startY = platformY;
        const endX = startX + arrowLength * Math.cos(arrowAngle);
        const endY = startY - arrowLength * Math.sin(arrowAngle);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead
        const headLen = 10;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(arrowAngle - Math.PI / 6),
          endY + headLen * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - headLen * Math.cos(arrowAngle + Math.PI / 6),
          endY + headLen * Math.sin(arrowAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }

      // Display information panel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(canvas.width - 180, 10, 170, projectile ? 120 : 80);
      ctx.strokeStyle = '#e5e7eb';
      ctx.strokeRect(canvas.width - 180, 10, 170, projectile ? 120 : 80);

      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('📊 Stats', canvas.width - 170, 28);
      
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#4b5563';
      ctx.fillText(`Angle: ${angle}°`, canvas.width - 170, 48);
      ctx.fillText(`Velocity: ${velocity} m/s`, canvas.width - 170, 64);
      ctx.fillText(`Gravity: ${gravity} m/s²`, canvas.width - 170, 80);

      if (projectile) {
        const currentHeight = Math.max(0, (GROUND_Y - projectile.y) / SCALE);
        const distance = (projectile.x - 50) / SCALE;
        
        ctx.fillText(`Height: ${currentHeight.toFixed(1)} m`, canvas.width - 170, 100);
        ctx.fillText(`Distance: ${distance.toFixed(1)} m`, canvas.width - 170, 116);
        
        if (projectile.landed) {
          ctx.fillStyle = '#059669';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`Max Height: ${projectile.maxHeight.toFixed(1)} m`, canvas.width - 170, 132);
        }
      }
    };

    draw();

    // Animation loop
    if (isRunning && projectile && !projectile.landed) {
      let lastTime = performance.now();
      
      const animate = (currentTime: number) => {
        const realDeltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        // Use multiple physics steps for smooth simulation
        const fixedDt = 0.016;
        const steps = Math.min(Math.floor(realDeltaTime / fixedDt) + 1, 4);
        
        for (let step = 0; step < steps; step++) {
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
          
          // Run physics steps
          for (let step = 0; step < steps; step++) {
            // Physics calculation - gravity in pixels/s² (SCALE converts m to pixels)
            let ax = 0;
            let ay = gravity * SCALE;

            // Air resistance (drag force proportional to velocity squared)
            if (airResistance > 0) {
              const speed = Math.sqrt(currentVx * currentVx + currentVy * currentVy);
              if (speed > 0) {
                const dragFactor = airResistance * 0.001;
                ax -= dragFactor * currentVx * speed;
                ay -= dragFactor * currentVy * speed;
              }
            }

            currentVx += ax * fixedDt;
            currentVy += ay * fixedDt;
            currentX += currentVx * fixedDt;
            currentY += currentVy * fixedDt;
            
            // Track trail every few steps
            if (step % 2 === 0) {
              newTrail = [...newTrail.slice(-200), { x: currentX, y: currentY }];
            }
          }
          
          const newX = currentX;
          const newY = currentY;
          const newVx = currentVx;
          const newVy = currentVy;

          // Calculate current height for max height tracking
          const currentHeight = (GROUND_Y - newY) / SCALE + height;

          // Check if landed
          if (newY >= GROUND_Y) {
            return {
              ...prev,
              x: newX,
              y: GROUND_Y,
              vx: 0,
              vy: 0,
              landed: true,
              maxHeight: Math.max(prev.maxHeight, currentHeight),
              landingX: newX,
              trail: [...prev.trail, { x: newX, y: GROUND_Y }],
            };
          }

          // Check if out of bounds
          if (newX > canvasRef.current!.width + 50) {
            return {
              ...prev,
              landed: true,
              landingX: newX,
            };
          }

          return {
            ...prev,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            maxHeight: Math.max(currentMaxHeight, currentHeight),
            trail: newTrail,
          };
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [projectile, isRunning, angle, velocity, gravity, airResistance, height]);

  // Stop animation when projectile lands
  useEffect(() => {
    if (projectile?.landed) {
      setIsRunning(false);
    }
  }, [projectile?.landed]);

  return (
    <div className="space-y-6">
      {/* Canvas */}
      <div className="bg-gradient-to-b from-sky-100 to-sky-50 rounded-lg overflow-hidden border-2 border-gray-300 shadow-md max-w-4xl mx-auto">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-auto"
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Launch Angle (°)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="85"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                disabled={isRunning}
              />
              <input
                type="number"
                min="5"
                max="85"
                value={angleInput}
                onChange={(e) => setAngleInput(e.target.value)}
                onBlur={() => setAngle(Math.max(5, Math.min(85, Number(angleInput) || 45)))}
                onKeyDown={(e) => e.key === 'Enter' && setAngle(Math.max(5, Math.min(85, Number(angleInput) || 45)))}
                className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5°</span>
              <span>45° (optimal)</span>
              <span>85°</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Velocity (m/s)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="100"
                value={velocity}
                onChange={(e) => setVelocity(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                disabled={isRunning}
              />
              <input
                type="number"
                min="10"
                max="100"
                value={velocityInput}
                onChange={(e) => setVelocityInput(e.target.value)}
                onBlur={() => setVelocity(Math.max(10, Math.min(100, Number(velocityInput) || 50)))}
                onKeyDown={(e) => e.key === 'Enter' && setVelocity(Math.max(10, Math.min(100, Number(velocityInput) || 50)))}
                className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10 m/s</span>
              <span>55 m/s</span>
              <span>100 m/s</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Height (m)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="30"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                disabled={isRunning}
              />
              <input
                type="number"
                min="1"
                max="30"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                onBlur={() => setHeight(Math.max(1, Math.min(30, Number(heightInput) || 1)))}
                onKeyDown={(e) => e.key === 'Enter' && setHeight(Math.max(1, Math.min(30, Number(heightInput) || 1)))}
                className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 m (ground)</span>
              <span>15 m</span>
              <span>30 m</span>
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
                max="25"
                step="0.1"
                value={gravity}
                onChange={(e) => setGravity(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                disabled={isRunning}
              />
              <input
                type="number"
                min="1"
                max="25"
                step="0.1"
                value={gravityInput}
                onChange={(e) => setGravityInput(e.target.value)}
                onBlur={() => setGravity(Math.max(1, Math.min(25, Number(gravityInput) || 9.8)))}
                onKeyDown={(e) => e.key === 'Enter' && setGravity(Math.max(1, Math.min(25, Number(gravityInput) || 9.8)))}
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
              Air Resistance (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="50"
                value={airResistance}
                onChange={(e) => setAirResistance(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                disabled={isRunning}
              />
              <input
                type="number"
                min="0"
                max="50"
                value={airResistanceInput}
                onChange={(e) => setAirResistanceInput(e.target.value)}
                onBlur={() => setAirResistance(Math.max(0, Math.min(50, Number(airResistanceInput) || 0)))}
                onKeyDown={(e) => e.key === 'Enter' && setAirResistance(Math.max(0, Math.min(50, Number(airResistanceInput) || 0)))}
                className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md text-sm"
                disabled={isRunning}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Vacuum</span>
              <span>Light Air</span>
              <span>Heavy Drag</span>
            </div>
          </div>

          {/* Theoretical calculations */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-1">Theoretical (no air resistance):</p>
            <p className="text-xs text-gray-500">
              Max Range: {((velocity * velocity * Math.sin(2 * angle * Math.PI / 180)) / gravity).toFixed(1)} m
            </p>
            <p className="text-xs text-gray-500">
              Max Height: {((velocity * velocity * Math.sin(angle * Math.PI / 180) ** 2) / (2 * gravity) + height).toFixed(1)} m
            </p>
            <p className="text-xs text-gray-500">
              Flight Time: {((2 * velocity * Math.sin(angle * Math.PI / 180)) / gravity).toFixed(2)} s
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 max-w-4xl mx-auto">
        {!isRunning && !projectile?.landed ? (
          <button
            onClick={launch}
            className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🚀</span> Launch Projectile
          </button>
        ) : (
          <button
            onClick={reset}
            className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span> Reset
          </button>
        )}
      </div>

      {/* Results panel */}
      {projectile?.landed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-4xl mx-auto">
          <h3 className="font-medium text-green-900 mb-2">🎯 Results</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-green-700 font-medium">Distance</p>
              <p className="text-green-900 text-lg font-bold">{((projectile.landingX - 50) / SCALE).toFixed(1)} m</p>
            </div>
            <div>
              <p className="text-green-700 font-medium">Max Height</p>
              <p className="text-green-900 text-lg font-bold">{projectile.maxHeight.toFixed(1)} m</p>
            </div>
            <div>
              <p className="text-green-700 font-medium">Flight Time</p>
              <p className="text-green-900 text-lg font-bold">{timeRef.current.toFixed(2)} s</p>
            </div>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
        <h3 className="font-medium text-blue-900 mb-2">📚 Projectile Motion Physics</h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          Projectile motion is the motion of an object thrown into the air, subject to gravity and optionally air resistance. 
          The path followed is called a <strong>parabola</strong>. The optimal launch angle for maximum range (without air resistance) 
          is <strong>45°</strong>. With air resistance, objects experience drag that reduces their range and alters the trajectory.
        </p>
        <p className="text-xs text-blue-600 mt-2">
          Key equations: x = v₀·cos(θ)·t, y = v₀·sin(θ)·t - ½gt², Range = v₀²·sin(2θ)/g
        </p>
      </div>
    </div>
  );
}
