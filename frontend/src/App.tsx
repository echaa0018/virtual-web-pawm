// src/App.tsx
import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Homepage } from './components/Homepage';
import { SimulationDetailPage } from './components/SimulationDetailPage';
import { AuthModal } from './components/AuthModal';
import { SaveExperimentModal } from './components/SaveExperimentModal';
import { UserProfile } from './components/UserProfile';
import { Toaster } from './components/ui/sonner';
import { supabase, getSimulations, getProfile } from './lib/supabase';
import type { Simulation } from './lib/supabase';

function App() {
  const [page, setPage] = useState<'home' | 'detail'>('home');
  const [selectedSim, setSelectedSim] = useState<any>(null);
  const [simulations, setSimulations] = useState<Simulation[]>([]); // List from Supabase
  const [user, setUser] = useState<any>(null);
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Current simulation parameters and save handler
  const [currentParams, setCurrentParams] = useState<any>(null);
  const [saveHandler, setSaveHandler] = useState<((name: string) => void) | null>(null);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage('home');
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header 
        isLoggedIn={!!user}
        user={user}
        onLoginClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
        onRegisterClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
        onSignOut={handleLogout}
        onLogoClick={() => setPage('home')}
        onProfileClick={() => setShowProfileModal(true)}
      />
      
      <div className="flex-1">
        {page === 'home' && (
          // Pass the real backend data to Homepage
          <Homepage 
            simulations={simulations} 
            onSimulationClick={(sim) => { setSelectedSim(sim); setPage('detail'); }} 
          />
        )}
        
        {page === 'detail' && selectedSim && (
          <SimulationDetailPage 
            simulation={selectedSim}
            user={user}
            onBack={() => setShowSaveModal(true)}
            onParamsChange={setCurrentParams}
            onSaveHandlerReady={(handler) => setSaveHandler(() => handler)}
          />
        )}
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

      {showSaveModal && (
        <SaveExperimentModal
           onDiscard={() => { setShowSaveModal(false); setPage('home'); }}
           onCancel={() => setShowSaveModal(false)}
           onSave={(experimentName) => {
             if (saveHandler) {
               saveHandler(experimentName);
             }
             setShowSaveModal(false);
             setPage('home');
           }}
           currentParams={currentParams}
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