import React, { useState } from 'react';
import { X, Camera } from 'lucide-react';

interface UserProfileProps {
  onClose: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const [displayName, setDisplayName] = useState('Valereo Jibril');

  const handleSave = () => {
    // Save logic would go here
    console.log('Saving profile changes:', displayName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl text-gray-900">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-4xl">
                VJ
              </div>
              <button className="absolute bottom-0 right-0 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">Click to change profile picture</p>
          </div>

          {/* Display Name Field */}
          <div>
            <label htmlFor="display-name" className="block text-sm text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Enter your display name"
            />
          </div>

          {/* Student ID (Read-only) */}
          <div>
            <label htmlFor="student-id" className="block text-sm text-gray-700 mb-2">
              Student ID
            </label>
            <input
              type="text"
              id="student-id"
              value="18223030"
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Student ID cannot be changed</p>
          </div>

          {/* Email (Optional additional field) */}
          <div>
            <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value="valereo.jibril@university.edu"
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
