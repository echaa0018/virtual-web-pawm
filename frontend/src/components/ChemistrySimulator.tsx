import { useEffect, useState } from 'react';

interface ChemParams {
  ph: number;
}

interface ChemistrySimulatorProps {
  onParametersChange?: (params: ChemParams) => void;
  initialParams?: ChemParams | null;
}

export function ChemistrySimulator({ onParametersChange, initialParams }: ChemistrySimulatorProps) {
  const [ph, setPh] = useState(7);

  useEffect(() => {
    if (initialParams) {
      setPh(initialParams.ph || 7);
    }
  }, [initialParams]);

  useEffect(() => {
    onParametersChange?.({ ph });
  }, [ph, onParametersChange]);

  // Determine liquid color based on pH
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

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Visualization Area */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        
        {/* Beaker Container */}
        <div className="relative w-48 h-64 border-b-4 border-x-4 border-gray-400 rounded-b-xl bg-gray-50/50 backdrop-blur-sm overflow-hidden">
            {/* Liquid */}
            <div 
                className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ease-in-out ${getLiquidColor(ph)} opacity-80`}
                style={{ height: '70%' }}
            >
                {/* Bubbles effect */}
                <div className="absolute top-0 w-full h-2 bg-white/30 animate-pulse"></div>
            </div>
            
            {/* Measurements Lines */}
            <div className="absolute inset-0 flex flex-col justify-end pb-[10%] px-2 space-y-6 pointer-events-none">
                <div className="w-8 h-0.5 bg-gray-400/50 self-end"></div>
                <div className="w-12 h-0.5 bg-gray-400/80 self-end"></div>
                <div className="w-8 h-0.5 bg-gray-400/50 self-end"></div>
                <div className="w-12 h-0.5 bg-gray-400/80 self-end"></div>
            </div>

            {/* PH Probe (Visual only) */}
            <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-4 h-[80%] bg-gray-800 rounded-b-full shadow-lg z-10"></div>
        </div>

        {/* Digital Display */}
        <div className="mt-8 bg-gray-800 p-4 rounded-lg shadow-inner border-4 border-gray-700">
            <div className="font-mono text-4xl font-bold text-green-400 tracking-wider">
                pH {ph.toFixed(1)}
            </div>
        </div>
        
        <p className="mt-4 text-xl font-medium text-gray-700">
            Substance: <span className="text-teal-600">{getSubstanceName(ph)}</span>
        </p>

      </div>

      {/* Controls */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-4">
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
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
            <span>0 (Acidic)</span>
            <span>7 (Neutral)</span>
            <span>14 (Basic)</span>
        </div>
      </div>
    </div>
  );
}