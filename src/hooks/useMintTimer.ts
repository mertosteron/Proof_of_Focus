import { Transaction } from '@mysten/sui/transactions'
import { useSuiClient } from '@mysten/dapp-kit'
import { useWalletStore } from '../store/useWalletStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { PACKAGE_ID } from '../constants'

const MODULE_NAME = 'focus_block'

export function useMintTimer() {
    const client = useSuiClient()
    const { keypair } = useWalletStore()
    const settings = useSettingsStore()

    const mintFocusBlock = async (durationMinutes: number, category: string) => {
        if (!keypair) {
            alert("Please import your wallet first!")
            return
        }

        // If the user has a UserProfile, mint + update stats in one PTB via the
        // redesigned identity::mint_and_update (now user-callable, no AdminCap).
        // Otherwise fall back to a standalone focus_block::mint.
        let profileId: string | undefined
        try {
            const objects = await client.getOwnedObjects({
                owner: keypair.getPublicKey().toSuiAddress(),
                filter: { StructType: `${PACKAGE_ID}::identity::UserProfile` },
                options: { showContent: true }
            })
            profileId = objects.data[0]?.data?.objectId
        } catch (e) {
            console.error("Failed to fetch profile", e)
        }

        const tx = new Transaction()

        if (profileId) {
            tx.moveCall({
                target: `${PACKAGE_ID}::identity::mint_and_update`,
                arguments: [
                    tx.object(profileId),
                    tx.pure.u64(durationMinutes),
                    tx.pure.string(category),
                    tx.pure.vector('u8', []),
                    tx.pure.u64(settings.idleThreshold),
                    tx.pure.bool(settings.idleDetectionEnabled)
                ],
            })
        } else {
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::mint`,
                arguments: [
                    tx.pure.u64(durationMinutes),
                    tx.pure.string(category),
                    tx.pure.vector('u8', []),
                    tx.pure.u64(settings.idleThreshold),
                    tx.pure.bool(settings.idleDetectionEnabled)
                ],
            })
        }

        try {
            const result = await client.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: {
                    showEffects: true
                }
            })
            console.log('Mint success:', result)
            alert(profileId ? 'Focus Block Minted & Stats Updated! 🚀' : 'Focus Block Minted! (Create a profile to track stats) 🌿')
        } catch (err) {
            console.error('Mint failed:', err)
            alert('Mint failed. See console.')
        }
    }

    return { mintFocusBlock }
}
