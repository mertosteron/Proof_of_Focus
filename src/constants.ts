// Single source of truth for on-chain config.
//
// focus_forge package — redeployed to Sui testnet 2026-06-06 (the old devnet
// package 0x54a4... was wiped). Testnet is persistent, unlike devnet.
export const PACKAGE_ID = '0xb769f336d89135955430d588bd58f39d8c2d711425ec16aa0ce759956b2fd029'

export const NETWORK = 'testnet' as const

// Sui system Clock shared object — same on every network.
export const CLOCK_ID = '0x6'
