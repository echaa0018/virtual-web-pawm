import { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfile } from '../lib/supabase';

interface UserData {
  id?: string;
  email: string;
  name: string | null;
  profileImage?: string | null;
}

interface UserProfileProps {
  user: UserData;
  onClose: () => void;
  onUpdate: (updatedUser: UserData) => void;
}

export function UserProfile({ user, onClose, onUpdate }: UserProfileProps) {
  const [displayName, setDisplayName] = useState(user.name || '');
  const [profileImage, setProfileImage] = useState<string | null>(user.profileImage || null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    const name = displayName || user.email.split('@')[0];
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user.id) {
      toast.error('User ID not found');
      return;
    }
    
    setIsSaving(true);
    try {
      // Save to Supabase
      const updatedProfile = await updateProfile(user.id, { 
        name: displayName,
        profile_image: profileImage
      });
      
      const updatedUser = {
        ...user,
        name: updatedProfile.name,
        profileImage: updatedProfile.profile_image
      };
      
      onUpdate(updatedUser);
      toast.success('Profile updated successfully!');
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to save changes: ' + err.message);
    } finally {
      setIsSaving(false);
    }
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
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                  {getInitials()}
                </div>
              )}
              <button 
                type="button"
                className="absolute bottom-0 right-0 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
              {/* Remove profile picture button */}
              {profileImage && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileImage(null);
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  title="Remove profile picture"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
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

          {/* Email (Read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={user.email}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}