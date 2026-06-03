# Table UI Polish: Names, Chips, and Betting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move player names/chips above table clipping, remove PlayerAvatar, lower BettingArea, add chip auto-consolidation.

**Architecture:** Three small edits across three files. No new components. Chip consolidation reuses the existing `breakdownDenoms` function. Player info strip is inline JSX in TablePage.

**Tech Stack:** React 18, TypeScript, Tailwind CSS

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/components/Table/PlayerPosition.tsx` | Modify | Remove name/chips/avatar block |
| `src/components/Table/TablePage.tsx` | Modify | Add player info strip below table |
| `src/components/Table/BettingArea.tsx` | Modify | Lower padding, add `consolidateChips` |

---

### Task 1: Move player names/chips below table + remove PlayerAvatar

**Files:**
- Modify: `src/components/Table/PlayerPosition.tsx:84-95`
- Modify: `src/components/Table/TablePage.tsx:151-172` (add info strip after TableFelt)

- [ ] **Step 1: Remove name/chips/avatar from PlayerPosition**

Remove lines 84-95 in `PlayerPosition.tsx` (the entire name + chips block):

```tsx
      <div className="flex flex-col items-center mt-1">
        <div className="flex items-center gap-1">
          <PlayerAvatar name={player.name} seat={player.seat} size="sm" isActive={isCurrentTurn} />
          <span className="text-white text-xs font-medium">
            {player.name}
            {player.isActive === false && (
              <span className="text-gray-500 ml-1">(Away)</span>
            )}
          </span>
        </div>
        <span className="text-gold text-xs">{player.chips} chips</span>
      </div>
```

Also remove unused imports: `PlayerAvatar` (line 2) and any unused `motion` if no longer needed.

The component should end after the action buttons block (around line 82).

- [ ] **Step 2: Add player info strip in TablePage.tsx**

Add this block between `</TableFelt>` closing (line 181) and the RoundResult div (line 185):

```tsx
      {/* Player info strip */}
      {!game.gameOver && (
        <div
          className="relative w-full"
          style={{ width: 'min(92vw, 900px)', height: '32px' }}
        >
          {game.players.map((player, i) => (
            <div
              key={player.id}
              className="absolute flex flex-col items-center"
              style={{
                left: positions[i]?.x ?? '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <span className="text-white/80 text-xs font-medium whitespace-nowrap">
                {player.name}
                {player.isActive === false && (
                  <span className="text-gray-500 ml-1">(Away)</span>
                )}
              </span>
              <span className="text-gold text-xs">{player.chips} chips</span>
            </div>
          ))}
        </div>
      )}
```

This sits below the TableFelt but above RoundResult, outside `overflow: hidden`.

- [ ] **Step 3: Run tests and build**

```bash
npx vitest run
npm run build
```

No expected failures. All 57 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/PlayerPosition.tsx src/components/Table/TablePage.tsx
git commit -m "feat: move player names/chips below table, remove PlayerAvatar"
```

---

### Task 2: Lower BettingArea + add chip consolidation

**Files:**
- Modify: `src/components/Table/BettingArea.tsx`

- [ ] **Step 1: Add consolidateChips function**

Add this function after `breakdownDenoms` (around line 31):

```typescript
function consolidateChips(chips: ChipValue[]): ChipValue[] {
  const total = chips.reduce((a, b) => a + b, 0)
  return breakdownDenoms(total)
}
```

This greedily converts the total value into the fewest higher-denomination chips.

- [ ] **Step 2: Wire consolidation into chip addition**

Change line 135 from:

```typescript
onClick={canAfford(v) ? () => setChipStack((prev) => [...prev, v]) : undefined}
```

To:

```typescript
onClick={canAfford(v) ? () => setChipStack((prev) => consolidateChips([...prev, v])) : undefined}
```

- [ ] **Step 3: Lower BettingArea top padding**

In the main betting flow, change line 117 from `className="py-3"` to `className="pt-8 pb-3"`.

In the "already bet" flow, change line 81 from `className="flex justify-center items-center gap-3 py-3"` to `className="flex justify-center items-center gap-3 pt-8 pb-3"`.

In the "not enough chips" flow, change line 93 from `className="flex justify-center py-3"` to `className="flex justify-center pt-8 pb-3"`.

- [ ] **Step 4: Run tests and build**

```bash
npx vitest run
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Table/BettingArea.tsx
git commit -m "feat: lower BettingArea padding, add chip auto-consolidation"
```

---

### Task 3: Visual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify in browser**

1. Create game with 3+ players — confirm names/chips visible below each spot on the arc
2. Confirm no PlayerAvatar colored circles
3. Confirm BettingArea has more top margin
4. Test chip consolidation: add 5 × 10 chips → should show 1 × 50. Add 5 more 10s → should show 1 × 100.
5. Confirm "(Away)" badge still shows for inactive players
6. Test with 1 player and 6 players — all labels visible
