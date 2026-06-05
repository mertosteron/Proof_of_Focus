import { useState, useEffect } from 'react'

export function useIdleDetection() {
    const [isIdle, setIsIdle] = useState(false)
    const [idleTime, setIdleTime] = useState(0)

    useEffect(() => {
        if (!window.ipcRenderer?.onIdleStatusChange) {
            // Running in a plain browser (vite dev without Electron) — no idle bridge.
            console.warn("IPC bridge not found; idle detection disabled")
            return
        }

        const cleanup = window.ipcRenderer.onIdleStatusChange((status) => {
            setIsIdle(status.isIdle)
            setIdleTime(status.idleTime ?? 0)
        })

        return cleanup
    }, [])

    return { isIdle, idleTime }
}
