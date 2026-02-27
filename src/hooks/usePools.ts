
import { Transaction } from '@mysten/sui/transactions'
import { useSuiClient } from '@mysten/dapp-kit'
import { useWalletStore } from '../store/useWalletStore'

// Updated Package ID with Settings Support (deployed 2025-12-06)
const PACKAGE_ID = '0xd92e7706ce871ecc0247f19e03baf31beadb645e0cc2eee3fab516408c5655fd'
const MODULE_NAME = 'accountability_pool'

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

        // Convert SUI to MIST (10^9)
        const stakeAmountMist = BigInt(stakeAmountSui * 1_000_000_000)

        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::create_pool`,
            arguments: [
                tx.pure.u64(stakeAmountMist),
                tx.pure.u64(joinDurationMs),
                tx.pure.u64(executionDurationMs),
                tx.pure.u64(targetDurationMs),
                tx.object('0x6') // Clock object is 0x6
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
        const stakeAmountMist = BigInt(stakeAmountSui * 1_000_000_000)

        // Split coin for joining
        const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(stakeAmountMist)])

        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::join_pool`,
            arguments: [
                tx.object(poolId),
                stakeCoin,
                tx.object('0x6') // Clock object is 0x6
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
            // @ts-ignore
            const poolIds = events.data.map(e => e.parsedJson?.pool_id).filter(id => !!id)

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
            const pools = objects.map((obj: any) => {
                const content = obj.data?.content
                if (content?.dataType === 'moveObject') {
                    // @ts-ignore
                    const fields = content.fields
                    return {
                        id: obj.data?.objectId,
                        stake_amount: fields.stake_amount,
                        participants: fields.participant_count,
                        join_window_end: fields.join_window_end,
                        end_time: fields.end_time,
                        target_duration: fields.target_duration
                    }
                }
                return null
            }).filter((p: any) => !!p)

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
                    // @ts-ignore
                    const poolId = e.parsedJson?.pool_id
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
                // @ts-ignore
                const participant = e.parsedJson?.participant
                // @ts-ignore
                const poolId = e.parsedJson?.pool_id

                if (participant === sender && poolId) {
                    proofPoolIds.add(poolId)
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
                // @ts-ignore
                const winner = e.parsedJson?.winner
                // @ts-ignore
                const poolId = e.parsedJson?.pool_id

                if (winner === sender && poolId) {
                    claimedPoolIds.add(poolId)
                }
            })
            return claimedPoolIds
        } catch (e) {
            console.error("Failed to fetch claims:", e)
            return new Set<string>()
        }
    }

    const submitProof = async (poolId: string) => {
        if (!keypair) return
        const tx = new Transaction()
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::submit_proof`,
            arguments: [
                tx.object(poolId),
                tx.object('0x6')
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
                tx.object('0x6')
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
