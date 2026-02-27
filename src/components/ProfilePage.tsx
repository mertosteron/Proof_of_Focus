import { Wallet, Calendar, Award, Sparkles } from 'lucide-react'
import { useWalletStore } from '../store/useWalletStore'
import { useActivePFP, useSessionHistoryStore } from '../store/useSessionHistoryStore'
import { SkillShowcase } from './SkillShowcase'
import { DemoNFTCard } from './DemoNFTCard';

export function ProfilePage() {
    const { address, isConnected } = useWalletStore()
    const activePFP = useActivePFP()
    const sessions = useSessionHistoryStore(s => s.sessions)
    const setActivePFP = useSessionHistoryStore(s => s.setActivePFP)

    // Calculate member since (first session date or fallback)
    const firstSession = sessions.length > 0 ? sessions[0] : null
    const memberSince = firstSession
        ? new Date(firstSession.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Just joined'

    const totalHours = Math.floor(sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60)

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                    <Wallet size={40} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
                <p className="text-gray-400">Import your wallet to view your profile and NFT collection.</p>
            </div>
        )
    }

    const truncatedAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`

    return (
        <div className="w-full h-full flex flex-col p-2 space-y-8 animate-in fade-in duration-500 overflow-y-auto">
            {/* Profile Header */}
            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex items-center gap-8">
                    {/* Large Avatar */}
                    <div className="avatar-glow">
                        {activePFP?.imageUri ? (
                            <img
                                src={activePFP.imageUri}
                                alt={activePFP.name}
                                className="w-28 h-28 rounded-full object-cover relative z-10 shadow-xl ring-2 ring-cyan-500/50"
                            />
                        ) : (
                            <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white relative z-10 shadow-xl ${activePFP?.type === 'skill'
                                ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                }`}>
                                {activePFP?.type === 'skill'
                                    ? activePFP.name.charAt(0).toUpperCase()
                                    : '⭐'
                                }
                            </div>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {activePFP?.name || 'Explorer'}
                            {activePFP?.level && (
                                <span className="ml-3 text-lg text-blue-400">Lvl {activePFP.level}</span>
                            )}
                        </h1>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <span className="flex items-center gap-2">
                                <Wallet size={14} className="text-blue-400" />
                                <span className="font-mono neon-text-blue">{truncatedAddress}</span>
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar size={14} className="text-purple-400" />
                                Member since {memberSince}
                            </span>
                            <span className="flex items-center gap-2">
                                <Award size={14} className="text-emerald-400" />
                                {totalHours}h focused
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* NFT Showcase Section */}
            <div className="glass-panel rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="text-purple-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Soulbound Collection</h2>
                </div>
                <SkillShowcase
                    starterNFT={{ id: 'starter-001', name: 'Novice Explorer', image_uri: '' }}
                    skillBadges={[]}
                    activePFPId={activePFP?.id}
                    onSetPFP={async (badgeId, pfpType) => {
                        // Simple local-only for now
                        if (pfpType === 1) {
                            setActivePFP({ id: badgeId, type: 'starter', name: 'Novice Explorer' })
                        }
                    }}
                />
                <DemoNFTCard
                    title="Move Master"
                    image="/Gemini.png"
                    level={5}
                    rank="Legend"
                    hours={200}
                    isActivePFP={activePFP?.id === 'demo-move'}
                />

                {/* Python Pro Kartı */}
                <DemoNFTCard
                    title="Python Pro"
                    image="/python.png"
                    level={3}
                    rank="Expert"
                    hours={85}
                    isActivePFP={activePFP?.id === 'demo-python'}
                />
            </div>
        </div>
    )
}
