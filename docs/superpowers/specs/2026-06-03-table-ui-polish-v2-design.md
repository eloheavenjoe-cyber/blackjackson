# Blackjackson — Table UI Polish v2: Action Buttons, Spacing

**Date:** 2026-06-03
**Scope:** Move action buttons outside overflow container, tighten info strip to table, lower chip selector

---

## 1. Problems

1. **Action buttons clipped** — `ActionButtons` and `TurnTimer` are rendered inside `PlayerPosition` inside `TableFelt`'s `overflow: hidden` container. When a player's spot is near the bottom curve, buttons get clipped or hidden.
2. **Info strip gap** — Player names/chips sit too far below the table.
3. **Chip selector still too close** — `pt-8` insufficient breathing room.

---

## 2. Solution

### 2.1 Move action buttons outside overflow container

**Changed in `PlayerPosition.tsx`:**
- Remove the `canAct` block (lines 59-81): `TurnTimer`, `ActionButtons`
- Remove unused imports: `ActionButtons`, `TurnTimer`
- `motion` import still needed for the betting circle animation

**Changed in `TablePage.tsx`:**
- Add an action buttons strip between the table wrapper close (`</div>` at line 182) and the player info strip (line 184)
- Uses the same `positions` X coordinates to align under each player's spot
- Only renders for the local player's turn (`canAct`)
- Includes `TurnTimer` bar and `ActionButtons`

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
      <div className="absolute flex justify-center" style={{
        left: positions[lpIdx]?.x ?? '50%',
        transform: 'translateX(-50%)',
      }}>
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

### 2.2 Tighten info strip to table

**Changed in `TablePage.tsx`:**
- Add `-mt-1` to the info strip div: `className="relative mx-auto -mt-1"`

### 2.3 Lower chip selector

**Changed in `BettingArea.tsx`:**
- All three return paths: `pt-8` → `pt-12`

---

## 3. Files Changed

| File | Change |
|------|--------|
| `src/components/Table/PlayerPosition.tsx` | Remove action buttons block, remove ActionButtons/TurnTimer imports |
| `src/components/Table/TablePage.tsx` | Add action buttons strip, add `-mt-1` to info strip, import ActionButtons/TurnTimer |
| `src/components/Table/BettingArea.tsx` | `pt-8` → `pt-12` on all three paths |

---

## 4. Verification

- `npx vitest run` — all 57 tests pass
- `npm run build` — compiles cleanly
- Visual: `npm run dev`, confirm action buttons visible below table during turn, info strip closer to table, chip selector has adequate spacing
