import { X, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import type { SkillBadge, StarterNFT } from './ProfilePFPHeader'

interface SetPFPModalProps {
    isOpen: boolean
    badge: SkillBadge | StarterNFT | null
    isCurrentPFP: boolean
    onClose: () => void
    onSetAsPFP: () => void
    isLoading?: boolean
}

function getLevelColor(level: number): string {
    switch (level) {
        case 1: return 'from-gray-500 to-gray-600'
        case 2: return 'from-green-500 to-emerald-600'
        case 3: return 'from-blue-500 to-indigo-600'
        case 4: return 'from-purple-500 to-violet-600'
        case 5: return 'from-yellow-500 to-orange-600'
        default: return 'from-gray-500 to-gray-600'
    }
}

export function SetPFPModal({
    isOpen,
    badge,
    isCurrentPFP,
    onClose,
    onSetAsPFP,
    isLoading = false
}: SetPFPModalProps) {
    if (!isOpen || !badge) return null

    const isSkillBadge = 'skill_name' in badge
    const name = isSkillBadge ? badge.skill_name : badge.name
    const level = isSkillBadge ? badge.level : 0
    const levelName = isSkillBadge ? badge.level_name : 'Starter'
    const totalMinutes = isSkillBadge ? badge.total_minutes : 0
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#1e1e1e] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>

                {/* NFT Image */}
                <div className="flex justify-center mb-6">
                    <div className={`
            w-36 h-36 rounded-3xl flex items-center justify-center text-6xl font-bold text-white
            bg-gradient-to-br ${isSkillBadge ? getLevelColor(level) : 'from-emerald-500 to-teal-600'}
            shadow-2xl
            ${isCurrentPFP ? 'ring-4 ring-blue-500 ring-offset-4 ring-offset-[#1e1e1e]' : ''}
          `}>
                        {isSkillBadge ? name.charAt(0).toUpperCase() : '⭐'}
                    </div>
                </div>

                {/* Badge Info */}
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
                    {isSkillBadge ? (
                        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl">
                            <TrendingUp size={16} />
                            <span className="font-bold">Level {level}</span>
                            <span className="text-blue-300">•</span>
                            <span className="text-blue-300">{levelName}</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl">
                            <span className="font-bold">Starter Badge</span>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {isSkillBadge && (
                    <div className="bg-black/30 rounded-2xl p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock size={16} />
                                <span className="text-sm">Total Focus Time</span>
                            </div>
                            <div className="text-white font-bold">
                                {hours}h {minutes}m
                            </div>
                        </div>
                    </div>
                )}

                {/* Current PFP Indicator */}
                {isCurrentPFP && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-center justify-center gap-2 text-blue-400">
                        <CheckCircle size={18} />
                        <span className="font-medium">Currently Active Avatar</span>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={onSetAsPFP}
                    disabled={isCurrentPFP || isLoading}
                    className={`
            w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
            ${isCurrentPFP
                            ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40'
                        }
          `}
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Setting...
                        </>
                    ) : isCurrentPFP ? (
                        <>
                            <CheckCircle size={20} />
                            Already Active
                        </>
                    ) : (
                        'Set as Active Avatar'
                    )}
                </button>

                {/* Badge ID */}
                <div className="mt-4 text-center">
                    <div className="text-[10px] text-gray-500 font-mono break-all px-4">
                        {badge.id}
                    </div>
                </div>
            </div>
        </div>
    )
}
