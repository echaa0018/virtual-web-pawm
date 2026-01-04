// frontend/src/lib/supabase.ts
// Supabase client for Vite frontend

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// Type Definitions
// ============================================================================

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface Simulation {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  image: string | null;
  is_new: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SimulationState {
  id: number;
  user_id: string;
  simulation_id: number;
  name: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Auth Helper Functions
// ============================================================================

export async function signUp(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || email.split('@')[0] }
    }
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ============================================================================
// Profile Functions
// ============================================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================================
// Simulation Functions
// ============================================================================

export async function getSimulations(): Promise<Simulation[]> {
  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function getSimulationById(id: number): Promise<Simulation | null> {
  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching simulation:', error);
    return null;
  }
  
  return data;
}

export async function getSimulationsByCategory(category: string): Promise<Simulation[]> {
  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// ============================================================================
// Saved Experiment Functions
// ============================================================================

export async function getSavedExperiments(simulationId: number): Promise<SimulationState[]> {
  const { data, error } = await supabase
    .from('simulation_states')
    .select('*')
    .eq('simulation_id', simulationId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function saveExperiment(
  simulationId: number,
  name: string,
  experimentData: Record<string, any>
): Promise<SimulationState> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Must be logged in to save experiments');
  
  const { data, error } = await supabase
    .from('simulation_states')
    .insert({
      user_id: user.id,
      simulation_id: simulationId,
      name,
      data: experimentData
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteExperiment(experimentId: number): Promise<void> {
  const { error } = await supabase
    .from('simulation_states')
    .delete()
    .eq('id', experimentId);
  
  if (error) throw error;
}

export async function updateExperiment(
  experimentId: number,
  updates: { name?: string; data?: Record<string, any> }
): Promise<SimulationState> {
  const { data, error } = await supabase
    .from('simulation_states')
    .update(updates)
    .eq('id', experimentId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
