# Blackjackson — Multiplayer Blackjack Design Spec

**Date:** 2026-06-02
**Status:** Draft

## Overview

A multiplayer Blackjack game for the browser, played between friends. No real money — play chips reset each game. Hosted on GitHub Pages with Firebase (Firestore + Auth) as the backend. Modern, sleek casino-themed UI with SVG assets.

## Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + Framer Motion (animations)
- **State:** Zustand (client state), Firestore onSnapshot (server state sync)
- **Backend:** Firebase Firestore (game state), Firebase Auth (anonymous identity)
- **Hosting:** GitHub Pages via `gh-pages` or GitHub Actions
- **Cards:** Custom SVG components (no external card library)

## Architecture

### No Backend Server

The host's browser runs the Blackjack engine and writes authoritative game state to Firestore. Other clients read via real-time listeners. No backend code — everything runs in the browser.

### Pages & Routing

```
/                        Lobby (create game, join game, waiting room)
/table/:roomCode         Game table
```

### Firebase Structure

```
games/{gameId}
  id: string                    // 6-char room code "ABC123"
  phase: GamePhase              // waiting|dealing|insurance|playing|dealer|settlement|round_end
  hostId: string                // Firebase Auth UID
  rules: GameRules              // host-configured rules
  shoe: Card[]                  // remaining cards
  discard: Card[]               // played cards
  dealerHand: Card[]
  dealerHoleCard: Card | null
  players: PlayerState[]         // PlayerState includes: id, name, seat, hands[], chips, activeHandIndex, isActive
  currentTurn: number           // seat index, -1 for dealer
  turnTimeLimit: number         // seconds, 0 = no limit
  turnStartedAt: timestamp|null
  roundNumber: number
  createdAt: timestamp
```

### Data Flow Per Action

1. Player clicks action → writes intent to Firestore (`playerActions/{gameId}/{playerId}` subdocument or field)
2. Host's browser picks up intent, runs engine, writes updated `games/{gameId}`
3. All clients receive `onSnapshot` update and re-render

Host disconnect: game pauses with "Host disconnected" overlay. On reconnect, resumes.

## Firebase Auth

Anonymous sign-in on page load — no friction, no email/password. Each user gets a stable UID for the session. Display names are entered in the lobby (stored locally before joining).

## Lobby

### Create Game

- Host enters a display name
- Game settings panel with defaults pre-configured:
  - **Decks:** 1-8 (default: 6)
  - **Dealer soft 17:** Stand (S17) / Hit (H17) (default: S17)
  - **Blackjack payout:** 3:2 / 6:5 (default: 3:2)
  - **Surrender:** None / Late (default: None)
  - **Insurance:** On / Off (default: Off)
  - **Double down:** Any two / 9-10-11 only / None (default: Any two)
  - **Splits:** None / Once / Twice / Unlimited (default: Once)
  - **Starting chips:** 100-10000 (default: 1000)
  - **Min bet:** 1 to starting chips (default: 10)
  - **Max bet:** min bet to starting chips (default: 500)
  - **Turn timer:** 0-120 seconds (default: 30s, 0 = no limit)
- "Create Game" → generates 6-char alphanumeric room code, creates Firestore document

### Join Game

- Enter display name
- Enter 6-char room code
- "Join" → validates room exists and isn't full/started, adds player
- Also works via URL: `?code=ABC123` pre-fills and auto-joins

### Waiting Room

- Room code displayed prominently with copy button
- Player list: colored circle avatars with initials, display names
- Host controls: Start Game (enabled with 1+ players), Kick Player
- Player view: "Waiting for host to start..."
- Max 6 seats, players fill seats in join order

### Visual Style

- Dark gradient background (#0a0a1a → #1a1a2e)
- Gold/amber accent colors for buttons and highlights
- Glassmorphism cards for settings/forms
- Smooth Framer Motion transitions between states

## Game Table

### Layout

- Overhead casino table: green felt circular/semicircular layout
- Dealer at top center
- Player seats arranged in arc (adjusts for player count)
- Each seat shows: player avatar, cards, hand value, bet chip stack, remaining chips

### Cards

- Custom SVG components with standard suit symbols (♠ ♥ ♦ ♣)
- Red suits (♥ ♦) in red, black suits (♠ ♣) in black
- Face cards display suit symbol + letter (J/Q/K)
- Card back: pattern SVG for hole card and shoe
- Dealing animation: slide from shoe position to hand

### Turn Flow

1. Phase: **dealing** → cards dealt with animation
2. Phase: **insurance** → if dealer shows Ace, offer insurance to all (host config)
3. Phase: **playing** → turn indicator moves clockwise through seats
   - Active seat gets glowing border
   - Action buttons appear: Hit, Stand, Double (if eligible), Split (if eligible), Surrender (if eligible)
   - Turn timer countdown bar if enabled
   - Timer expiry = auto-stand
4. Phase: **dealer** → hole card revealed, dealer draws to 16 (or soft 17 if H17)
5. Phase: **settlement** → each hand evaluated, wins/losses animated, chips updated
6. Phase: **round_end** → 5-second delay, then next round or game over

### Split Flow

- New hand created, one card dealt to each
- Player plays each hand in sequence (left to right)
- Different bets possible on split hands (equal to original bet)
- Max 4 hands per player (practical cap for "unlimited" splits)
- Aces split: only one additional card per hand, no re-split

### Edge Cases

- **All players bust:** skip dealer phase, go straight to settlement
- **Dealer blackjack:** all players lose unless they also have blackjack (push). Insurance bets pay 2:1.
- **Player blackjack + dealer blackjack:** push (tie)
- **Mid-round join:** players who join while a round is in progress wait in "spectating" state until next betting phase
- **Reshuffle:** when shoe is below ~25% of initial size (cut card region), collect discard pile except current hands and reshuffle
- **Zero chips:** player can still sit at table but cannot place a bet — auto-sits out each round. They can leave and rejoin with fresh chips only when host starts a new game.
- **Host disconnect:** game state frozen. When host reconnects within 2 minutes, resumes. After 2 minutes, game document is deleted (cleanup).

### Visual Effects

- Card deal: slide-in from dealer position with slight rotation
- Win: gold glow pulse on hand, chip increase animation
- Blackjack: special sparkle effect
- Bust: red flash + card shake
- Push: neutral gray pulse
- Turn timer: amber progress bar that turns red at 5 seconds

### Chips & Betting

- Starting bank per game session (host-set)
- Betting: click chip denominations or use +/- buttons
- Bet shown as stacked chip SVG next to hand
- Win: chips fly from pot to player's stack
- Running out of chips = can't bet, spectator only

## Game Engine (`src/engine/`)

Pure TypeScript module with zero UI dependencies. Fully testable.

### Exports

```ts
createGame(rules: GameRules): GameState
addPlayer(state: GameState, player: PlayerState): GameState
removePlayer(state: GameState, playerId: string): GameState
startGame(state: GameState): GameState
processAction(state: GameState, playerId: string, action: PlayerAction): GameState
playDealer(state: GameState): GameState
settleHands(state: GameState): GameState
evaluateHand(cards: Card[]): HandEvaluation
createShoe(decks: number): Card[]
```

### Types

```ts
type Suit = 'S' | 'H' | 'D' | 'C'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
type Card = { suit: Suit; rank: Rank }

type GamePhase = 'waiting' | 'dealing' | 'insurance' | 'playing' | 'dealer' | 'settlement' | 'round_end'

type GameRules = {
  decks: 1|2|3|4|5|6|7|8
  dealerSoft17: 'stand' | 'hit'
  blackjackPayout: '3:2' | '6:5'
  surrender: 'none' | 'late'
  insurance: boolean
  doubleDown: 'any' | '9-10-11' | 'none'
  splits: 'none' | 'once' | 'twice' | 'unlimited'
  startingChips: number
  minBet: number
  maxBet: number
  turnTimeLimit: number
}

type PlayerAction =
  | { type: 'hit' }
  | { type: 'stand' }
  | { type: 'double' }
  | { type: 'split' }
  | { type: 'surrender' }
  | { type: 'insurance_yes' }
  | { type: 'insurance_no' }
  | { type: 'bet', amount: number }

type HandEvaluation = {
  value: number
  soft: boolean
  isBlackjack: boolean
  isBust: boolean
}
```

## Sound Effects (Optional)

- Muted by default, toggle in UI
- Simple Web Audio API generated sounds (no external files):
  - Card deal: short "shhwp" sound
  - Chip bet: click/clack
  - Win: ascending chime
  - Bust/loss: descending tone
  - Blackjack: celebratory jingle
  - Turn timer warning: tick at 5 seconds

## Scope Boundaries

**In scope:**
- Create/join lobby with room codes
- Full Blackjack rules engine with all configurable options
- Real-time multiplayer (1-6 players)
- Casino-themed UI with animations
- Chip betting system (play money)
- Turn timer
- Mobile responsive

**Out of scope:**
- Chat system
- Persistent accounts/user profiles
- Leaderboards/statistics
- In-game purchases
- Spectator mode beyond the 6-seat limit
- Multiple simultaneous tables per host
- Dealer AI options (always follows standard dealer rules)

## File Structure

```
Blackjackson/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                    // Entry point, Firebase init
│   ├── App.tsx                     // Router setup
│   ├── engine/
│   │   ├── index.ts               // Re-exports
│   │   ├── game.ts                // createGame, startGame
│   │   ├── actions.ts             // processAction
│   │   ├── dealer.ts              // playDealer
│   │   ├── settlement.ts          // settleHands
│   │   ├── hand.ts                // evaluateHand, hand utilities
│   │   ├── shoe.ts                // createShoe, draw, reshuffle
│   │   └── types.ts               // All type definitions
│   ├── firebase/
│   │   ├── config.ts              // Firebase init
│   │   ├── auth.ts                // Anonymous sign-in
│   │   ├── games.ts               // Firestore game CRUD + listener
│   │   └── actions.ts             // Player action writes
│   ├── stores/
│   │   ├── authStore.ts           // Zustand auth
│   │   ├── gameStore.ts           // Zustand game (mirrors Firestore)
│   │   └── uiStore.ts             // Local UI state
│   ├── components/
│   │   ├── Lobby/
│   │   │   ├── CreateGameForm.tsx
│   │   │   ├── JoinGameForm.tsx
│   │   │   ├── WaitingRoom.tsx
│   │   │   └── RulesConfig.tsx
│   │   ├── Table/
│   │   │   ├── TableFelt.tsx
│   │   │   ├── DealerArea.tsx
│   │   │   ├── PlayerPosition.tsx
│   │   │   ├── CardComponent.tsx
│   │   │   ├── CardHand.tsx
│   │   │   ├── ChipStack.tsx
│   │   │   ├── ActionButtons.tsx
│   │   │   ├── TurnTimer.tsx
│   │   │   ├── BetControls.tsx
│   │   │   └── RoundResult.tsx
│   │   └── Shared/
│   │       ├── PlayerAvatar.tsx
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   ├── hooks/
│   │   ├── useGameSync.ts         // Firestore onSnapshot hook
│   │   ├── useGameEngine.ts       // Host engine loop
│   │   └── useSound.ts            // Web Audio API sounds
│   ├── utils/
│   │   └── roomCode.ts            // Generate 6-char codes
│   └── styles/
│       └── index.css              // Tailwind imports + custom utilities
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .github/
    └── workflows/
        └── deploy.yml             // GitHub Pages deploy
```
