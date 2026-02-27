import { useState, useEffect } from 'react'

export function useIdleDetection() {
    const [isIdle, setIsIdle] = useState(false)
    const [idleTime, setIdleTime] = useState(0)

    useEffect(() => {
        // @ts-ignore - types not synced yet for custom preload
        if (!window.ipcRenderer?.onIdleStatusChange) {
            console.warn("IPC Not found")
            return
        }

        // @ts-ignore
        const cleanup = window.ipcRenderer.onIdleStatusChange((status) => {
            setIsIdle(status.isIdle)
            if (status.idleTime) setIdleTime(status.idleTime)
        })

        return cleanup
    }, [])

    return { isIdle, idleTime }
}
