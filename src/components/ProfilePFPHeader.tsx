import { Edit3, Sparkles } from 'lucide-react'
import { PFPHeaderSkeleton } from './SkeletonLoader'

export interface SkillBadge {
    id: string
    skill_name: string
    level: number
    level_name: string
    total_minutes: number
    image_uri: string
}

export interface StarterNFT {
    id: string
    name: string
    image_uri: string
}

interface ProfilePFPHeaderProps {
    isLoading?: boolean
    activePFP?: SkillBadge | StarterNFT | null
    address?: string
    topSkill?: { name: string; level: number; hours: number } | null
    onChangePFP?: () => void
}

export function ProfilePFPHeader({
    isLoading = false,
    activePFP,
    address,
    topSkill,
    onChangePFP
}: ProfilePFPHeaderProps) {
    if (isLoading) {
        return <PFPHeaderSkeleton />
    }

    const truncatedAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : 'Not Connected'

    const getAvatarContent = () => {
        if (!activePFP) {
            return (
                <div className="avatar-glow">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-2xl text-gray-400 relative z-10">
                        ?
                    </div>
                </div>
            )
        }

        // Check if it's a StarterNFT or SkillBadge
        if ('skill_name' in activePFP) {
            // SkillBadge with glowing effect
            return (
                <div className="avatar-glow relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white relative z-10 shadow-lg">
                        {activePFP.skill_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#09090b] z-20 neon-glow-blue">
                        {activePFP.level}
                    </div>
                </div>
            )
        } else {
            // StarterNFT with glowing effect
            return (
                <div className="avatar-glow">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white relative z-10 shadow-lg">
                        ⭐
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="glass-panel glass-panel-hover rounded-3xl p-6 relative overflow-hidden">
            {/* Animated background glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex items-center gap-5">
                {/* Glowing Avatar */}
                <div className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105" onClick={onChangePFP}>
                    {getAvatarContent()}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">
                        Welcome back, <span className="neon-text-blue font-mono">{truncatedAddress}</span>
                    </h3>
                    {topSkill ? (
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                            <Sparkles size={14} className="text-purple-400" />
                            <span className="neon-text-purple">Top Skill:</span>
                            <span className="font-medium text-white">{topSkill.name} Lvl {topSkill.level}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-cyan-400">{topSkill.hours}h focused</span>
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <Sparkles size={14} className="text-gray-600" />
                            Start focusing to earn your first skill badge!
                        </p>
                    )}
                </div>

                {/* Select from Wallet Gallery Button */}
                <button
                    onClick={onChangePFP}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 cyber-button rounded-xl text-sm text-gray-300 hover:text-white transition-all"
                >
                    <Edit3 size={14} className="text-blue-400" />
                    <span className="hidden sm:inline">Select from Wallet Gallery</span>
                </button>
            </div>
        </div>
    )
}