import { useEffect } from 'react'
import { Play, Pause, Square, CheckCircle } from 'lucide-react'
import { useFocusStore } from '../store/useFocusStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

import { useMintTimer } from '../hooks/useMintTimer'

export function TimerDisplay() {
    const { status, timeLeft, initialDuration, startSession, pauseSession, resumeSession, stopSession, tick } = useFocusStore()
    const { mintFocusBlock } = useMintTimer()
    const settings = useSettingsStore()

    const handleClaim = () => {
        // Use the actual focus duration from settings (convert ms to minutes)
        const actualDuration = Math.round(initialDuration / 60000)
        mintFocusBlock(actualDuration, "Focus Session")
        stopSession()
    }

    // Show notification when session completes
    useEffect(() => {
        if (status === 'completed' && settings.desktopNotifs) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Focus Session Complete! 🎉', {
                    body: 'Great work! Click to claim your reward.',
                    icon: '/vite.svg'
                })
            }
        }
    }, [status, settings.desktopNotifs])

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    // Timer Tick Effect
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (status === 'running') {
            interval = setInterval(tick, 1000)
        }
        return () => clearInterval(interval)
    }, [status, tick])

    // Formatting
    const minutes = Math.floor(timeLeft / 60000)
    const seconds = Math.floor((timeLeft % 60000) / 1000)
    const progress = ((initialDuration - timeLeft) / initialDuration) * 100

    const formatTime = (val: number) => val.toString().padStart(2, '0')

    return (
        <div className="flex flex-col items-center justify-center p-8 w-full h-full relative">
            {/* Circular Progress (CSS driven for simplicity or SVG) */}
            <div className="relative w-full max-w-lg aspect-square flex items-center justify-center mb-8">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-[12px] border-[#2a2a2a] shadow-inner"></div>

                {/* Progress Ring (Approximation with conic-gradient) */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `conic-gradient(#3b82f6 ${progress}%, transparent ${progress}%)`,
                        maskImage: 'radial-gradient(transparent 68%, black 69%)',
                        WebkitMaskImage: 'radial-gradient(transparent 68%, black 69%)'
                    }}
                ></div>

                {/* Time Display */}
                <div className="text-center z-10 flex flex-col items-center">
                    <div className={cn(
                        "text-[10vw] md:text-8xl font-mono font-bold tracking-tighter transition-colors duration-300 drop-shadow-2xl",
                        status === 'running' ? "text-white scale-110" : "text-gray-500",
                        status === 'completed' && "text-green-500"
                    )}>
                        {formatTime(minutes)}:{formatTime(seconds)}
                    </div>
                    <div className="text-xl font-medium text-gray-500 mt-4 uppercase tracking-[0.5em]">
                        {status}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                {status === 'idle' && (
                    <button
                        onClick={startSession}
                        className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-blue-900/40"
                    >
                        <Play fill="currentColor" size={24} className="ml-1" />
                    </button>
                )}

                {status === 'running' && (
                    <button
                        onClick={pauseSession}
                        className="w-16 h-16 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                    >
                        <Pause fill="currentColor" size={24} />
                    </button>
                )}

                {status === 'paused' && (
                    <>
                        <button
                            onClick={resumeSession}
                            className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                        >
                            <Play fill="currentColor" size={24} className="ml-1" />
                        </button>
                        <button
                            onClick={stopSession}
                            className="w-12 h-12 rounded-full bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white flex items-center justify-center transition-all"
                        >
                            <Square fill="currentColor" size={18} />
                        </button>
                    </>
                )}

                {status === 'completed' && (
                    <button
                        onClick={handleClaim}
                        className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 animate-pulse"
                    >
                        <CheckCircle size={20} />
                        Claim Reward
                    </button>
                )}
            </div>
        </div>
    )
}
