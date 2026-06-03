# Table UI Cleanup — Chip Selector, Button Position, Chips on Felt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up table layout: move chip tray lower, fix action buttons clipping rim, show chips on table felt instead of accumulator container, sync to all players via Firestore.

**Architecture:** Add `pendingBets: Record<string, number>` to GameState synced via Firestore. Players increment/decrement their pending bet with `FieldValue.increment`. All clients render chip stacks on the felt. BettingArea simplifies to denom tray + Clear + Place Bet. Action buttons move to document flow below player info strip.

**Tech Stack:** React 19, TypeScript, Firestore Web SDK, Tailwind CSS v4, Zustand

---

### Task 1: Add `pendingBets` to GameState type

**Files:**
- Modify: `src/engine/types.ts`
- Modify: `src/engine/game.ts` (startNewRound clears pendingBets)

- [ ] **Step 1: Add `pendingBets` field to GameState**

In `src/engine/types.ts`, add to the `GameState` type:

```ts
export type GameState = {
  // ... existing fields ...
  lastActionAt?: Record<string, number>
  gameOver?: boolean
  pendingBets?: Record<string, number>
}
```

- [ ] **Step 2: Clear `pendingBets` in `startNewRound`**

In `src/engine/game.ts`, in `startNewRound`, add `pendingBets: {}` to the return objects to clear stale chip data across rounds.

For the `activePlayers.length === 0` return (game over):
```ts
return {
  ...state,
  phase: 'round_end' as const,
  shoe,
  discard,
  players: [],
  removedPlayers: newRemoved,
  gameOver: true,
  pendingBets: {},
}
```

For the normal return:
```ts
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
  pendingBets: {},
  players: activePlayers.map((p) => ({
    ...p,
    hands: [],
    activeHandIndex: 0,
    isActive: true,
    insuranceBet: 0,
    insuranceDecided: false,
  })),
}
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/engine/types.ts src/engine/game.ts
git commit -m "feat: add pendingBets to GameState and clear on new round"
```

---

### Task 2: Add Firestore increment helper

**Files:**
- Modify: `src/firebase/games.ts`

- [ ] **Step 1: Add `increment` import and helper function**

In `src/firebase/games.ts`, add `increment` to the firebase import and add the helper:

```ts
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot,
  collection, addDoc,
  increment,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
```

Add the helper function before the closing of the file:

```ts
export async function incrementPendingBet(
  gameId: string,
  playerId: string,
  delta: number,
): Promise<void> {
  await updateDoc(gameDoc(gameId), {
    [`pendingBets.${playerId}`]: increment(delta),
  } as any)
}

export async function clearPendingBet(
  gameId: string,
  playerId: string,
): Promise<void> {
  const snap = await getDoc(gameDoc(gameId))
  if (!snap.exists()) return
  const data = snap.data()
  const pendingBets = data.pendingBets || {}
  delete pendingBets[playerId]
  await updateDoc(gameDoc(gameId), { pendingBets } as any)
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/firebase/games.ts
git commit -m "feat: add incrementPendingBet and clearPendingBet helpers"
```

---

### Task 3: Add pending bet functions to useGameSync

**Files:**
- Modify: `src/hooks/useGameSync.ts`

- [ ] **Step 1: Import new Firestore helpers**

Add imports at top of `src/hooks/useGameSync.ts`:

```ts
import { subscribeToGame, updateGameDoc, submitBetIntent, getGameDoc, incrementPendingBet, clearPendingBet } from '../firebase/games'
```

- [ ] **Step 2: Add `addBetChip` and `clearBetChip` functions**

Add inside `useGameSync`, before the `submitAction` function:

```ts
async function addBetChip(value: number) {
  if (!game || !user) return
  await incrementPendingBet(game.id, user.uid, value)
}

async function clearBetChip() {
  if (!game || !user) return
  await clearPendingBet(game.id, user.uid)
}
```

- [ ] **Step 3: Update the bet intent listener to clear pendingBets**

In the bet intent processing useEffect (the `fsOnSnapshot` listener), after successfully calling `setPlayerBet` and writing the updated players, also clear `pendingBets` for that player. Add this after the `updateGameDoc` call inside the `if (change.type === 'added')` block:

```ts
let updated = setPlayerBet(current, data.playerId, data.amount)
await updateGameDoc(roomCode, { players: updated.players })
await clearPendingBet(roomCode, data.playerId)
```

- [ ] **Step 4: Return new functions from the hook**

Update the return statement:

```ts
return { submitAction, submitBet, scheduleNewRound, addBetChip, clearBetChip }
```

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useGameSync.ts
git commit -m "feat: add addBetChip and clearBetChip to useGameSync"
```

---

### Task 4: Simplify BettingArea — remove accumulator, move lower

**Files:**
- Modify: `src/components/Table/BettingArea.tsx`

- [ ] **Step 1: Rewrite BettingArea to use pending bets instead of local state**

Replace the entire file content. The new version has no local `chipStack` state, no `ChipArea` component, no `consolidateChips`. It accepts `pendingBet` from props and uses `onAddChip`/`onClear`/`onPlaceBet` callbacks:

```ts
import type { ChipValue } from './Chip'
import { Chip } from './Chip'
import { Button } from '../Shared/Button'

const allDenoms: ChipValue[] = [10, 25, 50, 100, 250, 500]

type Props = {
  chips: number
  minBet: number
  maxBet: number
  pendingBet: number
  onAddChip: (value: number) => void
  onClear: () => void
  onPlaceBet: (amount: number) => void
  alreadyBet: boolean
  currentBetAmount?: number
}

export function BettingArea({
  chips, minBet, maxBet, pendingBet,
  onAddChip, onClear, onPlaceBet,
  alreadyBet, currentBetAmount,
}: Props) {
  if (alreadyBet) {
    return (
      <div className="flex justify-center pt-20 pb-3">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur rounded-2xl px-5 py-3 border border-gold/20">
          <span className="text-gold/60 text-xs uppercase tracking-wider">Bet placed</span>
          <span className="text-white text-sm font-bold">{currentBetAmount}</span>
        </div>
      </div>
    )
  }

  if (chips < minBet) {
    return (
      <div className="flex justify-center pt-20 pb-3">
        <p className="text-gray-500 text-sm">Not enough chips to bet</p>
      </div>
    )
  }

  const canAfford = (v: number) => v <= chips && v + pendingBet <= maxBet && v + pendingBet <= chips

  return (
    <div className="pt-20 pb-3">
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-white text-xs cursor-pointer uppercase tracking-wider"
        >
          Clear
        </button>

        <span className="text-gold font-bold text-sm w-12 text-center">
          {pendingBet || '0'}
        </span>

        <div className="flex gap-1.5">
          {allDenoms.map((v) => (
            <Chip
              key={v}
              value={v}
              size="betting"
              onClick={canAfford(v) ? () => onAddChip(v) : undefined}
              dimmed={!canAfford(v)}
            />
          ))}
        </div>

        <Button onClick={() => onPlaceBet(pendingBet)} disabled={pendingBet < minBet} size="sm">
          Place Bet
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Extract and export ChipValue type from Chip.tsx**

In `src/components/Table/Chip.tsx`, extract the inline union from `ChipProps.value` into an exported type. Replace:

```ts
type ChipProps = {
  value: 10 | 25 | 50 | 100 | 250 | 500
```

With:

```ts
export type ChipValue = 10 | 25 | 50 | 100 | 250 | 500

type ChipProps = {
  value: ChipValue
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/BettingArea.tsx src/components/Table/Chip.tsx
git commit -m "feat: simplify BettingArea with pending bets from Firestore"
```

---

### Task 5: Render pending bet chips on table felt

**Files:**
- Modify: `src/components/Table/TablePage.tsx`

- [ ] **Step 1: Import ChipStack**

Add import at top of `src/components/Table/TablePage.tsx`:

```ts
import { ChipStack } from './ChipStack'
```

- [ ] **Step 2: Render chip stacks on the felt for each player's pending bet**

Inside the `TableFelt` children, after the player positions map (line 165), add chip stack rendering. Place it below the player positions inside the same `flex-1 relative` div. Add this code right after the `{game.players.map(...)}` closing `</div>`:

```tsx
{/* Pending bet chips on felt */}
{game.phase === 'betting' &&
  game.players.map((player, i) => {
    const pending = game.pendingBets?.[player.id] ?? 0
    if (pending <= 0) return null
    return (
      <div
        key={`chips-${player.id}`}
        className="absolute"
        style={{
          left: positions[i]?.x ?? 0,
          top: (positions[i]?.y ?? 0) + 30,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <ChipStack amount={pending} size="sm" />
      </div>
    )
  })}
```

This places chip stacks 30px below each player's betting circle.

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/TablePage.tsx
git commit -m "feat: render pending bet chips on table felt"
```

---

### Task 6: Move action buttons below table rim

**Files:**
- Modify: `src/components/Table/TablePage.tsx`

- [ ] **Step 1: Move action buttons strip to below the player info strip**

Currently the action buttons strip is at lines 179-217, right after the `</TableFelt>` closing. It's positioned with absolute coordinates overlapping the table top.

Move it to after the player info strip (after line 244), keeping the same alignment logic but in document flow:

Replace the existing action buttons block (lines 179-217) with nothing (delete it). Then add this AFTER the player info strip closing `</div>` (after line 244):

```tsx
{/* Action buttons strip */}
{!game.gameOver && (() => {
  const lp = localPlayer
  if (!lp) return null
  const lpIdx = game.players.findIndex(p => p.id === lp.id)
  const canAct = game.currentTurn === lp.seat && (game.phase === 'playing' || game.phase === 'insurance')
  if (!canAct) return null
  return (
    <div
      className="relative mx-auto mt-2"
      style={{ width: dims.width }}
    >
      <div
        className="flex justify-center"
        style={{
          paddingLeft: positions[lpIdx]?.x ?? '50%',
        }}
      >
        <div className="space-y-1.5 -translate-x-1/2">
          {game.turnTimeLimit > 0 && game.turnStartedAt && game.phase === 'playing' && (
            <TurnTimer
              timeLimit={game.turnTimeLimit}
              startedAt={game.turnStartedAt}
              onTimeout={() => submitAction({ type: 'stand' })}
            />
          )}
          <ActionButtons
            hand={lp.hands[lp.activeHandIndex]}
            chips={lp.chips}
            onAction={submitAction}
            rules={game.rules}
            handIndex={lp.activeHandIndex}
            playerHands={lp.hands}
            phase={game.phase}
            dealerUpcard={game.dealerHand.length > 0 ? game.dealerHand[0].rank : null}
          />
        </div>
      </div>
    </div>
  )
})()}
```

The key change: instead of `className="absolute"` and `z-20`, this is now in normal document flow with `mt-2`, positioned below the player info strip. Alignment to seat X uses `paddingLeft` with `-translate-x-1/2` on the inner div.

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/Table/TablePage.tsx
git commit -m "fix: move action buttons below table rim into document flow"
```

---

### Task 7: Wire up pending bet props in TablePage

**Files:**
- Modify: `src/components/Table/TablePage.tsx`

- [ ] **Step 1: Update useGameSync destructure to include new functions**

Update the destructure on line 23:

```ts
const { submitAction, submitBet, scheduleNewRound, addBetChip, clearBetChip } = useGameSync()
```

- [ ] **Step 2: Update BettingArea calls to pass pending bet props**

Update the first BettingArea call (unbet state, lines 252-259) to pass the new props:

```tsx
{isBetting && !allBet && localPlayer && (
  <BettingArea
    chips={localPlayer.chips}
    minBet={game.rules.minBet}
    maxBet={game.rules.maxBet}
    pendingBet={game.pendingBets?.[user.uid] ?? 0}
    onAddChip={addBetChip}
    onClear={clearBetChip}
    onPlaceBet={(amount) => submitBet(user.uid, amount)}
    alreadyBet={false}
  />
)}
```

Update the second BettingArea call (already-bet state, lines 262-271) — remove the unused `onPlaceBet` and add the missing props:

```tsx
{isBetting && localPlayer && localPlayer.hands[0]?.bet > 0 && (
  <BettingArea
    chips={localPlayer.chips}
    minBet={game.rules.minBet}
    maxBet={game.rules.maxBet}
    pendingBet={0}
    onAddChip={() => {}}
    onClear={() => {}}
    onPlaceBet={() => {}}
    alreadyBet={true}
    currentBetAmount={localPlayer.hands[0].bet}
  />
)}
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/TablePage.tsx
git commit -m "feat: wire pending bet props to BettingArea"
```

---

### Task 8: Verify with tests and build

**Files:**
- No new files. Runs existing tests + build.

- [ ] **Step 1: Run existing tests**

```bash
npx vitest run
```

Expected: All 57 tests pass.

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit any fixes if needed, otherwise skip**
