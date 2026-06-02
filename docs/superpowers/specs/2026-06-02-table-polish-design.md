# Blackjackson — Table Polish & Visual Chips Design

**Date:** 2026-06-02
**Approach:** Component rework with inline SVG chips, semicircle table layout
**Scope:** Visual chips, table felt rework, semicircle player positions, betting interaction

---

## 1. Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/components/Table/Chip.tsx` | Single inline SVG casino chip component |
| `src/components/Table/BettingArea.tsx` | Chip tray + current bet display + place bet (extracted from TablePage) |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/Table/TableFelt.tsx` | Semicircle layout, wood rim, felt texture, player arc positioning |
| `src/components/Table/ChipStack.tsx` | Uses new `Chip` component for rendering |
| `src/components/Table/PlayerPosition.tsx` | Simplified — positioned by `x, y, angle`, no card container |
| `src/components/Table/TablePage.tsx` | Simplified, delegates betting to `BettingArea` |

No new dependencies. All visuals are CSS + inline SVG. Zero external image assets.

---

## 2. TableFelt Rework

### Visual Design

- **Felt color:** dark green (`#0a3d1f` base) with subtle felt-grain texture via CSS `background-image` using a small inline SVG data-URI pattern (overlapping tiny circles or noise). Gentle radial highlight (`radial-gradient`) centered behind the dealer position.
- **Rim:** wide wood border (16px+ equivalent) with golden inner ring. Wood uses a gradient (`#5c3a1e` → `#4a2c14` → `#3b2210`) to simulate grain. Outer edge has a darker border.
- **Table shape:** rounded rectangle with generous `border-radius` (similar to current `rounded-[3rem]`).
- **Player arc markings:** each seat position has a subtle gold dashed circle on the felt (the betting spot) + a small gold seat number.

### Semicircle Layout

Players are positioned on an arc:

```
                    [Dealer]
                
      P5                          P1
      
    P4                              P2
              P3          P0
```

For N players, seats are distributed along an arc from 200° to 340° (bottom-left to bottom-right). The radius adapts to the viewport width.

**Computation (in TableFelt, passed as props to PlayerPosition):**
```
centerX = containerWidth / 2
centerY = containerHeight * 0.65
radius  = min(containerWidth * 0.35, containerHeight * 0.45)
angle(i) = startAngle + (i / (N - 1)) * arcSpan  (or center if N=1)
x = centerX + radius * cos(angle)
y = centerY + radius * sin(angle)
rotation = angle - 90°  (cards face toward center)
```

### Card/Dealer Area

- Dealer cards sit directly on the felt at top center — no separate "DealerArea" box. Cards overlap slightly, face-up hole card when revealed.
- Dealer avatar sits to the right of the cards, small and subtle.
- Dealer hand value text below the cards.
- Insurance badge and blackjack badge remain (gold/red pill badges).

### Round Result

- Animated overlay at center of table (not pushed to a separate row). Scales in/out with spring animation over the felt.

---

## 3. Chip Component

### SVG Structure (for each denomination)

Each chip is a self-contained inline `<svg>` element.

**Layers (bottom to top):**
1. Outer rim shadow (dark ring, `stroke-width: 3`)
2. Rim face (lighter ring, `stroke-width: 2`)
3. Chip body (filled circle with subtle radial gradient for depth)
4. Edge spots: 3 pairs of colored rectangles, each pair spaced 120° apart from the next. Rotated via SVG `transform="rotate(deg, cx, cy)"`.
5. Inner ring (golden circle, `stroke-width: 1`, slightly inset)
6. Center inlay (white/off-white circle)
7. Denomination number (large, centered, bold sans-serif font)
8. Outer text ring: arc text with denomination and "BLACKJACKSON" (SVG `<textPath>` along a circle)

### Denominations & Colors

| Value | Body Color | Edge Spots | Inlay |
|-------|-----------|------------|-------|
| 10 | `#1a6ec4` (blue) | White | White |
| 25 | `#2d8c3a` (green) | `#e8c547` (yellow) | White |
| 50 | `#c44141` (red) | `#1a6ec4` (blue) | White |
| 100 | `#1a1a1a` (black) | `#d4a843` (gold) | White |
| 250 | `#7b2d8b` (purple) | White | White |
| 500 | `#8b1a2b` (burgundy) | `#d4a843` (gold) | White |

### Sizes

| Mode | Diameter | Use |
|------|----------|-----|
| `betting` | 56px | Tray chips (clickable) |
| `table` | 40px | Chips on the felt (card hand, bet display) |
| `small` | 28px | ChipStack mini chips |

### Component API

```typescript
type ChipProps = {
  value: 10 | 25 | 50 | 100 | 250 | 500
  size?: 'betting' | 'table' | 'small'
  onClick?: () => void
  dimmed?: boolean
}
```

---

## 4. BettingArea Component

Extracted from `TablePage` — the entire betting interaction.

### Props

```typescript
type BettingAreaProps = {
  chips: number              // player's current chip count
  minBet: number
  maxBet: number
  onPlaceBet: (amount: number) => void
  alreadyBet: boolean         // player already placed a bet this round
  currentBetAmount?: number   // if already bet, show the amount
}
```

### Layout

```
   [current bet chips + amount]  [chip tray row]  [Place Bet button]
```

- **Chip tray row:** horizontally centered. Each available chip denomination is a `Chip` component with `size="betting"` and `onClick`. Chips the player can't afford (cost > chips) are `dimmed={true}`.
- **Current bet area:** left of tray. Shows accumulated bet as small chip icons + numeric total. "Clear" link below.
- **Place Bet button:** right of tray. Gold `Button`, disabled until `total >= minBet`.

### Interaction

1. Click chip in tray → adds its value to current bet accumulator (local state)
2. Click same chip again → adds another (stacks)
3. Click "Clear" → resets accumulator to 0
4. Click "Place Bet" → calls `onPlaceBet(total)`, resets accumulator
5. If `alreadyBet` → shows static "Bet placed: {amount}" with chip display, no tray

### States

- `!isBetting` → render nothing
- `!localPlayer` → render nothing
- `alreadyBet` → show placed bet display
- `localPlayer.chips < rules.minBet` → show "Not enough chips to bet" (player is broke but not yet removed)

---

## 5. PlayerPosition Rework

### Old vs New

**Old:** Self-contained card with `bg-black/20 rounded-xl border` container, avatar, name, chips, cards inside.

**New:** Everything sits directly on the felt. The "card" container is gone.

### Props

```typescript
type PlayerPositionProps = {
  player: PlayerState
  isCurrentTurn: boolean
  isLocalPlayer: boolean
  phase: GamePhase
  turnTimeLimit: number
  turnStartedAt: number | null
  onAction: (action: any) => void
  rules: GameRules
  dealerUpcard: string | null
  x: number       // pixel position from TableFelt arc calculation
  y: number
  angle: number   // radians, for card rotation
}
```

### Layout at Position (x, y)

From bottom to top (each element offset slightly):
1. **Betting circle** — subtle gold dashed ring (`border-2 border-dashed border-gold/30 rounded-full w-24 h-24`) centered at (x, y). This is the "spot" on the felt.
2. **Cards** — inside/beside the circle, stacked with slight overlap. Rotated by `angle` so they face the center.
3. **ActionButtons** — beside the cards, appearing during player's turn. Not in a box — buttons float over the felt.
4. **TurnTimer** — thin progress bar above the cards when it's the player's turn.
5. **Name + chips** — below the circle. Small text: player name + chip count. "Away" badge if `!player.isActive`.

### Visual States

- **Current turn:** betting circle glows with gold box-shadow. Scale pulse on cards.
- **Inactive/away:** betting circle dimmed, name grayed out, "Away" badge.
- **Busted:** cards flipped face-down, red "BUST" overlay.

---

## 6. TablePage Changes

- Remove the betting button row (`{isBetting && !allBet && localPlayer && (...)}` block)
- Replace with `<BettingArea />` component
- Remove the player flex-wrap row
- Players now rendered via `TableFelt`'s semicircle positioning
- Keep: header bar, DealerArea (but DealerArea simplified — see Section 2), RoundResult, game-over overlay, insurance waiting text, deal/new round buttons

---

## 7. ChipStack Update

Current `ChipStack` renders tiny colored divs. Replace with actual `Chip` components at `size="small"`. Same stacking logic (1-5 visible chips based on amount).

---

## 8. DealerArea Simplification

- Remove the card-like container
- Cards sit directly on the felt
- Dealer avatar is small, beside cards
- Keep insurance badge and blackjack badge
- Keep hand value display

---

## 9. What Stays the Same

- All engine code (types, game, actions, dealing, settlement, shoe, hand, dealer)
- All Firebase code (config, auth, games)
- All stores (gameStore, authStore, uiStore)
- All hooks (useGameSync, useSound)
- CardComponent, CardHand animations
- ActionButtons logic (just visual repositioning)
- TurnTimer logic
- RoundResult logic (just repositioned)
- Lobby components
- Shared components (Button, Modal, PlayerAvatar)

---

## 10. Verification

- `npm run build` — TypeScript + Vite production build succeeds
- `npx vitest run` — all 51 engine tests pass (no engine changes)
- Visual smoke test: create game → bet chips → deal → play hand → see results → new round
