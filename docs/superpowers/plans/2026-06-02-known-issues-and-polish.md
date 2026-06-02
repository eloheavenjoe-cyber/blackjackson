# Known Issues Fix & Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 9 known issues from memory.md + additional gaps discovered during exploration (engine insurance, split hand nav, RoundResult labels, dead code cleanup, bet concurrency, 0-chip/disconnect).

**Architecture:** Engine-first — all TypeScript engine changes and tests come before UI wiring. Engine functions remain pure `(state) => newState`. Firestore document `games/{roomCode}` unchanged. Bet intents use new subcollection `games/{code}/bets/{playerId}`.

**Tech Stack:** TypeScript, React 18, Vite, Zustand, Firebase Firestore, Vitest, Framer Motion, Tailwind CSS v4

---

### Task 1: Add types for insuranceDecided, removedPlayers, lastActionAt, gameOver

**Files:**
- Modify: `src/engine/types.ts:44-53`
- Modify: `src/engine/types.ts:72-87`

- [ ] **Step 1: Add `insuranceDecided` to `PlayerState`**

In `src/engine/types.ts`, change the `PlayerState` type (lines 44-53):

```typescript
export type PlayerState = {
  id: string
  name: string
  seat: number
  hands: HandState[]
  activeHandIndex: number
  chips: number
  isActive: boolean
  insuranceBet: number
  insuranceDecided: boolean
}
```

Add `insuranceDecided: boolean` after `insuranceBet: number` on line 53.

- [ ] **Step 2: Add `removedPlayers`, `lastActionAt`, `gameOver` to `GameState`**

In `src/engine/types.ts`, change the `GameState` type (lines 72-87):

```typescript
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
  removedPlayers?: { id: string; name: string; reason: 'bust' | 'kicked' | 'disconnected' }[]
  lastActionAt?: Record<string, number>
  gameOver?: boolean
}
```

Add `removedPlayers?`, `lastActionAt?`, and `gameOver?` after `createdAt: number` on line 86.

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: No type errors related to these types (other pre-existing errors may exist — only check for new ones).

- [ ] **Step 4: Commit**

```bash
git add src/engine/types.ts
git commit -m "feat: add insuranceDecided, removedPlayers, lastActionAt, gameOver types"
```

---

### Task 2: Double-down rule enforcement in engine

**Files:**
- Modify: `src/engine/actions.ts:98-134`
- Modify: `src/engine/__tests__/actions.test.ts`

- [ ] **Step 1: Write failing tests for double-down rules**

In `src/engine/__tests__/actions.test.ts`, add after the existing split test (after line 53):

```typescript
describe('processAction - double', () => {
  it('blocks double when rules.doubleDown is none', () => {
    let game = createGame('T3', 'host', { ...rules, doubleDown: 'none' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '9' }, { suit: 'D', rank: '2' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    expect(() => processAction(game, { type: 'double', playerId: 'p1' })).toThrow('Double down is not allowed')
  })

  it('blocks double on 8 when rules.doubleDown is 9-10-11', () => {
    let game = createGame('T4', 'host', { ...rules, doubleDown: '9-10-11' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '5' }, { suit: 'D', rank: '3' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    expect(() => processAction(game, { type: 'double', playerId: 'p1' })).toThrow('Double down only allowed on 9, 10, or 11')
  })

  it('allows double on 10 when rules.doubleDown is 9-10-11', () => {
    let game = createGame('T5', 'host', { ...rules, doubleDown: '9-10-11' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '5' }, { suit: 'D', rank: '5' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    game = processAction(game, { type: 'double', playerId: 'p1' })
    expect(game.players[0].hands[0].isDoubled).toBe(true)
    expect(game.players[0].hands[0].bet).toBe(100)
  })

  it('blocks double after hitting (more than 2 cards)', () => {
    let game = createGame('T6', 'host', rules)
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '5' }, { suit: 'D', rank: '3' }, { suit: 'C', rank: '2' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    expect(() => processAction(game, { type: 'double', playerId: 'p1' })).toThrow()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/actions.test.ts`
Expected: The new double tests fail with "Double down is not allowed" / "Double down only allowed on 9, 10, or 11" not being thrown, and the last test might still pass since the cards.length check already exists.

- [ ] **Step 3: Implement double-down rule enforcement**

In `src/engine/actions.ts`, in the `case 'double'` block (after line 101), add the rule checks. Replace lines 98-134 with:

```typescript
    case 'double': {
      const player = state.players[playerIndex]
      const hand = player.hands[player.activeHandIndex]
      if (hand.cards.length !== 2) throw new Error('Can only double on initial two cards')

      if (state.rules.doubleDown === 'none') {
        throw new Error('Double down is not allowed')
      }
      if (state.rules.doubleDown === '9-10-11') {
        const value = evaluateHand(hand.cards).value
        if (value !== 9 && value !== 10 && value !== 11) {
          throw new Error('Double down only allowed on 9, 10, or 11')
        }
      }

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/actions.test.ts`
Expected: All tests pass (3 stand+split tests + 4 new double tests = 7 passing).

- [ ] **Step 5: Commit**

```bash
git add src/engine/actions.ts src/engine/__tests__/actions.test.ts
git commit -m "feat: enforce double-down rules in engine (none, 9-10-11)"
```

---

### Task 3: Surrender first-action guard in engine

**Files:**
- Modify: `src/engine/actions.ts:136-153`
- Modify: `src/engine/__tests__/actions.test.ts`

- [ ] **Step 1: Write failing test for surrender after hit**

In `src/engine/__tests__/actions.test.ts`, add after the double tests:

```typescript
describe('processAction - surrender', () => {
  it('blocks surrender after hitting (more than 2 cards)', () => {
    let game = createGame('T7', 'host', { ...rules, surrender: 'late' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '5' }, { suit: 'D', rank: '3' }, { suit: 'C', rank: '2' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    expect(() => processAction(game, { type: 'surrender', playerId: 'p1' })).toThrow('Can only surrender on initial two cards')
  })

  it('allows surrender on two cards', () => {
    let game = createGame('T8', 'host', { ...rules, surrender: 'late' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: 'K' }, { suit: 'D', rank: '6' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    const result = processAction(game, { type: 'surrender', playerId: 'p1' })
    expect(result.players[0].hands[0].isSurrendered).toBe(true)
    expect(result.players[0].hands[0].result).toBe('lose')
    expect(result.players[0].chips).toBe(1000 + 25) // half bet returned
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/actions.test.ts`
Expected: The "blocks surrender after hitting" test fails (surrender succeeds when it shouldn't).

- [ ] **Step 3: Add first-action guard to surrender**

In `src/engine/actions.ts`, in the `case 'surrender'` block (after line 136), add the cards.length check. Replace lines 136-153 with:

```typescript
    case 'surrender': {
      if (state.rules.surrender === 'none') throw new Error('Surrender not allowed')
      const player = state.players[playerIndex]
      const hand = player.hands[player.activeHandIndex]
      if (hand.cards.length !== 2) throw new Error('Can only surrender on initial two cards')
      const surrendered = {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex
            ? {
                ...p,
                chips: p.chips + Math.floor(hand.bet / 2),
                hands: p.hands.map((h, hi) =>
                  hi === p.activeHandIndex ? { ...h, isSurrendered: true, result: 'lose' as const, isStood: true } : h
                ),
              }
            : p
        ),
      }
      return advanceTurn(surrendered)
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/actions.test.ts`
Expected: All tests pass (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/actions.ts src/engine/__tests__/actions.test.ts
git commit -m "feat: add surrender first-action guard (must be 2 cards)"
```

---

### Task 4: Insurance action handlers + resolveInsurance in engine

**Files:**
- Modify: `src/engine/actions.ts` (add cases + new function)
- Modify: `src/engine/__tests__/actions.test.ts`
- Modify: `src/engine/index.ts`

- [ ] **Step 1: Write failing tests for insurance actions**

In `src/engine/__tests__/actions.test.ts`, add:

```typescript
describe('processAction - insurance', () => {
  it('insurance_yes deducts half bet and marks decided', () => {
    let game = createGame('T9', 'host', { ...rules, insurance: true })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 100)
    game = {
      ...game,
      phase: 'insurance' as const,
      currentTurn: 0,
      players: game.players.map(p => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: 'K' }, { suit: 'D', rank: '8' }], bet: 100, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    const result = processAction(game, { type: 'insurance_yes', playerId: 'p1' })
    expect(result.players[0].insuranceBet).toBe(50)
    expect(result.players[0].insuranceDecided).toBe(true)
    expect(result.players[0].chips).toBe(850) // 900 (1000 - 100 bet) - 50 insurance
  })

  it('insurance_no marks decided without deducting', () => {
    let game = createGame('T10', 'host', { ...rules, insurance: true })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 100)
    game = {
      ...game,
      phase: 'insurance' as const,
      currentTurn: 0,
      players: game.players.map(p => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: 'K' }, { suit: 'D', rank: '8' }], bet: 100, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    const result = processAction(game, { type: 'insurance_no', playerId: 'p1' })
    expect(result.players[0].insuranceBet).toBe(0)
    expect(result.players[0].insuranceDecided).toBe(true)
    expect(result.players[0].chips).toBe(900) // unchanged (1000 - 100 bet already)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/actions.test.ts`
Expected: Insurance tests fail — action returns state unchanged (default case).

- [ ] **Step 3: Implement insurance handlers and resolveInsurance**

In `src/engine/actions.ts`, add after the `getNextActivePlayer` function (before `export function processAction`):

```typescript
export function allInsuranceDecided(state: GameState): boolean {
  return state.players.every((p) => p.insuranceDecided === true)
}

export function resolveInsurance(state: GameState): GameState {
  const dealerEval = evaluateHand(state.dealerHand)
  const dealerBJ = dealerEval.isBlackjack

  const players = state.players.map((player) => {
    if (dealerBJ && player.insuranceBet > 0) {
      return { ...player, chips: player.chips + player.insuranceBet + player.insuranceBet * 2, insuranceBet: 0 }
    }
    return { ...player, insuranceBet: 0 }
  })

  if (dealerBJ) {
    return { ...state, players, phase: 'settlement' as const, currentTurn: -1 }
  }
  return { ...state, players, phase: 'playing' as const, currentTurn: 0, turnStartedAt: Date.now() }
}
```

Then in `processAction`, replace `default: return state` at line 208 with:

```typescript
    case 'insurance_yes': {
      if (state.phase !== 'insurance') throw new Error('Not in insurance phase')
      const player = state.players[playerIndex]
      const hand = player.hands[0]
      const insuranceAmount = Math.floor(hand.bet / 2)
      if (player.chips < insuranceAmount) throw new Error('Insufficient chips for insurance')
      const updated = {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex
            ? { ...p, chips: p.chips - insuranceAmount, insuranceBet: insuranceAmount, insuranceDecided: true }
            : p
        ),
      }
      if (allInsuranceDecided(updated)) return resolveInsurance(updated)
      return updated
    }

    case 'insurance_no': {
      if (state.phase !== 'insurance') throw new Error('Not in insurance phase')
      const updated = {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex
            ? { ...p, insuranceBet: 0, insuranceDecided: true }
            : p
        ),
      }
      if (allInsuranceDecided(updated)) return resolveInsurance(updated)
      return updated
    }

    default:
      return state
```

- [ ] **Step 4: Export new functions in index.ts**

In `src/engine/index.ts`, change the actions export line (line 6) from:
```typescript
export { processAction } from './actions'
```
to:
```typescript
export { processAction, allInsuranceDecided, resolveInsurance } from './actions'
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/actions.test.ts`
Expected: 11 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/engine/actions.ts src/engine/__tests__/actions.test.ts src/engine/index.ts
git commit -m "feat: add insurance action handlers and resolveInsurance engine logic"
```

---

### Task 5: Split hand navigation fix in engine

**Files:**
- Modify: `src/engine/actions.ts` (advanceTurn, split case)

- [ ] **Step 1: Fix `advanceTurn` to advance activeHandIndex within same player**

In `src/engine/actions.ts`, add a new function `advanceHand` before `advanceTurn`:

```typescript
function advanceHand(state: GameState): GameState {
  const player = state.players[state.currentTurn]
  const nextHand = player.activeHandIndex + 1
  if (nextHand < player.hands.length) {
    return {
      ...state,
      players: state.players.map((p, i) =>
        i === state.currentTurn
          ? { ...p, activeHandIndex: nextHand }
          : p
      ),
      turnStartedAt: Date.now(),
    }
  }
  return advanceTurn(state)
}
```

Then update `advanceTurn` to use this in the `hit` bust path (line 76), `stand` (line 95), `surrender` (line 152), and `double` (lines 131 and 133), and the ace split path (line 202):

Replace `return advanceTurn(nextState)` at line 76 with `return advanceHand(nextState)`
Replace `return advanceTurn(stood)` at line 95 with `return advanceHand(stood)`
Replace `return advanceTurn(busted)` at line 131 with `return advanceHand(busted)`
Replace `return advanceTurn(doubled)` at line 133 with `return advanceHand(doubled)`
Replace `return advanceTurn(surrendered)` at line 152 with `return advanceHand(surrendered)`
Replace `return advanceTurn(aceStood)` at line 202 with `return advanceHand(aceStood)`

- [ ] **Step 2: Add test for split hand navigation**

In `src/engine/__tests__/actions.test.ts`, add:

```typescript
describe('processAction - split hand navigation', () => {
  it('advances activeHandIndex after first split hand stands', () => {
    let game = createGame('T11', 'host', { ...rules, splits: 'once' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '8' }, { suit: 'D', rank: '8' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    game = processAction(game, { type: 'split', playerId: 'p1' })
    expect(game.players[0].hands).toHaveLength(2)
    expect(game.players[0].activeHandIndex).toBe(0)
    // Stand on first hand
    game = processAction(game, { type: 'stand', playerId: 'p1' })
    // Should still be player 0's turn, now on hand 1
    expect(game.currentTurn).toBe(0)
    expect(game.players[0].activeHandIndex).toBe(1)
  })
})
```

- [ ] **Step 3: Run tests to verify**

Run: `npx vitest run src/engine/__tests__/actions.test.ts`
Expected: 12 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/engine/actions.ts src/engine/__tests__/actions.test.ts
git commit -m "feat: fix split hand navigation - advanceHand before advanceTurn"
```

---

### Task 6: Dealer Ace-up blackjack detection in dealing

**Files:**
- Modify: `src/engine/dealing.ts:50-64`
- Modify: `src/engine/__tests__/dealing.test.ts`

- [ ] **Step 1: Fix dealer Ace-up check**

In `src/engine/dealing.ts`, replace lines 50-64 (from `const dealerUpcard = currentState.dealerHand[0]` to the end) with:

```typescript
  const dealerUpcard = currentState.dealerHand[0]
  const dealerHole = currentState.dealerHand[1]
  const dealerEval = evaluateHand(currentState.dealerHand)
  const dealerBJ = dealerEval.isBlackjack

  // Dealer shows Ace
  if (dealerUpcard.rank === 'A') {
    if (currentState.rules.insurance) {
      return { ...currentState, phase: 'insurance' }
    }
    // No insurance - check for blackjack
    if (dealerBJ) {
      return { ...currentState, phase: 'settlement' }
    }
    return { ...currentState, phase: 'playing', currentTurn: 0 }
  }

  // Dealer shows 10-value
  if (['10', 'J', 'Q', 'K'].includes(dealerUpcard.rank)) {
    if (dealerBJ) {
      return { ...currentState, phase: 'settlement' }
    }
  }

  return { ...currentState, phase: 'playing', currentTurn: 0 }
```

Also add the import for `evaluateHand` at the top of `dealing.ts`:

```typescript
import { evaluateHand } from './hand'
```

After the existing imports at lines 1-2.

- [ ] **Step 2: Add test for dealer blackjack when showing Ace, no insurance**

In `src/engine/__tests__/dealing.test.ts`, add after the last test (line 64):

```typescript
  it('transitions to settlement when dealer shows Ace and has blackjack, insurance off', () => {
    let game = createGame('TEST', 'host-1', { ...defaultRules, insurance: false })
    game = addPlayer(game, makePlayer('p1', 'Alice'))
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    // Force shoe with Ace and 10-value for dealer
    game = {
      ...game,
      shoe: [
        { suit: 'H', rank: '10' }, { suit: 'D', rank: 'A' }, // dealer Ace then 10
        { suit: 'H', rank: '8' }, { suit: 'D', rank: '8' }, // p1 first round
        { suit: 'H', rank: '9' }, { suit: 'D', rank: '9' }, // p1 second round
      ],
    }
    game = dealInitialHands(game)
    expect(game.phase).toBe('settlement')
  })
```

- [ ] **Step 3: Run tests to verify**

Run: `npx vitest run src/engine/__tests__/dealing.test.ts`
Expected: All tests pass (4 tests).

- [ ] **Step 4: Commit**

```bash
git add src/engine/dealing.ts src/engine/__tests__/dealing.test.ts
git commit -m "feat: detect dealer blackjack on Ace upcard when insurance is off"
```

---

### Task 7: Insurance payout in settlement

**Files:**
- Modify: `src/engine/settlement.ts`
- Modify: `src/engine/__tests__/settlement.test.ts`

- [ ] **Step 1: Add settleInsurance to settlement.ts**

In `src/engine/settlement.ts`, after the `settleHands` function, add:

```typescript
export function settleInsurance(state: GameState): GameState {
  const dealerEval = evaluateHand(state.dealerHand)
  if (!dealerEval.isBlackjack) return state

  const players = state.players.map((player) => {
    if (player.insuranceBet > 0) {
      return { ...player, chips: player.chips + player.insuranceBet + player.insuranceBet * 2, insuranceBet: 0 }
    }
    return { ...player, insuranceBet: 0 }
  })

  return { ...state, players }
}
```

- [ ] **Step 2: Write test for insurance payout**

In `src/engine/__tests__/settlement.test.ts`, add after line 129:

```typescript
  it('insurance pays 2:1 when dealer has blackjack', () => {
    const state: GameState = {
      id: 'T1', phase: 'settlement', hostId: 'host', rules: { ...rules, insurance: true },
      shoe: [], discard: [],
      dealerHand: [{ suit: 'H', rank: 'A' }, { suit: 'D', rank: 'K' }],
      dealerHoleCard: null,
      players: [{
        id: 'p1', name: 'Alice', seat: 0,
        hands: [{ cards: [{ suit: 'S', rank: '9' }, { suit: 'C', rank: '8' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: true, result: 'pending', payout: 0 }],
        activeHandIndex: 0, chips: 925, isActive: true, insuranceBet: 25,
      }],
      currentTurn: -1, turnTimeLimit: 0, turnStartedAt: null,
      roundNumber: 1, createdAt: Date.now(),
    }
    const settled = settleHands(state)
    const insured = settleInsurance(settled)
    // Player: 950 chips (original) - 50 bet - 25 insurance = 875
    // After settleHands: lose, chips stay 875 (bet already lost, 0 returned)
    // After settleInsurance: 875 + 25 + 50 = 950
    expect(insured.players[0].chips).toBe(950)
  })
```

- [ ] **Step 3: Export settleInsurance**

In `src/engine/index.ts`, change the settlement export line (line 8) from:
```typescript
export { settleHands } from './settlement'
```
to:
```typescript
export { settleHands, settleInsurance } from './settlement'
```

- [ ] **Step 4: Run settlement tests to verify**

Run: `npx vitest run src/engine/__tests__/settlement.test.ts`
Expected: All tests pass (6 tests).

- [ ] **Step 5: Wire settleInsurance into useGameSync**

In `src/hooks/useGameSync.ts`, update the `submitAction` function to call `settleInsurance` after settlement. Change line 33 from:

```typescript
      const settled = settleHands(afterDealer)
```

to:

```typescript
      const settled = settleInsurance(settleHands(afterDealer))
```

And add the import at line 5:
```typescript
import { processAction, playDealer, settleHands, settleInsurance, dealInitialHands, setPlayerBet, allBetsPlaced, startNewRound } from '../engine'
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/settlement.ts src/engine/__tests__/settlement.test.ts src/engine/index.ts src/hooks/useGameSync.ts
git commit -m "feat: add insurance settlement payout and wire into game sync"
```

---

### Task 8: setPlayerBet guard, startNewRound fixes, allInsuranceDecided

**Files:**
- Modify: `src/engine/game.ts`
- Modify: `src/engine/__tests__/game.test.ts`

- [ ] **Step 1: Add guards to setPlayerBet and fix startNewRound**

Replace `src/engine/game.ts` contents:

```typescript
import type { GameState, GameRules, PlayerState } from './types'
import { createShoe, needsReshuffle, reshuffleDiscard } from './shoe'

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
  if (state.phase !== 'betting') throw new Error('Not in betting phase')
  const player = state.players.find((p) => p.id === playerId)
  if (!player) throw new Error('Player not found')
  if (player.hands.length > 0 && player.hands[0].bet > 0) throw new Error('Already placed a bet')
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

export function startNewRound(state: GameState): GameState {
  let shoe = state.shoe
  let discard = [...state.discard, ...state.dealerHand, ...state.players.flatMap((p) => p.hands.flatMap((h) => h.cards))]

  if (needsReshuffle(shoe, state.rules.decks)) {
    const reshuffled = reshuffleDiscard(discard)
    shoe = reshuffled
    discard = []
  }

  const removedPlayers = (state.removedPlayers || []).filter(p => p.reason !== 'bust')
  const bustedPlayers = state.players.filter(p => p.chips <= 0)
  const newRemoved = [
    ...removedPlayers,
    ...bustedPlayers.map(p => ({ id: p.id, name: p.name, reason: 'bust' as const })),
  ]

  const activePlayers = state.players.filter(p => p.chips > 0)
  if (activePlayers.length === 0) {
    return {
      ...state,
      phase: 'round_end' as const,
      shoe,
      discard,
      removedPlayers: newRemoved,
      gameOver: true,
    }
  }

  return {
    ...state,
    phase: 'betting' as const,
    roundNumber: state.roundNumber + 1,
    dealerHand: [],
    dealerHoleCard: null,
    currentTurn: -1,
    turnStartedAt: null,
    shoe,
    discard,
    removedPlayers: newRemoved,
    players: activePlayers.map((p) => ({
      ...p,
      hands: [],
      activeHandIndex: 0,
      isActive: true,
      insuranceBet: 0,
      insuranceDecided: false,
    })),
  }
}
```

- [ ] **Step 2: Add tests for new guards**

In `src/engine/__tests__/game.test.ts`, add after line 77:

```typescript
describe('setPlayerBet', () => {
  it('rejects bet outside betting phase', () => {
    const game = createGame('ABC', 'host', defaultRules)
    expect(() => setPlayerBet(game, 'p1', 50)).toThrow('Not in betting phase')
  })

  it('rejects re-betting', () => {
    let game = createGame('ABC', 'host', defaultRules)
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    expect(() => setPlayerBet(game, 'p1', 100)).toThrow('Already placed a bet')
  })
})

describe('startNewRound', () => {
  it('removes players with 0 chips', () => {
    let game = createGame('ABC', 'host', defaultRules)
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 0, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = addPlayer(game, { id: 'p2', name: 'Bob', seat: 1, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = { ...game, phase: 'round_end' as const }
    game = startNewRound(game)
    expect(game.players).toHaveLength(1)
    expect(game.players[0].id).toBe('p2')
    expect(game.removedPlayers).toHaveLength(1)
    expect(game.removedPlayers![0].reason).toBe('bust')
  })

  it('sets gameOver when all players bust', () => {
    let game = createGame('ABC', 'host', defaultRules)
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 0, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = { ...game, phase: 'round_end' as const }
    game = startNewRound(game)
    expect(game.gameOver).toBe(true)
    expect(game.players).toHaveLength(0)
  })
})
```

Also update the `addPlayer` calls in the existing `setup` in `actions.test.ts` to include `insuranceDecided: false` in the player objects (the `PlayerState` now requires it). Update all `addPlayer` calls in `actions.test.ts`:

Change every:
```typescript
{ id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0 }
```
to:
```typescript
{ id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false }
```

Do this for ALL player objects in `actions.test.ts` (multiple occurrences).

- [ ] **Step 3: Run all engine tests**

Run: `npx vitest run`
Expected: All tests pass. Previous 36 + new ones = 48+ tests.

- [ ] **Step 4: Commit**

```bash
git add src/engine/game.ts src/engine/__tests__/game.test.ts src/engine/__tests__/actions.test.ts
git commit -m "feat: add setPlayerBet guards, reshuffle in startNewRound, 0-chip removal, gameOver"
```

---

### Task 9: ActionButtons — rules-aware with surrender, insurance, split/double fixes

**Files:**
- Modify: `src/components/Table/ActionButtons.tsx`

- [ ] **Step 1: Rewrite ActionButtons with full rules awareness**

Replace the entire contents of `src/components/Table/ActionButtons.tsx`:

```typescript
import type { HandState, GameRules, GamePhase } from '../../engine/types'
import { calculateHandValue, evaluateHand } from '../../engine'

type Props = {
  hand: HandState
  chips: number
  onAction: (action: any) => void
  rules: GameRules
  handIndex: number
  playerHands: HandState[]
  phase: GamePhase
  dealerUpcard: string | null
}

export function ActionButtons({ hand, chips, onAction, rules, handIndex, playerHands, phase, dealerUpcard }: Props) {
  if (phase === 'insurance') {
    return (
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={() => onAction({ type: 'insurance_yes' })}
          className="px-3 py-1.5 bg-gold hover:bg-yellow-500 text-gray-900 text-xs font-bold rounded cursor-pointer"
        >
          Insure
        </button>
        <button
          onClick={() => onAction({ type: 'insurance_no' })}
          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded cursor-pointer"
        >
          Decline
        </button>
      </div>
    )
  }

  if (phase !== 'playing') return null

  const handValue = hand.cards.length >= 2 ? evaluateHand(hand.cards).value : 0

  const canDouble = hand.cards.length === 2 &&
    chips >= hand.bet &&
    (rules.doubleDown === 'any' ||
      (rules.doubleDown === '9-10-11' && [9, 10, 11].includes(handValue)))

  const maxHands = rules.splits === 'none' ? 1
    : rules.splits === 'once' ? 2
    : rules.splits === 'twice' ? 3
    : 4

  const canSplit = hand.cards.length === 2 &&
    calculateHandValue([hand.cards[0]]) === calculateHandValue([hand.cards[1]]) &&
    chips >= hand.bet &&
    rules.splits !== 'none' &&
    playerHands.length < maxHands

  const canSurrender = rules.surrender === 'late' &&
    hand.cards.length === 2 &&
    !hand.isStood

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5 flex-wrap justify-center">
        <button onClick={() => onAction({ type: 'hit' })} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded cursor-pointer">Hit</button>
        <button onClick={() => onAction({ type: 'stand' })} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded cursor-pointer">Stand</button>
      </div>
      {(canDouble || canSplit || canSurrender) && (
        <div className="flex gap-1.5 flex-wrap justify-center">
          {canDouble && (
            <button onClick={() => onAction({ type: 'double' })} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded cursor-pointer">Double</button>
          )}
          {canSplit && (
            <button onClick={() => onAction({ type: 'split' })} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded cursor-pointer">Split</button>
          )}
          {canSurrender && (
            <button onClick={() => onAction({ type: 'surrender' })} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded cursor-pointer">Surrender</button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: No new errors from ActionButtons (PlayerPosition still has old props — that's fine, will fix next task).

**Note:** PlayerPosition will have type errors because it passes old props. Don't worry — Task 10 fixes it.

- [ ] **Step 3: Commit**

```bash
git add src/components/Table/ActionButtons.tsx
git commit -m "feat: make ActionButtons rules-aware with surrender, insurance, split/double fixes"
```

---

### Task 10: PlayerPosition — thread rules, phase, dealer upcard, onTimeout

**Files:**
- Modify: `src/components/Table/PlayerPosition.tsx`

- [ ] **Step 1: Update PlayerPosition to pass new props to ActionButtons**

Replace the entire contents of `src/components/Table/PlayerPosition.tsx`:

```typescript
import type { PlayerState, GamePhase, GameRules } from '../../engine/types'
import { PlayerAvatar } from '../Shared/PlayerAvatar'
import { CardHand } from './CardHand'
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
  rules: GameRules
  dealerUpcard: string | null
}

export function PlayerPosition({ player, isCurrentTurn, isLocalPlayer, phase, turnTimeLimit, turnStartedAt, onAction, rules, dealerUpcard }: Props) {
  const canAct = isCurrentTurn && isLocalPlayer && (phase === 'playing' || phase === 'insurance')

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
          {turnTimeLimit > 0 && turnStartedAt && phase === 'playing' && (
            <TurnTimer
              timeLimit={turnTimeLimit}
              startedAt={turnStartedAt}
              onTimeout={() => onAction({ type: 'stand' })}
            />
          )}
          <ActionButtons
            hand={player.hands[player.activeHandIndex]}
            chips={player.chips}
            onAction={onAction}
            rules={rules}
            handIndex={player.activeHandIndex}
            playerHands={player.hands}
            phase={phase}
            dealerUpcard={dealerUpcard}
          />
        </div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/PlayerPosition.tsx
git commit -m "feat: thread rules, phase, dealerUpcard to ActionButtons; enable insurance phase actions"
```

---

### Task 11: TurnTimer — add onTimeout prop

**Files:**
- Modify: `src/components/Table/TurnTimer.tsx`

- [ ] **Step 1: Add onTimeout callback**

Replace the entire contents of `src/components/Table/TurnTimer.tsx`:

```typescript
import { useState, useEffect, useRef } from 'react'

type Props = {
  timeLimit: number
  startedAt: number
  onTimeout?: () => void
}

export function TurnTimer({ timeLimit, startedAt, onTimeout }: Props) {
  const [remaining, setRemaining] = useState(timeLimit)
  const firedRef = useRef(false)
  const pct = (remaining / timeLimit) * 100

  useEffect(() => {
    firedRef.current = false
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      const left = Math.max(0, timeLimit - elapsed)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(interval)
        if (!firedRef.current && onTimeout) {
          firedRef.current = true
          onTimeout()
        }
      }
    }, 100)
    return () => clearInterval(interval)
  }, [timeLimit, startedAt, onTimeout])

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

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/TurnTimer.tsx
git commit -m "feat: add onTimeout callback to TurnTimer for auto-stand"
```

---

### Task 12: RoundResult — per-hand results, correct labels

**Files:**
- Modify: `src/components/Table/RoundResult.tsx`

- [ ] **Step 1: Fix RoundResult to show per-hand results with correct labels**

Replace the entire contents of `src/components/Table/RoundResult.tsx`:

```typescript
import { motion, AnimatePresence } from 'framer-motion'
import type { HandState } from '../../engine/types'
import { evaluateHand } from '../../engine'

type Props = {
  hands: HandState[]
  visible: boolean
}

function handLabel(hand: HandState): string {
  if (hand.isSurrendered) return 'SURRENDER'
  if (hand.result === 'blackjack') return 'BLACKJACK!'
  if (hand.result === 'win') return 'WIN!'
  if (hand.result === 'push') return 'PUSH'
  if (hand.result === 'lose') {
    const ev = evaluateHand(hand.cards)
    return ev.isBust ? 'BUST' : 'LOSE'
  }
  return ''
}

function handColor(hand: HandState): string {
  if (hand.result === 'blackjack') return 'text-gold'
  if (hand.result === 'win') return 'text-green-400'
  if (hand.result === 'push' || hand.isSurrendered) return 'text-gray-400'
  if (hand.result === 'lose') return 'text-red-400'
  return 'text-white'
}

export function RoundResult({ hands, visible }: Props) {
  const hasResult = hands.some(h => h.result && h.result !== 'pending')

  return (
    <AnimatePresence>
      {visible && hasResult && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="text-center py-4"
        >
          {hands.length === 1 ? (
            <div>
              <span className={`text-4xl font-black drop-shadow-lg ${handColor(hands[0])}`}>
                {handLabel(hands[0])}
              </span>
              {hands[0].payout > 0 && (
                <span className="block text-lg text-gold mt-1">+{hands[0].payout + hands[0].bet}</span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {hands.map((hand, i) => (
                <div key={i} className={`text-2xl font-black drop-shadow-lg ${handColor(hand)}`}>
                  Hand {i + 1}: {handLabel(hand)}
                  {hand.payout > 0 && (
                    <span className="text-gold text-base ml-2">+{hand.payout + hand.bet}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/RoundResult.tsx
git commit -m "feat: show per-hand results with correct labels (BUST vs LOSE, SURRENDER)"
```

---

### Task 13: TablePage — insurance phase, reshuffle, timer, game over, thread rules

**Files:**
- Modify: `src/components/Table/TablePage.tsx`
- Modify: `src/hooks/useGameSync.ts` (timer enforcement)

- [ ] **Step 1: Update TablePage with all new features**

Replace the entire contents of `src/components/Table/TablePage.tsx`:

```typescript
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameSync } from '../../hooks/useGameSync'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import { TableFelt } from './TableFelt'
import { DealerArea } from './DealerArea'
import { PlayerPosition } from './PlayerPosition'
import { RoundResult } from './RoundResult'
import { Button } from '../Shared/Button'
import { updateGameDoc } from '../../firebase/games'
import { dealInitialHands, allBetsPlaced, needsReshuffle } from '../../engine'

export function TablePage() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const { game, isHost, setRoomCode } = useGameStore()
  const { user } = useAuthStore()
  const { submitAction, submitBet } = useGameSync()
  const navigate = useNavigate()
  const [notFound, setNotFound] = useState(false)
  const [showReshuffle, setShowReshuffle] = useState(false)
  const prevRoundRef = useRef(game?.roundNumber)

  useEffect(() => {
    if (paramCode) setRoomCode(paramCode.toUpperCase())
  }, [paramCode, setRoomCode])

  useEffect(() => {
    if (game === null && paramCode) {
      const timer = setTimeout(() => setNotFound(true), 3000)
      return () => clearTimeout(timer)
    } else {
      setNotFound(false)
    }
  }, [game, paramCode])

  useEffect(() => {
    if (game && prevRoundRef.current !== undefined && game.roundNumber !== prevRoundRef.current) {
      if (needsReshuffle(game.shoe, game.rules.decks)) {
        setShowReshuffle(true)
        const timer = setTimeout(() => setShowReshuffle(false), 2000)
        return () => clearTimeout(timer)
      }
    }
    prevRoundRef.current = game?.roundNumber
  }, [game])

  useEffect(() => {
    if (game?.gameOver) {
      const timer = setTimeout(() => navigate('/'), 5000)
      return () => clearTimeout(timer)
    }
  }, [game?.gameOver, navigate])

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400">Game not found or has ended.</p>
          <Button onClick={() => navigate('/')}>Back to Lobby</Button>
        </div>
      </div>
    )
  }

  if (!game) return <div className="min-h-screen flex items-center justify-center"><p className="text-white text-lg">Loading game...</p></div>
  if (!user) return <div className="min-h-screen flex items-center justify-center"><p className="text-white text-lg">Connecting...</p></div>

  const localPlayer = game.players.find((p) => p.id === user.uid)
  const isBetting = game.phase === 'betting'
  const allBet = allBetsPlaced(game)
  const dealerUpcard = game.dealerHand.length > 0 ? game.dealerHand[0].rank : null

  async function handleStartRound() {
    if (!game || !isHost) return
    const dealt = dealInitialHands(game)
    await updateGameDoc(game.id, { ...dealt, shoe: dealt.shoe as any, players: dealt.players })
  }

  return (
    <TableFelt>
      <div className="h-full flex flex-col">
        {showReshuffle && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gold/90 text-gray-900 font-bold px-6 py-2 rounded-lg z-10 animate-pulse">
            Reshuffling...
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-3">
          <div className="text-gold text-sm font-mono">Round {game.roundNumber}</div>
          <div className="text-white text-sm">Room: {game.id}</div>
          <div className="text-gray-400 text-sm">{game.players.length} players</div>
        </div>

        <DealerArea
          dealerHand={game.dealerHand}
          showHoleCard={game.phase === 'dealer' || game.phase === 'settlement' || game.phase === 'round_end'}
          phase={game.phase}
        />

        <RoundResult hands={localPlayer?.hands ?? []} visible={game.phase === 'round_end'} />

        {game.gameOver && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-3xl font-black text-red-400">Game Over</p>
              <p className="text-gray-400">All players have busted out.</p>
              <Button onClick={() => navigate('/')}>Back to Lobby</Button>
            </div>
          </div>
        )}

        {!game.gameOver && (
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
                rules={game.rules}
                dealerUpcard={dealerUpcard}
              />
            ))}
          </div>
        )}

        {game.phase === 'insurance' && isHost && (
          <div className="flex justify-center pb-4">
            <p className="text-gold text-sm">Waiting for insurance decisions...</p>
          </div>
        )}

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

- [ ] **Step 2: Add timer auto-stand logic to useGameSync**

In `src/hooks/useGameSync.ts`, add a timer enforcement effect. Add after the subscription `useEffect` (after line 19):

```typescript
  useEffect(() => {
    if (!game || !isHost || !user) return
    if (game.phase !== 'playing') return
    if (game.currentTurn < 0) return
    if (!game.turnStartedAt || game.turnTimeLimit <= 0) return

    const currentPlayer = game.players[game.currentTurn]
    if (!currentPlayer) return

    const elapsed = Date.now() - game.turnStartedAt
    const remaining = game.turnTimeLimit * 1000 - elapsed
    if (remaining <= 0) return

    const timer = setTimeout(async () => {
      const current = useGameStore.getState().game
      if (!current || current.phase !== 'playing' || current.currentTurn !== game.currentTurn) return
      const updated = processAction(current, { type: 'stand', playerId: currentPlayer.id })
      await updateGameDoc(current.id, { ...updated, shoe: updated.shoe as any, players: updated.players })
    }, remaining)

    return () => clearTimeout(timer)
  }, [game?.currentTurn, game?.turnStartedAt, game?.turnTimeLimit, game?.phase, isHost, user])
```

Also import `processAction` at the top (it's already imported, just verify).

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: No new errors (some pre-existing warnings about `as any` may persist — that's fine).

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/TablePage.tsx src/hooks/useGameSync.ts
git commit -m "feat: add insurance phase, reshuffle indicator, timer auto-stand, game over to TablePage"
```

---

### Task 14: DealerArea — insurance badge, blackjack badge

**Files:**
- Modify: `src/components/Table/DealerArea.tsx`

- [ ] **Step 1: Add insurance and blackjack visual indicators**

Replace the entire contents of `src/components/Table/DealerArea.tsx`:

```typescript
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
  const ev = dealerHand.length > 0 ? evaluateHand(showHoleCard ? dealerHand : [dealerHand[0]]) : null
  const dealerBJ = dealerHand.length === 2 && evaluateHand(dealerHand).isBlackjack

  return (
    <div className="flex flex-col items-center py-6">
      <div className="flex items-center gap-4 mb-2">
        <PlayerAvatar name="Dealer" seat={6} size="lg" />
        <span className="text-gold font-semibold text-lg">Dealer</span>
      </div>
      {phase === 'insurance' && (
        <div className="bg-gold/20 text-gold text-xs font-bold px-2 py-0.5 rounded mb-2">
          INSURANCE
        </div>
      )}
      {(phase === 'settlement' || phase === 'round_end') && dealerBJ && (
        <div className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded mb-2">
          BLACKJACK
        </div>
      )}
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

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/DealerArea.tsx
git commit -m "feat: add insurance and blackjack badges to DealerArea"
```

---

### Task 15: CreateGameForm — room code collision check

**Files:**
- Modify: `src/components/Lobby/CreateGameForm.tsx`

- [ ] **Step 1: Add Firestore collision check**

In `src/components/Lobby/CreateGameForm.tsx`, update the imports (add `getGameDoc`):

```typescript
import { createGameDoc, getGameDoc } from '../../firebase/games'
```

Then replace the `handleCreate` function (lines 34-55) with:

```typescript
  async function handleCreate() {
    if (!user) return
    setCreating(true)

    let code = ''
    let attempts = 0
    let exists = true
    while (exists && attempts < 3) {
      code = generateRoomCode()
      const existing = await getGameDoc(code)
      if (!existing) exists = false
      attempts++
    }
    if (exists) {
      setCreating(false)
      return
    }

    let game = createGame(code, user.uid, rules)
    game = addPlayer(game, {
      id: user.uid,
      name: displayName,
      seat: 0,
      hands: [],
      activeHandIndex: 0,
      chips: rules.startingChips,
      isActive: true,
      insuranceBet: 0,
      insuranceDecided: false,
    })
    await createGameDoc(game)
    setGame(game)
    setRoomCode(code)
    setIsHost(true)
    setView('waiting')
    setCreating(false)
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Lobby/CreateGameForm.tsx
git commit -m "feat: check for room code collision with Firestore before creating game"
```

---

### Task 16: Dead code cleanup — uiStore, useSound wiring

**Files:**
- Modify: `src/stores/uiStore.ts`
- Modify: `src/stores/gameStore.ts`

- [ ] **Step 1: Remove `currentView: 'table'` from uiStore**

`src/stores/uiStore.ts` — `'table'` is never used (React Router handles table navigation). Remove it from the type:

```typescript
import { create } from 'zustand'

type UIState = {
  soundEnabled: boolean
  toggleSound: () => void
  currentView: 'lobby' | 'waiting'
  setView: (view: 'lobby' | 'waiting') => void
}

export const useUIStore = create<UIState>((set) => ({
  soundEnabled: false,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  currentView: 'lobby',
  setView: (view) => set({ currentView: view }),
}))
```

- [ ] **Step 2: Keep isSyncing in gameStore but wire it up**

`src/stores/gameStore.ts` — `isSyncing` is a legitimate field that should be used. Keep it. In `useGameSync.ts`, set `isSyncing` to `true` when subscribing and `false` on errors. This is a bonus but not blocking — leave the store as-is for now. No change needed.

- [ ] **Step 3: Verify sound already gated by soundEnabled**

Check `src/hooks/useSound.ts` — line 17 already has `if (!soundEnabled) return`. It's already correctly gated. No change needed.

- [ ] **Step 4: Commit**

```bash
git add src/stores/uiStore.ts
git commit -m "chore: remove unused table view from uiStore"
```

---

### Task 17: Bet concurrency — two-phase bet intent subcollection

**Files:**
- Modify: `src/firebase/games.ts`
- Modify: `src/hooks/useGameSync.ts`

- [ ] **Step 1: Add bet intent Firestore services**

In `src/firebase/games.ts`, add after the existing exports:

```typescript
import { collection, addDoc, deleteDoc, query, serverTimestamp } from 'firebase/firestore'

export function betIntentsCollection(gameId: string) {
  return collection(db, COLLECTION, gameId.toUpperCase(), 'bets')
}

export async function submitBetIntent(gameId: string, playerId: string, amount: number): Promise<void> {
  await addDoc(betIntentsCollection(gameId), {
    playerId,
    amount,
    timestamp: serverTimestamp(),
  })
}
```

Also add `query` to the existing import at line 2 (it already has `onSnapshot`, `serverTimestamp` etc.). Update the import line:

```typescript
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot,
  collection, addDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
```

- [ ] **Step 2: Update useGameSync to use bet intents**

In `src/hooks/useGameSync.ts`, add these imports at the top alongside existing imports:

```typescript
import { collection, onSnapshot as fsOnSnapshot, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
```

Update the games import to include `submitBetIntent`:

```typescript
import { subscribeToGame, updateGameDoc, submitBetIntent } from '../firebase/games'
```

Replace the `submitBet` function with:

```typescript
  async function submitBet(playerId: string, amount: number) {
    if (!game) return
    await submitBetIntent(game.id, playerId, amount)
  }
```

Add this host bet-intent listener effect after the subscription `useEffect`:

```typescript
  useEffect(() => {
    if (!roomCode || !isHost) return
    const betsCol = collection(db, 'games', roomCode.toUpperCase(), 'bets')
    const unsub = fsOnSnapshot(betsCol, async (snapshot) => {
      const current = useGameStore.getState().game
      if (!current) return
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const data = change.doc.data()
          try {
            let updated = setPlayerBet(current, data.playerId, data.amount)
            await updateGameDoc(roomCode, { players: updated.players })
            if (allBetsPlaced(updated)) {
              const dealt = dealInitialHands(updated)
              await updateGameDoc(roomCode, { ...dealt, shoe: dealt.shoe as any, players: dealt.players })
            }
          } catch (e) {
            // Ignore duplicate/invalid bets
          }
          deleteDoc(change.doc.ref).catch(() => {})
        }
      }
    })
    return () => unsub()
  }, [roomCode, isHost])
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/firebase/games.ts src/hooks/useGameSync.ts
git commit -m "feat: two-phase bet submission via Firestore subcollection for concurrency safety"
```

---

### Task 18: Player disconnect tracking

**Files:**
- Modify: `src/hooks/useGameSync.ts`
- Modify: `src/components/Table/PlayerPosition.tsx`

- [ ] **Step 1: Add disconnect tracking to useGameSync**

In `src/hooks/useGameSync.ts`, add a `lastActionAt` tracking effect. After the subscription `useEffect`, add:

```typescript
  useEffect(() => {
    if (!game || !isHost) return
    if (game.phase !== 'playing') return
    const currentPlayer = game.players[game.currentTurn]
    if (!currentPlayer) return

    const now = Date.now()
    const lastActionAt = { ...game.lastActionAt, [currentPlayer.id]: now }
    if (JSON.stringify(lastActionAt) !== JSON.stringify(game.lastActionAt)) {
      updateGameDoc(game.id, { lastActionAt } as any)
    }
  }, [game?.currentTurn, game?.phase, isHost])
```

In `src/components/Table/PlayerPosition.tsx`, update the `canAct` logic to handle inactive players (no new import needed):

```typescript
  const canAct = isCurrentTurn && isLocalPlayer && (phase === 'playing' || phase === 'insurance') && player.isActive !== false
```

Add an "Away" badge for inactive players in the UI, right after the name display (after line 33 in current PlayerPosition):

```typescript
      {player.isActive === false && (
        <span className="text-gray-500 text-xs ml-2">(Away)</span>
      )}
```

In `useGameSync.ts`, after the timer auto-stand `setTimeout`, also mark the player as inactive after 2 consecutive timeouts. Add this inside the timer auto-stand effect (Task 13 Step 2), just after the auto-stand `processAction` call:

```typescript
      const timeoutCount = (current.lastActionAt?.[currentPlayer.id + '_timeouts'] || 0) + 1
      const lastActionPatch: Record<string, any> = {
        lastActionAt: { ...current.lastActionAt, [currentPlayer.id + '_timeouts']: timeoutCount }
      }
      if (timeoutCount >= 2) {
        const marked = {
          ...updated,
          players: updated.players.map((p: any) =>
            p.id === currentPlayer.id ? { ...p, isActive: false } : p
          ),
          ...lastActionPatch,
        }
        await updateGameDoc(current.id, { ...marked, shoe: marked.shoe as any, players: marked.players })
      } else {
        await updateGameDoc(current.id, { ...updated, ...lastActionPatch, shoe: updated.shoe as any, players: updated.players })
      }
```

Wait — this is getting too complex to embed in the timer code. Let me simplify the approach. Instead, just add the visual "Away" badge in PlayerPosition and track `lastActionAt` timestamp. The engine already skips inactive players in `getNextActivePlayer` via the `isActive` check (it checks `p.isActive` but the current code doesn't use it for filtering — it uses `activeHand` checks). 

Simpler approach: Update `getNextActivePlayer` in `actions.ts` to also check `p.isActive`:

In `src/engine/actions.ts`, in the `getNextActivePlayer` function, change the condition from:
```typescript
    const activeHand = p.hands[p.activeHandIndex]
    if (activeHand && !activeHand.isStood && !activeHand.isSurrendered) {
```
to:
```typescript
    if (!p.isActive) continue
    const activeHand = p.hands[p.activeHandIndex]
    if (activeHand && !activeHand.isStood && !activeHand.isSurrendered) {
```

Then in the timer auto-stand code in `useGameSync.ts` (from Task 13 Step 2), after the auto-stand, check consecutive timeouts and mark inactive. Replace the timer effect body with:

```typescript
    const timer = setTimeout(async () => {
      const current = useGameStore.getState().game
      if (!current || current.phase !== 'playing' || current.currentTurn !== game.currentTurn) return
      const updated = processAction(current, { type: 'stand', playerId: currentPlayer.id })

      const timeoutKey = currentPlayer.id + '_timeouts'
      const prevTimeouts = (current.lastActionAt?.[timeoutKey] as number) || 0
      const newTimeouts = prevTimeouts + 1
      const lastActionPatch = {
        lastActionAt: { ...current.lastActionAt, [timeoutKey]: newTimeouts }
      }

      if (newTimeouts >= 2) {
        const marked = {
          ...updated,
          players: updated.players.map((p) =>
            p.id === currentPlayer.id ? { ...p, isActive: false } : p
          ),
          ...lastActionPatch,
        }
        await updateGameDoc(current.id, { ...marked, shoe: marked.shoe as any, players: marked.players })
      } else {
        await updateGameDoc(current.id, { ...updated, ...lastActionPatch, shoe: updated.shoe as any, players: updated.players })
      }
    }, remaining)
```

- [ ] **Step 2: Run all engine tests to verify getNextActivePlayer change**

Run: `npx vitest run`
Expected: All tests pass (existing tests don't touch isActive filtering directly).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGameSync.ts src/engine/actions.ts src/components/Table/PlayerPosition.tsx
git commit -m "feat: add disconnect tracking - mark inactive after 2 timeouts, skip in turn logic, Away badge"
```

---

### Task 19: Final verification — tests + build + cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run all engine tests**

Run: `npx vitest run`
Expected: All tests pass (48+ tests).

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: TypeScript + Vite build succeeds with no errors.

- [ ] **Step 3: Update memory.md with resolved issues**

In `src/memory.md` (wait, it's `memory.md` at root), update the "Known Issues / TODOs" section to reflect what was fixed. Replace lines 74-84:

```markdown
## Known Issues / TODOs

1. ~~**Concurrency** — Multiple players betting simultaneously can overwrite each other.~~ Fixed: Two-phase bet submission via `games/{code}/bets/{playerId}` subcollection.
2. ~~**Double down rules** — Engine doesn't enforce `doubleDown` config (`9-10-11` / `none`).~~ Fixed: Engine checks rule and UI gates button visibility.
3. ~~**Insurance flow** — Insurance phase transitions but no UI or engine logic.~~ Fixed: Full engine handling + UI insurance prompt.
4. ~~**Surrender button** — Not shown in UI even when surrender rules allow it.~~ Fixed: ActionButtons shows surrender when `rules.surrender === 'late'`.
5. ~~**Split 10-value pairs** — ActionButtons checks raw rank equality (8==8), not value equality (K==Q).~~ Fixed: Uses `calculateHandValue` for value comparison.
6. ~~**Turn timer auto-stand** — Timer counts down but doesn't auto-stand.~~ Fixed: `onTimeout` callback auto-submits stand action.
7. **Player disconnect** — No handling for players leaving mid-game. Partially addressed: `lastActionAt` tracking added to types, but full disconnect handling needs presence system.
8. ~~**0-chip players** — Can stay in game but can't bet; no removal logic.~~ Fixed: `startNewRound` removes 0-chip players, `gameOver` when all bust.
9. ~~**Round result labels** — `lose` shown as "BUST" for all losses.~~ Fixed: Shows "BUST" only for actual busts, "LOSE" otherwise, per-hand display.
```

**Note:** Keep *before* the update so the commit shows what was fixed.

Run: `git add memory.md && git commit -m "docs: update memory.md with resolved issues"`

- [ ] **Step 4: Commit final state if any pending changes**

```bash
git status
git add -A
git commit -m "chore: final integration and dead code cleanup"
```

---

## Verification Checklist

After all tasks complete, verify:

```bash
npx vitest run        # All 48+ engine tests pass
npm run build         # Production build succeeds
```

Then manually test in dev:
1. `npm run dev` → Create game with surrender:late → see Surrender button
2. Create game with double:9-10-11 → Double button only on 9/10/11 value hands
3. Create game with insurance:on → see insurance prompt on dealer Ace
4. Split K+Q → split allowed
5. Player bets 0 chips → removed next round
