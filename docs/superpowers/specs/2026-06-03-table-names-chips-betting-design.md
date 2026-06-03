# Blackjackson — Table UI Polish: Names, Chips, and Betting

**Date:** 2026-06-03
**Scope:** Move player names/chips above the table clipping, remove PlayerAvatar, lower BettingArea, auto-consolidate bet chips into higher denominations

---

## 1. Problems

1. **Names/chips clipped** — PlayerPosition renders name, chips, and avatar inside the `TableFelt` container which has `overflow: hidden`. When spots are near the bottom curve of the half-oval table, text gets clipped below the visible felt.
2. **Unnecessary PlayerAvatar** — The colored circle with initials next to player names is redundant.
3. **BettingArea too close** — The chip selector sits too close to the table bottom, leaving little visual breathing room.
4. **No chip consolidation** — Adding many small chips clutters the display. Chips should auto-consolidate into higher denominations.

---

## 2. Solution

### 2.1 Move names/chips below the table

Remove the name/chips section from `PlayerPosition` and render it as a separate layer **below** the `TableFelt` wrapper — outside the `overflow: hidden` container. This layer reuses the same X positions from `computePositions` so names align with their spots on the arc. Y is fixed (same for all players) just below the table.

**Changed in `PlayerPosition.tsx`:**
- Remove the name/chips section (lines 84-95): `PlayerAvatar`, name text, "(Away)" badge, chip count

**Changed in `TablePage.tsx`:**
- Add a player info strip between `</TableFelt>` closing tag and `<RoundResult>`:
  - Horizontal bar with `position: relative`, matching the table width
  - Each player gets a `position: absolute` label at their X position
  - Shows: player name (white, small), "(Away)" if inactive, chip count (gold)
  - Centered under each spot

### 2.2 Remove PlayerAvatar

No more `<PlayerAvatar>` usage in the player name display. The colored circle with initials is gone. Only text remains.

### 2.3 Lower BettingArea

**Changed in `BettingArea.tsx`:**
- Increase top padding from `py-3` to `pt-8 pb-3` (or equivalent)

### 2.4 Auto-consolidate bet chips

**Changed in `BettingArea.tsx`:**
- Add a `consolidateChips` function that greedily converts same-denomination chips into higher denominations whenever their total value equals or exceeds the next step up.
- Call it after every chip addition (`setChipStack` calls).
- Denominations: 10, 25, 50, 100, 250, 500
- Greedy algorithm: sort descending, for each denomination group chips, convert total to fewest chips possible.
- Example: adding 5 × 10 chips → consolidates to 1 × 50. Adding 5 more → 2 × 50 → consolidates to 1 × 100.

---

## 3. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `src/components/Table/PlayerPosition.tsx` | Remove name/chips/avatar block | Remove lines 84-95 |
| `src/components/Table/TablePage.tsx` | Add player info strip below table | Insert ~15 lines after `</TableFelt>` |
| `src/components/Table/BettingArea.tsx` | Increase top padding, add `consolidateChips` function | Modify `py-3`, add function before `ChipArea` |

---

## 4. Verification

- `npx vitest run` — all 57 tests still pass (no engine changes)
- `npm run build` — compiles cleanly
- Visual: `npm run dev`, confirm names/chips visible below table for all player counts (1-6), confirm chip selector has more breathing room, confirm no PlayerAvatar circles, confirm chip consolidation works (5×10→50, 2×50→100, etc.)
