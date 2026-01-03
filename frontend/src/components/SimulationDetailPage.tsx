// src/components/SimulationDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { PendulumSimulator } from './PendulumSimulator';
import api from '../lib/axios';
import { Save, Download, X } from 'lucide-react';

interface Props {
  simulation: any;
  user: any;
  onBack: () => void;
}

export function SimulationDetailPage({ simulation, user, onBack }: Props) {
  const [activeTab, setActiveTab] = useState('simulation');
  const [currentParams, setCurrentParams] = useState<any>({}); // Current Sim State
  const [history, setHistory] = useState<any[]>([]); // Saved experiments
  const [showSaveUI, setShowSaveUI] = useState(false);
  const [loadedParams, setLoadedParams] = useState<any>(null); // Params loaded from saved experiment
  const [showSaveModal, setShowSaveModal] = useState(false); // Save modal visibility
  const [experimentName, setExperimentName] = useState(''); // Name for saved experiment

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
      alert("Please login to save progress");
      return;
    }
    
    // Check if we have parameters to save
    if (!currentParams || Object.keys(currentParams).length === 0) {
      alert("No simulation data to save. Please run the simulation first.");
      return;
    }
    
    setExperimentName('');
    setShowSaveModal(true);
  };

  const handleSave = async () => {
    if (!experimentName.trim()) {
      alert("Please enter a name for your experiment.");
      return;
    }
    
    try {
      await api.post('/save-progress', {
        simulationId: parseInt(simulation.id), // Ensure it's an integer
        name: experimentName.trim(),
        data: currentParams // <--- Saves the pendulum state (length, mass, etc)
      });
      alert('Experiment Saved!');
      setShowSaveModal(false);
      setExperimentName('');
    } catch (err: any) {
      console.error('Save error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert('Session expired. Please login again.');
      } else {
        alert('Failed to save: ' + (err.response?.data?.error || err.message));
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