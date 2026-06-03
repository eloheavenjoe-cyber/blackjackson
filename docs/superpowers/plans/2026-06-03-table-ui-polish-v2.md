# Table UI Polish v2: Action Buttons, Spacing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move action buttons outside overflow container, tighten info strip to table, lower chip selector.

**Architecture:** Extract ActionButtons/TurnTimer from PlayerPosition into a new strip layer in TablePage (outside overflow:hidden). Same arc-aligned approach as the info strip. Simple padding tweaks for spacing.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/components/Table/PlayerPosition.tsx` | Modify | Remove action buttons block, remove ActionButtons/TurnTimer imports |
| `src/components/Table/TablePage.tsx` | Modify | Add action buttons strip, tighten info strip, add imports |
| `src/components/Table/BettingArea.tsx` | Modify | `pt-8` → `pt-12` on all three paths |

---

### Task 1: Move action buttons outside table + tighten info strip

**Files:**
- Modify: `src/components/Table/PlayerPosition.tsx:59-81` (remove block), lines 3-4 (remove imports)
- Modify: `src/components/Table/TablePage.tsx:8-10` (add imports), line 184 (tighten strip), between lines 183-184 (add buttons strip)

- [ ] **Step 1: Remove action buttons block from PlayerPosition.tsx**

Remove the `canAct` block (lines 59-81):

```tsx
      {canAct && (
        <div className="flex justify-center mt-2">
          <div className="space-y-1.5">
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
        </div>
      )}
```

Also remove unused imports on lines 3-4:
```tsx
import { ActionButtons } from './ActionButtons'
import { TurnTimer } from './TurnTimer'
```

Also remove the `canAct` variable on line 27 since it's now unused:
```tsx
const canAct = isCurrentTurn && isLocalPlayer && (phase === 'playing' || phase === 'insurance')
```

The component now ends after the cards section (around line 57). The `motion` import stays (used for betting circle animation).

- [ ] **Step 2: Add ActionButtons/TurnTimer imports to TablePage.tsx**

Add after existing imports (around line 12):
```tsx
import { ActionButtons } from './ActionButtons'
import { TurnTimer } from './TurnTimer'
```

- [ ] **Step 3: Add action buttons strip in TablePage.tsx**

Insert this block between the table wrapper close (`</div>` at line 182) and the player info strip (line 184):

```tsx
      {/* Action buttons strip */}
      {!game.gameOver && (() => {
        const lp = localPlayer
        if (!lp) return null
        const lpIdx = game.players.findIndex(p => p.id === lp.id)
        const canAct = game.currentTurn === lp.seat && (game.phase === 'playing' || game.phase === 'insurance')
        if (!canAct) return null
        return (
          <div className="relative mx-auto z-20" style={{ width: dims.width }}>
            <div
              className="absolute flex justify-center"
              style={{
                left: positions[lpIdx]?.x ?? '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="space-y-1.5">
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

- [ ] **Step 4: Tighten info strip to table**

Change line 187 from:
```tsx
          className="relative mx-auto"
```
To:
```tsx
          className="relative mx-auto -mt-1"
```

- [ ] **Step 5: Run tests and build**

```bash
npx vitest run
npm run build
```

All 57 tests must pass. Build must succeed.

- [ ] **Step 6: Commit**

```bash
git add src/components/Table/PlayerPosition.tsx src/components/Table/TablePage.tsx
git commit -m "feat: move action buttons outside table, tighten info strip"
```

---

### Task 2: Lower BettingArea padding

**Files:**
- Modify: `src/components/Table/BettingArea.tsx`

- [ ] **Step 1: Change pt-8 to pt-12 on all three paths**

Find and replace `pt-8` with `pt-12` everywhere in the file (three occurrences: the "already bet", "not enough chips", and "main betting" return paths).

- [ ] **Step 2: Run tests and build**

```bash
npx vitest run
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Table/BettingArea.tsx
git commit -m "feat: increase BettingArea top padding to pt-12"
```

---

### Task 3: Visual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify in browser**

1. Create game, join with multiple players
2. Confirm action buttons appear below table when it's your turn
3. Confirm buttons are NOT clipped (visible even when player spot is near bottom curve)
4. Confirm info strip is closer to table bottom
5. Confirm chip selector has adequate breathing room (pt-12)
6. Confirm buttons, timer, and TurnTimer still function correctly
