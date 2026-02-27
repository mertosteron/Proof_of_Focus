import { useEffect, useState, useRef, useCallback } from 'react'
import { Play, Pause, Square, CheckCircle, Search, X, Trophy, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { useFocusStore } from '../store/useFocusStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

import { useMintTimer } from '../hooks/useMintTimer'

// TOPICS: Dev/tech focus areas (searchable list)
const TOPICS = [
    // Languages
    { id: 'python', name: 'Python', color: 'from-blue-500 to-cyan-500' },
    { id: 'rust', name: 'Rust', color: 'from-orange-500 to-red-600' },
    { id: 'typescript', name: 'TypeScript', color: 'from-blue-600 to-blue-400' },
    { id: 'javascript', name: 'JavaScript', color: 'from-yellow-400 to-yellow-600' },
    { id: 'go', name: 'Go', color: 'from-cyan-400 to-cyan-600' },
    { id: 'solidity', name: 'Solidity', color: 'from-gray-500 to-gray-700' },
    { id: 'move', name: 'Move', color: 'from-purple-500 to-indigo-600' },
    { id: 'cairo', name: 'Cairo', color: 'from-red-400 to-pink-600' },
    { id: 'cpp', name: 'C/C++', color: 'from-blue-700 to-blue-900' },
    { id: 'java', name: 'Java', color: 'from-red-600 to-red-800' },
    // Web3/Blockchain
    { id: 'smart-contracts', name: 'Smart Contracts', color: 'from-violet-500 to-purple-700' },
    { id: 'defi', name: 'DeFi', color: 'from-green-400 to-emerald-600' },
    { id: 'nft', name: 'NFT Development', color: 'from-pink-500 to-rose-600' },
    { id: 'web3', name: 'Web3', color: 'from-indigo-400 to-violet-600' },
    // Frontend/Backend
    { id: 'react', name: 'React', color: 'from-cyan-400 to-blue-500' },
    { id: 'nextjs', name: 'Next.js', color: 'from-gray-600 to-black' },
    { id: 'nodejs', name: 'Node.js', color: 'from-green-500 to-green-700' },
    { id: 'api', name: 'API Design', color: 'from-teal-400 to-teal-600' },
    { id: 'databases', name: 'Databases', color: 'from-blue-400 to-indigo-600' },
    // DevOps/Infra
    { id: 'devops', name: 'DevOps', color: 'from-sky-400 to-blue-600' },
    { id: 'docker', name: 'Docker/K8s', color: 'from-blue-400 to-blue-700' },
    { id: 'aws', name: 'AWS/Cloud', color: 'from-orange-400 to-yellow-600' },
    // Design/Other
    { id: 'design', name: 'UI/UX Design', color: 'from-pink-400 to-rose-500' },
    { id: 'system-design', name: 'System Design', color: 'from-slate-400 to-slate-600' },
    { id: 'algorithms', name: 'Algorithms', color: 'from-amber-400 to-orange-600' },
    { id: 'security', name: 'Security', color: 'from-red-500 to-rose-700' },
    { id: 'testing', name: 'Testing', color: 'from-lime-400 to-green-600' },
    { id: 'general', name: 'General', color: 'from-gray-400 to-gray-600' },
]

// Audio utility functions
const playSound = (type: 'click' | 'start' | 'stop' | 'success') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    switch (type) {
        case 'click':
            oscillator.frequency.value = 800
            gainNode.gain.value = 0.1
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.05)
            break
        case 'start':
            oscillator.frequency.value = 523 // C5
            gainNode.gain.value = 0.15
            oscillator.start()
            oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1) // E5
            oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2) // G5
            oscillator.stop(audioContext.currentTime + 0.3)
            break
        case 'stop':
            oscillator.frequency.value = 300
            gainNode.gain.value = 0.1
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.15)
            break
        case 'success':
            oscillator.type = 'sine'
            oscillator.frequency.value = 523 // C5
            gainNode.gain.value = 0.2
            oscillator.start()
            setTimeout(() => {
                oscillator.frequency.value = 659 // E5
            }, 150)
            setTimeout(() => {
                oscillator.frequency.value = 784 // G5
            }, 300)
            setTimeout(() => {
                oscillator.frequency.value = 1047 // C6
            }, 450)
            oscillator.stop(audioContext.currentTime + 0.6)
            break
    }
}

export function TimerDisplay() {
    const { status, timeLeft, initialDuration, startSession, pauseSession, resumeSession, stopSession, tick } = useFocusStore()
    const { mintFocusBlock } = useMintTimer()
    const settings = useSettingsStore()
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
    const [showCombobox, setShowCombobox] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const comboboxRef = useRef<HTMLDivElement>(null)

    // Long-press state for Stop button
    const [stopProgress, setStopProgress] = useState(0)
    const [isHoldingStop, setIsHoldingStop] = useState(false)
    const isHoldingRef = useRef(false)
    const stopHoldTimer = useRef<NodeJS.Timeout | null>(null)
    const stopStartTime = useRef<number>(0)

    // Session complete modal
    const [showCompleteModal, setShowCompleteModal] = useState(false)

    const selectedTopicData = TOPICS.find(t => t.id === selectedSubject)
    const filteredTopics = TOPICS.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Close combobox when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
                setShowCombobox(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleClaim = () => {
        const actualDuration = Math.round(initialDuration / 60000)
        mintFocusBlock(actualDuration, selectedTopicData?.name || 'Focus Session')
        stopSession()
        setSelectedSubject(null)
        setShowCompleteModal(false)
    }

    const handleStart = () => {
        if (!selectedSubject) {
            setShowCombobox(true)
            return
        }
        if (settings.soundEnabled) playSound('start')
        startSession()
    }

    const handlePause = () => {
        if (settings.strictMode) return // Can't pause in strict mode
        if (settings.soundEnabled) playSound('click')
        pauseSession()
    }

    const handleResume = () => {
        if (settings.soundEnabled) playSound('click')
        resumeSession()
    }

    // Long-press stop handlers
    const handleStopMouseDown = useCallback(() => {
        if (settings.soundEnabled) playSound('click')
        setIsHoldingStop(true)
        isHoldingRef.current = true
        stopStartTime.current = Date.now()

        // Animate progress over 2 seconds
        const updateProgress = () => {
            const elapsed = Date.now() - stopStartTime.current
            const progress = Math.min(elapsed / 2000, 1) // 2 seconds
            setStopProgress(progress)

            if (progress >= 1) {
                // Trigger stop
                if (settings.soundEnabled) playSound('stop')
                stopSession()
                setSelectedSubject(null)
                setIsHoldingStop(false)
                isHoldingRef.current = false
                setStopProgress(0)
            } else if (isHoldingRef.current) {
                stopHoldTimer.current = setTimeout(updateProgress, 16) // ~60fps
            }
        }
        stopHoldTimer.current = setTimeout(updateProgress, 16)
    }, [settings.soundEnabled, stopSession])

    const handleStopMouseUp = useCallback(() => {
        setIsHoldingStop(false)
        isHoldingRef.current = false
        setStopProgress(0)
        if (stopHoldTimer.current) {
            clearTimeout(stopHoldTimer.current)
            stopHoldTimer.current = null
        }
    }, [])

    // Show completion modal when session completes
    useEffect(() => {
        if (status === 'completed') {
            if (settings.soundEnabled) playSound('success')
            setShowCompleteModal(true)

            if (settings.desktopNotifs) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Focus Session Complete! 🎉', {
                        body: 'Great work! Click to claim your reward.',
                        icon: '/vite.svg'
                    })
                }
            }
        }
    }, [status, settings.desktopNotifs, settings.soundEnabled])

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
    const formatTime = (n: number) => n.toString().padStart(2, '0')

    // Progress for circular indicator
    const progressPercent = initialDuration > 0 ? ((initialDuration - timeLeft) / initialDuration) * 100 : 0
    const circumference = 2 * Math.PI * 140

    return (
        <div className="relative flex flex-col items-center justify-center flex-grow">
            {/* Session Complete Modal */}
            {showCompleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-panel rounded-3xl p-8 max-w-md w-full mx-4 text-center animate-in zoom-in-95 duration-300">
                        {/* Success Animation */}
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 animate-pulse opacity-50" />
                            <div className="absolute inset-2 rounded-full bg-black/50 flex items-center justify-center">
                                <Trophy size={40} className="text-yellow-400 animate-bounce" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-white mb-2">Well Done! 🎉</h2>
                        <p className="text-gray-400 mb-6">You've completed your focus session!</p>

                        {/* Session Stats */}
                        <div className="bg-white/5 rounded-2xl p-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-2xl font-bold text-cyan-400">
                                        {Math.round(initialDuration / 60000)}m
                                    </div>
                                    <div className="text-xs text-gray-500">Focus Time</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-400">
                                        {selectedTopicData?.name || 'Focus'}
                                    </div>
                                    <div className="text-xs text-gray-500">Topic</div>
                                </div>
                            </div>
                        </div>

                        {/* XP Progress */}
                        <div className="mb-6">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Sparkles size={16} className="text-yellow-400" />
                                <span className="text-sm text-gray-400">Skill Badge Progress</span>
                            </div>
                            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"
                                    style={{ width: '75%' }} />
                            </div>
                        </div>

                        {/* Claim Button */}
                        <button
                            onClick={handleClaim}
                            className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                        >
                            <CheckCircle size={20} />
                            Claim Reward & Mint NFT
                        </button>
                    </div>
                </div>
            )}

            {/* Circular Timer */}
            <div className="relative">
                {/* SVG Progress Ring */}
                <svg className="absolute -inset-8" width="320" height="320" viewBox="0 0 320 320">
                    <circle
                        cx="160" cy="160" r="140"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="8"
                    />
                    <circle
                        cx="160" cy="160" r="140"
                        fill="none"
                        stroke={status === 'running' ? '#3b82f6' : status === 'paused' ? '#eab308' : status === 'completed' ? '#10b981' : '#374151'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - (progressPercent / 100) * circumference}
                        transform="rotate(-90 160 160)"
                        className="transition-all duration-1000"
                        style={{
                            filter: status === 'running' ? 'drop-shadow(0 0 10px #3b82f6)' :
                                status === 'completed' ? 'drop-shadow(0 0 15px #10b981)' : 'none'
                        }}
                    />
                </svg>

                {/* Timer Display */}
                <div className="w-64 h-64 rounded-full glass-panel flex flex-col items-center justify-center relative z-10">
                    <div className={cn(
                        "text-6xl font-black tracking-tight transition-all",
                        status === 'running' && "text-blue-400 neon-text-blue",
                        status === 'idle' && "text-gray-500",
                        status === 'paused' && "text-yellow-400 neon-text-purple",
                        status === 'completed' && "text-emerald-400 neon-text-turquoise animate-pulse"
                    )}>
                        {formatTime(minutes)}:{formatTime(seconds)}
                    </div>
                    <div className={cn(
                        "text-sm font-medium mt-4 uppercase tracking-[0.4em] px-4 py-1 rounded-full border transition-all",
                        status === 'running' && "text-blue-400 border-blue-500/30 bg-blue-500/10",
                        status === 'idle' && "text-gray-500 border-white/10 bg-white/5",
                        status === 'paused' && "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
                        status === 'completed' && "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    )}>
                        {status}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 mt-8">
                {/* Topic Searchable Combobox - Only in idle state */}
                {status === 'idle' && (
                    <div className="relative mb-4" ref={comboboxRef}>
                        <div
                            className={cn(
                                "flex items-center gap-3 rounded-xl transition-all cursor-pointer border",
                                selectedSubject
                                    ? `bg-gradient-to-r ${selectedTopicData?.color} text-white shadow-lg border-transparent px-4 py-2`
                                    : "glass-panel border-white/10 hover:border-white/20 px-3 py-2"
                            )}
                            onClick={() => setShowCombobox(true)}
                        >
                            <Search size={16} className={selectedSubject ? "text-white/80" : "text-gray-500"} />
                            {showCombobox ? (
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search topic..."
                                    autoFocus
                                    className="bg-transparent border-none outline-none text-white placeholder-gray-500 w-[160px]"
                                />
                            ) : (
                                <span className="font-medium text-sm">
                                    {selectedTopicData?.name || 'Select Topic'}
                                </span>
                            )}
                            {selectedSubject && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedSubject(null)
                                        setSearchQuery('')
                                    }}
                                    className="ml-auto hover:bg-white/20 rounded p-0.5"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {showCombobox && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 glass-panel rounded-xl p-2 min-w-[240px] max-h-[280px] overflow-y-auto z-30 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                                {filteredTopics.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4 text-sm">No topics found</div>
                                ) : (
                                    filteredTopics.map(topic => (
                                        <button
                                            key={topic.id}
                                            onClick={() => {
                                                setSelectedSubject(topic.id)
                                                setShowCombobox(false)
                                                setSearchQuery('')
                                                if (settings.soundEnabled) playSound('click')
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 text-sm",
                                                selectedSubject === topic.id
                                                    ? `bg-gradient-to-r ${topic.color} text-white`
                                                    : "hover:bg-white/10 text-gray-300"
                                            )}
                                        >
                                            <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${topic.color}`} />
                                            {topic.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Play/Pause/Stop Controls */}
                <div className="flex items-center gap-4">
                    {status === 'idle' && (
                        <button
                            onClick={handleStart}
                            disabled={!selectedSubject}
                            className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                                selectedSubject
                                    ? "cyber-button-primary text-white hover:scale-110 shadow-lg shadow-blue-500/30"
                                    : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                            )}
                            style={selectedSubject ? {
                                boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)'
                            } : {}}
                            title={!selectedSubject ? "Select a topic first" : "Start focusing"}
                        >
                            <Play fill="currentColor" size={24} className="ml-1" />
                        </button>
                    )}

                    {status === 'running' && (
                        <>
                            {/* Pause button - disabled in strict mode */}
                            {!settings.strictMode && (
                                <button
                                    onClick={handlePause}
                                    className="w-16 h-16 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-yellow-600/30"
                                >
                                    <Pause fill="currentColor" size={24} />
                                </button>
                            )}

                            {/* Long-press Stop button */}
                            <button
                                onMouseDown={handleStopMouseDown}
                                onMouseUp={handleStopMouseUp}
                                onMouseLeave={handleStopMouseUp}
                                onTouchStart={handleStopMouseDown}
                                onTouchEnd={handleStopMouseUp}
                                className="w-14 h-14 rounded-full relative flex items-center justify-center transition-all border border-red-500/30 overflow-hidden"
                                style={{
                                    background: isHoldingStop
                                        ? `conic-gradient(#ef4444 ${stopProgress * 360}deg, rgba(239, 68, 68, 0.1) 0deg)`
                                        : 'rgba(239, 68, 68, 0.1)'
                                }}
                                title="Hold for 2 seconds to stop"
                            >
                                <Square fill="currentColor" size={16} className="text-red-400 relative z-10" />
                                {isHoldingStop && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[10px] text-red-400 font-bold mt-6">
                                            {Math.ceil(2 - stopProgress * 2)}s
                                        </span>
                                    </div>
                                )}
                            </button>
                        </>
                    )}

                    {status === 'paused' && (
                        <>
                            <button
                                onClick={handleResume}
                                className="w-16 h-16 rounded-full cyber-button-primary text-white flex items-center justify-center transition-all hover:scale-110"
                            >
                                <Play fill="currentColor" size={24} className="ml-1" />
                            </button>

                            {/* Long-press Stop button */}
                            <button
                                onMouseDown={handleStopMouseDown}
                                onMouseUp={handleStopMouseUp}
                                onMouseLeave={handleStopMouseUp}
                                onTouchStart={handleStopMouseDown}
                                onTouchEnd={handleStopMouseUp}
                                className="w-12 h-12 rounded-full relative flex items-center justify-center transition-all border border-red-500/30 overflow-hidden"
                                style={{
                                    background: isHoldingStop
                                        ? `conic-gradient(#ef4444 ${stopProgress * 360}deg, rgba(239, 68, 68, 0.1) 0deg)`
                                        : 'rgba(239, 68, 68, 0.1)'
                                }}
                                title="Hold for 2 seconds to stop"
                            >
                                <Square fill="currentColor" size={16} className="text-red-400 relative z-10" />
                            </button>
                        </>
                    )}

                    {status === 'completed' && !showCompleteModal && (
                        <button
                            onClick={() => setShowCompleteModal(true)}
                            className="px-8 py-3 cyber-button-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 animate-pulse"
                            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                        >
                            <CheckCircle size={20} />
                            Claim Reward
                        </button>
                    )}
                </div>

                {/* Strict Mode Indicator */}
                {settings.strictMode && status === 'running' && (
                    <div className="text-xs text-orange-400 flex items-center gap-1 mt-2">
                        <Volume2 size={12} />
                        Strict Mode: Pausing disabled
                    </div>
                )}

                {/* Sound indicator */}
                <button
                    onClick={() => settings.updateSettings({ soundEnabled: !settings.soundEnabled })}
                    className="text-gray-500 hover:text-gray-300 transition-colors mt-2"
                    title={settings.soundEnabled ? 'Mute sounds' : 'Enable sounds'}
                >
                    {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
            </div>
        </div>
    )
}
