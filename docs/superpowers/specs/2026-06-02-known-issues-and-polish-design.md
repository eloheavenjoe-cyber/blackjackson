# Blackjackson — Known Issues Fix & Polish Design

**Date:** 2026-06-02
**Approach:** Engine-first, UI-follow (Approach A)
**Scope:** All 9 known issues from memory.md + additional gaps discovered during exploration. Mobile polish excluded.

---

## 1. Architecture

No new files, no new dependencies, no Firestore schema migration needed. Changes follow existing patterns:

- **Engine**: Pure functions `(state) => newState`, all in `src/engine/`
- **UI**: React components in `src/components/`, Zustand stores in `src/stores/`
- **Hooks**: `useGameSync` in `src/hooks/`
- **Firestore**: Same `games/{roomCode}` document. Bet intents use new subcollection `games/{code}/bets/{playerId}` for concurrency fix.

Flow: Host browser runs engine → writes to Firestore → all clients sync via `onSnapshot`.

---

## 2. Engine Changes

### 2.1 `actions.ts` — Action Processing

**Double-down rule enforcement:**

In `case 'double'`, before allowing the action, check `state.rules.doubleDown`:
- `'none'` — throw error ("Double down is not allowed in this game")
- `'9-10-11'` — require `evaluateHand(hand.cards).value` to be 9, 10, or 11; otherwise throw
- `'any'` — allow (current behavior)
- Also reject if `hand.cards.length !== 2` (first-action-only guard; already partially exists)

**Surrender first-action guard:**

In `case 'surrender'`, reject if `hand.cards.length !== 2` — prevents hitting then surrendering.

**Insurance action handlers:**

Add `case 'insurance_yes'`:
- Require phase === `'insurance'`
- Deduct `Math.floor(hand.bet / 2)` from `player.chips`
- Set `player.insuranceBet = Math.floor(hand.bet / 2)`
- Mark player as having made insurance decision (via new `insuranceDecided` check)
- If all players decided, call `resolveInsurance(state)`

Add `case 'insurance_no'`:
- Require phase === `'insurance'`
- Set `player.insuranceBet = 0`
- Mark player as decided
- If all players decided, call `resolveInsurance(state)`

**New function `resolveInsurance(state: GameState): GameState`:**
- Check if dealer has blackjack (dealerHand value === 21 with exactly 2 cards)
- If dealer BJ: pay each player `insuranceBet * 2` (receive back insurance bet + 2:1 payout), then transition to `'settlement'`
- If no dealer BJ: insurance bets are lost (already deducted, no further action), transition to `'playing'` with `currentTurn: 0`
- If dealer BJ and no players took insurance: straight to `'settlement'`

**Split `'unlimited'` cap:**

- Change max hands cap from 4 to 4 for `'unlimited'` (same as `'twice'` — practical limit given 6 seats). Document that "unlimited" means up to 4 hands total per player.

**Split hand navigation fix:**

Add function `advanceHand(state: GameState): GameState`:
- After completing a hand (stood/busted/surrendered), advance `player.activeHandIndex`
- If more hands remain for this player, set `currentTurn` to same player index
- If all hands complete for this player (activeHandIndex >= hands.length), advance to next player via existing `getNextActivePlayer`
- Integrate into hit→bust, stand, double, surrender paths

### 2.2 `dealing.ts` — Dealer Blackjack Detection

Fix dealer Ace-up blackjack check:

```
After initial deal:
  if dealer upcard === Ace:
    evaluate both dealer cards
    if dealer has blackjack AND insurance is enabled:
      → phase: 'insurance'
    if dealer has blackjack AND insurance is disabled:
      → phase: 'settlement' (skip playing entirely)
    if dealer does NOT have blackjack AND insurance is enabled:
      → phase: 'insurance'
    if dealer does NOT have blackjack AND insurance is disabled:
      → phase: 'playing'
  if dealer upcard === 10-value (J/Q/K/10):
    evaluate both dealer cards
    if dealer has blackjack:
      → phase: 'settlement'
    else:
      → phase: 'playing'
  else:
    → phase: 'playing'
```

Replaces current logic which only checks 10-up + Ace hole, and never checks Ace-up + 10 hole when insurance is off.

### 2.3 `settlement.ts` — Insurance Payouts

After `settleHands()` completes, add `settleInsurance(state: GameState): GameState`:
- If dealer has blackjack, each player receives `insuranceBet + insuranceBet * 2` added back to chips (total 3x insurance bet returned)
- If no dealer blackjack, insurance bets are already lost (deducted at insurance decision time) — no-op
- Called only when phase transitions through `'settlement'`

### 2.4 `game.ts` — Lifecycle Fixes

**`setPlayerBet` guard:**
- Reject if `state.phase !== 'betting'`
- Reject if player already has `hands[0].bet > 0` (prevent double-deduct)

**`startNewRound`:**
- Call `needsReshuffle(state.shoe, state.rules.decks)` before starting
- If needed, call `reshuffleDiscard(state.discard)` → assign to `state.shoe`, clear `state.discard`
- Remove players with `chips <= 0` from `state.players`, add to `state.removedPlayers[]`
- If no players remain (all busted), set `gameOver: true` on state (new optional field)

**`PlayerState` type addition** (in `types.ts`):
- `insuranceDecided?: boolean` — tracks whether the player has made an insurance decision. Defaults to `false`. Set to `true` on both `insurance_yes` and `insurance_no`. This is needed because `insuranceBet = 0` is ambiguous (both the initial value and "declined" mean 0).

**New function `allInsuranceDecided(state): boolean`:**
- True when every player has `insuranceDecided === true`

**`GameState` type additions** (in `types.ts`):
- `removedPlayers?: { id: string; name: string; reason: 'bust' | 'kicked' | 'disconnected' }[]`
- `lastActionAt?: Record<string, number>` — timestamp per player ID
- `gameOver?: boolean`

---

## 3. UI Changes

### 3.1 `ActionButtons.tsx` — Rules-Aware Buttons

New props: `rules: GameRules`, `handIndex: number`, `playerHands: HandState[]`, `chips: number`, `onAction`, `phase: GamePhase`, `dealerUpcard: string | null` (derived from `dealerHand[0]?.rank`, null if no dealer card yet).

**Surrender button:**
- Visible when `rules.surrender === 'late'` and `hand.cards.length === 2` and `phase === 'playing'`
- Styled: ghost/danger variant, label "SURRENDER"
- Emits `{ type: 'surrender' }`

**Split button:**
- Change from `hand.cards[0].rank === hand.cards[1].rank` to `calculateHandValue([hand.cards[0]]) === calculateHandValue([hand.cards[1]])`
- Also gate by `rules.splits !== 'none'` and `playerHands.length < maxSplits`
- `maxSplits` mapping: `'none'→1, 'once'→2, 'twice'→3, 'unlimited'→4`

**Double button:**
- Gate by `rules.doubleDown`:
  - `'none'` → hidden
  - `'9-10-11'` → visible only when `evaluateHand(hand.cards).value` is 9, 10, or 11
  - `'any'` → always visible (if cards === 2 and chips ok)

**Insurance buttons:**
- Visible when `phase === 'insurance'` and `dealerUpcard === 'A'`
- Two buttons: "Insure" (primary), "Decline" (secondary)
- Emit `{ type: 'insurance_yes' }` / `{ type: 'insurance_no' }`
- Each player only sees their own insurance prompt

**Layout:** Two rows — primary actions (Hit, Stand) top row, secondary (Double, Split, Surrender) bottom row. Insurance replaces both rows when phase is insurance.

### 3.2 `PlayerPosition.tsx`

New prop: `rules: GameRules`. Pass through to `ActionButtons` and wire into `TurnTimer` timeout.

### 3.3 `TurnTimer.tsx`

New prop: `onTimeout?: () => void`. When `remaining <= 0`, call `onTimeout()` exactly once (guard with ref to prevent re-invocation). If `timeLimit === 0`, never shows (no timer).

### 3.4 `RoundResult.tsx`

**Fix per-hand results:** Instead of only `hands[0]`, map all hands and show result per hand:
```
  Hand 1: WIN +200
  Hand 2: LOSE
```

**Fix label mapping:**
- `'win'` → "WIN"
- `'lose'` → show "BUST" only if `hand.cards` evaluate to bust; otherwise "LOSE"
- `'push'` → "PUSH"
- `'blackjack'` → "BLACKJACK"
- `'pending'` → no display

Show "SURRENDER" if `hand.isSurrendered`.

### 3.5 `TablePage.tsx`

**Insurance phase:**
- When `phase === 'insurance'`, pass phase and dealer upcard to `PlayerPosition`
- No separate modal — insurance UI integrated into player's action area

**Shoe reshuffle indicator:**
- When `needsReshuffle(game.shoe, game.rules.decks)` is true, show a brief toast/overlay: "Reshuffling..."
- Triggered on round start detection via `roundNumber` change

**Timer enforcement:**
- In the `useEffect` that monitors `game`, set a `setTimeout` for `turnStartedAt + turnTimeLimit * 1000 - Date.now()`
- On expiry, call `submitAction({ type: 'stand', playerId })` for the current turn player
- Only on the host browser (single source of truth for timeout)

**Thread rules:**
- Pass `game.rules` as prop to `PlayerPosition`

**Game over:**
- When `game.gameOver === true`, show "Game Over" overlay with final standings, redirect to lobby after delay

### 3.6 `DealerArea.tsx`

- When phase is `'insurance'` and dealer upcard is Ace, show a gold "INSURANCE" badge
- When dealer reveals blackjack (settlement phase), show "BLACKJACK" in gold

### 3.7 Lobby

**`CreateGameForm.tsx`:**
- After generating room code, check Firestore `games/{code}` exists; if so, regenerate (max 3 attempts)
- Error if all attempts collide (edge case, virtually impossible with 6-char alphanumeric)

### 3.8 Dead Code Cleanup

- `uiStore.ts`: Remove `currentView: 'table'` variant (dead — Router handles navigation)
- `gameStore.ts`: Remove `isSyncing` if truly unused across all components (grep-verify first)
- `useSound.ts`: Gate sound effects behind `soundEnabled` from `uiStore`

---

## 4. Concurrency & Player Management

### 4.1 Bet Concurrency

**Problem:** Multiple players writing `setPlayerBet` to same `games/{code}` document can overwrite each other.

**Solution:** Two-phase bet submission:

1. **Client writes bet intent** to `games/{code}/bets/{playerId}` (Firestore subcollection document with `{ amount, timestamp }`)
2. **Host's `onSnapshot`** detects new bet intent → calls engine's `setPlayerBet()` locally → writes single authoritative `games/{code}` document
3. **All clients** read authoritative state from `games/{code}` via existing subscription

New Firestore function: `submitBetIntent(code, playerId, amount)` — writes to subcollection.
Modification to `useGameSync`: instead of direct `setPlayerBet` + Firestore write, call `submitBetIntent()`. Host's subscription handler picks up bet intents and processes them.

Note: The existing `submitBet` in `useGameSync` is called during the betting phase. This change makes betting async — the UI should show "Bet placed, waiting..." until the authoritative state reflects the bet.

### 4.2 0-Chip Player Removal

- `startNewRound()` removes players with `chips <= 0`, adds to `removedPlayers[]`
- If `removedPlayers` includes the local player: show "Busted Out!" overlay, offer "Return to Lobby" button
- If `players` becomes empty: set `gameOver: true`, redirect all clients to lobby

### 4.3 Player Disconnect (Soft)

- Host tracks `lastActionAt[playerId]` — timestamp updated on any action submission
- If a player times out on their turn 2 consecutive rounds, mark `isActive = false`
- Inactive players are skipped in dealing phase (no cards dealt) and skipped in `getNextActivePlayer`
- UI shows inactive players with "Away" badge and dimmed avatar
- Host can manually mark players as active/inactive from waiting room (reuse existing kick mechanism)

---

## 5. Test Plan

### 5.1 Engine Tests (add to existing files)

| File | New Test Cases |
|------|---------------|
| `actions.test.ts` | Double `'none'` throws, double `'9-10-11'` on 8 throws, double `'9-10-11'` on 10 allows, surrender blocked after hit, insurance_yes deducts half bet, insurance_no sets zero, resolveInsurance pays 2:1 on dealer BJ, resolveInsurance confiscates on no BJ |
| `dealing.test.ts` | Dealer Ace-up + hole 10 → settlement (insurance off), dealer Ace-up + no BJ → insurance (insurance on) |
| `settlement.test.ts` | Insurance payout 2:1, insurance confiscation, dealer BJ vs player BJ push unaffected |
| `game.test.ts` | `setPlayerBet` re-bet rejection, `startNewRound` reshuffle, 0-chip removal, all players busted → gameOver |
| `hand.test.ts` | (no new tests needed) |

Minimum 8 new test cases. Target: 44+ total tests (up from 36).

### 5.2 UI Verification

Manual testing checklist (run `npm run dev` after changes):
- Create game with surrender: late → Surrender button appears, hit first → Surrender button gone
- Create game with double: `'none'` → no Double button, `'9-10-11'` → appears only on 9/10/11 value hands
- Create game with insurance: on → Insurance prompt on dealer Ace, decline → play continues
- Create game with insurance: on → Insurance prompt, accept → dealer BJ → 2:1 pays out
- Split K+Q → split allowed (value-based), split 8+8 → split allowed
- Split aces → auto-stand after one card each, activeHandIndex advances
- Non-ace split → complete first hand → activeHandIndex advances to second hand
- Timer reaches 0 → auto-stand fires (host side)
- 0-chip player → removed on next round start
- Room code collision → retries generation
- RoundResult shows per-hand results with correct labels
- Dead code: `isSyncing` references gone, `currentView: 'table'` removed

---

## 6. Verification

After all changes:
```bash
npx vitest run        # All engine tests pass
npm run build         # TypeScript + Vite production build succeeds
```
