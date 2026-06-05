import { useState, useEffect } from 'react'
import { PlusCircle, Users, Copy, ArrowRight } from 'lucide-react'
import { usePools, type PoolSummary } from '../hooks/usePools'

export function PoolsDashboard() {
    const [mode, setMode] = useState<'list' | 'create' | 'join'>('list')
    const [stakeInput, setStakeInput] = useState('1')
    const [poolIdInput, setPoolIdInput] = useState('')
    const [pools, setPools] = useState<PoolSummary[]>([])
    const [joinedPools, setJoinedPools] = useState<Set<string>>(new Set())
    const [joinDuration, setJoinDuration] = useState('5') // minutes
    const [workDuration, setWorkDuration] = useState('25') // minutes
    // Drives the live "Xm left" countdown; updated once a second so the render
    // stays a pure function of state instead of calling Date.now() inline.
    const [now, setNow] = useState(() => Date.now())
    const { createPool, joinPool, fetchPools, fetchUserParticipation } = usePools()

    useEffect(() => {
        if (mode === 'list') {
            fetchPools().then(data => setPools(data))
            fetchUserParticipation().then(data => setJoinedPools(data))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode])

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

    const handleCreate = () => {
        // Durations in MS
        const joinMs = Number(joinDuration) * 60 * 1000
        const workMs = Number(workDuration) * 60 * 1000
        const targetMs = workMs // For now target is same as work window

        createPool(Number(stakeInput), joinMs, workMs, targetMs)
    }

    const formatTimeLeft = (endMs: string) => {
        const diff = Number(endMs) - now
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
                                    <div key={pool.id} className="bg-black/20 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-lg text-white">Focus Pool</h4>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                                                        Join: {formatTimeLeft(pool.join_window_end)}
                                                    </span>
                                                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                                                        Target: {Number(pool.target_duration) / 60000}m
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold mb-1">
                                                    {Number(pool.stake_amount) / 1_000_000_000} SUI
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-mono">{pool.id.slice(0, 6)}...{pool.id.slice(-4)}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 text-sm text-gray-400 mb-6">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} />
                                                <span>{pool.participants} Joined</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setPoolIdInput(pool.id)
                                                setStakeInput((Number(pool.stake_amount) / 1_000_000_000).toString())
                                                setMode('join')
                                            }}
                                            disabled={joinedPools.has(pool.id)}
                                            className={`w-full py-3 rounded-lg font-bold text-sm transition-colors ${joinedPools.has(pool.id)
                                                ? 'bg-green-500/10 text-green-500 cursor-not-allowed border border-green-500/20'
                                                : 'bg-white/5 hover:bg-white/15 text-white'
                                                }`}
                                        >
                                            {joinedPools.has(pool.id) ? 'Already Joined' : 'Join Pool'}
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
