# Card Dealing, Hole Card Flip & Chip Stacking Animations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three high-impact animations: cards deal from a shoe position across the table in sequence, dealer's hole card flips with a 3D animation, and chips animate when added/removed from the felt.

**Architecture:** CardComponent gains `originX`/`originY` props for configurable deal origin and a dual-face render mode for flip. TablePage computes a shoe position and generates sequential deal indices per card. DealerArea triggers the hole card flip on `showHoleCard` transition. ChipStack rewrites internals with framer-motion `AnimatePresence` for entry/exit animations.

**Tech Stack:** React 19, TypeScript, framer-motion, Tailwind CSS v4

---

### Task 1: Add originX/originY props to CardComponent + dual-face flip support

**Files:**
- Modify: `src/components/Table/CardComponent.tsx`

- [ ] **Step 1: Read the current file**

Read `src/components/Table/CardComponent.tsx` to understand the current structure.

- [ ] **Step 2: Rewrite CardComponent with origin props and dual-face flip support**

Replace the entire file content with:

```tsx
import { motion } from 'framer-motion'
import type { Card } from '../../engine/types'

type Props = {
  card?: Card
  faceDown?: boolean
  size?: 'sm' | 'md' | 'lg'
  delay?: number
  originX?: number
  originY?: number
  isFlipping?: boolean
}

const suitSymbols: Record<string, string> = { S: '\u2660', H: '\u2665', D: '\u2666', C: '\u2663' }
const suitColors: Record<string, string> = { S: 'text-gray-900', H: 'text-red-600', D: 'text-red-600', C: 'text-gray-900' }

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

function CardFace({ card, size = 'md' }: { card?: Card; size?: 'sm' | 'md' | 'lg' }) {
  if (!card) {
    return <div className="w-full h-full rounded-lg border border-white/20 bg-white/5" />
  }
  return (
    <div className={`w-full h-full rounded-lg border border-gray-300 flex flex-col p-1 ${suitColors[card.suit]}`}>
      <div className={`${textSizes[size]} font-bold leading-none`}>{card.rank}</div>
      <div className={`${textSizes[size]} leading-none`}>{suitSymbols[card.suit]}</div>
      <div className="flex-1 flex items-center justify-center">
        <span className={`${size === 'sm' ? 'text-xl' : 'text-3xl'}`}>{suitSymbols[card.suit]}</span>
      </div>
    </div>
  )
}

function CardBack() {
  return (
    <div className="w-full h-full rounded-lg border-2 border-blue-400 bg-blue-700 flex items-center justify-center">
      <div className="w-3/4 h-3/4 rounded border border-blue-400 bg-blue-600 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-blue-500 rounded-sm" />
        ))}
      </div>
    </div>
  )
}

export function CardComponent({
  card, faceDown, size = 'md', delay = 0,
  originX = -60, originY = -300,
  isFlipping,
}: Props) {
  const rot = (Math.random() - 0.5) * 6

  return (
    <motion.div
      initial={{ x: originX, y: originY, rotate: -15 + rot, opacity: 0 }}
      animate={
        isFlipping !== undefined
          ? { x: 0, y: 0, rotateY: isFlipping ? 180 : 0, rotate: 0, opacity: 1 }
          : { x: 0, y: 0, rotate: 0, opacity: 1 }
      }
      transition={{
        duration: isFlipping !== undefined ? 0.5 : 0.6,
        delay,
        type: isFlipping !== undefined ? 'tween' : 'spring',
        stiffness: 120,
        damping: 14,
      }}
      className={`${sizeClasses[size]} rounded-lg shadow-xl flex-shrink-0`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 600,
      }}
    >
      {/* Face-down (back) — visible at rotateY=0 */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
      >
        <CardBack />
      </div>
      {/* Face-up (front) — visible at rotateY=180 */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <CardFace card={card} size={size} />
      </div>
    </motion.div>
  )
}
```

Key changes:
- New `originX`, `originY` props (default to -60, -300 for backward compatibility)
- New `isFlipping` prop — when provided, uses tween animation for 3D flip instead of spring
- Both card faces always rendered as absolute layers with `backface-visibility: hidden`
- Front face pre-rotated to 180deg so it's hidden when card is "face down" (rotateY=0)
- Random rotation on arrival (±3°) for organic feel
- Refactored face-down and face-up into `CardBack`/`CardFace` sub-components

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/CardComponent.tsx
git commit -m "feat: add origin props and dual-face flip support to CardComponent"
```

---

### Task 2: Rewrite ChipStack with entry/exit animations

**Files:**
- Modify: `src/components/Table/ChipStack.tsx`

- [ ] **Step 1: Read the current file**

Read `src/components/Table/ChipStack.tsx` to understand the current structure.

- [ ] **Step 2: Rewrite with framer-motion AnimatePresence**

Replace the entire file content with:

```tsx
import { motion, AnimatePresence } from 'framer-motion'
import { Chip } from './Chip'

type ChipValue = 10 | 25 | 50 | 100 | 250 | 500

type Props = {
  amount: number
  size?: 'sm' | 'md'
}

function getChipValues(amount: number): ChipValue[] {
  const denoms: ChipValue[] = [500, 250, 100, 50, 25, 10]
  const result: ChipValue[] = []
  let remaining = amount
  for (const d of denoms) {
    while (remaining >= d && result.length < 5) {
      result.push(d)
      remaining -= d
    }
  }
  return result
}

let idCounter = 0
function nextId() {
  return ++idCounter
}

export function ChipStack({ amount, size = 'sm' }: Props) {
  if (amount <= 0) return null
  const values = getChipValues(amount)
  const chipSize = size === 'sm' ? 'small' : 'table'
  const maxChips = Math.min(values.length, 5)
  const height = 28 + (maxChips - 1) * 4

  return (
    <motion.div layout className="relative inline-flex flex-col items-center">
      <motion.div layout className="relative" style={{ height, width: 30 }}>
        <AnimatePresence>
          {values.map((v, i) => (
            <motion.div
              key={`${v}-${nextId()}`}
              initial={{ scale: 0, y: -10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0, y: 8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: i * 4, zIndex: values.length - i }}
            >
              <Chip value={v} size={chipSize as 'small' | 'table'} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      <motion.span
        key={amount}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="text-xs font-bold text-gold mt-1"
      >
        {amount}
      </motion.span>
    </motion.div>
  )
}
```

Key changes:
- Wrapped in `motion.div` with `layout` prop for automatic smooth repositioning
- Each chip uses `AnimatePresence` for entry/exit animations
- Entry: scale 0→1 with spring bounce, slight vertical pop
- Exit: scale→0, slide down, fade out
- Amount label crossfades using `key={amount}` + motion
- `nextId()` ensures unique keys even for same-value chips (prevents stale key reuse across re-renders)

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/ChipStack.tsx
git commit -m "feat: add entry/exit animations to ChipStack"
```

---

### Task 3: Compute shoe position and deal sequence in TablePage

**Files:**
- Modify: `src/components/Table/TablePage.tsx`

- [ ] **Step 1: Read the current file**

Read `src/components/Table/TablePage.tsx` to understand the current structure, especially the player positions loop and DealerArea usage.

- [ ] **Step 2: Compute shoe origin from felt dimensions**

Add a `shoeOrigin` computed value after the `positions` useMemo (around line 83):

```ts
const shoeOrigin = useMemo(
  () => ({ x: dims.width / 2, y: 10 }),
  [dims]
)
```

This puts the shoe position at the horizontal center, near the top of the felt.

- [ ] **Step 3: Compute deal indices for sequential card dealing**

Add a `dealIndices` computed value after `shoeOrigin`:

```ts
const dealIndices = useMemo(() => {
  const playerCount = game?.players.length ?? 0
  if (playerCount === 0 || game?.phase !== 'dealing') return new Map<string, { first: number; second: number }>()
  const map = new Map<string, { first: number; second: number }>()
  let idx = 0
  // First pass: each player gets card 1, then dealer
  game!.players.forEach((p) => {
    map.set(p.id, { first: idx++, second: 0 })
  })
  const dealerFirst = idx++
  // Second pass: each player gets card 2, then dealer
  game!.players.forEach((p) => {
    const entry = map.get(p.id)!
    entry.second = idx++
  })
  const dealerSecond = idx++
  return map
}, [game?.players, game?.phase])
```

Each player gets `{ first, second }` deal indices. The `delay` prop on CardComponent is `dealIndex * 0.15`.

- [ ] **Step 4: Pass dealIndex and origin to PlayerPosition and DealerArea**

For `PlayerPosition`, add `dealIndex` and `origin` props. Find the `<PlayerPosition ...>` call inside the `game.players.map` and add:

```tsx
dealIndex={game?.phase === 'dealing' ? (dealIndices.get(player.id)?.first ?? null) : null}
originX={shoeOrigin.x - (positions[i]?.x ?? 0)}
originY={shoeOrigin.y - (positions[i]?.y ?? 0)}
```

For `DealerArea`, add props. Find the `<DealerArea ...>` call and add:

```tsx
dealIndex={game?.phase === 'dealing' ? 0 : null}
originX={0}
originY={0}
```

Wait — `DealerArea` positions above the felt, not inside it. The shoe is on the felt. Dealer cards should fly from the shoe position too. Set:

```tsx
originX={shoeOrigin.x - (dims.width / 2)}
originY={shoeOrigin.y - 50}
```

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/components/Table/TablePage.tsx
git commit -m "feat: compute shoe origin and deal sequence in TablePage"
```

---

### Task 4: Pass origin and dealIndex through CardHand

**Files:**
- Modify: `src/components/Table/CardHand.tsx`

- [ ] **Step 1: Read the current file**

Read `src/components/Table/CardHand.tsx`.

- [ ] **Step 2: Add dealIndex and origin props to CardHand**

Replace the file with:

```tsx
import type { HandState } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent } from './CardComponent'

type Props = {
  hand: HandState
  handIndex: number
  activeHandIndex: number
  dealIndex?: number | null
  originX?: number
  originY?: number
}

export function CardHand({ hand, handIndex, activeHandIndex, dealIndex, originX, originY }: Props) {
  const ev = evaluateHand(hand.cards)
  const isActive = handIndex === activeHandIndex
  return (
    <div className={`flex flex-col items-center gap-1 ${!isActive ? 'opacity-60' : ''}`}>
      <div className="flex -space-x-3">
        {hand.cards.map((card, i) => (
          <CardComponent
            key={`${card.suit}${card.rank}-${i}`}
            card={card}
            size="sm"
            delay={dealIndex != null ? (dealIndex + i) * 0.15 : i * 0.2}
            originX={originX}
            originY={originY}
          />
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

Key change: When `dealIndex` is provided, card delays use `(dealIndex + i) * 0.15` for sequential dealing. Otherwise falls back to `i * 0.2` for backward compat.

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/CardHand.tsx
git commit -m "feat: pass origin and dealIndex through CardHand"
```

---

### Task 5: Pass origin to DealerArea + trigger hole card flip

**Files:**
- Modify: `src/components/Table/DealerArea.tsx`

- [ ] **Step 1: Read the current file**

Read `src/components/Table/DealerArea.tsx`.

- [ ] **Step 2: Add origin props and hole card flip logic**

Replace the file with:

```tsx
import { useEffect, useState } from 'react'
import type { Card } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent } from './CardComponent'
import { PlayerAvatar } from '../Shared/PlayerAvatar'

type Props = {
  dealerHand: Card[]
  showHoleCard: boolean
  phase: string
  dealIndex?: number | null
  originX?: number
  originY?: number
}

export function DealerArea({ dealerHand, showHoleCard, phase, dealIndex, originX, originY }: Props) {
  const ev = dealerHand.length > 0 ? evaluateHand(showHoleCard ? dealerHand : [dealerHand[0]]) : null
  const dealerBJ = dealerHand.length === 2 && evaluateHand(dealerHand).isBlackjack
  const [flipping, setFlipping] = useState(false)
  const [wasShowing, setWasShowing] = useState(showHoleCard)

  useEffect(() => {
    if (showHoleCard && !wasShowing && dealerHand.length >= 2) {
      const timer = setTimeout(() => setFlipping(true), 300)
      return () => clearTimeout(timer)
    }
    setWasShowing(showHoleCard)
  }, [showHoleCard, wasShowing, dealerHand.length])

  return (
    <div
      className="flex flex-col items-center"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        padding: '10px 40px 20px',
        borderRadius: '12px 12px 0 0',
        marginBottom: -10,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <PlayerAvatar name="Dealer" seat={6} size="sm" />
        <span className="text-gold/70 text-xs font-semibold uppercase tracking-widest">Dealer</span>
      </div>

      {phase === 'insurance' && (
        <div className="bg-gold/30 text-gold text-xs font-bold px-3 py-0.5 rounded-full mb-2">
          INSURANCE
        </div>
      )}
      {(phase === 'settlement' || phase === 'round_end') && dealerBJ && (
        <div className="bg-red-500/30 text-red-300 text-xs font-bold px-3 py-0.5 rounded-full mb-2">
          BLACKJACK
        </div>
      )}

      <div
        className="flex -space-x-4"
        style={{ perspective: 600 }}
      >
        {dealerHand.map((card, i) => {
          const isHoleCard = i === 1 && !showHoleCard
          const cardDelay = dealIndex != null
            ? (dealIndex + i) * 0.15
            : i * 0.2
          return (
            <CardComponent
              key={i}
              card={card}
              faceDown={!showHoleCard && i === 1}
              size="lg"
              delay={cardDelay}
              originX={originX}
              originY={originY}
              isFlipping={i === 1 && flipping ? true : i === 1 && showHoleCard ? false : undefined}
            />
          )
        })}
        {dealerHand.length === 0 && (
          <div className="w-16 h-24 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center">
            <span className="text-white/15 text-xl">?</span>
          </div>
        )}
      </div>

      {ev && phase !== 'waiting' && phase !== 'betting' && phase !== 'dealing' && (
        <div className="text-sm font-mono text-white bg-black/40 px-3 py-0.5 rounded-full mt-2">
          {showHoleCard ? ev.value : ev.soft ? `${ev.value - 10}/${ev.value}` : ev.value}
        </div>
      )}
    </div>
  )
}
```

Key changes:
- New `dealIndex`, `originX`, `originY` props
- `flipping` state triggers after 300ms delay when `showHoleCard` transitions false→true
- `isFlipping` prop on CardComponent: `true` during the flip, `false` after flip settles, `undefined` for non-hole cards (uses spring animation)
- Parent div gets `perspective: 600` for 3D flip depth
- Card delays use deal sequence when `dealIndex` is provided

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/DealerArea.tsx
git commit -m "feat: pass origin to DealerArea and trigger hole card flip"
```

---

### Task 6: Wire DealerArea dealIndex in TablePage

**Files:**
- Modify: `src/components/Table/TablePage.tsx`

- [ ] **Step 1: Update DealerArea call in TablePage**

Find the `<DealerArea ...>` call and add `dealIndex` prop. Also update the `PlayerPosition` call to pass `dealIndex` properly.

In Task 3 we added props but need to refine. The dealer's dealIndex should come from the deal sequence — dealer's cards are dealt after all players get their first card, and before the second pass.

Update the dealer deal index and pass through to PlayerPosition properly:

Find the DealerArea call and update to:
```tsx
<DealerArea
  dealerHand={game.dealerHand}
  showHoleCard={game.phase === 'dealer' || game.phase === 'settlement' || game.phase === 'round_end'}
  phase={game.phase}
  dealIndex={game.phase === 'dealing' ? game.players.length : null}
  originX={shoeOrigin.x - dims.width / 2}
  originY={shoeOrigin.y - 50}
/>
```

And inside the players map, update PlayerPosition to pass dealIndex:
```tsx
<PlayerPosition
  key={player.id}
  player={player}
  isCurrentTurn={game.currentTurn === player.seat}
  x={positions[i]?.x ?? 0}
  y={positions[i]?.y ?? 0}
  angle={positions[i]?.angle ?? 0}
  dealIndex={game.phase === 'dealing' ? (dealIndices.get(player.id)) : null}
  originX={shoeOrigin.x - (positions[i]?.x ?? 0)}
  originY={shoeOrigin.y - (positions[i]?.y ?? 0)}
/>
```

- [ ] **Step 2: Update PlayerPosition to accept and pass dealIndex/origin**

Read `src/components/Table/PlayerPosition.tsx` and update it to accept `dealIndex`, `originX`, `originY` props and pass them through to `CardHand`:

Add to the Props type:
```ts
dealIndex?: { first: number; second: number } | null
originX?: number
originY?: number
```

Update CardHand rendering to pass the deal index for the appropriate hand:
```tsx
player.hands.map((hand, hi) => (
  <div key={hi} className={hi > 0 ? 'ml-2' : ''}>
    <CardHand
      hand={hand}
      handIndex={hi}
      activeHandIndex={player.activeHandIndex}
      dealIndex={dealIndex ? (hi === 0 ? dealIndex.first : dealIndex.second) : null}
      originX={originX}
      originY={originY}
    />
  </div>
))
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/TablePage.tsx src/components/Table/PlayerPosition.tsx
git commit -m "feat: wire deal sequence origin through TablePage"
```

---

### Task 7: Update memory.md and verify

**Files:**
- Modify: `memory.md`
- No code changes.

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All 57 tests pass.

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Update memory.md**

Add to the Fixed Issues Summary section in `memory.md`:

```markdown
- ~~Card dealing animation~~ — Cards fly from shoe position, sequential dealing order
- ~~Hole card reveal~~ — 3D flip animation on dealer's second card
- ~~Chip stacking animation~~ — Framer-motion entry/exit animations in ChipStack
```

And add to the Key Files table:
```markdown
| `src/components/Table/CardComponent.tsx` | Card with origin props, dual-face flip support |
```

- [ ] **Step 4: Commit**

```bash
git add memory.md
git commit -m "docs: update memory.md with animation features"
```
