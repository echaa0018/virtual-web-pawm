import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { PendulumSimulator } from './PendulumSimulator';
import { GraphPlotterSimulator } from './GraphPlotterSimulator';
import { PHMeterSimulator } from './PHMeterSimulator';
import { ProjectileMotionSimulator } from './ProjectileMotionSimulator';
import { supabase, getSimulationById, getSavedExperiments, saveExperiment } from '../lib/supabase';
import type { Simulation } from '../lib/supabase';
import type { AppOutletContext } from '../App';
import { toast } from 'sonner';
import { Save, X, Loader2 } from 'lucide-react';

// Local type definition for saved experiments
interface SavedExperimentState {
  id: number;
  user_id: string;
  simulation_id: number;
  name: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function SimulationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useOutletContext<AppOutletContext>();
  
  // Simulation data state
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('simulation');
  const [currentParams, setCurrentParams] = useState<any>({}); // Current Sim State
  const [history, setHistory] = useState<SavedExperimentState[]>([]); // Saved experiments
  const [loadedParams, setLoadedParams] = useState<any>(null); // Params loaded from saved experiment
  const [showSaveModal, setShowSaveModal] = useState(false); // Save modal visibility
  const [experimentName, setExperimentName] = useState(''); // Name for saved experiment
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // Loading state for history

  // Fetch simulation data when component mounts or ID changes
  useEffect(() => {
    const fetchSimulation = async () => {
      if (!id) {
        setError('No simulation ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await getSimulationById(parseInt(id));
        if (data) {
          setSimulation(data);
        } else {
          setError('Simulation not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch simulation:', err);
        setError('Failed to load simulation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimulation();
  }, [id]);

  // Function to fetch saved experiments from Supabase
  const fetchHistory = async () => {
    if (!user || !id) return;
    
    setIsLoadingHistory(true);
    try {
      const experiments = await getSavedExperiments(parseInt(id));
      setHistory(experiments);
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
      toast.error('Failed to load saved experiments');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch saved history when tab changes or user changes
  useEffect(() => {
    if (activeTab === 'saved' && user && id) {
      fetchHistory();
    }
  }, [activeTab, id, user]);

  const openSaveModal = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!user || !session) {
      toast.error("Please login to save progress");
      return;
    }
    
    // Check if we have parameters to save
    if (!currentParams || Object.keys(currentParams).length === 0) {
      toast.error("No simulation data to save. Please run the simulation first.");
      return;
    }
    
    setExperimentName('');
    setShowSaveModal(true);
  };

  const handleSave = async () => {
    if (!experimentName.trim() || !id) {
      toast.error("Please enter a name for your experiment.");
      return;
    }
    
    try {
      await saveExperiment(
        parseInt(id),
        experimentName.trim(),
        currentParams
      );
      toast.success('Experiment saved successfully!');
      setShowSaveModal(false);
      setExperimentName('');
      fetchHistory();
    } catch (err: any) {
      console.error('Save error:', err);
      if (err.message?.includes('logged in')) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to save: ' + err.message);
      }
    }
  };

  const handleLoadExperiment = (experimentData: any) => {
    setLoadedParams({ ...experimentData });
    setActiveTab('simulation');
  };

  const handleBack = () => {
    navigate('/');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading simulation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !simulation) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <X className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Simulation not found'}
          </h2>
          <p className="text-gray-500 mb-6">
            The simulation you're looking for doesn't exist or couldn't be loaded.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Logic to determine which simulator to render based on title or ID
  const renderSimulator = () => {
      const title = simulation.title?.toLowerCase() || '';
      
      if (title.includes('pendulum')) {
          return (
            <PendulumSimulator 
                onParametersChange={(params) => setCurrentParams(params)} 
                initialParams={loadedParams}
            />
          );
      } else if (title.includes('graph') || title.includes('math') || title.includes('function')) {
          return (
            <GraphPlotterSimulator 
                onParametersChange={(params) => setCurrentParams(params)} 
                initialParams={loadedParams}
            />
          );
      } else if (title.includes('ph') || title.includes('chem') || title.includes('scale')) {
          return (
            <PHMeterSimulator 
                onParametersChange={(params) => setCurrentParams(params)} 
                initialParams={loadedParams}
            />
          );
      } else if (title.includes('projectile') || title.includes('motion')) {
          return (
            <ProjectileMotionSimulator 
                onParametersChange={(params) => setCurrentParams(params)} 
                initialParams={loadedParams}
            />
          );
      } else {
          // Default fallback
          return (
            <div className="text-center py-20">
                <p className="text-gray-500">Simulation component not found for this type.</p>
            </div>
          );
      }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{simulation.title}</h1>
          <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 font-medium">Back to Home</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          <button onClick={() => setActiveTab('simulation')} className={`pb-2 px-2 transition-colors ${activeTab === 'simulation' ? 'border-b-2 border-teal-600 font-bold text-teal-800' : 'text-gray-600'}`}>Simulation</button>
          <button onClick={() => setActiveTab('saved')} className={`pb-2 px-2 transition-colors ${activeTab === 'saved' ? 'border-b-2 border-teal-600 font-bold text-teal-800' : 'text-gray-600'}`}>Saved Experiments</button>
        </div>

        {/* --- SIMULATION TAB --- */}
        {activeTab === 'simulation' && (
          <div>
            {/* Dynamic Simulator Rendering */}
            {simulation.config?.hasSimulation ? (
              <>
                {renderSimulator()}
                
                <div className="mt-8 flex justify-end border-t pt-6">
                  <button 
                    onClick={openSaveModal}
                    className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm transition-all hover:shadow-md"
                  >
                    <Save className="w-4 h-4" /> Save Current State
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Simulation in Progress</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  We're currently working on building this simulation. Check back soon for an interactive experience!
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  {simulation.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {!user ? (
               <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">Please log in to view saved experiments.</p>
               </div>
            ) : isLoadingHistory ? (
               <div className="text-center py-12">
                   <p className="text-gray-500">Loading saved experiments...</p>
               </div>
            ) : history.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                   <p className="text-gray-500">No saved experiments found.</p>
               </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 hover:bg-gray-100 transition-colors gap-4">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{item.name || `Experiment #${item.id}`}</p>
                    <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                    <p className="text-xs font-mono text-gray-500 mt-1 truncate max-w-md">
                      Data: {JSON.stringify(item.data).slice(0, 60)}...
                    </p>
                  </div>
                  <button 
                    onClick={() => handleLoadExperiment(item.data)}
                    className="w-full sm:w-auto px-5 py-2 bg-white border border-teal-600 text-teal-700 font-medium rounded hover:bg-teal-50 transition-colors"
                  >
                    Load
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Save Experiment</h2>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experiment Name
              </label>
              <input
                type="text"
                value={experimentName}
                onChange={(e) => setExperimentName(e.target.value)}
                placeholder="My Awesome Experiment"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                autoFocus
              />
            </div>

            {/* Current Parameters Preview */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Preview Data:</p>
              <p className="text-xs font-mono text-gray-600 break-all">
                {JSON.stringify(currentParams).slice(0, 100)}
                {JSON.stringify(currentParams).length > 100 ? '...' : ''}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Save Experiment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}