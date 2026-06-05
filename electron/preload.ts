import { ipcRenderer, contextBridge, type IpcRendererEvent } from 'electron'

interface IdleStatus {
    isIdle: boolean
    idleTime?: number
    reason?: string
}

// --------- Expose a narrow, purpose-built API to the Renderer process ---------
// We intentionally do NOT expose a generic ipcRenderer (on/send/invoke) to the
// renderer: that would let renderer code message any channel and is a known
// Electron security anti-pattern. The renderer only needs idle status updates.
contextBridge.exposeInMainWorld('ipcRenderer', {
    onIdleStatusChange: (callback: (status: IdleStatus) => void) => {
        const subscription = (_event: IpcRendererEvent, status: IdleStatus) => callback(status)
        ipcRenderer.on('idle-status-changed', subscription)
        return () => ipcRenderer.off('idle-status-changed', subscription)
    }
})
