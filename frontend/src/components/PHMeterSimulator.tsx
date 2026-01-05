import { useEffect, useState } from 'react';

interface PHMeterParams {
  ph: number;
}

interface PHMeterSimulatorProps {
  onParametersChange?: (params: PHMeterParams) => void;
  initialParams?: PHMeterParams | null;
}

export function PHMeterSimulator({ onParametersChange, initialParams }: PHMeterSimulatorProps) {
  const [ph, setPh] = useState(7);

  useEffect(() => {
    if (initialParams) {
      setPh(initialParams.ph || 7);
    }
  }, [initialParams]);

  useEffect(() => {
    onParametersChange?.({ ph });
  }, [ph, onParametersChange]);

  const getLiquidColor = (ph: number) => {
    if (ph < 3) return 'bg-red-500';
    if (ph < 5) return 'bg-orange-400';
    if (ph < 7) return 'bg-yellow-300';
    if (ph === 7) return 'bg-green-500';
    if (ph < 10) return 'bg-teal-400';
    if (ph < 12) return 'bg-blue-500';
    return 'bg-purple-600';
  };

  const getSubstanceName = (ph: number) => {
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

  const getDescription = (ph: number): string => {
    if (ph < 3) return 'Highly corrosive. Can cause severe burns.';
    if (ph < 6) return 'Mildly acidic. Common in citrus fruits and vinegar.';
    if (ph === 7) return 'Perfectly balanced. Neither acidic nor basic.';
    if (ph < 11) return 'Mildly basic. Found in soaps and cleaning products.';
    return 'Highly caustic. Can cause severe chemical burns.';
  };

  // Quick pH presets
  const presets = [
    { label: 'Lemon', value: 2 },
    { label: 'Coffee', value: 5 },
    { label: 'Water', value: 7 },
    { label: 'Soap', value: 10 },
    { label: 'Bleach', value: 13 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 w-full mx-auto">
      {/* Visualization Area */}
      <div className="bg-white p-4 sm:p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[350px] sm:min-h-[400px]">
        
        {/* Beaker Container */}
        <div className="relative w-32 h-48 sm:w-48 sm:h-64 border-b-4 border-x-4 border-gray-400 rounded-b-xl bg-gray-50/50 backdrop-blur-sm overflow-hidden">
          {/* Liquid */}
          <div 
            className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ease-in-out ${getLiquidColor(ph)} opacity-80`}
            style={{ height: '70%' }}
          >
            {/* Bubbles effect */}
            <div className="absolute top-0 w-full h-2 bg-white/30 animate-pulse"></div>
          </div>
          
          {/* Measurements Lines */}
          <div className="absolute inset-0 flex flex-col justify-end pb-[10%] px-2 space-y-4 sm:space-y-6 pointer-events-none">
            <div className="w-6 sm:w-8 h-0.5 bg-gray-400/50 self-end"></div>
            <div className="w-8 sm:w-12 h-0.5 bg-gray-400/80 self-end"></div>
            <div className="w-6 sm:w-8 h-0.5 bg-gray-400/50 self-end"></div>
            <div className="w-8 sm:w-12 h-0.5 bg-gray-400/80 self-end"></div>
          </div>

          {/* PH Probe (Visual only) */}
          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-3 sm:w-4 h-[80%] bg-gray-800 rounded-b-full shadow-lg z-10"></div>
        </div>

        {/* Digital Display */}
        <div className="mt-6 sm:mt-8 bg-gray-800 p-3 sm:p-4 rounded-lg shadow-inner border-4 border-gray-700">
          <div className="font-mono text-3xl sm:text-4xl font-bold text-green-400 tracking-wider">
            pH {ph.toFixed(1)}
          </div>
        </div>
        
        {/* Substance Info */}
        <div className="mt-4 text-center space-y-1 sm:space-y-2">
          <p className="text-lg sm:text-xl font-medium text-gray-700">
            <span className="text-teal-600">{getSubstanceName(ph)}</span>
          </p>
          <p className="text-sm sm:text-base font-semibold text-gray-800">
            {getAcidityLevel(ph)}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200 space-y-4 sm:space-y-6">
        {/* Main pH Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 sm:mb-4">
            pH Level Adjuster
          </label>
          <input
            type="range"
            min="0"
            max="14"
            step="0.1"
            value={ph}
            onChange={(e) => setPh(Number(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-red-500 via-green-500 to-purple-600 rounded-lg appearance-none cursor-pointer"
            style={{
              WebkitAppearance: 'none',
              background: 'linear-gradient(to right, #ef4444, #f97316, #fde047, #22c55e, #14b8a6, #3b82f6, #a855f7)',
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
            <span>0 (Acidic)</span>
            <span className="hidden sm:inline">7 (Neutral)</span>
            <span>14 (Basic)</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setPh(preset.value)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                  Math.abs(ph - preset.value) < 0.5
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-teal-50 hover:border-teal-500'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fine Adjustment Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPh(Math.max(0, ph - 0.1))}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm sm:text-base"
          >
            - 0.1
          </button>
          <button
            onClick={() => setPh(7)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm sm:text-base"
          >
            Reset to 7
          </button>
          <button
            onClick={() => setPh(Math.min(14, ph + 0.1))}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm sm:text-base"
          >
            + 0.1
          </button>
        </div>

        {/* Description Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-blue-800">
            <span className="font-semibold">ℹ️ Info:</span> {getDescription(ph)}
          </p>
        </div>

        {/* pH Scale Reference */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">pH Scale Reference:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between"><span>0-3: Strongly Acidic</span><span className="text-red-600">●</span></div>
            <div className="flex justify-between"><span>3-6: Weakly Acidic</span><span className="text-orange-500">●</span></div>
            <div className="flex justify-between"><span>7: Neutral</span><span className="text-green-600">●</span></div>
            <div className="flex justify-between"><span>8-11: Weakly Basic</span><span className="text-blue-500">●</span></div>
            <div className="flex justify-between"><span>11-14: Strongly Basic</span><span className="text-purple-600">●</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
