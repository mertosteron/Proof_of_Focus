
import { Transaction } from '@mysten/sui/transactions'
import { useSuiClient } from '@mysten/dapp-kit'
import { useWalletStore } from '../store/useWalletStore'
import { PACKAGE_ID, CLOCK_ID } from '../constants'

const MODULE_NAME = 'accountability_pool'

// Shape of the Move event payloads we read (parsedJson is loosely typed by the SDK)
interface PoolEventJson {
    pool_id?: string
    participant?: string
    winner?: string
}

// Parsed on-chain Pool summary returned by fetchPools (all numbers are u64
// strings as delivered by the RPC).
export interface PoolSummary {
    id: string
    stake_amount: string
    participants: string
    join_window_end: string
    end_time: string
    target_duration: string
}

export function usePools() {
    const client = useSuiClient()
    const { keypair } = useWalletStore()

    const createPool = async (stakeAmountSui: number, joinDurationMs: number, executionDurationMs: number, targetDurationMs: number) => {
        console.log("Creating Pool...", { stakeAmountSui, joinDurationMs, executionDurationMs, targetDurationMs })
        if (!keypair) {
            alert("Please import wallet first")
            return
        }

        const tx = new Transaction()

        // Convert SUI to MIST (10^9). Round first: BigInt() throws on a
        // non-integer float (e.g. 0.1 * 1e9 can produce fractional noise).
        const stakeAmountMist = BigInt(Math.round(stakeAmountSui * 1_000_000_000))

        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::create_pool`,
            arguments: [
                tx.pure.u64(stakeAmountMist),
                tx.pure.u64(joinDurationMs),
                tx.pure.u64(executionDurationMs),
                tx.pure.u64(targetDurationMs),
                tx.object(CLOCK_ID)
            ],
        })

        try {
            const result = await client.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: {
                    showEffects: true,
                    showEvents: true,
                    showObjectChanges: true
                }
            })
            console.log("Pool Created Success:", result)

            // Try to find the Created Object ID from changes
            const createdPool = result.objectChanges?.find(
                c => c.type === 'created' && c.objectType.includes('Pool')
            )

            if (createdPool && 'objectId' in createdPool) {
                alert(`Pool Deployed! ID: ${createdPool.objectId} \nCopy this to Join.`)
            } else {
                alert("Pool Deployed! Check console for ID.")
            }

        } catch (e) {
            console.error("Pool Creation Failed:", e)
            alert(`Failed to create pool.Check console.Error: ${e} `)
        }
    }

    const joinPool = async (poolId: string, stakeAmountSui: number) => {
        if (!keypair) {
            alert("Please import wallet first")
            return
        }

        const tx = new Transaction()
        const stakeAmountMist = BigInt(Math.round(stakeAmountSui * 1_000_000_000))

        // Split coin for joining
        const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(stakeAmountMist)])

        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::join_pool`,
            arguments: [
                tx.object(poolId),
                stakeCoin,
                tx.object(CLOCK_ID)
            ],
        })

        // Essential: Transfer the coin object back to sender because it was only passed by reference
        tx.transferObjects([stakeCoin], tx.pure.address(keypair.getPublicKey().toSuiAddress()))

        try {
            const result = await client.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx
            })
            console.log("Joined Pool:", result)
            alert("Successfully Joined Pool!")
        } catch (e) {
            console.error(e)
            alert("Failed to join pool")
        }
    }

    const fetchPools = async () => {
        try {
            // 1. Query Events to find created pools
            const events = await client.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::PoolCreated`
                },
                limit: 50,
                order: "descending"
            })

            if (!events.data || events.data.length === 0) {
                return []
            }

            // 2. Extract Pool IDs
            const poolIds = events.data
                .map(e => (e.parsedJson as PoolEventJson | undefined)?.pool_id)
                .filter((id): id is string => !!id)

            // Deduplicate IDs
            const uniqueIds = [...new Set(poolIds)]

            if (uniqueIds.length === 0) return []

            // 3. Fetch Object Details
            const objects = await client.multiGetObjects({
                ids: uniqueIds,
                options: {
                    showContent: true,
                }
            })

            // 4. Parse Data
            const pools = objects.map((obj): PoolSummary | null => {
                const content = obj.data?.content
                if (content?.dataType === 'moveObject') {
                    const fields = content.fields as Record<string, unknown>
                    return {
                        id: obj.data?.objectId as string,
                        stake_amount: fields.stake_amount as string,
                        participants: fields.participant_count as string,
                        join_window_end: fields.join_window_end as string,
                        end_time: fields.end_time as string,
                        target_duration: fields.target_duration as string
                    }
                }
                return null
            }).filter((p): p is PoolSummary => !!p)

            return pools
        } catch (e) {
            console.error("Failed to fetch pools:", e)
            return []
        }
    }

    const fetchUserParticipation = async () => {
        if (!keypair) return new Set<string>()

        try {
            const sender = keypair.getPublicKey().toSuiAddress()
            const events = await client.queryEvents({
                // Fetching all events for user is safer for finding OUR joins.
                query: {
                    Sender: sender
                },
                limit: 50,
                order: "descending"
            })

            const joinedPoolIds = new Set<string>()

            events.data.forEach(e => {
                if (e.type === `${PACKAGE_ID}::${MODULE_NAME}::JoinedPool`) {
                    const poolId = (e.parsedJson as PoolEventJson | undefined)?.pool_id
                    if (poolId) joinedPoolIds.add(poolId)
                }
            })

            return joinedPoolIds
        } catch (e) {
            console.error("Failed to fetch user participation:", e)
            return new Set<string>()
        }
    }

    const fetchUserProofs = async () => {
        if (!keypair) return new Set<string>()
        try {
            const sender = keypair.getPublicKey().toSuiAddress()
            const events = await client.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::ProofSubmitted`
                },
                limit: 50,
                order: "descending"
            })

            const proofPoolIds = new Set<string>()
            events.data.forEach(e => {
                const json = e.parsedJson as PoolEventJson | undefined
                if (json?.participant === sender && json.pool_id) {
                    proofPoolIds.add(json.pool_id)
                }
            })
            return proofPoolIds
        } catch (e) {
            console.error("Failed to fetch proofs:", e)
            return new Set<string>()
        }
    }

    const fetchUserClaims = async () => {
        if (!keypair) return new Set<string>()
        try {
            const sender = keypair.getPublicKey().toSuiAddress()
            // We want to find pools where WE claimed
            // RewardClaimed event has `winner` field.
            const events = await client.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::RewardClaimed`
                },
                limit: 50,
                order: "descending"
            })

            const claimedPoolIds = new Set<string>()
            events.data.forEach(e => {
                const json = e.parsedJson as PoolEventJson | undefined
                if (json?.winner === sender && json.pool_id) {
                    claimedPoolIds.add(json.pool_id)
                }
            })
            return claimedPoolIds
        } catch (e) {
            console.error("Failed to fetch claims:", e)
            return new Set<string>()
        }
    }

    // submit_proof now requires a FocusBlock the user owns whose duration meets
    // the pool target. We locate a qualifying block client-side and pass it in.
    const submitProof = async (poolId: string, targetDurationMs: number) => {
        if (!keypair) return
        const requiredMinutes = Math.ceil(targetDurationMs / 60000)

        // Find an owned FocusBlock long enough to satisfy the pool target.
        let proofBlockId: string | undefined
        try {
            const blocks = await client.getOwnedObjects({
                owner: keypair.getPublicKey().toSuiAddress(),
                filter: { StructType: `${PACKAGE_ID}::focus_block::FocusBlock` },
                options: { showContent: true }
            })
            for (const b of blocks.data) {
                const content = b.data?.content
                if (content?.dataType === 'moveObject') {
                    const fields = content.fields as Record<string, unknown>
                    if (Number(fields.duration) >= requiredMinutes) {
                        proofBlockId = b.data?.objectId
                        break
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load focus blocks:", e)
        }

        if (!proofBlockId) {
            alert(`No qualifying Focus Block found. Complete a ${requiredMinutes}min focus session first, then submit proof.`)
            return
        }

        const tx = new Transaction()
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::submit_proof`,
            arguments: [
                tx.object(poolId),
                tx.object(proofBlockId),
                tx.object(CLOCK_ID)
            ]
        })
        try {
            await client.signAndExecuteTransaction({ signer: keypair, transaction: tx })
            alert("Proof Submitted! You are now eligible for rewards.")
        } catch (e) {
            console.error(e)
            alert("Failed to submit proof: " + e)
        }
    }

    const claimReward = async (poolId: string) => {
        if (!keypair) return
        const tx = new Transaction()
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::claim_reward`,
            arguments: [
                tx.object(poolId),
                tx.object(CLOCK_ID)
            ]
        })
        try {
            await client.signAndExecuteTransaction({ signer: keypair, transaction: tx })
            alert("Reward Claimed! Check your wallet.")
        } catch (e) {
            console.error(e)
            alert("Failed to claim reward (Pool might not be ended yet): " + e)
        }
    }

    return { createPool, joinPool, fetchPools, fetchUserParticipation, fetchUserClaims, fetchUserProofs, submitProof, claimReward }
}
