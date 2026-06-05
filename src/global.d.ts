/// <reference types="vite/client" />

// Status payload pushed from the Electron main process (see electron/main.ts)
export interface IdleStatus {
    isIdle: boolean
    idleTime?: number
    reason?: string
}

// API exposed to the renderer by electron/preload.ts via contextBridge.
// Keep this in sync with the bridge — it is intentionally narrow (no generic
// ipcRenderer passthrough) so the renderer cannot send on arbitrary channels.
export interface POFocusBridge {
    onIdleStatusChange: (callback: (status: IdleStatus) => void) => () => void
}

declare global {
    interface Window {
        ipcRenderer?: POFocusBridge
    }
}

// Vite env vars used by the app
interface ImportMetaEnv {
    readonly VITE_WALLET_PRIVATE_KEY?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

// Electron exposes a non-standard CSS property to mark draggable window regions.
declare module 'react' {
    interface CSSProperties {
        WebkitAppRegion?: 'drag' | 'no-drag'
    }
}
