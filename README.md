# POFocus

**POFocus** is a desktop focus app that turns your deep‑work sessions into on‑chain proof. It pairs a Pomodoro‑style timer with the **Sui** blockchain: every completed session can be minted as a `FocusBlock` NFT, build up an on‑chain profile, evolve soulbound skill badges, and back social "Accountability Pools" where you stake SUI and earn it back only by actually doing the work.

> Status: `v0.1.0-alpha` — running on **Sui testnet**. This is a hackathon‑stage project; treat it as experimental.

---

## Why it exists

Most productivity apps ask you to trust a streak counter that lives on someone else's server. POFocus instead writes your focus history to a public ledger you own, and adds real stakes:

- **Proof of focus** — a completed session becomes a `FocusBlock` NFT in your wallet.
- **Anti‑cheating** — the desktop app watches system idle time and auto‑pauses when you walk away, so you can't farm rewards while AFK.
- **Skin in the game** — Accountability Pools let a group stake SUI; only members who submit a valid proof of focus split the pot. Slackers forfeit their stake (the "Lazy Tax").

---

## Features

- ⏱️ **Focus timer** — configurable Pomodoro sessions (focus duration, short/long breaks).
- 🛡️ **Idle detection** — the Electron main process tracks real system idle time and lock‑screen events; the app pauses the session and shows an "Idle Detected" overlay to prevent AFK farming.
- 🧱 **FocusBlock NFTs** — mint a tamper‑evident record of each completed session (duration, category, timestamp, settings snapshot).
- 👤 **On‑chain identity** — a `UserProfile` tracks total minutes, sessions, XP, and level (1 level per 100 XP).
- 🏅 **Soulbound skill badges** — non‑transferable NFTs that evolve through tiers (Novice → Apprentice → … → Grandmaster) as you log hours; pick one as your profile picture.
- 💰 **Accountability Pools** — stake SUI, complete the target focus within the window, and claim your share of the pot; if nobody wins, everyone can reclaim their stake.
- 🔑 **Lightweight wallet** — import a Sui private key (`suiprivkey…`) directly in the app; no browser extension required.

---

## Tech stack

| Layer            | Tech                                                                 |
| ---------------- | ------------------------------------------------------------------- |
| Desktop shell    | Electron 39                                                          |
| UI               | React 19, Vite 7, TypeScript, Tailwind CSS 4, lucide‑react          |
| State            | Zustand                                                              |
| Chain access     | `@mysten/sui`, `@mysten/dapp-kit`, TanStack Query                    |
| Smart contracts  | Move (Sui Move 2024) — package name `focus_forge`                   |
| Network          | Sui **testnet**                                                     |

---

## Project structure

```
POFocus/
├── electron/                 # Electron main + preload (window, idle detection bridge)
│   ├── main.ts
│   └── preload.ts
├── src/                      # React renderer (the app UI)
│   ├── components/           # Timer, pools, identity, settings, NFT cards, …
│   ├── hooks/                # useMintTimer, useIdleDetection, usePools
│   ├── store/                # Zustand stores (focus, wallet, settings, history)
│   ├── constants.ts          # PACKAGE_ID, NETWORK, CLOCK_ID — on-chain config
│   ├── Providers.tsx         # Sui client + wallet + query providers
│   └── App.tsx
└── contracts/focus_forge/    # Move smart contracts
    ├── sources/
    │   ├── focus_block.move          # FocusBlock NFT + on-chain UserSettings
    │   ├── identity.move             # UserProfile, XP/level, mint_and_update
    │   ├── accountability_pool.move  # Stake-to-focus pools + reward logic
    │   ├── skill_badge.move          # Evolving soulbound badge
    │   └── soulbound_collection.move # Multi-badge collection + PFP selection
    └── tests/
```

---

## On-chain model

The Move package `focus_forge` is made up of these modules:

- **`focus_block`** — `FocusBlock` is an owned NFT minted on session completion, storing duration, category, timestamp, a verification hash, and a snapshot of idle settings. Also holds `UserSettings` (your preferred durations/thresholds) on chain.
- **`identity`** — `UserProfile` accumulates `total_minutes`, `total_sessions`, `xp`, and `level`. `mint_and_update` mints a FocusBlock and updates your stats in a single transaction (no admin capability required).
- **`accountability_pool`** — a shared `Pool` object holds a pot of staked SUI. Members **join** during a join window, **submit a FocusBlock** as proof during the execution window (its duration must meet the pool target), then winners **claim** an equal share of the pot after it ends. If a pool ends with no winners, participants can **reclaim** their stake.
- **`skill_badge` / `soulbound_collection`** — non‑transferable badges that level up by accumulated minutes (10h, 50h, 100h, 200h, 500h thresholds), with a collection system for owning multiple badges and choosing an active profile picture.

Current deployment is configured in [`src/constants.ts`](src/constants.ts):

```ts
export const PACKAGE_ID = '0xb769f336d89135955430d588bd58f39d8c2d711425ec16aa0ce759956b2fd029'
export const NETWORK = 'testnet'
export const CLOCK_ID = '0x6'   // Sui system Clock shared object
```

---

## Getting started

### Prerequisites

- **Node.js** 20.19+ (or 22.12+) and npm — required by Vite 7
- (Contracts only) the **Sui CLI** if you want to build/test or redeploy the Move package
- A Sui **testnet** account with some testnet SUI (use the [Sui faucet](https://docs.sui.io/guides/developer/getting-started/get-coins))

### Run the desktop app

```bash
npm install
npm run dev
```

`npm run dev` launches the Vite dev server and opens the Electron window with hot reloading.

> Idle detection only works inside the Electron window (it uses the OS power monitor). If you open the app in a plain browser, the timer still runs but idle pausing is disabled.

### Import a wallet

Open the app, click **Import Wallet** in the sidebar, and paste a Sui private key in `suiprivkey…` format. For demo convenience the app will also auto‑import from:

1. a `VITE_WALLET_PRIVATE_KEY` environment variable, or
2. a previously saved key in `localStorage`.

> ⚠️ **Security note:** keys are stored in `localStorage` in plaintext for this alpha. Use a throwaway **testnet** key only — never a mainnet wallet that holds real funds.

### Build for production

```bash
npm run build      # type-check + Vite build
npm run lint       # ESLint
```

---

## Working on the smart contracts

From `contracts/focus_forge/`:

```bash
sui move build      # compile the Move package
sui move test       # run the Move unit tests
```

To deploy your own copy, publish the package to testnet and update `PACKAGE_ID` in `src/constants.ts` with the new package address.

---

## Roadmap / known limitations

- Wallet keys are stored unencrypted in `localStorage` — needs a proper secure keystore.
- A single `FocusBlock` can satisfy multiple overlapping pools (proofs are referenced, not consumed).
- Skill‑badge evolution is currently decoupled from the core stat loop (seed badge is cosmetic).
- Several UI stats on the Focus tab are still placeholders.

---

## License

The `skill_badge` module is marked Apache‑2.0. No top‑level project license file is defined yet.
