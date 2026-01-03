// src/components/SimulationDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { PendulumSimulator } from './PendulumSimulator';
import api from '../lib/axios';
import { toast } from 'sonner';
import { Save, Download, X } from 'lucide-react';

interface Props {
  simulation: any;
  user: any;
  onBack: () => void;
  onParamsChange?: (params: any) => void;
  onSaveHandlerReady?: (handler: (name: string) => void) => void;
}

export function SimulationDetailPage({ simulation, user, onBack, onParamsChange, onSaveHandlerReady }: Props) {
  const [activeTab, setActiveTab] = useState('simulation');
  const [currentParams, setCurrentParams] = useState<any>({}); // Current Sim State
  const [history, setHistory] = useState<any[]>([]); // Saved experiments
  const [showSaveUI, setShowSaveUI] = useState(false);
  const [loadedParams, setLoadedParams] = useState<any>(null); // Params loaded from saved experiment
  const [showSaveModal, setShowSaveModal] = useState(false); // Save modal visibility
  const [experimentName, setExperimentName] = useState(''); // Name for saved experiment
  // Notify parent when params change
  useEffect(() => {
    if (onParamsChange && currentParams) {
      onParamsChange(currentParams);
    }
  }, [currentParams, onParamsChange]);

  // Provide save handler to parent
  useEffect(() => {
    if (onSaveHandlerReady) {
      onSaveHandlerReady(async (name: string) => {
        try {
          await api.post('/save-progress', {
            simulationId: parseInt(simulation.id),
            name: name,
            data: currentParams
          });
          toast.success('Experiment saved successfully!');
        } catch (err: any) {
          console.error('Save error:', err);
          if (err.response?.status === 401 || err.response?.status === 403) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error('Failed to save: ' + (err.response?.data?.error || err.message));
          }
        }
      });
    }
  }, [simulation.id, currentParams, onSaveHandlerReady]);
  // Fetch saved history when tab changes
  useEffect(() => {
    if (activeTab === 'saved' && user) {
      api.get(`/my-history/${simulation.id}`)
         .then(res => setHistory(res.data))
         .catch(err => console.error(err));
    }
  }, [activeTab, simulation.id, user]);

  const openSaveModal = () => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
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
    if (!experimentName.trim()) {
      toast.error("Please enter a name for your experiment.");
      return;
    }
    
    try {
      await api.post('/save-progress', {
        simulationId: parseInt(simulation.id), // Ensure it's an integer
        name: experimentName.trim(),
        data: currentParams // <--- Saves the pendulum state (length, mass, etc)
      });
      toast.success('Experiment saved successfully!');
      setShowSaveModal(false);
      setExperimentName('');
    } catch (err: any) {
      console.error('Save error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to save: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleLoadExperiment = (experimentData: any) => {
    // Set the loaded parameters (this will trigger the simulator to update)
    setLoadedParams({ ...experimentData }); // Spread to create new reference
    // Switch to simulation tab
    setActiveTab('simulation');
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{simulation.title}</h1>
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700">Back to Home</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          <button onClick={() => setActiveTab('simulation')} className={`pb-2 ${activeTab === 'simulation' ? 'border-b-2 border-teal-600 font-bold' : ''}`}>Simulation</button>
          <button onClick={() => setActiveTab('saved')} className={`pb-2 ${activeTab === 'saved' ? 'border-b-2 border-teal-600 font-bold' : ''}`}>Saved Experiments</button>
        </div>

        {/* --- SIMULATION TAB --- */}
        {activeTab === 'simulation' && (
          <div>
            {/* Check if simulation has an active simulator */}
            {simulation.config?.hasSimulation ? (
              <>
                {/* Pass callback to capture state changes from the simulator */}
                <PendulumSimulator 
                  onParametersChange={(params) => setCurrentParams(params)} 
                  initialParams={loadedParams}
                />
                
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={openSaveModal}
                    className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded hover:bg-teal-700"
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
               <p>Please log in to view saved experiments.</p>
            ) : history.length === 0 ? (
               <p className="text-gray-500">No saved experiments found.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-4 border rounded flex justify-between items-center bg-gray-50">
                  <div>
                    <p className="font-bold text-gray-800">{item.name || `Experiment #${item.id}`}</p>
                    <p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                    {/* Display the JSON data cleanly */}
                    <p className="text-xs font-mono text-gray-600 mt-1">
                      {JSON.stringify(item.data).slice(0, 60)}...
                    </p>
                  </div>
                  <button 
                    onClick={() => handleLoadExperiment(item.data)}
                    className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm transition-colors"
                  >
                    Load Experiment
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
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
                placeholder="Enter a name for your experiment..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                autoFocus
              />
            </div>

            {/* Current Parameters Preview */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-1">Current Parameters:</p>
              <p className="text-sm font-mono text-gray-700">
                Length: {currentParams.length}cm, Mass: {currentParams.mass}kg, Gravity: {currentParams.gravity}m/s²
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
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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