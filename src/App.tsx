import { useState, useEffect, useMemo } from 'react'
import { Timer, Users, Shield, Settings, AlertTriangle, Key, LogOut, User, BarChart2 } from 'lucide-react'
import { useIdleDetection } from './hooks/useIdleDetection'
import { TimerDisplay } from './components/TimerDisplay'
import { useFocusStore } from './store/useFocusStore'
import { PoolsDashboard } from './components/PoolsDashboard'
import { useWalletStore } from './store/useWalletStore'
import { SettingsPage } from './components/SettingsPage'
import { useSettingsStore } from './store/useSettingsStore'
import { StatsCards } from './components/StatsCards'
import { NFTSelectorModal } from './components/NFTSelectorModal'
import { useActivePFP } from './store/useSessionHistoryStore'
import { ProfilePage } from './components/ProfilePage'
import { StatisticsPage } from './components/StatisticsPage'

// Cyberpunk Sidebar Item with Neon Effects
const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${active
      ? 'glass-panel neon-glow-blue text-blue-400 border-blue-500/30'
      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
      }`}
  >
    <Icon
      size={20}
      className={`transition-all duration-300 ${active
        ? 'text-blue-400 sidebar-icon-active'
        : 'text-gray-500 group-hover:text-blue-400 sidebar-icon'
        }`}
    />
    <span className="font-medium">{label}</span>
  </button>
)



function App() {
  const [activeTab, setActiveTab] = useState('focus')
  const { isIdle, idleTime } = useIdleDetection()
  const { status, pauseSession, resumeSession, setDuration } = useFocusStore()
  const [showNFTSelector, setShowNFTSelector] = useState(false)
  const activePFP = useActivePFP()

  // Memoize particle positions to avoid jittering on re-renders
  const particleStyles = useMemo(() =>
    [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${8 + Math.random() * 6}s`
    })), [])

  // Settings Store
  const settings = useSettingsStore()

  // Wallet Store
  const { isConnected, address, importKey, disconnect } = useWalletStore()
  const [privKeyInput, setPrivKeyInput] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)

  // Initialize focus duration from settings
  useEffect(() => {
    setDuration(settings.focusDuration)
  }, [settings.focusDuration, setDuration])

  // Auto-load key from .env or localStorage for demo convenience
  useEffect(() => {
    // Priority 1: Environment Variable
    const envKey = import.meta.env.VITE_WALLET_PRIVATE_KEY
    if (envKey) {
      console.log("Found wallet in .env, auto-importing...")
      if (importKey(envKey)) return
    }

    // Priority 2: Local Storage
    const savedKey = localStorage.getItem('focus_forge_privkey')
    if (savedKey) {
      importKey(savedKey)
    }
  }, [])

  // Anti-Cheat: Auto-pause when idle (only if enabled in settings)
  useEffect(() => {
    if (settings.idleDetectionEnabled && isIdle && status === 'running') {
      pauseSession()
    }
  }, [isIdle, status, pauseSession, settings.idleDetectionEnabled])

  const handleImport = () => {
    if (importKey(privKeyInput)) {
      setPrivKeyInput('')
      setShowKeyInput(false)
    } else {
      alert("Invalid Key! Must be 'suiprivkey...'")
    }
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-sans selection:bg-blue-500/30 relative">
      {/* Cyberpunk Animated Background */}
      <div className="cyber-background">
        <div className="cyber-grid" />
        <div className="cyber-particles">
          {particleStyles.map((style, i) => (
            <div
              key={i}
              className="cyber-particle"
              style={style}
            />
          ))}
        </div>
      </div>

      {/* NFT Selector Modal */}
      <NFTSelectorModal
        isOpen={showNFTSelector}
        onClose={() => setShowNFTSelector(false)}
        starterNFT={{ id: 'starter-001', name: 'Novice Explorer', image_uri: '' }}
        skillBadges={[]}
      />

      {/* Idle Overlay */}
      {settings.idleDetectionEnabled && isIdle && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="p-8 bg-[#1e1e1e] border border-red-500/30 rounded-3xl flex flex-col items-center max-w-md text-center shadow-2xl shadow-red-900/20">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Idle Detected!</h2>
            <p className="text-gray-400 mb-6">
              You have been away for {idleTime} seconds.
              <br />Focus session paused to prevent AFK farming.
            </p>
            <button
              onClick={resumeSession}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
            >
              I'm Back
            </button>
          </div>
        </div>
      )}

      {/* Cyberpunk Sidebar */}
      <aside className="w-64 glass-panel border-r border-white/5 p-4 flex flex-col pt-10 relative z-10">
        <div className="mb-10 px-4">
          <h1 className="text-2xl font-bold text-gradient-cyber flex items-center gap-2">
            <Shield size={28} className="text-blue-500 sidebar-icon-active" />
            POFocus
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-mono ml-9">v0.2.0-cyber</p>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem
            icon={Timer}
            label="Focus Zone"
            active={activeTab === 'focus'}
            onClick={() => setActiveTab('focus')}
          />
          <SidebarItem
            icon={Users}
            label="Pools"
            active={activeTab === 'pools'}
            onClick={() => setActiveTab('pools')}
          />
          <SidebarItem
            icon={User}
            label="Profile"
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
          <SidebarItem
            icon={BarChart2}
            label="Statistics"
            active={activeTab === 'statistics'}
            onClick={() => setActiveTab('statistics')}
          />
        </nav>

        <div className="pt-4 border-t border-white/5 space-y-4">
          {/* Manual Wallet Connect */}
          <div className="px-2">
            {!isConnected ? (
              <div className="bg-white/5 rounded-xl p-3">
                {!showKeyInput ? (
                  <button
                    onClick={() => setShowKeyInput(true)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Key size={14} /> Import Wallet
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="password"
                      placeholder="suiprivkey..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                      value={privKeyInput}
                      onChange={e => setPrivKeyInput(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleImport} className="flex-1 bg-green-600 hover:bg-green-500 py-1 rounded text-xs font-bold">Import</button>
                      <button onClick={() => setShowKeyInput(false)} className="bg-white/10 hover:bg-white/20 px-2 rounded text-xs">X</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="wallet-card rounded-xl p-3 text-xs space-y-2">
                <div className="text-emerald-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="wallet-connected-dot" />
                    Connected
                  </span>
                  <button onClick={disconnect} className="text-red-400 hover:text-white transition-colors"><LogOut size={12} /></button>
                </div>
                <div className="font-mono text-gray-300 truncate neon-text-turquoise" title={address || ''}>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>

                {/* Export / Reveal Key */}
                <div className="pt-2 border-t border-white/5">
                  {!showKeyInput ? (
                    <button
                      onClick={() => setShowKeyInput(true)}
                      className="w-full text-left text-[10px] text-gray-500 hover:text-white flex items-center gap-1"
                    >
                      <Key size={10} /> View Private Key
                    </button>
                  ) : (
                    <div className="bg-black/40 rounded p-1">
                      <p className="text-[10px] text-red-400 font-bold mb-1">DO NOT SHARE</p>
                      <div className="break-all font-mono text-[8px] text-gray-400 select-all">
                        {localStorage.getItem('focus_forge_privkey')}
                      </div>
                      <button
                        onClick={() => setShowKeyInput(false)}
                        className="w-full text-center text-[10px] text-blue-400 hover:text-white mt-1"
                      >
                        Hide
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <SidebarItem
            icon={Settings}
            label="Settings"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Drag Region for Window Controls */}
        <div className="h-10 w-full app-region-drag select-none" style={{ WebkitAppRegion: 'drag' } as any}></div>

        <div className="flex-1 overflow-y-auto p-8 pt-2">
          {activeTab === 'focus' && (
            <div className="w-full h-full flex flex-col animate-in fade-in duration-500">
              {/* Compact Header Row */}
              <div className="flex-shrink-0 flex items-center justify-between px-2 py-3">
                <div className="flex items-center gap-6">
                  {/* User Avatar - Compact */}
                  <button
                    onClick={() => setShowNFTSelector(true)}
                    className="glass-panel glass-panel-hover rounded-xl px-3 py-2 flex items-center gap-3 transition-all hover:scale-[1.02]"
                  >
                    {activePFP?.imageUri ? (
                      <img
                        src={activePFP.imageUri}
                        alt={activePFP.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-500/50"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white ${activePFP?.type === 'skill'
                        ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        }`}>
                        {activePFP?.type === 'skill' ? activePFP.name.charAt(0).toUpperCase() : '⭐'}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-medium text-white text-sm">{activePFP?.name || 'Avatar'}</div>
                      <div className="text-[10px] text-gray-500">Click to change</div>
                    </div>
                  </button>

                  {/* Stats Cards - Compact Inline */}
                  <StatsCards />
                </div>

                {/* Session Duration */}
                <div className="text-sm text-gray-500">
                  Session: <span className="text-blue-400 font-bold">{settings.focusDuration}min</span>
                </div>
              </div>

              {/* Hero Timer - Flex Grow to Fill Space */}
              <div className="flex-1 min-h-0 p-2">
                <div className="w-full h-full bg-white/5 border border-white/5 rounded-[32px] p-1 flex flex-col relative shadow-2xl overflow-hidden group">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-1000"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-purple-500/20 transition-all duration-1000"></div>

                  <div className="flex-1 rounded-[30px] border border-white/5 bg-[#09090b]/50 backdrop-blur-sm flex items-center justify-center relative z-10">
                    <TimerDisplay />
                  </div>
                </div>
              </div>
            </div>
          )}



          {activeTab === 'pools' && (
            <PoolsDashboard />
          )}

          {activeTab === 'profile' && (
            <ProfilePage />
          )}

          {activeTab === 'statistics' && (
            <StatisticsPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}

          {!['focus', 'pools', 'profile', 'statistics', 'settings'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-in fade-in zoom-in duration-300">
              <div className="p-4 bg-white/5 rounded-full mb-4">
                <Settings size={32} />
              </div>
              <h3 className="text-lg font-medium text-white">Work in Progress</h3>
              <p>This module is currently being built.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
