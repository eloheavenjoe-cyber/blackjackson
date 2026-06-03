# Table UI — Chip Selector, Button Positioning, Chips on Felt

## Goals

1. Move chip denom selector lower from the table
2. Fix action buttons clipping the table rim
3. Replace accumulator container with chips rendered on the table felt
4. All connected players see chips being added/removed in real-time

## Changes

### 1. Chip Selector Spacing

**File:** `src/components/Table/BettingArea.tsx`

Increase top padding on the betting area wrapper from `pt-12` to `pt-20` to push the denomination chip tray further from the table edge.

### 2. Action Buttons Below Rim

**File:** `src/components/Table/TablePage.tsx`

Move the action buttons strip (lines 179-217) from its current absolute-position-above-table location to the normal document flow, placed between the player info strip and the betting area.

Currently:
- Container: `relative mx-auto z-20` with `width: dims.width`
- Inner: `absolute` with `left: positions[lpIdx]?.x`, `transform: 'translateX(-50%)'`
- This floats above the table, overlapping the rim

New:
- Render in document flow below the player info strip
- Still horizontally centered on the player's seat X using the same alignment logic
- Use a `w-full relative` container positioned after the info strip

### 3. Chips on the Table Felt

#### 3a. New GameState Field

**File:** `src/engine/types.ts`

Add to `GameState`:
```ts
pendingBets?: Record<string, number>
```

Map of `playerId` to the total chip amount currently being assembled for their bet. `undefined` for players not actively stacking chips.

#### 3b. BettingArea Simplification

**File:** `src/components/Table/BettingArea.tsx`

Remove the local `chipStack` state and the `ChipArea` accumulator component. The component becomes:
- Denomination chip tray (6 chips in a row)
- Clear button (resets pending bet for this player)
- "Place Bet" button (submits the pending total as the bet)

Chip click handling:
- Add chip: `increment(pendingBets[playerId], value)` in Firestore
- Clear: set `pendingBets[playerId]` to 0
- Place Bet: read pending total → submit bet intent → clear pending

Use `FieldValue.increment` for concurrency-safe additions.

#### 3c. Chip Rendering on Table

**File:** `src/components/Table/TablePage.tsx` or new sub-component

For each player with a `pendingBets[playerId] > 0`, render a `ChipStack` component on the table felt at that player's betting circle position. Position it near the player's cards (e.g., slightly below the betting circle).

Since `pendingBets` is part of the game document synced via `onSnapshot`, all clients automatically see chip stacks appear/grow/shrink in real-time.

### 4. useGameSync Hooks

**File:** `src/hooks/useGameSync.ts`

Add three new functions:
- `addBetChip(value: number)` — increments `pendingBets[playerId]` in Firestore via `FieldValue.increment`
- `clearPendingBet()` — sets `pendingBets[playerId]` to 0
- `confirmPendingBet(playerId: string, amount: number)` — submits the bet intent, then clears pending

### 5. Firestore Write Path

**File:** `src/firebase/games.ts`

Add `increment` import and a helper:
```ts
updateFieldIncrement(gameId, field, delta)
```
Uses `updateDoc` with `FieldValue.increment` for atomic additions.

## Files Affected

| File | Change |
|------|--------|
| `src/engine/types.ts` | Add `pendingBets` to `GameState` |
| `src/firebase/games.ts` | Add `updateFieldIncrement` helper |
| `src/hooks/useGameSync.ts` | Add `addBetChip`, `clearPendingBet`, `confirmPendingBet` |
| `src/components/Table/BettingArea.tsx` | Remove accumulator, simplify to tray + Clear + Place Bet; move lower |
| `src/components/Table/TablePage.tsx` | Move action buttons below table; render pending bet chips on felt |
| `src/components/Table/PlayerPosition.tsx` | No change (chips rendered in TablePage alongside positions) |

### 6. pendingBets Cleanup

- When the host processes a bet intent and sets the player's `hands[0].bet`, it also clears `pendingBets[playerId]` (sets to 0 or removes the key).
- When `startNewRound` is called, the engine clears the entire `pendingBets` map (sets to `{}`).
- This prevents stale chips from persisting across rounds.

## Non-Goals

- Removing the `games/{id}/bets/` subcollection (it still handles final bet submission)
- Changing the host-only bet processing model
- Individual chip removal from the table (Clear resets all chips; user can re-add)
- Mobile responsiveness (separate issue)
