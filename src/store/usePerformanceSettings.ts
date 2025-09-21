import { create } from 'zustand'

export type PerfLevel = 'low' | 'medium' | 'high'

interface PerfState {
  level: PerfLevel
  setLevel: (lvl: PerfLevel) => void
}

export const usePerformanceSettings = create<PerfState>((set) => ({
  level: 'medium',
  setLevel: (lvl) => set({ level: lvl }),
}))
