import { CheckCircle } from 'lucide-react'
import type { SkillBadge, StarterNFT } from './ProfilePFPHeader'

interface SkillBadgeCardProps {
    badge: SkillBadge | StarterNFT
    isActivePFP?: boolean
    onClick?: () => void
}

// Evolution thresholds in minutes (must match smart contract)
const LEVEL_THRESHOLDS = [0, 600, 3000, 6000, 30000] // 0, 10h, 50h, 100h, 500h

function getProgressToNextLevel(totalMinutes: number, currentLevel: number): number {
    if (currentLevel >= 5) return 100 // Max level

    const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0
    const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[4]

    const progress = ((totalMinutes - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    return Math.min(Math.max(progress, 0), 100)
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

export function SkillBadgeCard({ badge, isActivePFP = false, onClick }: SkillBadgeCardProps) {
    const isSkillBadge = 'skill_name' in badge

    const name = isSkillBadge ? badge.skill_name : badge.name
    const level = isSkillBadge ? badge.level : 0
    const levelName = isSkillBadge ? badge.level_name : 'Starter'
    const totalMinutes = isSkillBadge ? badge.total_minutes : 0
    const hours = Math.floor(totalMinutes / 60)
    const progress = isSkillBadge ? getProgressToNextLevel(totalMinutes, level) : 100

    return (
        <div
            onClick={onClick}
            className={`
        relative bg-white/5 backdrop-blur-sm border rounded-3xl p-5 
        flex flex-col items-center gap-4 cursor-pointer
        transition-all duration-300 group hover:scale-[1.02]
        ${isActivePFP
                    ? 'border-blue-500/50 ring-2 ring-blue-500 ring-offset-2 ring-offset-[#09090b] shadow-lg shadow-blue-500/20'
                    : 'border-white/5 hover:border-white/20 hover:bg-white/10'
                }
      `}
        >
            {/* Active PFP Badge */}
            {isActivePFP && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <CheckCircle size={10} />
                    Active
                </div>
            )}

            {/* NFT Image / Avatar */}
            <div className={`
        w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-bold text-white
        bg-gradient-to-br ${isSkillBadge ? getLevelColor(level) : 'from-emerald-500 to-teal-600'}
        shadow-xl group-hover:shadow-2xl transition-shadow
        ${isActivePFP ? 'ring-2 ring-blue-500/50' : ''}
      `}>
                {isSkillBadge ? name.charAt(0).toUpperCase() : '⭐'}
            </div>

            {/* Badge Info */}
            <div className="w-full text-center space-y-2">
                <h4 className="text-lg font-bold text-white truncate">{name}</h4>
                <div className="flex items-center justify-center gap-2 text-sm">
                    {isSkillBadge ? (
                        <>
                            <span className="text-blue-400 font-medium">Level {level}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">{levelName}</span>
                        </>
                    ) : (
                        <span className="text-emerald-400 font-medium">Starter Badge</span>
                    )}
                </div>

                {/* Progress Bar */}
                {isSkillBadge && (
                    <div className="space-y-1">
                        <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                            <span>{hours}h</span>
                            <span>{level < 5 ? `Next: Lvl ${level + 1}` : 'Max Level'}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
