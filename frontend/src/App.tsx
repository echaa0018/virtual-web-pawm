// src/App.tsx
import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Homepage } from './components/Homepage';
import { SimulationDetailPage } from './components/SimulationDetailPage';
import { AuthModal } from './components/AuthModal';
import { SaveExperimentModal } from './components/SaveExperimentModal';
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

  // 1. Check for logged in user on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchSimulations();
  }, []);

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
           // Pass a dummy function here, actual saving is handled inside DetailPage
           onSave={() => { setShowSaveModal(false); setPage('home'); }}
        />
      )}
    </div>
  );
}

export default App;