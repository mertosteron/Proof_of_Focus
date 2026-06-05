import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Settings {
  // Focus Session Settings
  focusDuration: number // in minutes
  shortBreak: number
  longBreak: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
  
  // Idle Detection
  idleThreshold: number // in minutes
  idleDetectionEnabled: boolean
  activityMonitoring: boolean
  
  // Privacy
  anonymousMode: boolean
  shareStats: boolean
  
  // Notifications
  soundEnabled: boolean
  desktopNotifs: boolean
  sessionReminders: boolean
  
  // Appearance
  theme: 'dark' | 'light' | 'auto'
  accentColor: 'blue' | 'purple' | 'green' | 'orange' | 'red'
}

interface SettingsStore extends Settings {
  updateSettings: (partial: Partial<Settings>) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  autoStartBreaks: false,
  autoStartFocus: false,
  idleThreshold: 5,
  idleDetectionEnabled: true,
  activityMonitoring: true,
  anonymousMode: false,
  shareStats: true,
  soundEnabled: true,
  desktopNotifs: true,
  sessionReminders: true,
  theme: 'dark',
  accentColor: 'blue',
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      
      updateSettings: (partial) => set((state) => ({ ...state, ...partial })),
      
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'pofocus-settings',
    }
  )
)

