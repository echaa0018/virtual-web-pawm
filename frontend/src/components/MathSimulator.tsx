import { useEffect, useRef, useState } from 'react';

interface MathParams {
  expression: string;
  zoom: number;
}

interface MathSimulatorProps {
  onParametersChange?: (params: MathParams) => void;
  initialParams?: MathParams | null;
}

export function MathSimulator({ onParametersChange, initialParams }: MathSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expression, setExpression] = useState('Math.sin(x) * x');
  const [zoom, setZoom] = useState(30); // pixels per unit
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialParams) {
      setExpression(initialParams.expression || 'Math.sin(x) * x');
      setZoom(initialParams.zoom || 30);
    }
  }, [initialParams]);

  useEffect(() => {
    onParametersChange?.({ expression, zoom });
  }, [expression, zoom, onParametersChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = centerX % zoom; x < width; x += zoom) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Horizontal grid lines
    for (let y = centerY % zoom; y < height; y += zoom) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Plot Function
    ctx.strokeStyle = '#0d9488'; // teal-600
    ctx.lineWidth = 3;
    ctx.beginPath();

    setError(null);
    try {
      // Safe-ish evaluation for simple math demo
      // In production, use a library like mathjs instead of new Function
      const func = new Function('x', `return ${expression}`);

      let firstPoint = true;
      for (let px = 0; px < width; px++) {
        const x = (px - centerX) / zoom;
        let y = 0;
        try {
            y = func(x);
        } catch (e) {
            continue;
        }

        const py = centerY - y * zoom;

        // Skip if out of reasonable bounds to prevent artifacts
        if (py < -height || py > height * 2) {
             firstPoint = true;
             continue;
        }

        if (firstPoint) {
          ctx.moveTo(px, py);
          firstPoint = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    } catch (err) {
      setError('Invalid expression. Use JavaScript Math syntax (e.g., Math.sin(x))');
    }

  }, [expression, zoom]);

  return (
    <div className="space-y-6">
      {/* Canvas */}
      <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-300 shadow-md max-w-3xl mx-auto relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-auto"
        />
        {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-100 text-red-700 p-2 rounded text-center text-sm border border-red-200">
                {error}
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Function f(x) = 
          </label>
          <div className="flex gap-2">
             <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm"
                placeholder="Math.sin(x)"
             />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Examples: <button onClick={() => setExpression('Math.sin(x)')} className="text-teal-600 underline">Math.sin(x)</button>, <button onClick={() => setExpression('x*x/10')} className="text-teal-600 underline">x²/10</button>, <button onClick={() => setExpression('Math.cos(x) * x')} className="text-teal-600 underline">x·cos(x)</button>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zoom Level
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
        </div>
      </div>
    </div>
  );
}