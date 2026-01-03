// src/components/AuthModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../lib/axios'; // Import our API client

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (userData: any) => void;
  onSwitchMode: () => void;
}

export function AuthModal({ mode, onClose, onSuccess, onSwitchMode }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // LOGIN
        const res = await api.post('/auth/login', { email, password });
        // Save token to browser storage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data));
        onSuccess(res.data);
      } else {
        // REGISTER
        await api.post('/auth/register', { email, password, name });
        // Auto login after register, or ask user to switch to login
        alert('Account created! Please sign in.');
        onSwitchMode();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl text-gray-900">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-600" /></button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Display Name"
                required
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Email Address"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Password"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={onSwitchMode} className="text-teal-600 hover:text-teal-700 font-medium">
              {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}