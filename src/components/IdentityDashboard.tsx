import { useState, useEffect } from 'react'
import { Trophy, Activity, Zap, Plus, User, CheckCircle } from 'lucide-react'
import { useWalletStore } from '../store/useWalletStore'
import { useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { usePools, type PoolSummary } from '../hooks/usePools'
import { PACKAGE_ID } from '../constants'

const MODULE_NAME = 'identity'

interface UserProfile {
    id: string
    username: string
    level: number
    xp: number
    total_minutes: number
    total_sessions: number
}

export function IdentityDashboard() {
    const { keypair, address } = useWalletStore()
    const client = useSuiClient()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [iSCreating, setIsCreating] = useState(false)

    useEffect(() => {
        if (address) {
            fetchProfile()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address])

    const fetchProfile = async () => {
        if (!address) return
        setLoading(true)
        try {
            // Fetch UserProfile objects owned by address
            const objects = await client.getOwnedObjects({
                owner: address,
                filter: {
                    StructType: `${PACKAGE_ID}::${MODULE_NAME}::UserProfile`
                },
                options: {
                    showContent: true
                }
            })

            if (objects.data.length > 0) {
                const obj = objects.data[0]
                const content = obj.data?.content
                if (content?.dataType === 'moveObject') {
                    const fields = content.fields as Record<string, unknown>
                    setProfile({
                        id: obj.data?.objectId ?? '',
                        username: String(fields.username),
                        level: Number(fields.level),
                        xp: Number(fields.xp),
                        total_minutes: Number(fields.total_minutes),
                        total_sessions: Number(fields.total_sessions)
                    })
                }
            } else {
                setProfile(null)
            }
        } catch (e) {
            console.error("Failed to fetch profile", e)
        } finally {
            setLoading(false)
        }
    }

    const createProfile = async () => {
        console.log("Starting Profile Creation...", { username, keypair: !!keypair })
        if (!keypair || !username) {
            console.error("Missing keypair or username")
            return
        }
        setIsCreating(true)

        try {
            const tx = new Transaction()
            console.log("Building Transaction for:", `${PACKAGE_ID}::${MODULE_NAME}::create_profile`)
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::create_profile`,
                arguments: [tx.pure.string(username)]
            })

            console.log("Sending Transaction...")
            const result = await client.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: { showEffects: true, showObjectChanges: true }
            })

            console.log("Profile Created Result:", result)

            if (result.effects?.status.status === 'failure') {
                console.error("Transaction Failed:", result.effects.status.error)
                alert("Transaction Failed on Chain: " + result.effects.status.error)
            } else {
                alert("Profile Created! Welcome to POFocus " + username)
                fetchProfile() // Refresh
            }

        } catch (e) {
            console.error("Failed to create profile (Exception):", e)
            alert("Error creating profile: " + (e as Error).message)
        } finally {
            setIsCreating(false)
        }
    }

    if (loading) return <div className="text-center text-gray-500 mt-10">Loading Profile...</div>

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <User size={48} className="text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Create Your Identity</h2>
                    <p className="text-gray-400 mt-2">Start tracking your career progress on-chain. Earn XP and level up with every focus block.</p>
                </div>

                <div className="w-full space-y-3">
                    <input
                        type="text"
                        placeholder="Choose a Username"
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    <button
                        onClick={createProfile}
                        disabled={!username || iSCreating}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {iSCreating ? 'Minting Profile...' : 'Begin Journey'}
                        {!iSCreating && <Plus size={18} />}
                    </button>
                </div>
            </div>
        )
    }

    // Calculate XP Progress
    // Level formula: 1 + (XP / 100)
    // XP needed for next level: (Level * 100) - Current XP ?? 
    // Wait, simple formula used in contract: level = 1 + (xp/100). 
    // So distinct levels are at 0, 100, 200, 300.
    // Progress within level = XP % 100.
    const xpProgress = profile.xp % 100

    return (
        <div className="w-full h-full flex flex-col p-2 space-y-8 animate-in fade-in duration-500">
            {/* Split Layout: Profile Sidebar (Left) vs Content Area (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 min-h-[600px]">

                {/* Left Sidebar: Profile Identity (4 Cols) */}
                <div className="md:col-span-4 flex flex-col gap-6">
                    <div className="bg-gradient-to-b from-white/5 to-black border border-white/5 rounded-[32px] p-8 flex flex-col items-center text-center relative overflow-hidden shadow-2xl backdrop-blur-sm">
                        {/* Background Glow */}
                        <div className="absolute top-0 inset-x-0 h-32 bg-blue-500/10 blur-3xl"></div>

                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6 relative z-10 text-4xl font-bold text-white">
                            {profile.username[0].toUpperCase()}
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">{profile.username}</h2>
                        <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold mb-6">
                            LEVEL {profile.level}
                        </div>

                        {/* XP Bar */}
                        <div className="w-full bg-black/40 rounded-full h-3 mb-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${xpProgress}%` }}></div>
                        </div>
                        <div className="flex justify-between w-full text-[10px] text-gray-500 px-1 font-mono">
                            <span>{xpProgress} XP</span>
                            <span>100 XP</span>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5 w-full">
                            <div className="text-xs text-gray-500 mb-4 uppercase tracking-widest">Identity Hash</div>
                            <div className="bg-black/40 rounded-lg p-3 text-[10px] font-mono text-gray-400 break-all select-all border border-white/5 hover:border-white/10 transition-colors">
                                {profile.id}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content Area: Stats & Pools (8 Cols) */}
                <div className="md:col-span-8 flex flex-col gap-8">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Trophy size={24} className="text-yellow-500" />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{profile.total_sessions}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Sessions</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Activity size={24} className="text-blue-500" />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">
                                {Math.floor(profile.total_minutes / 60)}<span className="text-sm text-gray-500 ml-1">h</span> {profile.total_minutes % 60}<span className="text-sm text-gray-500 ml-1">m</span>
                            </div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Focus Time</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Zap size={24} className="text-purple-500" />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{profile.xp}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Total XP</div>
                        </div>
                    </div>

                    {/* Pools Section (Takes remaining space) */}
                    <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/5 rounded-[32px] p-8">
                        <ActivePoolsSection />
                    </div>
                </div>
            </div>
        </div>
    )
}

// Sub-component for Active Pools to check cleanliness
function ActivePoolsSection() {
    const { fetchPools, fetchUserParticipation, fetchUserClaims, fetchUserProofs, submitProof, claimReward } = usePools()
    const [myPools, setMyPools] = useState<PoolSummary[]>([])
    const [claimedPools, setClaimedPools] = useState<Set<string>>(new Set())
    const [proofPools, setProofPools] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const load = async () => {
            const joinedIds = await fetchUserParticipation()
            if (joinedIds.size === 0) {
                setLoading(false)
                return
            }

            // Parallel fetch
            const [allPools, claims, proofs] = await Promise.all([
                fetchPools(),
                fetchUserClaims(),
                fetchUserProofs()
            ])

            setClaimedPools(claims)
            setProofPools(proofs)
            const filtered = allPools.filter((p) => p && joinedIds.has(p.id))
            setMyPools(filtered)
            setLoading(false)
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading) return <div className="text-center text-gray-500">Loading pools...</div>
    if (myPools.length === 0) return null

    const getTimeRemaining = (targetTime: number) => {
        const diff = targetTime - now
        if (diff <= 0) return "Ended"
        const mins = Math.floor(diff / 60000)
        const secs = Math.floor((diff % 60000) / 1000)
        return `${mins}m ${secs}s`
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Active Pool Commitments
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">{myPools.length}</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {myPools.map(pool => {
                    const joinEnd = Number(pool.join_window_end)
                    const endTime = Number(pool.end_time)

                    let phase = 'Unknown'
                    let statusColor = 'text-gray-500'
                    let actionButton = null

                    if (now < joinEnd) {
                        phase = 'Joining Phase'
                        statusColor = 'text-blue-400'
                    } else if (now < endTime) {
                        phase = 'Execution Phase'
                        statusColor = 'text-yellow-400'
                        actionButton = (
                            <button
                                onClick={() => submitProof(pool.id, Number(pool.target_duration))}
                                className="mt-2 w-full bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <CheckCircle size={14} /> Submit Proof
                            </button>
                        )
                    } else {
                        phase = 'Ended'
                        statusColor = 'text-green-400'

                        const isWinner = proofPools.has(pool.id)

                        if (!isWinner) {
                            statusColor = 'text-red-400'
                            phase = 'Failed'
                            actionButton = (
                                <button
                                    disabled
                                    className="mt-2 w-full bg-red-900/20 border border-red-500/20 text-red-400 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 cursor-not-allowed"
                                >
                                    <Activity size={14} /> Mission Failed
                                </button>
                            )
                        } else if (claimedPools.has(pool.id)) {
                            actionButton = (
                                <button
                                    disabled
                                    className="mt-2 w-full bg-gray-600/50 text-gray-400 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 cursor-not-allowed"
                                >
                                    <Trophy size={14} /> Claimed ✓
                                </button>
                            )
                        } else {
                            actionButton = (
                                <button
                                    onClick={async () => {
                                        await claimReward(pool.id)
                                        window.location.reload()
                                    }}
                                    className="mt-2 w-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 animate-pulse"
                                >
                                    <Trophy size={14} /> Claim Reward
                                </button>
                            )
                        }
                    }

                    return (
                        <div key={pool.id} className="bg-[#1e1e1e]/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-white font-bold flex items-center gap-2">
                                        Focus Pool
                                        <span className={`text-[10px] uppercase tracking-wider border border-white/10 px-1.5 py-0.5 rounded ${statusColor}`}>{phase}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono mt-1">{pool.id.slice(0, 8)}...</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-blue-400 font-bold">{Number(pool.stake_amount) / 1_000_000_000} SUI</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-gray-500 bg-black/20 p-2 rounded-lg">
                                    <span>Mission:</span>
                                    <span className="font-mono text-white flex items-center gap-1">
                                        <Zap size={10} className="text-orange-400" />
                                        {Number(pool.target_duration) / 60000}m Focus
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 bg-black/20 p-2 rounded-lg">
                                    <span>Deadline:</span>
                                    <span className="font-mono text-white">{getTimeRemaining(endTime)}</span>
                                </div>
                            </div>

                            {actionButton}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
