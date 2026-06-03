# Card Dealing, Hole Card Flip & Chip Stacking Animations

## Goals

Add three high-impact animations to the Blackjack table:
1. Cards deal from a shoe position across the table in sequence
2. Dealer's hole card reveals with a 3D flip animation
3. Chips animate when added/removed from betting stacks on the felt

## Changes

### 1. Card Dealing Animation

**Current problem:** All cards animate from hardcoded (-60, -300) top-left regardless of who receives them. No sense of a shoe dealing cards.

**Design:**
- `CardComponent` accepts optional `originX`/`originY` props (default to existing values for backward compat)
- During the `dealing` phase, cards fly from a "shoe position" — computed as center-top of the table felt container
- Dealing order: all players' first cards → dealer's first card → all players' second cards → dealer's second card
- Each card gets a global `dealIndex` that determines its delay (`dealIndex * 0.15s`)
- Cards use framer-motion spring with the origin-to-destination path
- Slight random rotation on arrival (±3°) for organic feel

**Implementation approach:**
- In `TablePage`, during phase `dealing`, compute the shoe origin from the felt container ref
- Pass `dealIndex`, `originX`, `originY` to each `CardComponent` via `CardHand` and `DealerArea`
- `CardComponent` uses these for `initial` animation values instead of hardcoded values

**Files:** `CardComponent.tsx`, `CardHand.tsx`, `DealerArea.tsx`, `TablePage.tsx`

### 2. Hole Card Reveal (Flip)

**Current problem:** Dealer's second card instantly swaps from face-down to face-up with no animation.

**Design:**
- 3D card flip using CSS `rotateY` + `backface-visibility: hidden`
- Card renders both front and back faces as absolute layers at all times
- Front face (card content) starts at `rotateY(180deg)`, back face at `rotateY(0deg)`
- When `showHoleCard` transitions from false to true, animate `rotateY` of the wrapper from 0 to 180 over ~0.5s
- The visual effect: card spins on its vertical axis, revealing the opposite face
- Play the `deal` sound effect at the midpoint (~0.25s)
- The flip is delayed slightly (~0.3s) after all initial play ends for dramatic effect

**Implementation approach:**
- Replace `CardComponent`'s conditional rendering with always-rendered front/back layers
- Add `isFlipping` prop or detect `showHoleCard` change via `useEffect` in `DealerArea`
- Use framer-motion `animate={{ rotateY: showHoleCard ? 180 : 0 }}` with spring physics
- Add `perspective` on the parent and `transformStyle: 'preserve-3d'` on the card
- `backface-visibility: hidden` on both inner faces

**Files:** `CardComponent.tsx` (dual-face render + flip support), `DealerArea.tsx` (trigger logic)

### 3. Chip Stacking Animation

**Current problem:** Chips on the table (via `ChipStack`) appear/disappear instantly when `pendingBets` changes.

**Design:**
- Each chip in `ChipStack` wrapped in `motion.div` with `AnimatePresence`
- **Chip added:** `initial={{ scale: 0, y: -8 }}` → `animate={{ scale: 1, y: 0 }}` with spring bounce
- **Chip removed:** `exit={{ scale: 0, y: 8, opacity: 0 }}` with short ease-out
- **Stack order changes** (e.g., 3 chips become 2 bigger chips): use `layout` prop for smooth repositioning
- Amount label crossfades to new value via `AnimatePresence` mode="wait" or a simple motion key swap
- Stable keys: use a combination of value and unique instance id for add/remove detection

**Implementation approach:**
- Rewrite `ChipStack` internals to use `motion.div` with `AnimatePresence`
- Each chip gets a stable key using value + counter to distinguish same-value chips
- The wrapper uses `layout` prop for automatic repositioning
- No changes needed in `TablePage.tsx` — `ChipStack` API unchanged

**Files:** `ChipStack.tsx`

## Files Affected

| File | Change |
|------|--------|
| `src/components/Table/CardComponent.tsx` | New props: originX, originY; dual-face render mode for flip |
| `src/components/Table/CardHand.tsx` | Pass origin props and dealIndex to CardComponent |
| `src/components/Table/DealerArea.tsx` | Compute shoe origin, trigger flip animation on showHoleCard change |
| `src/components/Table/ChipStack.tsx` | Rewrite with motion components, AnimatePresence |
| `src/components/Table/TablePage.tsx` | Compute shoe origin, sequence deal indices across all players + dealer |

## Non-Goals

- Syncing deal animation across network (each client runs its own animation)
- Sound changes beyond reusing existing `deal` sound
- Changing the card back design
- Animating existing bet amounts (committed bets) — only pending bets
