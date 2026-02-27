import { useState } from 'react'
import { BarChart3, PieChart, Calendar, Clock, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPie, Pie } from 'recharts'
import { useSessionHistoryStore } from '../store/useSessionHistoryStore'

// Colors for charts
const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899']

export function StatisticsPage() {
    const sessions = useSessionHistoryStore(s => s.sessions)
    const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | 'all'>('7d')
    const [chartRange, setChartRange] = useState<'1W' | '1M' | '1Y' | 'All'>('1W')

    // Calculate chart data based on selected range
    const getChartData = () => {
        let days: { name: string; minutes: number }[] = []

        if (chartRange === '1W') {
            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]
                const dayMinutes = sessions
                    .filter(s => s.date === dateStr && s.completed)
                    .reduce((sum, s) => sum + s.durationMinutes, 0)
                days.push({
                    name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    minutes: dayMinutes
                })
            }
        } else if (chartRange === '1M') {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekEnd = new Date()
                weekEnd.setDate(weekEnd.getDate() - i * 7)
                const weekStart = new Date(weekEnd)
                weekStart.setDate(weekStart.getDate() - 6)
                const weekMinutes = sessions
                    .filter(s => {
                        const d = new Date(s.timestamp)
                        return d >= weekStart && d <= weekEnd && s.completed
                    })
                    .reduce((sum, s) => sum + s.durationMinutes, 0)
                days.push({
                    name: `W${4 - i}`,
                    minutes: weekMinutes
                })
            }
        } else if (chartRange === '1Y') {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const month = new Date()
                month.setMonth(month.getMonth() - i)
                const monthStr = month.toISOString().slice(0, 7) // YYYY-MM
                const monthMinutes = sessions
                    .filter(s => s.date?.startsWith(monthStr) && s.completed)
                    .reduce((sum, s) => sum + s.durationMinutes, 0)
                days.push({
                    name: month.toLocaleDateString('en-US', { month: 'short' }),
                    minutes: monthMinutes
                })
            }
        } else {
            // All time - by month
            const grouped: Record<string, number> = {}
            sessions.filter(s => s.completed).forEach(s => {
                const monthStr = s.date?.slice(0, 7) || 'Unknown'
                grouped[monthStr] = (grouped[monthStr] || 0) + s.durationMinutes
            })
            days = Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-12)
                .map(([key, value]) => ({
                    name: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short' }),
                    minutes: value
                }))
        }
        return days
    }

    // Calculate skill distribution
    const getSkillDistribution = () => {
        const skillMap: Record<string, number> = {}
        sessions.filter(s => s.completed).forEach(s => {
            const category = s.category || 'Other'
            skillMap[category] = (skillMap[category] || 0) + s.durationMinutes
        })
        return Object.entries(skillMap).map(([name, value]) => ({ name, value }))
    }

    const chartData = getChartData()
    const skillData = getSkillDistribution()

    const totalMinutes = sessions.filter(s => s.completed).reduce((sum, s) => sum + s.durationMinutes, 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMins = totalMinutes % 60
    const totalSessions = sessions.filter(s => s.completed).length

    return (
        <div className="w-full h-full flex flex-col p-2 space-y-6 animate-in fade-in duration-500 overflow-y-auto">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
                <div className="stat-card rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Clock size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold neon-text-blue">{totalHours}h {remainingMins}m</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Total Focus</div>
                    </div>
                </div>
                <div className="stat-card rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <TrendingUp size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold neon-text-purple">{totalSessions}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Sessions</div>
                    </div>
                </div>
                <div className="stat-card rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Calendar size={24} className="text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold neon-text-turquoise">
                            {totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0}m
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Avg Session</div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart with Time Range Filters */}
                <div className="glass-panel rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={20} className="text-blue-400" />
                            <h3 className="text-lg font-bold text-white">Focus Hours</h3>
                        </div>
                        <div className="flex gap-1">
                            {(['1W', '1M', '1Y', 'All'] as const).map(range => (
                                <button
                                    key={range}
                                    onClick={() => setChartRange(range)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${chartRange === range
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-white/5 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} width={50} tickFormatter={(v) => v >= 60 ? `${Math.round(v / 60)}h` : `${v}m`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e1e1e',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px'
                                    }}
                                    formatter={(value: number) => [value >= 60 ? `${Math.floor(value / 60)}h ${value % 60}m` : `${value}m`, 'Focus']}
                                />
                                <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Skill Distribution Donut with Legend */}
                <div className="glass-panel rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChart size={20} className="text-purple-400" />
                        <h3 className="text-lg font-bold text-white">Skill Distribution</h3>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Donut Chart */}
                        <div className="h-56 flex-1">
                            {skillData.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-gray-500 text-center">No data yet.<br />Complete sessions to see distribution.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={skillData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {skillData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e1e1e',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px'
                                            }}
                                            formatter={(value: number) => [`${Math.round(value)} min`, 'Time']}
                                        />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            )}
                        </div>
                        {/* Legend */}
                        {skillData.length > 0 && (
                            <div className="flex flex-col gap-2 min-w-[140px] max-h-56 overflow-y-auto pr-2">
                                {skillData.map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-2 text-sm">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-gray-300 truncate">{item.name}</span>
                                        <span className="text-gray-500 ml-auto text-xs">
                                            {item.value >= 60 ? `${Math.floor(item.value / 60)}h` : `${item.value}m`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Session History Table */}
            <div className="glass-panel rounded-3xl p-6 flex-1">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Calendar size={20} className="text-emerald-400" />
                        Session History
                    </h3>
                    <div className="flex gap-2">
                        {(['7d', '30d', 'all'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setSelectedRange(range)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${selectedRange === range
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-white/5 text-gray-400 hover:text-white'
                                    }`}
                            >
                                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
                                <th className="pb-3 pr-4">Date</th>
                                <th className="pb-3 pr-4">Category</th>
                                <th className="pb-3 pr-4">Duration</th>
                                <th className="pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">
                                        No sessions yet. Start focusing!
                                    </td>
                                </tr>
                            ) : (
                                sessions
                                    .filter(s => {
                                        if (selectedRange === 'all') return true
                                        const daysAgo = selectedRange === '7d' ? 7 : 30
                                        const cutoff = new Date()
                                        cutoff.setDate(cutoff.getDate() - daysAgo)
                                        return new Date(s.timestamp) >= cutoff
                                    })
                                    .sort((a, b) => b.timestamp - a.timestamp)
                                    .slice(0, 20)
                                    .map(session => (
                                        <tr key={session.id} className="text-sm">
                                            <td className="py-3 pr-4 text-gray-300">
                                                {new Date(session.timestamp).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs">
                                                    {session.category || 'General'}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4 text-white font-medium">
                                                {session.durationMinutes}m
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-lg text-xs ${session.completed
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {session.completed ? 'Completed' : 'Incomplete'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
