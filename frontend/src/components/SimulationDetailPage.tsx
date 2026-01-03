// src/components/SimulationDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { PendulumSimulator } from './PendulumSimulator';
import api from '../lib/axios';
import { Save, Download } from 'lucide-react';

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

  // Fetch saved history when tab changes
  useEffect(() => {
    if (activeTab === 'saved' && user) {
      api.get(`/my-history/${simulation.id}`)
         .then(res => setHistory(res.data))
         .catch(err => console.error(err));
    }
  }, [activeTab, simulation.id, user]);

  const handleSave = async () => {
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
    
    try {
      await api.post('/save-progress', {
        simulationId: parseInt(simulation.id), // Ensure it's an integer
        data: currentParams // <--- Saves the pendulum state (length, mass, etc)
      });
      alert('Experiment Saved!');
      setShowSaveUI(false);
    } catch (err: any) {
      console.error('Save error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert('Session expired. Please login again.');
      } else {
        alert('Failed to save: ' + (err.response?.data?.error || err.message));
      }
    }
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
            <PendulumSimulator onParametersChange={(params) => setCurrentParams(params)} />
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSave}
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
                    <p className="font-bold text-gray-800">Experiment #{item.id}</p>
                    <p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                    {/* Display the JSON data cleanly */}
                    <p className="text-xs font-mono text-gray-600 mt-1">
                      {JSON.stringify(item.data).slice(0, 60)}...
                    </p>
                  </div>
                  <button className="text-teal-600 hover:underline text-sm">Load (Coming Soon)</button>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}