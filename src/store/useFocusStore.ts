import { create } from 'zustand'

type FocusStatus = 'idle' | 'running' | 'paused' | 'completed'

interface FocusState {
    status: FocusStatus
    timeLeft: number // in milliseconds
    initialDuration: number
    startTime: number | null

    // Actions
    startSession: () => void
    pauseSession: () => void
    resumeSession: () => void
    stopSession: () => void
    tick: () => void
    setDuration: (minutes: number) => void
}

const DEFAULT_DURATION = 25 * 60 * 1000 // 25 minutes

export const useFocusStore = create<FocusState>((set, get) => ({
    status: 'idle',
    timeLeft: DEFAULT_DURATION,
    initialDuration: DEFAULT_DURATION,
    startTime: null,

    startSession: () => set({
        status: 'running',
        startTime: Date.now()
    }),

    pauseSession: () => set({ status: 'paused' }),

    resumeSession: () => set({ status: 'running' }),

    stopSession: () => set({
        status: 'idle',
        timeLeft: get().initialDuration,
        startTime: null
    }),

    tick: () => {
        const { status, timeLeft } = get()
        if (status !== 'running') return

        if (timeLeft <= 1000) {
            set({ status: 'completed', timeLeft: 0 })
        } else {
            set({ timeLeft: timeLeft - 1000 })
        }
    },

    setDuration: (minutes) => {
        const duration = minutes * 60 * 1000
        set({
            initialDuration: duration,
            timeLeft: duration
        })
    }
}))
