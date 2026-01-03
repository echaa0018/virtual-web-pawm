import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface SaveExperimentModalProps {
  onSave: (experimentName: string) => void;
  onDiscard: () => void;
  onCancel: () => void;
  currentParams?: any;
}

export function SaveExperimentModal({ onSave, onDiscard, onCancel, currentParams }: SaveExperimentModalProps) {
  const [showNameInput, setShowNameInput] = useState(false);
  const [experimentName, setExperimentName] = useState('');

  const handleSaveClick = () => {
    setShowNameInput(true);
  };

  const handleConfirmSave = () => {
    if (!experimentName.trim()) {
      return; // Don't save if name is empty
    }
    onSave(experimentName.trim());
  };

  if (showNameInput) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Save Experiment</h2>

          {/* Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experiment Name
            </label>
            <input
              type="text"
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              placeholder="Enter a name for your experiment..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              autoFocus
            />
          </div>

          {/* Current Parameters Preview */}
          {currentParams && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-1">Current Parameters:</p>
              <p className="text-sm font-mono text-gray-700">
                {currentParams.length && `Length: ${currentParams.length}cm, `}
                {currentParams.mass && `Mass: ${currentParams.mass}kg, `}
                {currentParams.gravity && `Gravity: ${currentParams.gravity}m/s²`}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowNameInput(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirmSave}
              disabled={!experimentName.trim()}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Save Experiment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Icon */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-teal-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl text-gray-900 mb-3">
            Save Your Experiment?
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Do you want to save your experiment progress before leaving? 
            Your current settings and data will be preserved.
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSaveClick}
              className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Yes, Save Experiment
            </button>
            <button
              onClick={onDiscard}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              No, Discard Changes
            </button>
            <button
              onClick={onCancel}
              className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
