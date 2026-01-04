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
import api from './lib/axios';

function App() {
  const [page, setPage] = useState<'home' | 'detail'>('home');
  const [selectedSim, setSelectedSim] = useState<any>(null);
  const [simulations, setSimulations] = useState([]); // List from Backend
  const [user, setUser] = useState<any>(null);
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Current simulation parameters and save handler
  const [currentParams, setCurrentParams] = useState<any>(null);
  const [saveHandler, setSaveHandler] = useState<((name: string) => void) | null>(null);

  // 1. Check for logged in user on load and fetch fresh profile data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      // Set cached user first for immediate display
      setUser(JSON.parse(storedUser));
      // Then fetch fresh data from server
      fetchUserProfile();
    }
    fetchSimulations();
  }, []);

  // Fetch fresh user profile from server
  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      const freshUser = res.data;
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      // If token is invalid, log out
      if ((err as any)?.response?.status === 401 || (err as any)?.response?.status === 403) {
        handleLogout();
      }
    }
  };

  // 2. Fetch Simulations from Backend
  const fetchSimulations = async () => {
    try {
      const res = await api.get('/simulations');
      setSimulations(res.data);
    } catch (err) {
      console.error("Failed to load simulations", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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