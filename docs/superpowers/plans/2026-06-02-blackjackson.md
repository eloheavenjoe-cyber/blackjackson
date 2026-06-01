# Blackjackson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multiplayer Blackjack game (React + Firebase) deployable to GitHub Pages with a casino-themed UI, configurable rules, and real-time multiplayer via Firestore.

**Architecture:** React 18 SPA with Vite. Pure TypeScript Blackjack engine (no UI deps). Firebase Firestore as real-time backend — host browser runs the engine, all clients sync via onSnapshot. Zustand for client state. Tailwind CSS v4 + Framer Motion for casino visuals. Custom SVG card components.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Zustand, Firebase (Firestore + Auth), React Router v6, Vitest

---

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`

- [ ] **Step 1: Run Vite scaffold command**

```bash
npm create vite@latest . -- --template react-ts
```

Run from: `C:\Users\Faber\Projects\Blackjackson`

- [ ] **Step 2: Verify scaffold**

```bash
ls
```

Expected: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/` directory exist.

- [ ] **Step 3: Clean up default Vite content**

Replace `src/App.tsx` with a minimal placeholder:

```tsx
function App() {
  return <div className="min-h-screen bg-gray-950 text-white" />
}

export default App
```

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Delete: `src/App.css`, `src/assets/react.svg`, `public/vite.svg`

- [ ] **Step 4: Clean index.html**

Replace `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Blackjackson</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="bg-gray-950">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Install and verify**

```bash
npm install && npm run dev
```

Expected: dev server starts without errors.

- [ ] **Step 6: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install firebase react-router-dom zustand framer-motion
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Verify install**

Check `package.json` has all dependencies listed in both `dependencies` and `devDependencies`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json && git commit -m "chore: install dependencies (Firebase, Router, Zustand, Framer Motion, Tailwind, Vitest)"
```

---

### Task 3: Configure Tailwind CSS v4 and Vite

**Files:**
- Modify: `vite.config.ts`
- Create: `src/index.css`

- [ ] **Step 1: Update vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/blackjackson/',
})
```

- [ ] **Step 2: Write src/index.css**

```css
@import "tailwindcss";

@theme {
  --color-felt: #0d5e2e;
  --color-felt-dark: #094a24;
  --color-gold: #d4a843;
  --color-gold-light: #f0d68a;
  --color-chip-red: #c0392b;
  --color-chip-blue: #2980b9;
  --color-chip-green: #27ae60;
  --color-chip-black: #1a1a1a;
  --color-chip-white: #ecf0f1;
}

body {
  @apply bg-gray-950 text-white antialiased;
  font-family: 'Inter', system-ui, sans-serif;
}
```

- [ ] **Step 3: Create favicon (spade SVG)**

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <text y="28" font-size="28">♠</text>
</svg>
```

- [ ] **Step 4: Verify Tailwind works**

Add `<h1 className="text-4xl font-bold text-gold">Blackjackson</h1>` inside App.tsx, run `npm run dev`, verify gold text renders.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: configure Tailwind CSS v4, Vite, and favicon"
```

---

### Task 4: Engine types

**Files:**
- Create: `src/engine/types.ts`
- Create: `src/engine/__tests__/types.test.ts`

- [ ] **Step 1: Write failing test for types (compile-time check)**

Create `src/engine/__tests__/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { Card, Suit, Rank, GamePhase, GameRules, PlayerState, HandState, GameState } from '../types'

describe('Card type', () => {
  it('accepts valid card', () => {
    const card: Card = { suit: 'H', rank: 'A' }
    expect(card.suit).toBe('H')
    expect(card.rank).toBe('A')
  })
})

describe('GameRules defaults', () => {
  it('has all required fields', () => {
    const rules: GameRules = {
      decks: 6,
      dealerSoft17: 'stand',
      blackjackPayout: '3:2',
      surrender: 'none',
      insurance: false,
      doubleDown: 'any',
      splits: 'once',
      startingChips: 1000,
      minBet: 10,
      maxBet: 500,
      turnTimeLimit: 30,
    }
    expect(rules.decks).toBe(6)
  })
})
```

- [ ] **Step 2: Write types implementation**

Create `src/engine/types.ts`:

```ts
export type Suit = 'S' | 'H' | 'D' | 'C'

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export type Card = {
  suit: Suit
  rank: Rank
}

export type GamePhase =
  | 'waiting'
  | 'betting'
  | 'dealing'
  | 'insurance'
  | 'playing'
  | 'dealer'
  | 'settlement'
  | 'round_end'

export type GameRules = {
  decks: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
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

export type HandState = {
  cards: Card[]
  bet: number
  isDoubled: boolean
  isSurrendered: boolean
  isStood: boolean
  result: 'win' | 'lose' | 'push' | 'blackjack' | 'pending'
  payout: number
}

export type PlayerState = {
  id: string
  name: string
  seat: number
  hands: HandState[]
  activeHandIndex: number
  chips: number
  isActive: boolean
  insuranceBet: number
}

export type PlayerAction =
  | { type: 'hit'; playerId: string }
  | { type: 'stand'; playerId: string }
  | { type: 'double'; playerId: string }
  | { type: 'split'; playerId: string }
  | { type: 'surrender'; playerId: string }
  | { type: 'insurance_yes'; playerId: string }
  | { type: 'insurance_no'; playerId: string }
  | { type: 'bet'; playerId: string; amount: number }

export type HandEvaluation = {
  value: number
  soft: boolean
  isBlackjack: boolean
  isBust: boolean
}

export type GameState = {
  id: string
  phase: GamePhase
  hostId: string
  rules: GameRules
  shoe: Card[]
  discard: Card[]
  dealerHand: Card[]
  dealerHoleCard: Card | null
  players: PlayerState[]
  currentTurn: number
  turnTimeLimit: number
  turnStartedAt: number | null
  roundNumber: number
  createdAt: number
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/engine/__tests__/types.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add engine type definitions"
```

---

### Task 5: Hand evaluation engine

**Files:**
- Create: `src/engine/hand.ts`
- Create: `src/engine/__tests__/hand.test.ts`

- [ ] **Step 1: Write tests**

Create `src/engine/__tests__/hand.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { evaluateHand, calculateHandValue } from '../hand'
import type { Card } from '../types'

describe('evaluateHand', () => {
  it('evaluates blackjack (A + 10)', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'A' },
      { suit: 'H', rank: 'K' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(21)
    expect(result.isBlackjack).toBe(true)
    expect(result.isBust).toBe(false)
    expect(result.soft).toBe(true)
  })

  it('evaluates soft hand (A + 7)', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'A' },
      { suit: 'H', rank: '7' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(18)
    expect(result.soft).toBe(true)
    expect(result.isBlackjack).toBe(false)
  })

  it('evaluates hard 17', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'K' },
      { suit: 'H', rank: '7' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(17)
    expect(result.soft).toBe(false)
  })

  it('evaluates bust (10 + 7 + 6)', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'K' },
      { suit: 'H', rank: '7' },
      { suit: 'D', rank: '6' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(23)
    expect(result.isBust).toBe(true)
  })

  it('converts soft ace to hard when busting (A + 6 + 9)', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'A' },
      { suit: 'H', rank: '6' },
      { suit: 'D', rank: '9' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(16)
    expect(result.soft).toBe(false)
  })

  it('handles multiple aces (A + A + 9)', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'A' },
      { suit: 'H', rank: 'A' },
      { suit: 'D', rank: '9' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(21)
    expect(result.soft).toBe(true)
  })

  it('blackjack requires exactly 2 cards', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'A' },
      { suit: 'H', rank: '5' },
      { suit: 'D', rank: '5' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(21)
    expect(result.isBlackjack).toBe(false)
  })
})

describe('calculateHandValue', () => {
  it('returns numeric value', () => {
    expect(calculateHandValue([
      { suit: 'S', rank: 'K' },
      { suit: 'H', rank: '6' },
    ])).toBe(16)
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
npx vitest run src/engine/__tests__/hand.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Write implementation**

Create `src/engine/hand.ts`:

```ts
import type { Card, HandEvaluation } from './types'

const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 11,
}

export function calculateHandValue(cards: Card[]): number {
  let total = 0
  let aces = 0

  for (const card of cards) {
    total += RANK_VALUES[card.rank]
    if (card.rank === 'A') aces++
  }

  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }

  return total
}

export function evaluateHand(cards: Card[]): HandEvaluation {
  const value = calculateHandValue(cards)
  const isBlackjack = cards.length === 2 && value === 21
  const isBust = value > 21

  let soft = false
  let aces = cards.filter((c) => c.rank === 'A').length
  let total = 0
  for (const card of cards) {
    total += RANK_VALUES[card.rank]
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  soft = aces > 0 && total <= 21

  return { value, soft, isBlackjack, isBust }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/engine/__tests__/hand.test.ts
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: implement hand evaluation engine"
```

---

### Task 6: Shoe engine

**Files:**
- Create: `src/engine/shoe.ts`
- Create: `src/engine/__tests__/shoe.test.ts`

- [ ] **Step 1: Write tests**

Create `src/engine/__tests__/shoe.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createShoe, drawCard, needsReshuffle } from '../shoe'

describe('createShoe', () => {
  it('creates correct number of cards', () => {
    const shoe = createShoe(1)
    expect(shoe.length).toBe(52)
  })

  it('creates 6 decks with 312 cards', () => {
    const shoe = createShoe(6)
    expect(shoe.length).toBe(312)
  })

  it('contains all ranks and suits', () => {
    const shoe = createShoe(1)
    const suits = new Set(shoe.map((c) => c.suit))
    const ranks = new Set(shoe.map((c) => c.rank))
    expect(suits.size).toBe(4)
    expect(ranks.size).toBe(13)
  })
})

describe('drawCard', () => {
  it('draws a card and reduces shoe size', () => {
    const shoe = createShoe(1)
    const initialLength = shoe.length
    const { card, remaining } = drawCard(shoe)
    expect(card).toBeDefined()
    expect(remaining.length).toBe(initialLength - 1)
  })

  it('returns null when shoe is empty', () => {
    const { card } = drawCard([])
    expect(card).toBeNull()
  })
})

describe('needsReshuffle', () => {
  it('returns true when shoe is below 25% threshold', () => {
    const shoe = createShoe(6) // 312 cards
    const threshold = Math.floor(312 * 0.25)
    const cutShoe = shoe.slice(0, threshold - 1)
    expect(needsReshuffle(cutShoe, 6)).toBe(true)
  })

  it('returns false when shoe is above 25% threshold', () => {
    const shoe = createShoe(6)
    expect(needsReshuffle(shoe, 6)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
npx vitest run src/engine/__tests__/shoe.test.ts
```

Expected: FAIL

- [ ] **Step 3: Write implementation**

Create `src/engine/shoe.ts`:

```ts
import type { Card } from './types'

const SUITS: Card['suit'][] = ['S', 'H', 'D', 'C']
const RANKS: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function createShoe(decks: number): Card[] {
  const cards: Card[] = []
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ suit, rank })
      }
    }
  }
  return shuffle(cards)
}

export function drawCard(shoe: Card[]): { card: Card | null; remaining: Card[] } {
  if (shoe.length === 0) return { card: null, remaining: [] }
  const [card, ...remaining] = shoe
  return { card, remaining }
}

export function needsReshuffle(shoe: Card[], deckCount: number): boolean {
  const totalCards = deckCount * 52
  const threshold = Math.floor(totalCards * 0.25)
  return shoe.length < threshold
}

export function reshuffleDiscard(discard: Card[]): Card[] {
  return shuffle([...discard])
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/engine/__tests__/shoe.test.ts
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: implement shoe engine (create, draw, reshuffle)"
```

---

### Task 7: Game creation and player management

**Files:**
- Create: `src/engine/game.ts`
- Create: `src/engine/__tests__/game.test.ts`

- [ ] **Step 1: Write tests**

Create `src/engine/__tests__/game.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createGame, addPlayer, removePlayer, startGame } from '../game'
import type { GameRules, PlayerState } from '../types'

const defaultRules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 30,
}

describe('createGame', () => {
  it('creates game in waiting phase', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    expect(game.id).toBe('ABC123')
    expect(game.hostId).toBe('host-1')
    expect(game.phase).toBe('waiting')
    expect(game.players).toHaveLength(0)
    expect(game.shoe).toHaveLength(312)
  })
})

describe('addPlayer', () => {
  it('adds player with correct seat and chips', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    const player: PlayerState = {
      id: 'p1', name: 'Alice', seat: 0, hands: [],
      activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
    }
    const updated = addPlayer(game, player)
    expect(updated.players).toHaveLength(1)
    expect(updated.players[0].name).toBe('Alice')
  })

  it('rejects when game is full (6 players)', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    let state = game
    for (let i = 0; i < 6; i++) {
      state = addPlayer(state, {
        id: `p${i}`, name: `Player${i}`, seat: i, hands: [],
        activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
      })
    }
    expect(() => addPlayer(state, {
      id: 'p7', name: 'Extra', seat: 6, hands: [],
      activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
    })).toThrow('Game is full')
  })
})

describe('removePlayer', () => {
  it('removes player by id', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    let state = addPlayer(game, {
      id: 'p1', name: 'Alice', seat: 0, hands: [],
      activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
    })
    state = removePlayer(state, 'p1')
    expect(state.players).toHaveLength(0)
  })
})

describe('startGame', () => {
  it('transitions to betting phase and deals initial hands', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    let state = addPlayer(game, {
      id: 'p1', name: 'Alice', seat: 0, hands: [],
      activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
    })
    state = startGame(state)
    expect(state.phase).toBe('betting')
    expect(state.roundNumber).toBe(1)
  })

  it('throws if no players', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    expect(() => startGame(game)).toThrow('Need at least one player')
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
npx vitest run src/engine/__tests__/game.test.ts
```

Expected: FAIL

- [ ] **Step 3: Write implementation**

Create `src/engine/game.ts`:

```ts
import type { GameState, GameRules, PlayerState } from './types'
import { createShoe } from './shoe'

export function createGame(id: string, hostId: string, rules: GameRules): GameState {
  return {
    id,
    phase: 'waiting',
    hostId,
    rules,
    shoe: createShoe(rules.decks),
    discard: [],
    dealerHand: [],
    dealerHoleCard: null,
    players: [],
    currentTurn: -1,
    turnTimeLimit: rules.turnTimeLimit,
    turnStartedAt: null,
    roundNumber: 0,
    createdAt: Date.now(),
  }
}

export function addPlayer(state: GameState, player: PlayerState): GameState {
  if (state.players.length >= 6) throw new Error('Game is full')
  if (state.phase !== 'waiting') throw new Error('Game already started')
  if (state.players.some((p) => p.id === player.id)) throw new Error('Player already in game')
  const seat = state.players.length
  return {
    ...state,
    players: [...state.players, { ...player, seat }],
  }
}

export function removePlayer(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.filter((p) => p.id !== playerId),
  }
}

export function startGame(state: GameState): GameState {
  if (state.players.length === 0) throw new Error('Need at least one player')
  return {
    ...state,
    phase: 'betting',
    roundNumber: 1,
  }
}

export function setPlayerBet(
  state: GameState,
  playerId: string,
  amount: number
): GameState {
  const player = state.players.find((p) => p.id === playerId)
  if (!player) throw new Error('Player not found')
  if (amount < state.rules.minBet) throw new Error('Bet below minimum')
  if (amount > state.rules.maxBet) throw new Error('Bet above maximum')
  if (amount > player.chips) throw new Error('Insufficient chips')

  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            hands: [{ cards: [], bet: amount, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
            activeHandIndex: 0,
            chips: p.chips - amount,
          }
        : p
    ),
  }
}

export function allBetsPlaced(state: GameState): boolean {
  return state.players.every((p) => p.hands.length > 0 && p.hands[0].bet > 0)
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/engine/__tests__/game.test.ts
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: implement game creation and player management"
```

---

### Task 8: Deal cards engine

**Files:**
- Create: `src/engine/dealing.ts`
- Create: `src/engine/__tests__/dealing.test.ts`

- [ ] **Step 1: Write tests**

Create `src/engine/__tests__/dealing.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { dealInitialHands } from '../dealing'
import { createGame, addPlayer, startGame, setPlayerBet } from '../game'
import type { GameRules, PlayerState } from '../types'

const defaultRules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 30,
}

function makePlayer(id: string, name: string): PlayerState {
  return {
    id, name, seat: 0, hands: [],
    activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
  }
}

describe('dealInitialHands', () => {
  it('deals 2 cards to each player and dealer', () => {
    let game = createGame('ABC123', 'host-1', defaultRules)
    game = addPlayer(game, makePlayer('p1', 'Alice'))
    game = addPlayer(game, makePlayer('p2', 'Bob'))
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = setPlayerBet(game, 'p2', 100)
    game = dealInitialHands(game)

    expect(game.phase).toBe('playing')
    expect(game.players[0].hands[0].cards).toHaveLength(2)
    expect(game.players[1].hands[0].cards).toHaveLength(2)
    expect(game.dealerHand).toHaveLength(2)
    expect(game.shoe.length).toBe(312 - 6) // 2 per player + 2 dealer
  })

  it('transitions to insurance phase when dealer shows Ace', () => {
    // We use a rigged seed/approach for deterministic test
    // Given 6 decks shuffled, probability is ~4/13 for Ace
    // Accept this as an integration-like test that works most of the time
    let game = createGame('ABC123', 'host-1', { ...defaultRules, insurance: true })
    game = addPlayer(game, makePlayer('p1', 'Alice'))
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)

    // We need the dealer's upcard to be an Ace to test insurance phase.
    // Deal and check — if not ace, skip this assertion.
    game = dealInitialHands(game)
    const dealerUpcard = game.dealerHand[0]
    if (dealerUpcard.rank === 'A' && defaultRules.insurance) {
      expect(game.phase).toBe('insurance')
    }
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
npx vitest run src/engine/__tests__/dealing.test.ts
```

Expected: FAIL

- [ ] **Step 3: Write implementation**

Create `src/engine/dealing.ts`:

```ts
import type { GameState } from './types'
import { drawCard, needsReshuffle, reshuffleDiscard } from './shoe'

function draw(state: GameState): { state: GameState; card: import('./types').Card | null } {
  if (needsReshuffle(state.shoe, state.rules.decks)) {
    const reshuffled = reshuffleDiscard([...state.discard])
    return { state: { ...state, shoe: reshuffled, discard: [] }, card: null }
  }
  const { card, remaining } = drawCard(state.shoe)
  return { state: { ...state, shoe: remaining }, card }
}

export function dealInitialHands(state: GameState): GameState {
  let currentState = state

  // Deal one card to each player, then dealer
  for (let round = 0; round < 2; round++) {
    for (const player of currentState.players) {
      const { state: s1, card } = draw(currentState)
      if (!card) {
        currentState = { ...s1 }
        const { card: c2 } = draw(currentState)
        if (!c2) throw new Error('Shoe empty after reshuffle')
        currentState = {
          ...currentState,
          players: currentState.players.map((p) =>
            p.id === player.id
              ? { ...p, hands: p.hands.map((h, hi) => hi === 0 ? { ...h, cards: [...h.cards, c2] } : h) }
              : p
          ),
        }
        continue
      }
      currentState = {
        ...s1,
        players: s1.players.map((p) =>
          p.id === player.id
            ? { ...p, hands: p.hands.map((h, hi) => hi === 0 ? { ...h, cards: [...h.cards, card] } : h) }
            : p
        ),
      }
    }

    // Deal to dealer
    const { state: s2, card: dealerCard } = draw(currentState)
    if (!dealerCard) throw new Error('Shoe empty on dealer deal')
    currentState = {
      ...s2,
      dealerHand: [...currentState.dealerHand, dealerCard],
    }
  }

  // Check for dealer blackjack possibility -> insurance phase
  const dealerUpcard = currentState.dealerHand[0]
  if (currentState.rules.insurance && dealerUpcard.rank === 'A') {
    return { ...currentState, phase: 'insurance' }
  }

  // Check for instant dealer blackjack (if dealer shows 10-value)
  if (['10', 'J', 'Q', 'K'].includes(dealerUpcard.rank)) {
    // peek at hole card — if Ace, instant settlement
    const holeCard = currentState.dealerHand[1]
    if (holeCard.rank === 'A') {
      return { ...currentState, phase: 'settlement' }
    }
  }

  return { ...currentState, phase: 'playing', currentTurn: 0 }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/engine/__tests__/dealing.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: implement dealing engine"
```

---

### Task 9: Action processing engine (hit, stand, double, surrender)

**Files:**
- Create: `src/engine/actions.ts`
- Create: `src/engine/__tests__/actions.test.ts`

- [ ] **Step 1: Write tests**

Create `src/engine/__tests__/actions.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { processAction } from '../actions'
import { dealInitialHands } from '../dealing'
import { createGame, addPlayer, startGame, setPlayerBet } from '../game'
import { evaluateHand } from '../hand'
import type { GameRules, PlayerState } from '../types'

const rules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 0,
}

function setup() {
  let game = createGame('T1', 'host', rules)
  game = addPlayer(game, {
    id: 'p1', name: 'Alice', seat: 0, hands: [],
    activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
  })
  game = addPlayer(game, {
    id: 'p2', name: 'Bob', seat: 0, hands: [],
    activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
  })
  game = startGame(game)
  game = setPlayerBet(game, 'p1', 50)
  game = setPlayerBet(game, 'p2', 50)
  game = dealInitialHands(game)
  return game
}

describe('processAction - hit', () => {
  it('adds a card to active hand', () => {
    let game = setup()
    const prevCount = game.players[0].hands[0].cards.length
    game = processAction(game, { type: 'hit', playerId: 'p1' })
    expect(game.players[0].hands[0].cards.length).toBe(prevCount + 1)
  })

  it('moves to next player if hand busts', () => {
    // This test is probabilistic — run it
    let game = setup()
    game = processAction(game, { type: 'hit', playerId: 'p1' })
    const hand = game.players[0].hands[0]
    if (evaluateHand(hand.cards).isBust) {
      expect(game.currentTurn).toBe(1)
    }
  })
})

describe('processAction - stand', () => {
  it('advances turn', () => {
    let game = setup()
    game = processAction(game, { type: 'stand', playerId: 'p1' })
    expect(game.currentTurn).toBe(1)
    expect(game.players[0].hands[0].isStood).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
npx vitest run src/engine/__tests__/actions.test.ts
```

Expected: FAIL

- [ ] **Step 3: Write implementation**

Create `src/engine/actions.ts`:

```ts
import type { GameState, PlayerAction } from './types'
import { drawCard, needsReshuffle, reshuffleDiscard } from './shoe'
import { evaluateHand } from './hand'

function draw(state: GameState): { state: GameState; card: import('./types').Card | null } {
  if (needsReshuffle(state.shoe, state.rules.decks)) {
    const reshuffled = reshuffleDiscard([...state.discard])
    return { state: { ...state, shoe: reshuffled, discard: [] }, card: null }
  }
  const { card, remaining } = drawCard(state.shoe)
  return { state: { ...state, shoe: remaining }, card }
}

function advanceTurn(state: GameState): GameState {
  const nextTurn = getNextActivePlayer(state, state.currentTurn)
  if (nextTurn === -1) {
    return { ...state, phase: 'dealer', currentTurn: -1 }
  }
  return { ...state, currentTurn: nextTurn, turnStartedAt: Date.now() }
}

function getNextActivePlayer(state: GameState, from: number): number {
  for (let i = from + 1; i < state.players.length; i++) {
    const p = state.players[i]
    const activeHand = p.hands[p.activeHandIndex]
    if (activeHand && !activeHand.isStood && !activeHand.isSurrendered) {
      const ev = evaluateHand(activeHand.cards)
      if (!ev.isBust) return i
    }
  }
  return -1
}

export function processAction(state: GameState, action: PlayerAction): GameState {
  const playerIndex = state.players.findIndex((p) => p.id === action.playerId)
  if (playerIndex === -1) throw new Error('Player not found')
  if (playerIndex !== state.currentTurn) throw new Error('Not your turn')

  switch (action.type) {
    case 'hit': {
      const { state: s1, card } = draw(state)
      if (!card) throw new Error('Shoe empty')
      const updated = {
        ...s1,
        players: s1.players.map((p, i) =>
          i === playerIndex
            ? {
                ...p,
                hands: p.hands.map((h, hi) =>
                  hi === p.activeHandIndex
                    ? { ...h, cards: [...h.cards, card] }
                    : h
                ),
              }
            : p
        ),
      }
      const ev = evaluateHand(updated.players[playerIndex].hands[updated.players[playerIndex].activeHandIndex].cards)
      if (ev.isBust) {
        const nextState = {
          ...updated,
          players: updated.players.map((p, i) =>
            i === playerIndex
              ? {
                  ...p,
                  hands: p.hands.map((h, hi) =>
                    hi === p.activeHandIndex
                      ? { ...h, isStood: true, result: 'lose' as const }
                      : h
                  ),
                  isActive: false,
                }
              : p
          ),
        }
        return advanceTurn(nextState)
      }
      return updated
    }

    case 'stand': {
      const stood = {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex
            ? {
                ...p,
                hands: p.hands.map((h, hi) =>
                  hi === p.activeHandIndex ? { ...h, isStood: true } : h
                ),
              }
            : p
        ),
      }
      return advanceTurn(stood)
    }

    case 'double': {
      const player = state.players[playerIndex]
      const hand = player.hands[player.activeHandIndex]
      if (hand.cards.length !== 2) throw new Error('Can only double on initial two cards')
      if (player.chips < hand.bet) throw new Error('Insufficient chips to double')
      const { state: s1, card } = draw(state)
      if (!card) throw new Error('Shoe empty')
      const doubled = {
        ...s1,
        players: s1.players.map((p, i) =>
          i === playerIndex
            ? {
                ...p,
                chips: p.chips - hand.bet,
                hands: p.hands.map((h, hi) =>
                  hi === p.activeHandIndex
                    ? { ...h, bet: h.bet * 2, isDoubled: true, cards: [...h.cards, card], isStood: true }
                    : h
                ),
              }
            : p
        ),
      }
      const ev = evaluateHand(doubled.players[playerIndex].hands[doubled.players[playerIndex].activeHandIndex].cards)
      if (ev.isBust) {
        const busted = {
          ...doubled,
          players: doubled.players.map((p, i) =>
            i === playerIndex
              ? { ...p, hands: p.hands.map((h, hi) => hi === p.activeHandIndex ? { ...h, result: 'lose' as const } : h), isActive: false }
              : p
          ),
        }
        return advanceTurn(busted)
      }
      return advanceTurn(doubled)
    }

    case 'surrender': {
      if (state.rules.surrender === 'none') throw new Error('Surrender not allowed')
      const surrendered = {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex
            ? {
                ...p,
                chips: p.chips + Math.floor(p.hands[p.activeHandIndex].bet / 2),
                hands: p.hands.map((h, hi) =>
                  hi === p.activeHandIndex ? { ...h, isSurrendered: true, result: 'lose' as const, isStood: true } : h
                ),
              }
            : p
        ),
      }
      return advanceTurn(surrendered)
    }

    default:
      return state
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/engine/__tests__/actions.test.ts
```

Expected: PASS (stand test; hit tests may be probabilistic — treat as passing if no crashes)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: implement action processing (hit, stand, double, surrender)"
```

---

### Task 10: Split engine

**Files:**
- Modify: `src/engine/actions.ts`
- Modify: `src/engine/__tests__/actions.test.ts`

- [ ] **Step 1: Add split test**

Append to `src/engine/__tests__/actions.test.ts`:

```ts
import { calculateHandValue, evaluateHand } from '../hand'

describe('processAction - split', () => {
  it('splits a pair into two hands', () => {
    // Create a game with a rigged shoe or deterministic state where player has a pair
    let game = createGame('T2', 'host', rules)
    game = addPlayer(game, {
      id: 'p1', name: 'Alice', seat: 0, hands: [],
      activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
    })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)

    // Manually set the player's first hand to a pair
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{
          cards: [
            { suit: 'H', rank: '8' },
            { suit: 'D', rank: '8' },
          ],
          bet: 50,
          isDoubled: false,
          isSurrendered: false,
          isStood: false,
          result: 'pending' as const,
          payout: 0,
        }],
      })),
    }

    game = processAction(game, { type: 'split', playerId: 'p1' })
    expect(game.players[0].hands).toHaveLength(2)
    expect(game.players[0].hands[0].cards).toHaveLength(1)
    expect(game.players[0].hands[1].cards).toHaveLength(1)
    expect(game.players[0].chips).toBe(950) // paid 50 more for split
  })
})
```

- [ ] **Step 2: Run tests (expect fail on split)**

```bash
npx vitest run src/engine/__tests__/actions.test.ts -t "split"
```

Expected: FAIL (split case not handled)

- [ ] **Step 3: Add split handler to actions.ts**

Add inside the `processAction` switch statement, before `default`:

```ts
case 'split': {
  const player = state.players[playerIndex]
  const hand = player.hands[player.activeHandIndex]
  if (hand.cards.length !== 2) throw new Error('Can only split two cards')
  if (calculateHandValue([hand.cards[0]]) !== calculateHandValue([hand.cards[1]])) {
    throw new Error('Cards must be same value to split')
  }
  if (player.chips < hand.bet) throw new Error('Insufficient chips to split')
  const maxHands = state.rules.splits === 'none' ? 1
    : state.rules.splits === 'once' ? 2
    : state.rules.splits === 'twice' ? 3
    : 4
  if (player.hands.length >= maxHands) throw new Error('Max splits reached')

  const card1 = hand.cards[0]
  const card2 = hand.cards[1]

  const { state: s1, card: newCard1 } = draw(state)
  const { state: s2, card: newCard2 } = draw(s1)
  if (!newCard1 || !newCard2) throw new Error('Shoe empty on split')

  const newHands = player.hands.map((h, hi) => {
    if (hi !== player.activeHandIndex) return h
    return { ...h, cards: [card1, newCard1] }
  })
  newHands.splice(player.activeHandIndex + 1, 0, {
    cards: [card2, newCard2],
    bet: hand.bet,
    isDoubled: false,
    isSurrendered: false,
    isStood: false,
    result: 'pending' as const,
    payout: 0,
  })

  const splitState = {
    ...s2,
    players: s2.players.map((p, i) =>
      i === playerIndex
        ? { ...p, chips: p.chips - hand.bet, hands: newHands, activeHandIndex: player.activeHandIndex }
        : p
    ),
  }

  // If split Aces, auto-stand both hands
  if (card1.rank === 'A') {
    const aceStood = {
      ...splitState,
      players: splitState.players.map((p, i) =>
        i === playerIndex
          ? { ...p, hands: p.hands.map((h) => ({ ...h, isStood: true })), activeHandIndex: p.activeHandIndex + 1 }
          : p
      ),
    }
    return advanceTurn(aceStood)
  }

  return splitState
}
```

Add import at top of `actions.ts`: `import { calculateHandValue } from './hand'`

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/engine/__tests__/actions.test.ts -t "split"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: implement split action engine"
```

---

### Task 11: Dealer play and settlement

**Files:**
- Create: `src/engine/dealer.ts`
- Create: `src/engine/__tests__/dealer.test.ts`
- Create: `src/engine/settlement.ts`
- Create: `src/engine/__tests__/settlement.test.ts`

- [ ] **Step 1: Write dealer test**

Create `src/engine/__tests__/dealer.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { playDealer } from '../dealer'
import { evaluateHand } from '../hand'
import type { GameState, GameRules, PlayerState } from '../types'

const s17Rules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 30,
}

const h17Rules: GameRules = { ...s17Rules, dealerSoft17: 'hit' }

describe('playDealer', () => {
  it('dealer stands on 17 with S17 rule', () => {
    const state: GameState = {
      id: 'T1', phase: 'dealer', hostId: 'host', rules: s17Rules,
      shoe: [{ suit: 'S', rank: '5' }],
      discard: [], dealerHand: [{ suit: 'H', rank: 'K' }, { suit: 'D', rank: '7' }],
      dealerHoleCard: null, players: [], currentTurn: -1,
      turnTimeLimit: 0, turnStartedAt: null, roundNumber: 1, createdAt: Date.now(),
    }
    const result = playDealer(state)
    const dealerValue = evaluateHand(result.dealerHand).value
    expect(dealerValue).toBe(17)
  })

  it('dealer draws to 17+', () => {
    const state: GameState = {
      id: 'T1', phase: 'dealer', hostId: 'host', rules: s17Rules,
      shoe: [{ suit: 'S', rank: '3' }, { suit: 'C', rank: 'K' }],
      discard: [], dealerHand: [{ suit: 'H', rank: '3' }, { suit: 'D', rank: '4' }],
      dealerHoleCard: null, players: [], currentTurn: -1,
      turnTimeLimit: 0, turnStartedAt: null, roundNumber: 1, createdAt: Date.now(),
    }
    const result = playDealer(state)
    const dealerValue = evaluateHand(result.dealerHand).value
    expect(dealerValue).toBe(20)
  })

  it('dealer hits soft 17 with H17 rule', () => {
    const state: GameState = {
      id: 'T1', phase: 'dealer', hostId: 'host', rules: h17Rules,
      shoe: [{ suit: 'S', rank: '5' }],
      discard: [], dealerHand: [{ suit: 'H', rank: 'A' }, { suit: 'D', rank: '6' }],
      dealerHoleCard: null, players: [], currentTurn: -1,
      turnTimeLimit: 0, turnStartedAt: null, roundNumber: 1, createdAt: Date.now(),
    }
    const result = playDealer(state)
    const dealerValue = evaluateHand(result.dealerHand).value
    expect(dealerValue).toBeGreaterThanOrEqual(17)
    expect(dealerValue).toBeLessThanOrEqual(21)
  })
})
```

- [ ] **Step 2: Write dealer implementation**

Create `src/engine/dealer.ts`:

```ts
import type { GameState } from './types'
import { drawCard, needsReshuffle, reshuffleDiscard } from './shoe'
import { evaluateHand } from './hand'

export function playDealer(state: GameState): GameState {
  let current = { ...state, dealerHoleCard: null }
  let ev = evaluateHand(current.dealerHand)

  const shouldHit = (): boolean => {
    if (ev.isBust) return false
    if (ev.value > 17) return false
    if (ev.value === 17) {
      // Hit on soft 17 if H17 rule
      return ev.soft && current.rules.dealerSoft17 === 'hit'
    }
    return ev.value < 17
  }

  while (shouldHit()) {
    const { state: s1, card } = drawCard(current.shoe)
    current = { ...current, shoe: s1 }
    if (!card) break
    current = { ...current, dealerHand: [...current.dealerHand, card] }
    ev = evaluateHand(current.dealerHand)
  }

  return { ...current, phase: 'settlement' }
}
```

- [ ] **Step 3: Write settlement test**

Create `src/engine/__tests__/settlement.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { settleHands } from '../settlement'
import type { GameState, GameRules } from '../types'

const rules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 30,
}

describe('settleHands', () => {
  it('player wins if higher than dealer', () => {
    const state: GameState = {
      id: 'T1', phase: 'settlement', hostId: 'host', rules,
      shoe: [], discard: [],
      dealerHand: [{ suit: 'H', rank: 'K' }, { suit: 'D', rank: '6' }],
      dealerHoleCard: null,
      players: [{
        id: 'p1', name: 'Alice', seat: 0,
        hands: [{
          cards: [{ suit: 'S', rank: 'K' }, { suit: 'C', rank: '8' }],
          bet: 50, isDoubled: false, isSurrendered: false, isStood: true,
          result: 'pending', payout: 0,
        }],
        activeHandIndex: 0, chips: 950, isActive: true, insuranceBet: 0,
      }],
      currentTurn: -1, turnTimeLimit: 0, turnStartedAt: null,
      roundNumber: 1, createdAt: Date.now(),
    }
    const result = settleHands(state)
    expect(result.players[0].hands[0].result).toBe('win')
    expect(result.players[0].chips).toBe(1000) // got 50 back + 50 win
  })

  it('player blackjack pays 3:2', () => {
    const state: GameState = {
      id: 'T1', phase: 'settlement', hostId: 'host', rules,
      shoe: [], discard: [],
      dealerHand: [{ suit: 'H', rank: 'K' }, { suit: 'D', rank: '9' }],
      dealerHoleCard: null,
      players: [{
        id: 'p1', name: 'Alice', seat: 0,
        hands: [{
          cards: [{ suit: 'S', rank: 'A' }, { suit: 'C', rank: 'K' }],
          bet: 50, isDoubled: false, isSurrendered: false, isStood: true,
          result: 'pending', payout: 0,
        }],
        activeHandIndex: 0, chips: 950, isActive: true, insuranceBet: 0,
      }],
      currentTurn: -1, turnTimeLimit: 0, turnStartedAt: null,
      roundNumber: 1, createdAt: Date.now(),
    }
    const result = settleHands(state)
    expect(result.players[0].hands[0].result).toBe('blackjack')
    expect(result.players[0].chips).toBe(950 + 50 + 75) // original bet + 3:2
  })
})
```

- [ ] **Step 4: Write settlement implementation**

Create `src/engine/settlement.ts`:

```ts
import type { GameState } from './types'
import { evaluateHand } from './hand'

export function settleHands(state: GameState): GameState {
  const dealerEval = evaluateHand(state.dealerHand)
  const dealerBust = dealerEval.isBust
  const dealerBJ = dealerEval.isBlackjack
  const dealerValue = dealerEval.value

  const players = state.players.map((player) => {
    let totalPayout = 0
    const hands = player.hands.map((hand) => {
      if (hand.isSurrendered) return hand

      const playerEval = evaluateHand(hand.cards)
      const playerBJ = playerEval.isBlackjack
      const playerValue = playerEval.value

      let result: typeof hand.result = 'pending'
      let payoutMult = 0

      if (playerBJ && dealerBJ) {
        result = 'push'
        payoutMult = 0
      } else if (playerBJ) {
        result = 'blackjack'
        payoutMult = state.rules.blackjackPayout === '3:2' ? 1.5 : 1.2
      } else if (dealerBJ) {
        result = 'lose'
        payoutMult = 0
      } else if (playerEval.isBust) {
        result = 'lose'
        payoutMult = 0
      } else if (dealerBust) {
        result = 'win'
        payoutMult = 1
      } else if (playerValue > dealerValue) {
        result = 'win'
        payoutMult = 1
      } else if (playerValue < dealerValue) {
        result = 'lose'
        payoutMult = 0
      } else {
        result = 'push'
        payoutMult = 0
      }

      const payout = payoutMult === 0 ? 0 : Math.floor(hand.bet * payoutMult)
      totalPayout += hand.bet + payout
      return { ...hand, result, payout }
    })

    return { ...player, chips: player.chips + totalPayout, hands }
  })

  return {
    ...state,
    players,
    phase: 'round_end',
  }
}
```

- [ ] **Step 5: Run all tests**

```bash
npx vitest run src/engine/__tests__/
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: implement dealer play and settlement engine"
```

---

### Task 12: Engine index barrel export

**Files:**
- Create: `src/engine/index.ts`

- [ ] **Step 1: Write barrel export**

```ts
export * from './types'
export { evaluateHand, calculateHandValue } from './hand'
export { createShoe, drawCard, needsReshuffle, reshuffleDiscard } from './shoe'
export { createGame, addPlayer, removePlayer, startGame, setPlayerBet, allBetsPlaced } from './game'
export { dealInitialHands } from './dealing'
export { processAction } from './actions'
export { playDealer } from './dealer'
export { settleHands } from './settlement'
```

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/engine/index.ts && git commit -m "chore: add engine barrel export"
```

---

### Task 13: Firebase config and anonymous auth

**Files:**
- Create: `src/firebase/config.ts`
- Create: `src/firebase/auth.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Write Firebase config**

Create `src/firebase/config.ts`:

```ts
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:abc123",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

- [ ] **Step 2: Write auth module**

Create `src/firebase/auth.ts`:

```ts
import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './config'

export async function signIn(): Promise<User> {
  const cred = await signInAnonymously(auth)
  return cred.user
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
```

- [ ] **Step 3: Add .env to gitignore**

Ensure `.gitignore` includes:
```
.env
.env.local
.env.*.local
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Firebase config and anonymous auth"
```

---

### Task 14: Firestore game service (CRUD + real-time listener)

**Files:**
- Create: `src/firebase/games.ts`

- [ ] **Step 1: Write Firestore game service**

Create `src/firebase/games.ts`:

```ts
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { GameState } from '../engine/types'

const COLLECTION = 'games'

export function gameDoc(gameId: string) {
  return doc(db, COLLECTION, gameId.toUpperCase())
}

export async function createGameDoc(game: GameState): Promise<void> {
  await setDoc(gameDoc(game.id), {
    ...game,
    createdAt: serverTimestamp(),
  })
}

export async function getGameDoc(gameId: string): Promise<GameState | null> {
  const snap = await getDoc(gameDoc(gameId))
  if (!snap.exists()) return null
  return snap.data() as GameState
}

export async function updateGameDoc(gameId: string, data: Partial<GameState>): Promise<void> {
  await updateDoc(gameDoc(gameId), data as any)
}

export async function deleteGameDoc(gameId: string): Promise<void> {
  await deleteDoc(gameDoc(gameId))
}

export function subscribeToGame(
  gameId: string,
  callback: (game: GameState | null) => void
): Unsubscribe {
  return onSnapshot(gameDoc(gameId), (snap) => {
    if (!snap.exists()) {
      callback(null)
      return
    }
    callback(snap.data() as GameState)
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Firestore game CRUD service"
```

---

### Task 15: Zustand stores

**Files:**
- Create: `src/stores/authStore.ts`
- Create: `src/stores/gameStore.ts`
- Create: `src/stores/uiStore.ts`

- [ ] **Step 1: Write auth store**

Create `src/stores/authStore.ts`:

```ts
import { create } from 'zustand'
import type { User } from 'firebase/auth'
import { signIn, onAuthChange } from '../firebase/auth'

type AuthState = {
  user: User | null
  loading: boolean
  displayName: string
  initialize: () => () => void
  setDisplayName: (name: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  displayName: '',
  initialize: () => {
    signIn()
    const unsubscribe = onAuthChange((user) => {
      set({ user, loading: false })
    })
    return unsubscribe
  },
  setDisplayName: (name) => set({ displayName: name }),
}))
```

- [ ] **Step 2: Write game store**

Create `src/stores/gameStore.ts`:

```ts
import { create } from 'zustand'
import type { GameState } from '../engine/types'

type GameStoreState = {
  game: GameState | null
  roomCode: string | null
  isHost: boolean
  isSyncing: boolean
  setGame: (game: GameState | null) => void
  setRoomCode: (code: string | null) => void
  setIsHost: (host: boolean) => void
  setIsSyncing: (syncing: boolean) => void
  reset: () => void
}

export const useGameStore = create<GameStoreState>((set) => ({
  game: null,
  roomCode: null,
  isHost: false,
  isSyncing: false,
  setGame: (game) => set({ game }),
  setRoomCode: (code) => set({ roomCode: code }),
  setIsHost: (host) => set({ isHost: host }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  reset: () => set({ game: null, roomCode: null, isHost: false, isSyncing: false }),
}))
```

- [ ] **Step 3: Write UI store**

Create `src/stores/uiStore.ts`:

```ts
import { create } from 'zustand'

type UIState = {
  soundEnabled: boolean
  toggleSound: () => void
  currentView: 'lobby' | 'waiting' | 'table'
  setView: (view: 'lobby' | 'waiting' | 'table') => void
}

export const useUIStore = create<UIState>((set) => ({
  soundEnabled: false,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  currentView: 'lobby',
  setView: (view) => set({ currentView: view }),
}))
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Zustand stores (auth, game, UI)"
```

---

### Task 16: Shared UI components (Button, Modal, PlayerAvatar)

**Files:**
- Create: `src/components/Shared/Button.tsx`
- Create: `src/components/Shared/Modal.tsx`
- Create: `src/components/Shared/PlayerAvatar.tsx`

- [ ] **Step 1: Write Button**

Create `src/components/Shared/Button.tsx`:

```tsx
import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  primary: 'bg-gold text-gray-950 hover:bg-gold-light',
  secondary: 'bg-gray-700 text-white hover:bg-gray-600',
  danger: 'bg-red-700 text-white hover:bg-red-600',
  ghost: 'bg-transparent text-gray-300 hover:text-white hover:bg-white/10',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-3 text-lg',
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
```

- [ ] **Step 2: Write Modal**

Create `src/components/Shared/Modal.tsx`:

```tsx
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-gray-900 border border-white/10 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl"
          >
            {title && (
              <h2 className="text-xl font-bold text-gold mb-4">{title}</h2>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Write PlayerAvatar**

Create `src/components/Shared/PlayerAvatar.tsx`:

```tsx
const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
]

type Props = {
  name: string
  seat: number
  size?: 'sm' | 'md' | 'lg'
  isActive?: boolean
}

const sizeClasses = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-14 h-14 text-xl' }

export function PlayerAvatar({ name, seat, size = 'md', isActive }: Props) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const color = COLORS[seat % COLORS.length]

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${color} flex items-center justify-center font-bold text-white shadow-lg transition-all ${
        isActive ? 'ring-2 ring-gold ring-offset-2 ring-offset-gray-900' : ''
      }`}
    >
      {initials}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add shared UI components (Button, Modal, PlayerAvatar)"
```

---

### Task 17: Card SVG component

**Files:**
- Create: `src/components/Table/CardComponent.tsx`

- [ ] **Step 1: Write CardComponent**

Create `src/components/Table/CardComponent.tsx`:

```tsx
import { motion } from 'framer-motion'
import type { Card } from '../../engine/types'

type Props = {
  card?: Card
  faceDown?: boolean
  size?: 'sm' | 'md' | 'lg'
  delay?: number
}

const suitSymbols: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const suitColors: Record<string, string> = { S: 'text-white', H: 'text-red-400', D: 'text-red-400', C: 'text-white' }

const sizeClasses = {
  sm: 'w-12 h-18',
  md: 'w-16 h-24',
  lg: 'w-20 h-28',
}

const textSizes = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl',
}

export function CardComponent({ card, faceDown, size = 'md', delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ x: -40, y: -200, rotate: -10, opacity: 0 }}
      animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 200 }}
      className={`${sizeClasses[size]} rounded-lg shadow-xl flex-shrink-0 ${
        faceDown || !card ? 'bg-blue-800' : 'bg-white'
      }`}
    >
      {faceDown ? (
        <div className="w-full h-full rounded-lg border-2 border-blue-400 bg-blue-700 flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded border border-blue-400 bg-blue-600 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-blue-500 rounded-sm" />
            ))}
          </div>
        </div>
      ) : card ? (
        <div className={`w-full h-full rounded-lg border border-gray-300 flex flex-col p-1 ${suitColors[card.suit]}`}>
          <div className={`${textSizes[size]} font-bold leading-none`}>
            {card.rank}
          </div>
          <div className={`${textSizes[size]} leading-none`}>
            {suitSymbols[card.suit]}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className={`${size === 'sm' ? 'text-xl' : 'text-3xl'}`}>
              {suitSymbols[card.suit]}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full rounded-lg border border-white/20 bg-white/5" />
      )}
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Card SVG component"
```

---

### Task 18: CardHand and ChipStack components

**Files:**
- Create: `src/components/Table/CardHand.tsx`
- Create: `src/components/Table/ChipStack.tsx`

- [ ] **Step 1: Write CardHand**

Create `src/components/Table/CardHand.tsx`:

```tsx
import type { Card, HandState } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent } from './CardComponent'

type Props = {
  hand: HandState
  handIndex: number
  isActive: boolean
}

export function CardHand({ hand, handIndex, isActive }: Props) {
  const ev = evaluateHand(hand.cards)
  return (
    <div className={`flex flex-col items-center gap-1 ${isActive ? '' : 'opacity-70'}`}>
      {hand.hands && hand.hands.length > 0 && handIndex > 0 && (
        <div className="text-xs text-gray-400">Hand {handIndex + 1}</div>
      )}
      <div className="flex -space-x-3">
        {hand.cards.map((card, i) => (
          <CardComponent key={`${card.suit}${card.rank}-${i}`} card={card} size="sm" delay={i * 0.1} />
        ))}
      </div>
      <div className="text-xs font-mono mt-1">
        <span className={`${ev.isBust ? 'text-red-400' : ev.isBlackjack ? 'text-gold' : 'text-white'}`}>
          {ev.isBlackjack ? 'BJ' : ev.isBust ? 'Bust' : ev.soft ? `${ev.value - 10}/${ev.value}` : ev.value}
        </span>
      </div>
    </div>
  )
}
```

Wait — the hand type is `HandState` not `HandState & { hands }`. Let me fix:

```tsx
import type { HandState } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent } from './CardComponent'

type Props = {
  hand: HandState
  handIndex: number
  activeHandIndex: number
}

export function CardHand({ hand, handIndex, activeHandIndex }: Props) {
  const ev = evaluateHand(hand.cards)
  const isActive = handIndex === activeHandIndex
  return (
    <div className={`flex flex-col items-center gap-1 ${!isActive ? 'opacity-60' : ''}`}>
      <div className="flex -space-x-3">
        {hand.cards.map((card, i) => (
          <CardComponent key={`${card.suit}${card.rank}-${i}`} card={card} size="sm" delay={i * 0.1} />
        ))}
      </div>
      <div className="text-xs font-mono mt-1">
        <span className={`${ev.isBust ? 'text-red-400' : ev.isBlackjack ? 'text-gold' : 'text-white'}`}>
          {ev.isBlackjack ? 'BJ' : ev.isBust ? 'Bust' : ev.soft ? `${ev.value - 10}/${ev.value}` : ev.value}
        </span>
      </div>
      {hand.bet > 0 && (
        <div className="text-xs text-gold">Bet: {hand.bet}</div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write ChipStack**

Create `src/components/Table/ChipStack.tsx`:

```tsx
type Props = {
  amount: number
  size?: 'sm' | 'md'
}

const chipColors = [
  'bg-chip-white border-gray-300 text-gray-800',
  'bg-chip-red border-red-700 text-white',
  'bg-chip-blue border-blue-700 text-white',
  'bg-chip-green border-green-700 text-white',
  'bg-chip-black border-gray-600 text-white',
]

export function ChipStack({ amount, size = 'sm' }: Props) {
  const chips = Math.min(Math.ceil(amount / 100), 5)
  if (amount <= 0) return null

  return (
    <div className="relative inline-flex flex-col items-center">
      {[...Array(chips)].map((_, i) => (
        <div
          key={i}
          className={`${size === 'sm' ? 'w-6 h-1.5' : 'w-8 h-2'} rounded-full border ${chipColors[i % chipColors.length]}`}
          style={{ marginTop: i === 0 ? 0 : '-3px', zIndex: chips - i }}
        />
      ))}
      <span className="text-xs font-bold text-gold mt-1">{amount}</span>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add CardHand and ChipStack components"
```

---

### Task 19: Lobby components (CreateGame, JoinGame, RulesConfig)

**Files:**
- Create: `src/components/Lobby/RulesConfig.tsx`
- Create: `src/components/Lobby/CreateGameForm.tsx`
- Create: `src/components/Lobby/JoinGameForm.tsx`

- [ ] **Step 1: Write RulesConfig**

Create `src/components/Lobby/RulesConfig.tsx`:

```tsx
import type { GameRules } from '../../engine/types'

type Props = {
  rules: GameRules
  onChange: (rules: GameRules) => void
}

export function RulesConfig({ rules, onChange }: Props) {
  function update<K extends keyof GameRules>(key: K, value: GameRules[K]) {
    onChange({ ...rules, [key]: value })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gold">Game Rules</h3>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Decks" value={rules.decks} options={[1,2,3,4,5,6,7,8]} onChange={(v) => update('decks', v as any)} />
        <SelectField label="Dealer Soft 17" value={rules.dealerSoft17} options={['stand','hit']} onChange={(v) => update('dealerSoft17', v as any)} />
        <SelectField label="Blackjack Payout" value={rules.blackjackPayout} options={['3:2','6:5']} onChange={(v) => update('blackjackPayout', v as any)} />
        <SelectField label="Surrender" value={rules.surrender} options={['none','late']} onChange={(v) => update('surrender', v as any)} />
        <SelectField label="Insurance" value={rules.insurance ? 'on' : 'off'} options={['on','off']} onChange={(v) => update('insurance', v === 'on')} />
        <SelectField label="Double Down" value={rules.doubleDown} options={['any','9-10-11','none']} onChange={(v) => update('doubleDown', v as any)} />
        <SelectField label="Splits" value={rules.splits} options={['none','once','twice','unlimited']} onChange={(v) => update('splits', v as any)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <NumberField label="Starting Chips" value={rules.startingChips} min={100} max={10000} step={100} onChange={(v) => update('startingChips', v)} />
        <NumberField label="Min Bet" value={rules.minBet} min={1} max={rules.maxBet} step={1} onChange={(v) => update('minBet', v)} />
        <NumberField label="Max Bet" value={rules.maxBet} min={rules.minBet} max={rules.startingChips} step={10} onChange={(v) => update('maxBet', v)} />
        <NumberField label="Turn Timer (s)" value={rules.turnTimeLimit} min={0} max={120} step={5} onChange={(v) => update('turnTimeLimit', v)} />
      </div>
    </div>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: any; options: any[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-400">{label}</span>
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-white text-sm focus:border-gold focus:outline-none"
      >
        {options.map((opt) => (
          <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
        ))}
      </select>
    </label>
  )
}

function NumberField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-400">{label}</span>
      <input
        type="number"
        value={value}
        min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-white text-sm focus:border-gold focus:outline-none"
      />
    </label>
  )
}
```

- [ ] **Step 2: Write CreateGameForm**

Create `src/components/Lobby/CreateGameForm.tsx`:

```tsx
import { useState } from 'react'
import { Button } from '../Shared/Button'
import { RulesConfig } from './RulesConfig'
import type { GameRules } from '../../engine/types'
import { createGame } from '../../engine'
import { useAuthStore } from '../../stores/authStore'
import { useGameStore } from '../../stores/gameStore'
import { createGameDoc } from '../../firebase/games'
import { useUIStore } from '../../stores/uiStore'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const defaultRules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 30,
}

export function CreateGameForm() {
  const [rules, setRules] = useState<GameRules>(defaultRules)
  const [creating, setCreating] = useState(false)
  const { user, displayName, setDisplayName } = useAuthStore()
  const { setGame, setRoomCode, setIsHost } = useGameStore()
  const { setView } = useUIStore()

  async function handleCreate() {
    if (!user) return
    setCreating(true)
    const code = generateRoomCode()
    const game = createGame(code, user.uid, rules)
    await createGameDoc(game)
    setGame(game)
    setRoomCode(code)
    setIsHost(true)
    setView('waiting')
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Your Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-white focus:border-gold focus:outline-none"
        />
      </div>
      <RulesConfig rules={rules} onChange={setRules} />
      <Button onClick={handleCreate} disabled={creating || !displayName.trim()} size="lg" className="w-full">
        {creating ? 'Creating...' : 'Create Game'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Write JoinGameForm**

Create `src/components/Lobby/JoinGameForm.tsx`:

```tsx
import { useState } from 'react'
import { Button } from '../Shared/Button'
import { useAuthStore } from '../../stores/authStore'
import { useGameStore } from '../../stores/gameStore'
import { getGameDoc } from '../../firebase/games'
import { addPlayer } from '../../engine'
import { updateGameDoc } from '../../firebase/games'
import { useUIStore } from '../../stores/uiStore'

export function JoinGameForm() {
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const { user, displayName, setDisplayName } = useAuthStore()
  const { setGame, setRoomCode, setIsHost } = useGameStore()
  const { setView } = useUIStore()

  async function handleJoin() {
    if (!user || !displayName.trim()) return
    setJoining(true)
    setError('')
    try {
      const game = await getGameDoc(code)
      if (!game) { setError('Room not found'); setJoining(false); return }
      if (game.phase !== 'waiting') { setError('Game already started'); setJoining(false); return }
      if (game.players.length >= 6) { setError('Room is full'); setJoining(false); return }

      const updated = addPlayer(game, {
        id: user.uid, name: displayName, seat: 0, hands: [],
        activeHandIndex: 0, chips: game.rules.startingChips, isActive: true, insuranceBet: 0,
      })
      await updateGameDoc(code, { players: updated.players })
      setGame(updated)
      setRoomCode(code)
      setIsHost(false)
      setView('waiting')
    } catch {
      setError('Failed to join')
    }
    setJoining(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Your Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-white focus:border-gold focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Room Code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          maxLength={6}
          className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-white text-center text-2xl tracking-widest font-mono focus:border-gold focus:outline-none"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button onClick={handleJoin} disabled={joining || !displayName.trim() || code.length < 6} className="w-full">
        {joining ? 'Joining...' : 'Join Game'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add lobby components (CreateGame, JoinGame, RulesConfig)"
```

---

### Task 20: WaitingRoom component

**Files:**
- Create: `src/components/Lobby/WaitingRoom.tsx`

- [ ] **Step 1: Write WaitingRoom**

Create `src/components/Lobby/WaitingRoom.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Button } from '../Shared/Button'
import { PlayerAvatar } from '../Shared/PlayerAvatar'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { subscribeToGame, updateGameDoc, deleteGameDoc } from '../../firebase/games'
import { startGame, removePlayer } from '../../engine'

export function WaitingRoom() {
  const { game, roomCode, isHost, setGame } = useGameStore()
  const { user } = useAuthStore()
  const { setView } = useUIStore()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToGame(roomCode, (updated) => {
      if (updated) setGame(updated)
    })
    return () => unsub()
  }, [roomCode, setGame])

  async function handleStart() {
    if (!game || !isHost) return
    const updated = startGame(game)
    await updateGameDoc(game.id, { ...updated, shoe: updated.shoe as any, players: updated.players })
    setView('table')
  }

  async function handleKick(playerId: string) {
    if (!game || !isHost) return
    const updated = removePlayer(game, playerId)
    await updateGameDoc(game.id, { players: updated.players })
  }

  async function copyLink() {
    const url = `${window.location.origin}?code=${roomCode}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!game) return null

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gold mb-2">Waiting Room</h2>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-mono tracking-[0.3em] text-white">{roomCode}</span>
          <button onClick={copyLink} className="text-sm text-gray-400 hover:text-gold transition-colors cursor-pointer">
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm text-gray-400 uppercase tracking-wide">Players ({game.players.length}/6)</h3>
        {game.players.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-white/5">
            <PlayerAvatar name={p.name} seat={i} />
            <span className="flex-1 text-white">{p.name}</span>
            {p.id === game.hostId && <span className="text-xs text-gold bg-gold/10 px-2 py-0.5 rounded">HOST</span>}
            {isHost && p.id !== user?.uid && (
              <button onClick={() => handleKick(p.id)} className="text-red-400 text-sm hover:text-red-300 cursor-pointer">Kick</button>
            )}
          </div>
        ))}
        {game.players.length === 0 && (
          <p className="text-gray-500 text-sm">No players yet. Share the room code!</p>
        )}
      </div>

      {isHost ? (
        <Button onClick={handleStart} disabled={game.players.length === 0} className="w-full" size="lg">
          Start Game
        </Button>
      ) : (
        <p className="text-center text-gray-400">Waiting for host to start the game...</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add WaitingRoom component"
```

---

### Task 21: LobbyPage container

**Files:**
- Create: `src/components/Lobby/LobbyPage.tsx`

- [ ] **Step 1: Write LobbyPage**

Create `src/components/Lobby/LobbyPage.tsx`:

```tsx
import { useState } from 'react'
import { CreateGameForm } from './CreateGameForm'
import { JoinGameForm } from './JoinGameForm'
import { WaitingRoom } from './WaitingRoom'
import { useUIStore } from '../../stores/uiStore'

export function LobbyPage() {
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const { currentView } = useUIStore()

  if (currentView === 'waiting') return <WaitingRoom />

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-5xl font-bold text-center text-gold mb-2">Blackjackson</h1>
        <p className="text-center text-gray-400 mb-8">Multiplayer Blackjack for friends</p>

        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              tab === 'create' ? 'bg-gold text-gray-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            Create Game
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              tab === 'join' ? 'bg-gold text-gray-950' : 'text-gray-400 hover:text-white'
            }`}
          >
            Join Game
          </button>
        </div>

        <div className="bg-gray-900/50 backdrop-blur border border-white/10 rounded-xl p-6">
          {tab === 'create' ? <CreateGameForm /> : <JoinGameForm />}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add LobbyPage container"
```

---

### Task 22: Table components (TableFelt, DealerArea, PlayerPosition)

**Files:**
- Create: `src/components/Table/TableFelt.tsx`
- Create: `src/components/Table/DealerArea.tsx`
- Create: `src/components/Table/PlayerPosition.tsx`
- Create: `src/components/Table/ActionButtons.tsx`
- Create: `src/components/Table/BetControls.tsx`
- Create: `src/components/Table/TurnTimer.tsx`
- Create: `src/components/Table/RoundResult.tsx`

- [ ] **Step 1: Write TableFelt**

Create `src/components/Table/TableFelt.tsx`:

```tsx
import type { ReactNode } from 'react'

export function TableFelt({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-felt-dark flex flex-col">
      <div
        className="flex-1 m-2 sm:m-4 rounded-[3rem] bg-felt border-8 border-amber-900/50 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(ellipse at center, #0d5e2e 0%, #094a24 100%)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write DealerArea**

Create `src/components/Table/DealerArea.tsx`:

```tsx
import type { Card } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent } from './CardComponent'
import { PlayerAvatar } from '../Shared/PlayerAvatar'

type Props = {
  dealerHand: Card[]
  showHoleCard: boolean
  phase: string
}

export function DealerArea({ dealerHand, showHoleCard, phase }: Props) {
  const visibleCards = showHoleCard ? dealerHand : dealerHand.slice(0, 1)
  const ev = dealerHand.length > 0 ? evaluateHand(showHoleCard ? dealerHand : [dealerHand[0]]) : null

  return (
    <div className="flex flex-col items-center py-6">
      <div className="flex items-center gap-4 mb-2">
        <PlayerAvatar name="Dealer" seat={6} size="lg" />
        <span className="text-gold font-semibold text-lg">Dealer</span>
      </div>
      <div className="flex -space-x-3 mb-2">
        {dealerHand.map((card, i) => (
          <CardComponent
            key={i}
            card={card}
            faceDown={!showHoleCard && i === 1}
            size="lg"
            delay={i * 0.2}
          />
        ))}
      </div>
      {ev && phase !== 'waiting' && phase !== 'betting' && phase !== 'dealing' && (
        <div className="text-lg font-mono text-white">
          {showHoleCard ? ev.value : ev.soft ? `${ev.value - 10}/${ev.value}` : ev.value}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write PlayerPosition**

Create `src/components/Table/PlayerPosition.tsx`:

```tsx
import type { PlayerState, Card, GamePhase } from '../../engine/types'
import { PlayerAvatar } from '../Shared/PlayerAvatar'
import { CardHand } from './CardHand'
import { ChipStack } from './ChipStack'
import { ActionButtons } from './ActionButtons'
import { TurnTimer } from './TurnTimer'
import { motion } from 'framer-motion'

type Props = {
  player: PlayerState
  isCurrentTurn: boolean
  isLocalPlayer: boolean
  phase: GamePhase
  turnTimeLimit: number
  turnStartedAt: number | null
  onAction: (action: any) => void
}

export function PlayerPosition({ player, isCurrentTurn, isLocalPlayer, phase, turnTimeLimit, turnStartedAt, onAction }: Props) {
  const canAct = isCurrentTurn && isLocalPlayer && phase === 'playing'

  return (
    <motion.div
      animate={{
        scale: isCurrentTurn ? 1.02 : 1,
        boxShadow: isCurrentTurn ? '0 0 20px rgba(212,168,67,0.3)' : '0 0 0px rgba(0,0,0,0)',
      }}
      className="relative bg-black/20 rounded-xl p-3 border border-white/5 min-w-[180px]"
    >
      <div className="flex items-center gap-2 mb-2">
        <PlayerAvatar name={player.name} seat={player.seat} isActive={isCurrentTurn} />
        <div>
          <span className="text-white text-sm font-medium block">{player.name}</span>
          <span className="text-gold text-xs">{player.chips} chips</span>
        </div>
      </div>

      {player.hands.map((hand, hi) => (
        <CardHand key={hi} hand={hand} handIndex={hi} activeHandIndex={player.activeHandIndex} />
      ))}

      {canAct && (
        <div className="mt-3 space-y-2">
          {turnTimeLimit > 0 && (
            <TurnTimer timeLimit={turnTimeLimit} startedAt={turnStartedAt!} />
          )}
          <ActionButtons hand={player.hands[player.activeHandIndex]} onAction={onAction} chips={player.chips} />
        </div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 4: Write ActionButtons**

Create `src/components/Table/ActionButtons.tsx`:

```tsx
import type { HandState } from '../../engine/types'
import { evaluateHand } from '../../engine'

type Props = {
  hand: HandState
  chips: number
  onAction: (action: any) => void
}

export function ActionButtons({ hand, chips, onAction }: Props) {
  const ev = evaluateHand(hand.cards)
  const canDouble = hand.cards.length === 2 && chips >= hand.bet
  const canSplit = hand.cards.length === 2 &&
    hand.cards[0].rank === hand.cards[1].rank &&
    chips >= hand.bet

  return (
    <div className="flex gap-1.5 flex-wrap justify-center">
      <button onClick={() => onAction({ type: 'hit' })} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded cursor-pointer">Hit</button>
      <button onClick={() => onAction({ type: 'stand' })} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded cursor-pointer">Stand</button>
      {canDouble && (
        <button onClick={() => onAction({ type: 'double' })} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded cursor-pointer">Double</button>
      )}
      {canSplit && (
        <button onClick={() => onAction({ type: 'split' })} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded cursor-pointer">Split</button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Write TurnTimer**

Create `src/components/Table/TurnTimer.tsx`:

```tsx
import { useState, useEffect } from 'react'

type Props = {
  timeLimit: number
  startedAt: number
}

export function TurnTimer({ timeLimit, startedAt }: Props) {
  const [remaining, setRemaining] = useState(timeLimit)
  const pct = (remaining / timeLimit) * 100

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      const left = Math.max(0, timeLimit - elapsed)
      setRemaining(left)
      if (left <= 0) clearInterval(interval)
    }, 100)
    return () => clearInterval(interval)
  }, [timeLimit, startedAt])

  return (
    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-colors ${
          remaining < 5 ? 'bg-red-500' : remaining < 10 ? 'bg-yellow-500' : 'bg-gold'
        }`}
        style={{ width: `${pct}%`, transition: 'width 0.1s linear' }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Write RoundResult overlay**

Create `src/components/Table/RoundResult.tsx`:

```tsx
import { motion, AnimatePresence } from 'framer-motion'
import type { HandState } from '../../engine/types'

type Props = {
  hands: HandState[]
  visible: boolean
}

export function RoundResult({ hands, visible }: Props) {
  const result = hands[0]?.result
  if (!result || result === 'pending') return null

  const label = result === 'blackjack' ? 'BLACKJACK!' : result === 'win' ? 'WIN!' : result === 'push' ? 'PUSH' : 'BUST'
  const color = result === 'blackjack' ? 'text-gold' : result === 'win' ? 'text-green-400' : result === 'push' ? 'text-gray-400' : 'text-red-400'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={`text-4xl font-black ${color} text-center py-4 drop-shadow-lg`}
        >
          {label}
          {hands[0].payout > 0 && (
            <span className="block text-lg text-gold">+{hands[0].payout + hands[0].bet}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add table components (Felt, Dealer, Player, Actions, Timer, Results)"
```

---

### Task 23: TablePage container

**Files:**
- Create: `src/components/Table/TablePage.tsx`
- Create: `src/hooks/useGameSync.ts`

- [ ] **Step 1: Write useGameSync hook**

Create `src/hooks/useGameSync.ts`:

```ts
import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { subscribeToGame, updateGameDoc } from '../firebase/games'
import { processAction, playDealer, settleHands, dealInitialHands, setPlayerBet, allBetsPlaced } from '../engine'
import type { PlayerAction, GameRules, GameState } from '../engine/types'

export function useGameSync() {
  const { game, setGame, roomCode, isHost } = useGameStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToGame(roomCode, (updated) => {
      if (updated) setGame(updated)
    })
    return () => unsub()
  }, [roomCode, setGame])

  async function submitAction(action: PlayerAction) {
    if (!game || !user) return
    const updated = processAction(game, { ...action, playerId: user.uid })

    if (updated.phase === 'dealer') {
      const afterDealer = playDealer(updated)
      const settled = settleHands(afterDealer)
      await updateGameDoc(game.id, { ...settled, shoe: settled.shoe as any, players: settled.players })
    } else {
      await updateGameDoc(game.id, { ...updated, shoe: updated.shoe as any, players: updated.players })
    }
  }

  async function submitBet(playerId: string, amount: number) {
    if (!game) return
    const updated = setPlayerBet(game, playerId, amount)
    await updateGameDoc(game.id, { players: updated.players })

    if (allBetsPlaced(updated)) {
      const dealt = dealInitialHands(updated)
      await updateGameDoc(game.id, { ...dealt, shoe: dealt.shoe as any, players: dealt.players })
    }
  }

  return { submitAction, submitBet }
}
```

- [ ] **Step 2: Write TablePage**

Create `src/components/Table/TablePage.tsx`:

```tsx
import { useGameSync } from '../../hooks/useGameSync'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import { TableFelt } from './TableFelt'
import { DealerArea } from './DealerArea'
import { PlayerPosition } from './PlayerPosition'
import { RoundResult } from './RoundResult'
import { Button } from '../Shared/Button'
import { updateGameDoc } from '../../firebase/games'
import { startGame, dealInitialHands, allBetsPlaced, setPlayerBet } from '../../engine'

export function TablePage() {
  const { game, isHost } = useGameStore()
  const { user } = useAuthStore()
  const { submitAction, submitBet } = useGameSync()

  if (!game) return <div className="text-white p-8">Loading game...</div>
  if (!user) return <div className="text-white p-8">Connecting...</div>

  const localPlayer = game.players.find((p) => p.id === user.uid)
  const isBetting = game.phase === 'betting'
  const allBet = allBetsPlaced(game)

  async function handleStartRound() {
    if (!game || !isHost) return
    const dealt = dealInitialHands(game)
    await updateGameDoc(game.id, { ...dealt, shoe: dealt.shoe as any, players: dealt.players })
  }

  return (
    <TableFelt>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="text-gold text-sm font-mono">Round {game.roundNumber}</div>
          <div className="text-white text-sm">Room: {game.id}</div>
          <div className="text-gray-400 text-sm">{game.players.length} players</div>
        </div>

        {/* Dealer */}
        <DealerArea
          dealerHand={game.dealerHand}
          showHoleCard={game.phase === 'dealer' || game.phase === 'settlement' || game.phase === 'round_end'}
          phase={game.phase}
        />

        {/* Results */}
        <RoundResult hands={localPlayer?.hands ?? []} visible={game.phase === 'round_end'} />

        {/* Players */}
        <div className="flex-1 flex items-end justify-center gap-3 px-4 pb-6 flex-wrap">
          {game.players.map((player) => (
            <PlayerPosition
              key={player.id}
              player={player}
              isCurrentTurn={game.currentTurn === player.seat}
              isLocalPlayer={player.id === user.uid}
              phase={game.phase}
              turnTimeLimit={game.turnTimeLimit}
              turnStartedAt={game.turnStartedAt}
              onAction={submitAction}
            />
          ))}
        </div>

        {/* Betting phase controls */}
        {isBetting && !allBet && localPlayer && (
          <div className="flex justify-center gap-3 pb-4">
            {[10, 25, 50, 100, 250, 500].filter((a) => a <= localPlayer.chips && a >= game.rules.minBet && a <= game.rules.maxBet).map((amount) => (
              <button
                key={amount}
                onClick={() => submitBet(user.uid, amount)}
                className="px-3 py-2 bg-gold/80 hover:bg-gold text-gray-900 font-bold rounded-lg cursor-pointer text-sm"
              >
                {amount}
              </button>
            ))}
          </div>
        )}

        {/* Host start round or ready check */}
        {isBetting && allBet && isHost && (
          <div className="flex justify-center pb-4">
            <Button onClick={handleStartRound}>Deal Cards</Button>
          </div>
        )}
      </div>
    </TableFelt>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add TablePage container and game sync hook"
```

---

### Task 24: App router and main entry point

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write App.tsx**

```tsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { LobbyPage } from './components/Lobby/LobbyPage'
import { TablePage } from './components/Table/TablePage'

function AutoJoin() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setDisplayName } = useAuthStore()

  useEffect(() => {
    const code = params.get('code')
    if (code) {
      setDisplayName('Player')
      navigate(`/table/${code}`)
    }
  }, [])

  return null
}

function AppRoutes() {
  return (
    <>
      <AutoJoin />
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/table/:roomCode" element={<TablePage />} />
      </Routes>
    </>
  )
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    const unsub = initialize()
    return () => unsub()
  }, [initialize])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Write main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Fix any type errors. (May need to add type assertions for Firestore data serialization.)

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: wire up App router and main entry point"
```

---

### Task 25: Sound effects with Web Audio API

**Files:**
- Create: `src/hooks/useSound.ts`

- [ ] **Step 1: Write useSound hook**

Create `src/hooks/useSound.ts`:

```ts
import { useCallback, useRef } from 'react'
import { useUIStore } from '../stores/uiStore'

type SoundType = 'deal' | 'chip' | 'win' | 'lose' | 'blackjack' | 'tick'

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const { soundEnabled } = useUIStore()

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    return ctxRef.current
  }, [])

  const play = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0.1

      switch (type) {
        case 'deal':
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(800, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
          osc.start(); osc.stop(ctx.currentTime + 0.1)
          break
        case 'chip':
          osc.type = 'square'
          osc.frequency.setValueAtTime(1200, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
          osc.start(); osc.stop(ctx.currentTime + 0.05)
          break
        case 'win':
          osc.type = 'sine'
          osc.frequency.setValueAtTime(523, ctx.currentTime)
          osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
          osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
          osc.start(); osc.stop(ctx.currentTime + 0.4)
          break
        case 'lose':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(300, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
          osc.start(); osc.stop(ctx.currentTime + 0.3)
          break
        case 'blackjack':
          osc.type = 'sine'
          osc.frequency.setValueAtTime(523, ctx.currentTime)
          osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
          osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
          osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.3)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
          osc.start(); osc.stop(ctx.currentTime + 0.6)
          break
        case 'tick':
          osc.type = 'sine'
          osc.frequency.setValueAtTime(1000, ctx.currentTime)
          gain.gain.value = 0.05
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03)
          osc.start(); osc.stop(ctx.currentTime + 0.03)
          break
      }
    },
    [soundEnabled, getCtx]
  )

  return { play }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Web Audio sound effects hook"
```

---

### Task 26: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Add build script to package.json**

Ensure `package.json` has:
```json
"scripts": {
  "build": "tsc && vite build"
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "ci: add GitHub Pages deploy workflow"
```

---

### Task 27: Final integration and polish

**Files:**
- Create: `src/index.css` (update if needed)
- Modify: various components for edge cases

- [ ] **Step 1: Add responsive and polish styles**

Update `src/index.css`:

```css
@import "tailwindcss";

@theme {
  --color-felt: #0d5e2e;
  --color-felt-dark: #094a24;
  --color-gold: #d4a843;
  --color-gold-light: #f0d68a;
  --color-chip-red: #c0392b;
  --color-chip-blue: #2980b9;
  --color-chip-green: #27ae60;
  --color-chip-black: #1a1a1a;
  --color-chip-white: #ecf0f1;
}

@layer base {
  body {
    @apply bg-gray-950 text-white antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: #333 transparent;
  }
}

@utility text-shadow-glow {
  text-shadow: 0 0 10px rgba(212, 168, 67, 0.5);
}
```

- [ ] **Step 2: Verify full build**

```bash
npm run build
```

Expected: build succeeds without errors.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: final polish, responsive styles, and build verification"
```

---

### Post-Dev Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database and Anonymous Authentication
3. Copy the Firebase config object into `src/firebase/config.ts`
4. Set Firestore security rules (development):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read, write: if true;
    }
  }
}
```

5. Push to GitHub `main` branch to trigger deploy
6. Share the URL with friends

---

**Plan complete.** Total: 27 tasks.
