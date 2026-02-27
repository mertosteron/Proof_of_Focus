import { useState } from 'react'
import { X, Check, Wallet, Sparkles } from 'lucide-react'
import { useSessionHistoryStore } from '../store/useSessionHistoryStore'
import type { ActivePFP } from '../store/useSessionHistoryStore'
import { useActivePFP } from '../store/useSessionHistoryStore'
import { useWalletStore } from '../store/useWalletStore'
import type { SkillBadge, StarterNFT } from './ProfilePFPHeader'

interface NFTSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    starterNFT?: StarterNFT | null
    skillBadges: SkillBadge[]
}

export function NFTSelectorModal({ isOpen, onClose, starterNFT, skillBadges }: NFTSelectorModalProps) {
    const activePFP = useActivePFP()
    const setActivePFP = useSessionHistoryStore(s => s.setActivePFP)
    const [selectedId, setSelectedId] = useState<string | null>(activePFP?.id || null)

    if (!isOpen) return null

    const allNFTs: (SkillBadge | StarterNFT)[] = [
        ...(starterNFT ? [starterNFT] : []),
        ...skillBadges
    ]

    const handleSelect = (nft: SkillBadge | StarterNFT) => {
        const isSkillBadge = 'skill_name' in nft
        const pfp: ActivePFP = {
            id: nft.id,
            type: isSkillBadge ? 'skill' : 'starter',
            name: isSkillBadge ? nft.skill_name : nft.name,
            level: isSkillBadge ? nft.level : undefined,
            imageUri: nft.image_uri
        }
        setSelectedId(nft.id)
        setActivePFP(pfp)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative glass-panel rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300 max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="text-purple-400" size={24} />
                            Select Your Avatar
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Choose from your Soulbound NFT collection</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* NFT Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {allNFTs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Wallet size={48} className="text-gray-600 mb-4" />
                            <h3 className="text-lg font-bold text-gray-400">No NFTs Found</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Complete focus sessions to earn Soulbound skill badges!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {allNFTs.map(nft => {
                                const isSkillBadge = 'skill_name' in nft
                                const name = isSkillBadge ? nft.skill_name : nft.name
                                const isSelected = selectedId === nft.id
                                const level = isSkillBadge ? nft.level : 0

                                return (
                                    <button
                                        key={nft.id}
                                        onClick={() => handleSelect(nft)}
                                        className={`
                                            relative p-4 rounded-2xl border transition-all duration-300 text-left
                                            ${isSelected
                                                ? 'border-blue-500 bg-blue-500/10 neon-glow-blue'
                                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        {/* Selected Indicator */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <Check size={14} className="text-white" />
                                            </div>
                                        )}

                                        {/* NFT Avatar */}
                                        <div className={`
                                            w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white
                                            ${isSkillBadge
                                                ? `bg-gradient-to-br ${getLevelGradient(level)}`
                                                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                            }
                                        `}>
                                            {isSkillBadge ? name.charAt(0).toUpperCase() : '⭐'}
                                        </div>

                                        {/* NFT Info */}
                                        <div className="text-center">
                                            <div className="font-bold text-white truncate">{name}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {isSkillBadge ? (
                                                    <span className="text-blue-400">Level {level}</span>
                                                ) : (
                                                    <span className="text-emerald-400">Starter</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Helper for level-based gradients
function getLevelGradient(level: number): string {
    switch (level) {
        case 1: return 'from-gray-500 to-gray-600'
        case 2: return 'from-green-500 to-emerald-600'
        case 3: return 'from-blue-500 to-indigo-600'
        case 4: return 'from-purple-500 to-violet-600'
        case 5: return 'from-yellow-500 to-orange-600'
        default: return 'from-gray-500 to-gray-600'
    }
}

// Top Right Profile Header Component
interface TopRightProfileProps {
    onOpenSelector: () => void
}

export function TopRightProfile({ onOpenSelector }: TopRightProfileProps) {
    const activePFP = useActivePFP()
    const { address, isConnected } = useWalletStore()

    if (!isConnected) return null

    const getAvatarContent = () => {
        if (!activePFP) {
            return (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-lg text-gray-400 border-2 border-white/10">
                    ?
                </div>
            )
        }

        // If we have an imageUri, show the actual image
        if (activePFP.imageUri) {
            return (
                <div className="avatar-glow">
                    <img
                        src={activePFP.imageUri}
                        alt={activePFP.name}
                        className="w-12 h-12 rounded-full object-cover relative z-10 ring-2 ring-cyan-500/50"
                    />
                </div>
            )
        }

        const gradient = activePFP.type === 'skill'
            ? getLevelGradient(activePFP.level || 1)
            : 'from-emerald-500 to-teal-600'

        return (
            <div className="avatar-glow">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-lg font-bold text-white relative z-10`}>
                    {activePFP.type === 'skill' ? activePFP.name.charAt(0).toUpperCase() : '⭐'}
                </div>
            </div>
        )
    }

    return (
        <button
            onClick={onOpenSelector}
            className="fixed top-4 right-4 z-40 flex items-center gap-3 glass-panel glass-panel-hover rounded-2xl px-4 py-2 transition-all hover:scale-105"
        >
            {getAvatarContent()}
            <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-white">
                    {activePFP?.name || 'Select Avatar'}
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
            </div>
        </button>
    )
}
