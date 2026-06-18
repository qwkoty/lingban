import { create } from 'zustand'
import type { Agent, AgentFormData } from '../types'
import { agentApi } from '../lib/api'

interface AgentsState {
  agents: Agent[]
  loading: boolean
  fetchAgents: () => Promise<void>
  createAgent: (data: AgentFormData) => Promise<Agent>
  updateAgent: (id: number, data: Partial<AgentFormData>) => Promise<Agent>
  deleteAgent: (id: number) => Promise<void>
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  loading: false,

  fetchAgents: async () => {
    set({ loading: true })
    try {
      const { agents } = await agentApi.list()
      set({ agents, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createAgent: async (data: AgentFormData) => {
    const { agent } = await agentApi.create(data)
    set({ agents: [agent, ...get().agents] })
    return agent
  },

  updateAgent: async (id: number, data: Partial<AgentFormData>) => {
    const { agent } = await agentApi.update(id, data)
    set({ agents: get().agents.map((a) => (a.id === id ? agent : a)) })
    return agent
  },

  deleteAgent: async (id: number) => {
    await agentApi.delete(id)
    set({ agents: get().agents.filter((a) => a.id !== id) })
  },
}))
