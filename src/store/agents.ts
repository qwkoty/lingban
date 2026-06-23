import { create } from 'zustand';
import type { Agent } from '../types';
import { api } from '../lib/api';

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  fetchAgents: () => Promise<void>;
  createAgent: (data: Partial<Agent>) => Promise<Agent>;
  updateAgent: (id: number, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: number) => Promise<void>;
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  loading: false,

  fetchAgents: async () => {
    set({ loading: true });
    try {
      const { agents } = await api.getAgents();
      set({ agents, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createAgent: async (data) => {
    const { agent } = await api.createAgent(data);
    set({ agents: [agent, ...get().agents] });
    return agent;
  },

  updateAgent: async (id, data) => {
    const { agent } = await api.updateAgent(id, data);
    set({
      agents: get().agents.map((a) => (a.id === id ? agent : a)),
    });
  },

  deleteAgent: async (id) => {
    await api.deleteAgent(id);
    set({ agents: get().agents.filter((a) => a.id !== id) });
  },
}));
