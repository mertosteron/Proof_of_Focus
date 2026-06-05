import { useState, useEffect } from 'react'
import { LayoutDashboard, Timer, Users, Shield, Settings, AlertTriangle, Key, LogOut, Zap, type LucideIcon } from 'lucide-react'
import { useIdleDetection } from './hooks/useIdleDetection'
// import { ConnectButton } from '@mysten/dapp-kit' // Unused for manual import
import { TimerDisplay } from './components/TimerDisplay'
import { useFocusStore } from './store/useFocusStore'
import { PoolsDashboard } from './components/PoolsDashboard'
import { useWalletStore } from './store/useWalletStore'
import { IdentityDashboard } from './components/IdentityDashboard'
import { SettingsPage } from './components/SettingsPage'
import { useSettingsStore } from './store/useSettingsStore'

// Placeholder components
const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: LucideIcon, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
      : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
  >
    <Icon size={20} className={active ? 'text-blue-400' : 'text-gray-500 group-hover:text-white'} />
    <span className="font-medium">{label}</span>
  </button>
)



function App() {
  const [activeTab, setActiveTab] = useState('focus')
  const { isIdle, idleTime } = useIdleDetection()
  const { status, pauseSession, resumeSession, setDuration } = useFocusStore()

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
    // Run once on mount; importKey is a stable zustand action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              onClick={() => { if (status === 'paused') resumeSession() }}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
            >
              I'm Back
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-transparent border-r border-white/5 p-4 flex flex-col pt-10">
        <div className="mb-10 px-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
            <Shield size={28} className="text-blue-500" />
            POFocus
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-mono ml-9">v0.1.0-alpha</p>
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
            label="Accountability Pools"
            active={activeTab === 'pools'}
            onClick={() => setActiveTab('pools')}
          />
          <SidebarItem
            icon={LayoutDashboard}
            label="Identity & Stats"
            active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
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
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 text-xs space-y-2">
                <div className="text-blue-300 font-bold flex items-center justify-between">
                  Connected
                  <button onClick={disconnect} className="text-red-400 hover:text-white"><LogOut size={12} /></button>
                </div>
                <div className="font-mono text-gray-400 truncate" title={address || ''}>
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
        <div className="h-10 w-full app-region-drag select-none" style={{ WebkitAppRegion: 'drag' }}></div>

        <div className="flex-1 overflow-y-auto p-8 pt-2">
          {activeTab === 'focus' && (
            <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-500">
              <header className="flex-shrink-0 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Ready to Focus?</h2>
                  <p className="text-gray-400 mt-2">Choose your task and stake your claim.</p>
                </div>
                <div className="text-sm text-gray-500">
                  Session: <span className="text-blue-400 font-bold">{settings.focusDuration}min</span>
                </div>
              </header>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">

                {/* Left: Stats & Context (Sidebar - 4 cols) */}
                <div className="md:col-span-4 flex flex-col gap-6 h-full">
                  {/* Level Card - Mini Hero */}
                  <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                        <span className="text-blue-200 font-bold uppercase tracking-wider text-xs">Current Level</span>
                      </div>
                      <div className="text-3xl font-bold text-white">Novice Focus</div>
                      <div className="h-1.5 w-full bg-black/50 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-blue-400 w-[10%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                      </div>
                      <p className="text-[10px] text-blue-300 mt-2 text-right">10/100 XP to Level 2</p>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="bg-white/5 rounded-3xl border border-white/5 p-5 hover:border-white/10 transition-colors flex flex-col justify-between">
                      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-2">
                        <Timer size={16} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">0m</div>
                        <div className="text-xs text-gray-500">Today's Focus</div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-3xl border border-white/5 p-5 hover:border-white/10 transition-colors flex flex-col justify-between">
                      <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2">
                        <Zap size={16} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">0</div>
                        <div className="text-xs text-gray-500">Day Streak</div>
                      </div>
                    </div>
                    <div className="col-span-2 bg-white/5 rounded-3xl border border-white/5 p-5 flex items-center justify-between group cursor-pointer hover:border-white/20 transition-all">
                      <div>
                        <h4 className="font-bold text-gray-200">History</h4>
                        <p className="text-xs text-gray-500">View past sessions</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                        <Settings size={14} className="text-gray-400 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Hero Timer (Main - 8 cols) */}
                <div className="md:col-span-8 flex flex-col h-full">
                  <div className="flex-1 bg-white/5 border border-white/5 rounded-[32px] p-1 flex flex-col relative shadow-2xl overflow-hidden group">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-1000"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-purple-500/20 transition-all duration-1000"></div>

                    <div className="flex-1 rounded-[30px] border border-white/5 bg-[#09090b]/50 backdrop-blur-sm flex items-center justify-center relative z-10 w-full h-full">
                      <TimerDisplay />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {activeTab === 'pools' && (
            <PoolsDashboard />
          )}

          {activeTab === 'stats' && (
            <IdentityDashboard />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}

          {activeTab !== 'focus' && activeTab !== 'pools' && activeTab !== 'stats' && activeTab !== 'settings' && (
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
