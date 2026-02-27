import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Session record stored in history
export interface FocusSession {
    id: string
    date: string // ISO date string (YYYY-MM-DD)
    timestamp: number // Unix timestamp
    durationMinutes: number
    category: string
    completed: boolean
}

// PFP type matches smart contract + demo for custom images
export type PFPType = 'starter' | 'skill' | 'demo'

export interface ActivePFP {
    id: string
    type: PFPType
    name: string
    level?: number
    imageUri?: string // URL to custom image (used for 'demo' type)
}

interface SessionHistoryState {
    // Session History
    sessions: FocusSession[]

    // Computed Stats
    todayMinutes: number
    streak: number
    lastSessionDate: string | null

    // Active PFP
    activePFP: ActivePFP | null

    // Actions
    addSession: (session: Omit<FocusSession, 'id' | 'date'>) => void
    recalculateStats: () => void
    setActivePFP: (pfp: ActivePFP | null) => void
    clearHistory: () => void
}

// Helper: Get today's date in YYYY-MM-DD format (local timezone)
const getTodayDate = (): string => {
    const now = new Date()
    return now.toISOString().split('T')[0]
}

// Helper: Get yesterday's date in YYYY-MM-DD format
const getYesterdayDate = (): string => {
    const now = new Date()
    now.setDate(now.getDate() - 1)
    return now.toISOString().split('T')[0]
}

// Helper: Calculate streak from sessions
const calculateStreak = (sessions: FocusSession[]): number => {
    if (sessions.length === 0) return 0

    // Get unique dates with completed sessions, sorted descending
    const completedDates = [...new Set(
        sessions
            .filter(s => s.completed)
            .map(s => s.date)
    )].sort((a, b) => b.localeCompare(a))

    if (completedDates.length === 0) return 0

    const today = getTodayDate()
    const yesterday = getYesterdayDate()
    const lastDate = completedDates[0]

    // If last session is older than yesterday, streak is broken
    if (lastDate !== today && lastDate !== yesterday) {
        return 0
    }

    // Count consecutive days
    let streak = 1
    let currentDate = new Date(lastDate)

    for (let i = 1; i < completedDates.length; i++) {
        const prevDate = new Date(currentDate)
        prevDate.setDate(prevDate.getDate() - 1)
        const expectedDate = prevDate.toISOString().split('T')[0]

        if (completedDates[i] === expectedDate) {
            streak++
            currentDate = prevDate
        } else {
            break
        }
    }

    return streak
}

// Helper: Calculate today's total minutes
const calculateTodayMinutes = (sessions: FocusSession[]): number => {
    const today = getTodayDate()
    return sessions
        .filter(s => s.date === today && s.completed)
        .reduce((sum, s) => sum + s.durationMinutes, 0)
}

export const useSessionHistoryStore = create<SessionHistoryState>()(
    persist(
        (set, get) => ({
            sessions: [],
            todayMinutes: 0,
            streak: 0,
            lastSessionDate: null,
            activePFP: null,

            addSession: (sessionData) => {
                const today = getTodayDate()
                const newSession: FocusSession = {
                    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                    date: today,
                    ...sessionData
                }

                set(state => {
                    const newSessions = [...state.sessions, newSession]
                    return {
                        sessions: newSessions,
                        todayMinutes: calculateTodayMinutes(newSessions),
                        streak: calculateStreak(newSessions),
                        lastSessionDate: today
                    }
                })
            },

            recalculateStats: () => {
                const { sessions } = get()
                set({
                    todayMinutes: calculateTodayMinutes(sessions),
                    streak: calculateStreak(sessions)
                })
            },

            setActivePFP: (pfp) => {
                set({ activePFP: pfp })
            },

            clearHistory: () => {
                set({
                    sessions: [],
                    todayMinutes: 0,
                    streak: 0,
                    lastSessionDate: null
                })
            }
        }),
        {
            name: 'pofocus-session-history',
            // Recalculate stats when rehydrated from storage
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.recalculateStats()
                }
            }
        }
    )
)

// Selector hooks for convenience
export const useTodayFocus = () => useSessionHistoryStore(state => state.todayMinutes)
export const useStreak = () => useSessionHistoryStore(state => state.streak)
export const useActivePFP = () => useSessionHistoryStore(state => state.activePFP)
