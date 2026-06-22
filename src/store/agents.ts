import { create } from 'zustand';
import type { Agent } from '../types';
import { agentsApi } from '../lib/api';

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  fetchAgents: () => Promise<void>;
  createAgent: (data: Partial<Agent>) => Promise<Agent>;
  updateAgent: (id: number, data: Partial<Agent>) => Promise<Agent>;
  deleteAgent: (id: number) => Promise<void>;
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  loading: false,

  fetchAgents: async () => {
    set({ loading: true });
    try {
      const { agents } = await agentsApi.list();
      set({ agents });
    } finally {
      set({ loading: false });
    }
  },

  createAgent: async (data) => {
    const { agent } = await agentsApi.create(data);
    set({ agents: [agent, ...get().agents] });
    return agent;
  },

  updateAgent: async (id, data) => {
    const { agent } = await agentsApi.update(id, data);
    set({
      agents: get().agents.map((a) => (a.id === id ? agent : a)),
    });
    return agent;
  },

  deleteAgent: async (id) => {
    await agentsApi.delete(id);
    set({ agents: get().agents.filter((a) => a.id !== id) });
  },
}));
