import { useState } from 'react'
import { Bell, Clock, Shield, Eye, Palette, Info, Save, RefreshCw, AlertTriangle, LogOut, Lock } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useFocusStore } from '../store/useFocusStore'
import { useDisconnectWallet } from '@mysten/dapp-kit'
import { DevToolsPanel } from './DevToolsPanel'

const SettingSection = ({ icon: Icon, title, description, children }: { icon: any, title: string, description: string, children: React.ReactNode }) => (
  <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
    <div className="flex items-start gap-4 mb-6">
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-blue-400" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
    <div className="space-y-4 pl-14">
      {children}
    </div>
  </div>
)

const ToggleSetting = ({ label, description, enabled, onChange }: { label: string, description?: string, enabled: boolean, onChange: (val: boolean) => void }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex-1">
      <div className="text-sm font-medium text-gray-200">{label}</div>
      {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
    >
      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
    </button>
  </div>
)

const SliderSetting = ({ label, description, value, min, max, step, unit, onChange }: { label: string, description?: string, value: number, min: number, max: number, step: number, unit: string, onChange: (val: number) => void }) => (
  <div className="py-2">
    <div className="flex items-center justify-between mb-2">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-200">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
      </div>
      <div className="text-sm font-bold text-blue-400">{value}{unit}</div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      style={{
        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`
      }}
    />
  </div>
)

const SelectSetting = ({ label, description, value, options, onChange }: { label: string, description?: string, value: string, options: { value: string, label: string }[], onChange: (val: string) => void }) => (
  <div className="py-2">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-200">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </div>
)

export function SettingsPage() {
  const settings = useSettingsStore()
  const { setDuration } = useFocusStore()
  const { mutate: disconnect } = useDisconnectWallet()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const showSavedToast = (message: string = 'Settings saved!') => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleSave = () => {
    setSaveStatus('saving')
    // Update focus duration in focus store when settings change
    setDuration(settings.focusDuration)
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 500)
  }

  const handleReset = () => {
    if (confirm('Reset all settings to default values?')) {
      settings.resetSettings()
      setDuration(25) // Reset to default
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const updateSetting = <K extends keyof typeof settings>(key: K, value: any) => {
    settings.updateSettings({ [key]: value })
    // Auto-apply focus duration changes
    if (key === 'focusDuration') {
      setDuration(value)
    }
    showSavedToast()
  }

  const handleDisconnect = () => {
    if (confirm('Disconnect your wallet? You will be signed out.')) {
      disconnect()
      window.location.reload()
    }
  }

  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white">Settings</h2>
          <p className="text-gray-400 mt-2">Customize your focus experience</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${saveStatus === 'saved'
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
          >
            <Save size={16} />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Focus Session Settings */}
        <SettingSection
          icon={Clock}
          title="Focus Sessions"
          description="Configure your focus block durations and breaks"
        >
          <SliderSetting
            label="Focus Duration"
            description="Length of each focus block"
            value={settings.focusDuration}
            min={5}
            max={90}
            step={5}
            unit="min"
            onChange={(val) => updateSetting('focusDuration', val)}
          />
          <SliderSetting
            label="Short Break"
            description="Break between focus blocks"
            value={settings.shortBreak}
            min={3}
            max={15}
            step={1}
            unit="min"
            onChange={(val) => updateSetting('shortBreak', val)}
          />
          <SliderSetting
            label="Long Break"
            description="Extended break after 4 focus blocks"
            value={settings.longBreak}
            min={15}
            max={45}
            step={5}
            unit="min"
            onChange={(val) => updateSetting('longBreak', val)}
          />
          <div className="border-t border-white/10 pt-4 mt-2">
            <ToggleSetting
              label="Auto-start breaks"
              description="Automatically begin break timer after focus session"
              enabled={settings.autoStartBreaks}
              onChange={(val) => updateSetting('autoStartBreaks', val)}
            />
            <ToggleSetting
              label="Auto-start focus"
              description="Automatically begin focus timer after break ends"
              enabled={settings.autoStartFocus}
              onChange={(val) => updateSetting('autoStartFocus', val)}
            />
            <div className="border-t border-white/10 pt-4 mt-2">
              <ToggleSetting
                label="Strict Mode"
                description="Prevents pausing during focus sessions (only Stop allowed)"
                enabled={settings.strictMode}
                onChange={(val) => updateSetting('strictMode', val)}
              />
              {settings.strictMode && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mt-2">
                  <div className="flex gap-2 text-xs text-orange-400">
                    <Lock size={14} className="flex-shrink-0 mt-0.5" />
                    <span>Strict Mode is ON. You won't be able to pause during focus sessions.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SettingSection>

        {/* Idle Detection */}
        <SettingSection
          icon={Eye}
          title="Idle Detection"
          description="Anti-cheat measures to ensure genuine focus"
        >
          <ToggleSetting
            label="Enable Idle Detection"
            description="Pause timer when no activity is detected"
            enabled={settings.idleDetectionEnabled}
            onChange={(val) => updateSetting('idleDetectionEnabled', val)}
          />
          {settings.idleDetectionEnabled && (
            <SliderSetting
              label="Idle Threshold"
              description="Time before session is paused"
              value={settings.idleThreshold}
              min={1}
              max={15}
              step={1}
              unit="min"
              onChange={(val) => updateSetting('idleThreshold', val)}
            />
          )}
          <ToggleSetting
            label="Activity Monitoring"
            description="Track keyboard/mouse activity (local only)"
            enabled={settings.activityMonitoring}
            onChange={(val) => updateSetting('activityMonitoring', val)}
          />
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
            <div className="flex gap-2 text-xs text-yellow-400">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>All monitoring happens locally. No data is sent to servers.</span>
            </div>
          </div>
        </SettingSection>

        {/* Privacy */}
        <SettingSection
          icon={Shield}
          title="Privacy & Security"
          description="Control your data and visibility"
        >
          <ToggleSetting
            label="Anonymous Mode"
            description="Hide your wallet address from leaderboards"
            enabled={settings.anonymousMode}
            onChange={(val) => updateSetting('anonymousMode', val)}
          />
          <ToggleSetting
            label="Share Stats"
            description="Allow your stats to appear on global leaderboard"
            enabled={settings.shareStats}
            onChange={(val) => updateSetting('shareStats', val)}
          />
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
            <div className="flex gap-2 text-xs text-blue-400">
              <Shield size={14} className="flex-shrink-0 mt-0.5" />
              <span>POFocus follows a Zero-Spy protocol. No keystrokes, screenshots, or app names are ever recorded.</span>
            </div>
          </div>
        </SettingSection>

        {/* Notifications */}
        <SettingSection
          icon={Bell}
          title="Notifications"
          description="Manage alerts and reminders"
        >
          <ToggleSetting
            label="Sound Effects"
            description="Play audio when timer starts/stops"
            enabled={settings.soundEnabled}
            onChange={(val) => updateSetting('soundEnabled', val)}
          />
          <ToggleSetting
            label="Desktop Notifications"
            description="Show system notifications for focus events"
            enabled={settings.desktopNotifs}
            onChange={(val) => updateSetting('desktopNotifs', val)}
          />
          <ToggleSetting
            label="Session Reminders"
            description="Remind you to start focus sessions"
            enabled={settings.sessionReminders}
            onChange={(val) => updateSetting('sessionReminders', val)}
          />
        </SettingSection>

        {/* Appearance */}
        <SettingSection
          icon={Palette}
          title="Appearance"
          description="Customize the look and feel"
        >
          <SelectSetting
            label="Theme"
            description="Choose your preferred color scheme"
            value={settings.theme}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'auto', label: 'System' }
            ]}
            onChange={(val) => updateSetting('theme', val)}
          />
          <SelectSetting
            label="Accent Color"
            description="Primary color for highlights and buttons"
            value={settings.accentColor}
            options={[
              { value: 'blue', label: 'Blue' },
              { value: 'purple', label: 'Purple' },
              { value: 'green', label: 'Green' },
              { value: 'orange', label: 'Orange' },
              { value: 'red', label: 'Red' }
            ]}
            onChange={(val) => updateSetting('accentColor', val)}
          />
        </SettingSection>

        {/* About */}
        <SettingSection
          icon={Info}
          title="About"
          description="Version and project information"
        >
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-400">Version</span>
              <span className="text-white font-mono">v0.1.0-alpha</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-400">Network</span>
              <span className="text-white">Sui Devnet</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-400">Build</span>
              <span className="text-white font-mono">hackathon-2025</span>
            </div>
            <div className="pt-2">
              <p className="text-xs text-gray-500">
                POFocus - Transform disciplined time management into financial rewards and verifiable on-chain reputation.
              </p>
            </div>
          </div>
        </SettingSection>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <LogOut size={20} className="text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Danger Zone</h3>
              <p className="text-sm text-gray-400">These actions cannot be undone</p>
            </div>
          </div>
          <div className="pl-14">
            <button
              onClick={handleDisconnect}
              className="w-full py-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 border border-red-500/30"
            >
              <LogOut size={18} />
              Disconnect Wallet & Sign Out
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This will clear your session. Your on-chain data remains safe.
            </p>
          </div>
        </div>

        {/* Developer Tools Panel - REMOVE BEFORE MAINNET */}
        <DevToolsPanel
          onDebugSetHours={async (topicId, minutes) => {
            // This is a mock handler - actual implementation would call the smart contract
            console.log(`[DEBUG] Setting ${minutes} minutes for topic: ${topicId}`)
            // In production, this would call:
            // await suiClient.signAndExecuteTransaction(...)
          }}
        />
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <Save size={16} />
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  )
}

