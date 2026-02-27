import { Transaction } from '@mysten/sui/transactions'
import { useSuiClient } from '@mysten/dapp-kit'
import { useWalletStore } from '../store/useWalletStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useSessionHistoryStore } from '../store/useSessionHistoryStore'

// Updated Package ID with Settings Support (deployed 2025-12-06)
const PACKAGE_ID = '0xd92e7706ce871ecc0247f19e03baf31beadb645e0cc2eee3fab516408c5655fd'
const MODULE_NAME = 'focus_block'
// const FUNCTION_NAME = 'mint'

export function useMintTimer() {
    const client = useSuiClient()
    const { keypair } = useWalletStore()
    const settings = useSettingsStore()
    const addSession = useSessionHistoryStore(s => s.addSession)

    const mintFocusBlock = async (durationMinutes: number, category: string) => {
        if (!keypair) {
            alert("Please import your wallet first!")
            return
        }

        // 1. Check for User Profile
        let profileId = null
        try {
            const objects = await client.getOwnedObjects({
                owner: keypair.getPublicKey().toSuiAddress(),
                filter: {
                    StructType: `${PACKAGE_ID}::identity::UserProfile`
                },
                options: { showContent: true }
            })
            if (objects.data.length > 0) {
                profileId = objects.data[0].data?.objectId
            }
        } catch (e) {
            console.error("Failed to fetch profile", e)
        }

        // 2. Create Transaction (PTB)
        const tx = new Transaction()

        if (profileId) {
            console.log("Minting with Profile Update:", profileId)
            // Call identity::mint_and_update with settings
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
            // Basic Mint (No Profile) with settings
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

        // 3. Execute
        try {
            const result = await client.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: {
                    showEffects: true
                }
            })
            console.log('Mint success:', result)

            // 4. Record session in local history for stats
            addSession({
                timestamp: Date.now(),
                durationMinutes,
                category,
                completed: true
            })

            alert(profileId ? 'Focus Block Minted & Stats Updated! 🚀' : 'Focus Block Minted! (Create a profile to track stats) 🌿')
        } catch (err) {
            console.error('Mint failed:', err)
            alert('Mint failed. See console.')
        }
    }

    return { mintFocusBlock }
}

