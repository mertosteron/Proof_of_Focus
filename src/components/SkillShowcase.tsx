import { useState } from 'react'
import { Sparkles, Award } from 'lucide-react'
import { SkillBadgeCard } from './SkillBadgeCard'
import { SetPFPModal } from './SetPFPModal'
import { BadgeGridSkeleton } from './SkeletonLoader'
import type { SkillBadge, StarterNFT } from './ProfilePFPHeader'

interface SkillShowcaseProps {
    isLoading?: boolean
    starterNFT?: StarterNFT | null
    skillBadges: SkillBadge[]
    activePFPId?: string | null
    onSetPFP?: (badgeId: string, pfpType: number) => Promise<void>
}

export function SkillShowcase({
    isLoading = false,
    starterNFT,
    skillBadges,
    activePFPId,
    onSetPFP
}: SkillShowcaseProps) {
    const [selectedBadge, setSelectedBadge] = useState<SkillBadge | StarterNFT | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSettingPFP, setIsSettingPFP] = useState(false)

    const handleBadgeClick = (badge: SkillBadge | StarterNFT) => {
        setSelectedBadge(badge)
        setIsModalOpen(true)
    }

    const handleSetAsPFP = async () => {
        if (!selectedBadge || !onSetPFP) return

        setIsSettingPFP(true)
        try {
            const pfpType = 'skill_name' in selectedBadge ? 2 : 1
            await onSetPFP(selectedBadge.id, pfpType)
            setIsModalOpen(false)
        } catch (e) {
            console.error('Failed to set PFP:', e)
        } finally {
            setIsSettingPFP(false)
        }
    }

    const allBadges: (SkillBadge | StarterNFT)[] = [
        ...(starterNFT ? [starterNFT] : []),
        ...skillBadges
    ]

    const isEmpty = allBadges.length === 0

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Award className="text-blue-500" size={24} />
                        Skill Badges
                    </h3>
                </div>
                <BadgeGridSkeleton count={4} />
            </div>
        )
    }

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <Sparkles size={40} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Badges Yet</h3>
                <p className="text-gray-400 max-w-sm">
                    Start a focus session to earn your first skill badge!
                    Track your learning journey and watch your collection grow.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Award className="text-blue-500" size={24} />
                    Skill Badges
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full ml-2">
                        {allBadges.length}
                    </span>
                </h3>
                <p className="text-sm text-gray-500">Click a badge to set as PFP</p>
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allBadges.map((badge) => (
                    <SkillBadgeCard
                        key={badge.id}
                        badge={badge}
                        isActivePFP={badge.id === activePFPId}
                        onClick={() => handleBadgeClick(badge)}
                    />
                ))}
            </div>

            {/* Set PFP Modal */}
            <SetPFPModal
                isOpen={isModalOpen}
                badge={selectedBadge}
                isCurrentPFP={selectedBadge?.id === activePFPId}
                onClose={() => setIsModalOpen(false)}
                onSetAsPFP={handleSetAsPFP}
                isLoading={isSettingPFP}
            />
        </div>
    )
}
