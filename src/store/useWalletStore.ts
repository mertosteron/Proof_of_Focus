import { create } from 'zustand'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1'
import { decodeSuiPrivateKey, Keypair } from '@mysten/sui/cryptography'

interface WalletState {
    isConnected: boolean
    address: string | null
    keypair: Keypair | null
    privateKey: string | null // Store the raw string for export

    importKey: (privateKey: string) => boolean
    disconnect: () => void
}

export const useWalletStore = create<WalletState>((set) => ({
    isConnected: false,
    address: null,
    keypair: null,
    privateKey: null,

    importKey: (privateKeyInput: string) => {
        try {
            let keypair: Keypair;

            if (privateKeyInput.startsWith('suiprivkey')) {
                const { schema, secretKey } = decodeSuiPrivateKey(privateKeyInput)
                if (schema === 'ED25519') {
                    keypair = Ed25519Keypair.fromSecretKey(secretKey)
                } else if (schema === 'Secp256k1') {
                    keypair = Secp256k1Keypair.fromSecretKey(secretKey)
                } else {
                    throw new Error(`Unsupported schema: ${schema}`)
                }
            } else {
                // Assume hex or other format (basic fallback, might fail if not proper 32-byte seed)
                throw new Error("Only suiprivkey format supported for now")
            }

            const address = keypair.getPublicKey().toSuiAddress()

            set({
                isConnected: true,
                address,
                keypair,
                privateKey: privateKeyInput
            })

            // Save to local storage for persistence (DEMO ONLY)
            localStorage.setItem('focus_forge_privkey', privateKeyInput)

            return true
        } catch (e) {
            console.error("Failed to import key:", e)
            return false
        }
    },

    disconnect: () => {
        set({ isConnected: false, address: null, keypair: null, privateKey: null })
        localStorage.removeItem('focus_forge_privkey')
    }
}))
