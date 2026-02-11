import { create } from 'zustand';
import { Environment } from '../types';

interface EnvState {
  environments: Environment[];
  selectedEnvId: string;
  isLoading: boolean;
  fetchEnvironments: () => Promise<void>;
  addEnvironment: (name: string) => Promise<void>;
  updateEnvironment: (id: string, data: Partial<Environment>) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  selectEnvironment: (id: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7002';

export const useEnvStore = create<EnvState>((set, get) => ({
  environments: [],
  selectedEnvId: 'env-dev', // Default
  isLoading: false,

  fetchEnvironments: async () => {
    // Only set loading on first load to prevent UI flicker on updates
    if (get().environments.length === 0) {
      set({ isLoading: true });
    }
    
    try {
      const res = await fetch(`${API_URL}/api/environments`);
      const data = await res.json();
      
      // Compare to avoid unnecessary re-renders
      const currentEnvs = get().environments;
      if (JSON.stringify(data) !== JSON.stringify(currentEnvs)) {
        set({ environments: data });
      }

      // Ensure selectedEnvId is valid
      const current = get().selectedEnvId;
      if (data.length > 0 && !data.find((e: Environment) => e.id === current)) {
        set({ selectedEnvId: data[0].id });
      }
    } catch (error) {
      console.error('Failed to fetch environments', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addEnvironment: async (name: string) => {
    try {
      const res = await fetch(`${API_URL}/api/environments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const newEnv = await res.json();
      set((state) => ({ environments: [...state.environments, newEnv] }));
    } catch (error) {
      console.error('Failed to add environment', error);
    }
  },

  updateEnvironment: async (id, data) => {
    try {
      const res = await fetch(`${API_URL}/api/environments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updatedEnv = await res.json();
      set((state) => ({
        environments: state.environments.map((e) => (e.id === id ? updatedEnv : e)),
      }));
    } catch (error) {
      console.error('Failed to update environment', error);
    }
  },

  deleteEnvironment: async (id: string) => {
    try {
      await fetch(`${API_URL}/api/environments/${id}`, {
        method: 'DELETE',
      });
      set((state) => ({
        environments: state.environments.filter((e) => e.id !== id),
        selectedEnvId: state.selectedEnvId === id ? (state.environments[0]?.id || '') : state.selectedEnvId
      }));
    } catch (error) {
      console.error('Failed to delete environment', error);
    }
  },

  selectEnvironment: (id: string) => {
    set({ selectedEnvId: id });
  }
}));
