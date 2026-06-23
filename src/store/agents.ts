import { create } from 'zustand';
import type { Agent } from '@/types';
import { agentsApi } from '@/lib/api';

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  createAgent: (data: Partial<Agent>) => Promise<Agent>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  getAgent: (id: string) => Agent | undefined;
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null });
    try {
      const agents = await agentsApi.list();
      set({ agents, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取智能体列表失败',
        loading: false,
      });
      throw error;
    }
  },

  createAgent: async (data) => {
    set({ loading: true, error: null });
    try {
      const agent = await agentsApi.create(data);
      set((state) => ({ agents: [agent, ...state.agents], loading: false }));
      return agent;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建智能体失败',
        loading: false,
      });
      throw error;
    }
  },

  updateAgent: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const agent = await agentsApi.update(id, data);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? agent : a)),
        loading: false,
      }));
      return agent;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新智能体失败',
        loading: false,
      });
      throw error;
    }
  },

  deleteAgent: async (id) => {
    set({ loading: true, error: null });
    try {
      await agentsApi.delete(id);
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除智能体失败',
        loading: false,
      });
      throw error;
    }
  },

  getAgent: (id) => {
    return get().agents.find((a) => a.id === id);
  },
}));
