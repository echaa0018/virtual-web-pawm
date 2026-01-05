import { useEffect, useRef, useState } from 'react';

interface GraphPlotterParams {
  expression: string;
  zoom: number;
}

interface GraphPlotterSimulatorProps {
  onParametersChange?: (params: GraphPlotterParams) => void;
  initialParams?: GraphPlotterParams | null;
}

export function GraphPlotterSimulator({ onParametersChange, initialParams }: GraphPlotterSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expression, setExpression] = useState('Math.sin(x) * x');
  const [zoom, setZoom] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

  // Predefined example functions
  const examples = [
    { label: 'sin(x)', value: 'Math.sin(x)' },
    { label: 'cos(x)', value: 'Math.cos(x)' },
    { label: 'x²', value: 'x*x/10' },
    { label: 'x·sin(x)', value: 'Math.sin(x) * x' },
    { label: 'x·cos(x)', value: 'Math.cos(x) * x' },
    { label: '1/x', value: '1/x' },
    { label: 'e^x', value: 'Math.exp(x/5)' },
    { label: 'tan(x)', value: 'Math.tan(x)' },
  ];

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = Math.min(500, width * 0.625); // 16:10 aspect ratio, max 500px
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    if (initialParams) {
      setExpression(initialParams.expression || 'Math.sin(x) * x');
      setZoom(initialParams.zoom || 30);
    }
  }, [initialParams]);

  useEffect(() => {
    onParametersChange?.({ expression, zoom });
  }, [expression, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvasSize.width;
    const height = canvasSize.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Set canvas resolution for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

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

    // Draw axis labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // X-axis labels
    for (let x = 0; x < width; x += zoom) {
      const value = Math.round((x - centerX) / zoom);
      if (value !== 0 && x !== centerX) {
        ctx.fillText(value.toString(), x, centerY + 5);
      }
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = 0; y < height; y += zoom) {
      const value = Math.round((centerY - y) / zoom);
      if (value !== 0 && y !== centerY) {
        ctx.fillText(value.toString(), centerX - 5, y);
      }
    }

    // Origin label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('0', centerX - 5, centerY + 5);

    // Plot Function
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 3;
    ctx.beginPath();

    setError(null);
    try {
      const func = new Function('x', `return ${expression}`);

      let firstPoint = true;
      let prevY: number | null = null;

      for (let px = 0; px < width; px++) {
        const x = (px - centerX) / zoom;
        let y = 0;
        
        try {
          y = func(x);
          
          // Check for discontinuities (e.g., tan function)
          if (!isFinite(y) || Math.abs(y) > 1000) {
            firstPoint = true;
            prevY = null;
            continue;
          }

          // Detect large jumps (discontinuities)
          if (prevY !== null && Math.abs(y - prevY) > height / zoom) {
            firstPoint = true;
          }
          
          prevY = y;

        } catch (e) {
          firstPoint = true;
          prevY = null;
          continue;
        }

        const py = centerY - y * zoom;

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

  }, [expression, zoom, canvasSize]);

  return (
    <div className="space-y-6">
      {/* Canvas Container */}
      <div ref={containerRef} className="bg-white rounded-lg overflow-hidden border-2 border-gray-300 shadow-md w-full mx-auto relative">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${canvasSize.height}px` }}
          className="touch-none"
        />
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-100 text-red-700 p-2 sm:p-3 rounded text-center text-xs sm:text-sm border border-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-6 w-full mx-auto bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200">
        {/* Function Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Function f(x) = 
          </label>
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm"
            placeholder="Math.sin(x)"
          />
        </div>

        {/* Example Functions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Examples
          </label>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.value}
                onClick={() => setExpression(example.value)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 rounded-md hover:bg-teal-50 hover:border-teal-500 transition-colors"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zoom Level: {zoom}
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Zoom Out</span>
            <span>Zoom In</span>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs sm:text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Use Math.sin(x), Math.cos(x), Math.tan(x) for trig functions</li>
            <li>Use x*x or Math.pow(x,2) for powers</li>
            <li>Use Math.exp(x) for exponential, Math.log(x) for logarithm</li>
            <li>Combine operations: Math.sin(x) * Math.cos(x)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
