import { useState, useEffect } from 'react'
import { PlusCircle, Users, Copy, ArrowRight, Lock, Globe } from 'lucide-react'
import { usePools } from '../hooks/usePools'

export function PoolsDashboard() {
    const [mode, setMode] = useState<'list' | 'create' | 'join'>('list')
    const [stakeInput, setStakeInput] = useState('1')
    const [poolIdInput, setPoolIdInput] = useState('')
    const [pools, setPools] = useState<any[]>([])
    const [joinedPools, setJoinedPools] = useState<Set<string>>(new Set())
    const [joinDuration, setJoinDuration] = useState('5') // minutes
    const [workDuration, setWorkDuration] = useState('25') // minutes
    const { createPool, joinPool, fetchPools, fetchUserParticipation } = usePools()

    useEffect(() => {
        if (mode === 'list') {
            fetchPools().then(data => setPools(data))
            fetchUserParticipation().then(data => setJoinedPools(data))
        }
    }, [mode])

    const handleCreate = () => {
        // Durations in MS
        const joinMs = Number(joinDuration) * 60 * 1000
        const workMs = Number(workDuration) * 60 * 1000
        const targetMs = workMs // For now target is same as work window

        createPool(Number(stakeInput), joinMs, workMs, targetMs)
    }

    const formatTimeLeft = (endMs: string) => {
        const diff = Number(endMs) - Date.now()
        if (diff <= 0) return "Closed"
        const mins = Math.floor(diff / 60000)
        return `${mins}m left`
    }

    const handleJoin = () => {
        if (!poolIdInput) return
        joinPool(poolIdInput, Number(stakeInput))
    }

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Accountability Pools</h2>
                    <p className="text-gray-400 mt-2">Stake SUI. Commit to focus. Earn from the lazy.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setMode('list')
                            fetchPools().then(data => setPools(data))
                            fetchUserParticipation().then(data => setJoinedPools(data))
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'list' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                    >
                        Browse
                    </button>
                    <button
                        onClick={() => setMode('create')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${mode === 'create' ? 'bg-blue-600 text-white' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'}`}
                    >
                        <PlusCircle size={18} /> Create Pool
                    </button>
                </div>
            </header>

            {/* Main Area */}
            <div className="bg-[#1e1e1e] border border-white/5 rounded-3xl p-8 min-h-[400px]">

                {mode === 'list' && (
                    <>
                        {pools.length === 0 ? (
                            <div className="text-center text-gray-500 py-20 flex flex-col items-center">
                                <Users size={48} className="mb-4 opacity-50" />
                                <p className="text-lg">No active pools found.</p>
                                <button onClick={() => setMode('create')} className="text-blue-400 hover:text-blue-300 mt-2">Create one to get started</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {pools.map(pool => (
                                    <div
                                        key={pool.id}
                                        className="group relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            backdropFilter: 'blur(12px)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
                                        }}
                                    >
                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                            style={{
                                                boxShadow: '0 0 30px rgba(59, 130, 246, 0.15), inset 0 0 20px rgba(59, 130, 246, 0.05)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)'
                                            }}
                                        />

                                        {/* Header Row */}
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <h4 className="font-bold text-lg text-white mb-1">
                                                    {pool.name || 'Focus Pool'}
                                                </h4>
                                                <p className="text-xs text-gray-500">by {pool.creator?.slice(0, 6) || 'anon'}...{pool.creator?.slice(-4) || ''}</p>
                                            </div>
                                            {/* Privacy Badge */}
                                            <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${pool.visibility === 'private'
                                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
                                                : 'bg-green-500/20 text-green-300 border border-green-500/20'
                                                }`}>
                                                {pool.visibility === 'private' ? <Lock size={10} /> : <Globe size={10} />}
                                                {pool.visibility === 'private' ? 'Private' : 'Public'}
                                            </span>
                                        </div>

                                        {/* Stake Amount - Featured */}
                                        <div className="mb-4 p-3 rounded-xl relative z-10"
                                            style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' }}>
                                            <div className="text-2xl font-bold text-white">
                                                {Number(pool.stake_amount) / 1_000_000_000} <span className="text-sm text-blue-400">SUI</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400">stake required</p>
                                        </div>

                                        {/* Info Row */}
                                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-blue-400" />
                                                <span className="font-medium text-white">{pool.participants || 0}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded">
                                                    {formatTimeLeft(pool.join_window_end)}
                                                </span>
                                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded">
                                                    {Number(pool.target_duration) / 60000}m target
                                                </span>
                                            </div>
                                        </div>

                                        {/* Join Button */}
                                        <button
                                            onClick={() => {
                                                setPoolIdInput(pool.id)
                                                setStakeInput((Number(pool.stake_amount) / 1_000_000_000).toString())
                                                setMode('join')
                                            }}
                                            disabled={joinedPools.has(pool.id)}
                                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all relative z-10 ${joinedPools.has(pool.id)
                                                ? 'bg-green-500/10 text-green-400 cursor-not-allowed border border-green-500/20'
                                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                                                }`}
                                        >
                                            {joinedPools.has(pool.id) ? '✓ Joined' : 'Join Pool'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {mode === 'create' && (
                    <div className="max-w-md mx-auto space-y-6">
                        <h3 className="text-xl font-bold text-white mb-6">Configure New Pool</h3>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Stake Amount (SUI)</label>
                            <input
                                type="number"
                                value={stakeInput}
                                onChange={(e) => setStakeInput(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Join Window (Mins)</label>
                                <input
                                    type="number"
                                    value={joinDuration}
                                    onChange={(e) => setJoinDuration(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Time allowed for others to join.</p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Focus Target (Mins)</label>
                                <input
                                    type="number"
                                    value={workDuration}
                                    onChange={(e) => setWorkDuration(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Duration of the focus session.</p>
                            </div>
                        </div>

                        <button
                            onClick={handleCreate}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-white hover:opacity-90 transition-opacity"
                        >
                            Deploy Pool
                        </button>

                        <button
                            onClick={() => setMode('list')}
                            className="w-full py-2 text-gray-500 text-sm hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {mode === 'join' && (
                    <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-white mb-6">Join Existing Pool</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Pool Object ID</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        readOnly
                                        value={poolIdInput}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed font-mono text-sm"
                                    />
                                    <div className="absolute right-3 top-3 text-gray-600">
                                        <Copy size={16} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Required Stake (SUI)</label>
                                <input
                                    type="number"
                                    readOnly
                                    value={stakeInput}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed focus:outline-none"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Determined by the pool issuer.</p>
                            </div>

                            <button
                                onClick={handleJoin}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                Join & Stake <ArrowRight size={18} />
                            </button>

                            <button
                                onClick={() => setMode('list')}
                                className="w-full py-2 text-gray-500 text-sm hover:text-white text-center"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
