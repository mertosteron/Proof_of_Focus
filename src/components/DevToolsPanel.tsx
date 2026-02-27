// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!! REMOVE THIS COMPONENT BEFORE MAINNET DEPLOYMENT !!!
// !!! This is for TESTING ONLY and allows arbitrary NFT state manipulation.
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import { useState } from 'react'
import { Bug, ChevronDown, ChevronUp, Zap, AlertTriangle, Clock } from 'lucide-react'

// Topics matching the contract
const DEBUG_TOPICS = [
    { id: 'python', name: 'Python' },
    { id: 'rust', name: 'Rust' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'move', name: 'Move' },
    { id: 'solidity', name: 'Solidity' },
    { id: 'react', name: 'React' },
    { id: 'design', name: 'UI/UX Design' },
    { id: 'defi', name: 'DeFi' },
    { id: 'general', name: 'General' },
]

// Evolution tiers for reference
const EVOLUTION_TIERS = [
    { level: 1, name: 'Novice', minHours: 0, minMinutes: 0 },
    { level: 2, name: 'Apprentice', minHours: 10, minMinutes: 600 },
    { level: 3, name: 'Master', minHours: 50, minMinutes: 3000 },
    { level: 4, name: 'Expert', minHours: 100, minMinutes: 6000 },
    { level: 5, name: 'Legend', minHours: 200, minMinutes: 12000 },
    { level: 6, name: 'Grandmaster', minHours: 500, minMinutes: 30000 },
]

interface DevToolsPanelProps {
    onDebugSetHours?: (topicId: string, minutes: number) => Promise<void>
}

export function DevToolsPanel({ onDebugSetHours }: DevToolsPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedTopic, setSelectedTopic] = useState('general')
    const [hoursInput, setHoursInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<string | null>(null)

    const handleForceUpdate = async () => {
        if (!hoursInput || !onDebugSetHours) return

        setIsLoading(true)
        setStatus('Sending transaction...')

        try {
            const minutes = Number(hoursInput) * 60
            await onDebugSetHours(selectedTopic, minutes)
            setStatus(`✓ Set ${hoursInput}h for ${selectedTopic}`)
        } catch (error) {
            setStatus(`✗ Error: ${error}`)
        } finally {
            setIsLoading(false)
            setTimeout(() => setStatus(null), 3000)
        }
    }

    const handlePreset = async (hours: number) => {
        if (!onDebugSetHours) {
            setStatus(`[Mock] Would set ${hours}h - no handler connected`)
            setTimeout(() => setStatus(null), 2000)
            return
        }

        setIsLoading(true)
        setStatus(`Setting ${hours}h...`)

        try {
            const minutes = hours * 60
            await onDebugSetHours(selectedTopic, minutes)
            setStatus(`✓ Set ${hours}h for ${selectedTopic}`)
        } catch (error) {
            setStatus(`✗ Error: ${error}`)
        } finally {
            setIsLoading(false)
            setTimeout(() => setStatus(null), 3000)
        }
    }

    return (
        <div className="mt-6 border border-yellow-500/30 rounded-2xl overflow-hidden bg-yellow-500/5">
            {/* Header - Click to expand */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-yellow-500/10 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                        <Bug size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                            🛠️ Developer Tools
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">DEV ONLY</span>
                        </h3>
                        <p className="text-xs text-gray-500">NFT Evolution Testing Panel</p>
                    </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-yellow-400" /> : <ChevronDown size={20} className="text-yellow-400" />}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-6 pb-6 space-y-4 border-t border-yellow-500/20">
                    {/* Warning Banner */}
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4">
                        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400">
                            <strong>WARNING:</strong> These tools bypass normal progression.
                            Remove before mainnet deployment!
                        </p>
                    </div>

                    {/* Evolution Tier Reference */}
                    <div className="p-3 bg-white/5 rounded-lg">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Evolution Tiers</h4>
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                            {EVOLUTION_TIERS.map(tier => (
                                <div key={tier.level} className="flex items-center gap-1">
                                    <span className="text-blue-400 font-bold">L{tier.level}</span>
                                    <span className="text-gray-500">{tier.name}</span>
                                    <span className="text-gray-600">({tier.minHours}h+)</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Topic Selector */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-2">Select Topic</label>
                        <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-yellow-500 outline-none text-sm"
                        >
                            {DEBUG_TOPICS.map(topic => (
                                <option key={topic.id} value={topic.id}>{topic.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Hours Input */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-2">Set Hours (converts to minutes)</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={hoursInput}
                                onChange={(e) => setHoursInput(e.target.value)}
                                placeholder="e.g., 100"
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-yellow-500 outline-none text-sm"
                            />
                            <button
                                onClick={handleForceUpdate}
                                disabled={isLoading || !hoursInput}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                            >
                                <Zap size={14} />
                                Force Update
                            </button>
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-2">Quick Presets (Just Before Tier)</label>
                        <div className="grid grid-cols-4 gap-2">
                            <button
                                onClick={() => handlePreset(9)}
                                disabled={isLoading}
                                className="py-2 px-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                                <Clock size={12} />
                                9h → L1
                            </button>
                            <button
                                onClick={() => handlePreset(49)}
                                disabled={isLoading}
                                className="py-2 px-3 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                                <Clock size={12} />
                                49h → L2
                            </button>
                            <button
                                onClick={() => handlePreset(99)}
                                disabled={isLoading}
                                className="py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                                <Clock size={12} />
                                99h → L3
                            </button>
                            <button
                                onClick={() => handlePreset(199)}
                                disabled={isLoading}
                                className="py-2 px-3 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                                <Clock size={12} />
                                199h → L4
                            </button>
                        </div>
                    </div>

                    {/* Jump TO Tier Presets */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-2">Jump TO Tier (Exact Threshold)</label>
                        <div className="grid grid-cols-6 gap-2">
                            {EVOLUTION_TIERS.map(tier => (
                                <button
                                    key={tier.level}
                                    onClick={() => handlePreset(tier.minHours)}
                                    disabled={isLoading}
                                    className="py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[10px] font-medium transition-colors"
                                >
                                    L{tier.level}: {tier.minHours}h
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    {status && (
                        <div className={`p-3 rounded-lg text-sm ${status.startsWith('✓') ? 'bg-green-500/10 text-green-400' : status.startsWith('✗') ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {status}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
