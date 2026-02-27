import { Timer, Flame, Zap } from 'lucide-react'
import { useTodayFocus, useStreak } from '../store/useSessionHistoryStore'

// Format minutes to display string
const formatFocusTime = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

// High-visibility compact stat cards for cockpit mode
export function StatsCards() {
    const todayMinutes = useTodayFocus()
    const streak = useStreak()

    const hasActiveStreak = streak > 0
    const hasFocusToday = todayMinutes > 0

    return (
        <div className="flex items-center gap-4">
            {/* Today's Focus - High Visibility */}
            <div className="stat-card rounded-2xl px-5 py-3 flex items-center gap-4 relative overflow-hidden"
                style={hasFocusToday ? {
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(16, 185, 129, 0.05))',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)'
                } : {}}
            >
                {/* Animated glow when active */}
                {hasFocusToday && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-emerald-500/5 animate-pulse" />
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10"
                    style={{ background: hasFocusToday ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.1)' }}>
                    <Timer size={20} className={hasFocusToday ? 'text-cyan-400' : 'text-gray-500'} />
                </div>
                <div className="relative z-10">
                    {/* LARGE, Bold Number with Neon Cyan */}
                    <div className={`text-3xl font-black tracking-tight ${hasFocusToday ? '' : 'text-gray-600'}`}
                        style={hasFocusToday ? {
                            color: '#22d3ee',
                            textShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)'
                        } : {}}
                    >
                        {formatFocusTime(todayMinutes)}
                    </div>
                    <div className="text-[11px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1">
                        <Zap size={10} className={hasFocusToday ? 'text-cyan-400' : 'text-gray-600'} />
                        Today's Focus
                    </div>
                </div>
            </div>

            {/* Day Streak - High Visibility */}
            <div className="stat-card rounded-2xl px-5 py-3 flex items-center gap-4 relative overflow-hidden"
                style={hasActiveStreak ? {
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(245, 158, 11, 0.05))',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    boxShadow: '0 0 20px rgba(249, 115, 22, 0.1)'
                } : {}}
            >
                {/* Animated glow when active */}
                {hasActiveStreak && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 animate-pulse" />
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10"
                    style={{ background: hasActiveStreak ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }}>
                    <Flame size={20} className={`${hasActiveStreak ? 'text-orange-400 animate-bounce' : 'text-gray-500'}`}
                        style={{ animationDuration: '2s' }} />
                </div>
                <div className="relative z-10">
                    {/* LARGE, Bold Number with Neon Orange/Gold */}
                    <div className={`text-3xl font-black tracking-tight flex items-center gap-2 ${hasActiveStreak ? '' : 'text-gray-600'}`}
                        style={hasActiveStreak ? {
                            background: 'linear-gradient(135deg, #fb923c, #fbbf24)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.5))'
                        } : {}}
                    >
                        {streak}
                        {hasActiveStreak && streak >= 7 && <span className="text-2xl">🔥</span>}
                        {hasActiveStreak && streak >= 30 && <span className="text-xl">👑</span>}
                    </div>
                    <div className="text-[11px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1">
                        <Flame size={10} className={hasActiveStreak ? 'text-orange-400' : 'text-gray-600'} />
                        Day Streak
                    </div>
                </div>
            </div>
        </div>
    )
}
