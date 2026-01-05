// src/App.tsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { Toaster } from './components/ui/sonner';
import { supabase, getSimulations, getProfile } from './lib/supabase';
import type { Simulation } from './lib/supabase';

// Context type for outlet
export interface AppOutletContext {
  user: any;
  simulations: Simulation[];
}

function App() {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<Simulation[]>([]); // List from Supabase
  const [user, setUser] = useState<any>(null);
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 1. Check for logged in user on load with Supabase
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setUser(null);
      }
    });

    fetchSimulations();

    return () => subscription.unsubscribe();
  }, []);

  // Load user data from Supabase profile
  const loadUserData = async (userId: string) => {
    try {
      const profile = await getProfile(userId);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (profile && authUser) {
        setUser({
          id: userId,
          email: authUser.email,
          name: profile.name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
          profileImage: profile.profile_image
        });
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

  // 2. Fetch Simulations from Supabase
  const fetchSimulations = async () => {
    try {
      const data = await getSimulations();
      setSimulations(data);
    } catch (err) {
      console.error("Failed to load simulations", err);
    }
  };

  // 3. Preload images for instant navigation (banner, simulation thumbnails)
  useEffect(() => {
    // Preload static homepage images (banner, etc.)
    const staticImages = ['/banner.png'];
    staticImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    // Preload simulation card images
    if (simulations.length > 0) {
      simulations.forEach(sim => {
        if (sim.image) {
          const img = new Image();
          img.src = sim.image;
        }
      });
    }
  }, [simulations]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setShowAuthModal(false);
  };

  // Context to pass to child routes
  const outletContext: AppOutletContext = {
    user,
    simulations,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header 
        isLoggedIn={!!user}
        user={user}
        onLoginClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
        onRegisterClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
        onSignOut={handleLogout}
        onLogoClick={() => navigate('/')}
        onProfileClick={() => setShowProfileModal(true)}
      />
      
      <div className="flex-1">
        <Outlet context={outletContext} />
      </div>

      <Footer />

      {showAuthModal && (
        <AuthModal 
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        />
      )}

      {showProfileModal && user && (
        <UserProfile
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdate={(updatedUser) => setUser(updatedUser)}
        />
      )}
      
      <Toaster position="top-center" />
    </div>
  );
}

export default App;