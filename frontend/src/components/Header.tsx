import React, { useState } from 'react';
import { Microscope, Menu, X, LogOut, User, Settings, HelpCircle } from 'lucide-react';

// Define the structure of the user data coming from the backend
interface UserData {
  id: number;
  email: string;
  name: string | null;
  profileImage?: string | null;
}

interface HeaderProps {
  isLoggedIn: boolean;
  user: UserData | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onSignOut: () => void;
  onLogoClick: () => void;
  onProfileClick: () => void;
}

export function Header({ 
  isLoggedIn, 
  user, 
  onLoginClick, 
  onRegisterClick, 
  onSignOut,
  onLogoClick,
  onProfileClick
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getDisplayInfo = () => {
    if (!user) return { displayName: '', initials: '' };
    const displayName = user.name || user.email.split('@')[0];
    const initials = displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return { displayName, initials };
  };

  const { displayName, initials } = getDisplayInfo();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-8 py-4">
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          
          {/* Logo and Brand */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer" 
            onClick={onLogoClick}
          >
            <div className="bg-teal-600 p-2 rounded-lg">
              <Microscope className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">VirtuLab</h1>
              <p className="text-xs sm:text-sm text-teal-600 font-medium">Interactive Physics Simulations</p>
            </div>
          </div>

          {/* Desktop Navigation & Auth Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn && user ? (
               <div className="relative">
                 <button 
                   onClick={() => setIsProfileOpen(!isProfileOpen)}
                   className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                 >
                   <div className="hidden sm:block text-left">
                     <p className="text-sm font-medium text-gray-700">{displayName}</p>
                     <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</p>
                   </div>
                   {user.profileImage ? (
                     <img 
                       src={user.profileImage} 
                       alt={displayName}
                       className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                     />
                   ) : (
                     <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-lg font-bold border-2 border-white shadow-sm">
                       {initials}
                     </div>
                   )}
                 </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsProfileOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 font-medium text-gray-700">
                      <div className="px-4 py-3 border-b border-gray-100 mb-1 sm:hidden">
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          onProfileClick();
                        }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" /> My Profile
                      </button>
                      <button className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <button className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 mb-1 border-b border-gray-100">
                        <HelpCircle className="w-4 h-4" /> Help & Support
                      </button>
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          onSignOut();
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
               </div>
            ) : (
              <>
                <button 
                  onClick={onLoginClick}
                  className="px-4 py-2 text-gray-700 hover:text-teal-600 font-medium transition-colors"
                >
                  Log In
                </button>
                <button 
                  onClick={onRegisterClick}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm"
                >
                  Sign Up Free
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-100">
            <nav className="flex flex-col gap-2 mt-4">
              <a href="#" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">All Simulations</a>
              <a href="#" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">By Topic</a>
              <a href="#" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">About Us</a>
            </nav>
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
              {isLoggedIn && user ? (
                <>
                   <div className="px-4 flex items-center gap-3 mb-4">
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-bold">
                        {initials}
                      </div>
                    )}
                     <div>
                       <p className="font-medium text-gray-900">{displayName}</p>
                       <p className="text-xs text-gray-500 truncate">{user.email}</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => {
                       setIsMenuOpen(false);
                       onProfileClick();
                     }}
                     className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 rounded-lg"
                   >
                     <User className="w-5 h-5 text-gray-500" /> My Profile
                   </button>
                   <button 
                     onClick={onSignOut}
                     className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                   >
                     <LogOut className="w-5 h-5" /> Sign Out
                   </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={onLoginClick}
                    className="w-full px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium border border-gray-300"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={onRegisterClick}
                    className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                  >
                    Sign Up Free
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}