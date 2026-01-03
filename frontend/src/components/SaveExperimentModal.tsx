import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SaveExperimentModalProps {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function SaveExperimentModal({ onSave, onDiscard, onCancel }: SaveExperimentModalProps) {
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
              onClick={onSave}
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
