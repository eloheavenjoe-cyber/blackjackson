# Table Atmosphere & Card Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add realistic casino atmosphere (lamp glow, vignette, felt grain, shoe, discard pile, plaque, burn card) and upgrade card visuals (custom back, face card figures, 3D shadow) using CSS for atmosphere and inline SVGs for objects.

**Architecture:** Modify existing TableFelt, CardComponent, DealerArea, and TablePage components. Add three new decorative components (Shoe, DiscardPile, LimitPlaque). Add one CSS keyframe. All visual assets are inline SVG — no external files.

**Tech Stack:** React 19 + TypeScript, Tailwind CSS v4, Framer Motion, inline SVG

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/index.css` | Modify | Lamp flicker `@keyframes` |
| `src/components/Table/TableFelt.tsx` | Modify | Two-layer lamp glow, two-layer vignette, SVG turbulence felt grain |
| `src/components/Table/CardComponent.tsx` | Modify | Export CardBack, casino pattern back, FaceCardFigure SVGs, 3D shadow |
| `src/components/Table/Shoe.tsx` | Create | Inline SVG dealing shoe at top-right |
| `src/components/Table/DiscardPile.tsx` | Create | Stack of face-down cards at top-left, reuses CardBack |
| `src/components/Table/LimitPlaque.tsx` | Create | Brass plaque with min/max bet, positioned at top rim |
| `src/components/Table/DealerArea.tsx` | Modify | Burn card near shoe area |
| `src/components/Table/TablePage.tsx` | Modify | Import and render Shoe, DiscardPile, LimitPlaque |

---

### Task 1: Lamp flicker keyframe

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add lamp-flicker keyframe to index.css**

Edit `src/index.css` — add after the `@utility text-shadow-glow` block (line 31):

```css
@keyframes lamp-flicker {
  0%, 100% { opacity: 1; }
  35% { opacity: 0.94; }
  50% { opacity: 0.92; }
  65% { opacity: 0.95; }
}
```

No test needed — this is a CSS declaration only.

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add lamp-flicker keyframe for table glow animation"
```

---

### Task 2: Table felt — lamp glow, vignette, grain

**Files:**
- Modify: `src/components/Table/TableFelt.tsx`

- [ ] **Step 1: Replace the felt background pattern**

In `src/components/Table/TableFelt.tsx`, replace the `background` style value in the felt div (line 50) from the old dot-pattern SVG URI to the turbulence-filter SVG URI:

**Old (line 50):**
```tsx
          background: `#0a3d1f url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='0.4' fill='%2300000022'/%3E%3C/svg%3E")`,
```

**New:**
```tsx
          background: `#0a3d1f url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`,
```

- [ ] **Step 2: Replace the vignette boxShadow**

In the same `boxShadow` style (lines 45-49), replace the single vignette line:

**Old (lines 46-47):**
```tsx
            inset 0 0 0 3px rgba(212,168,67,0.15),
            inset 0 0 100px rgba(0,0,0,0.5),
```

**New:**
```tsx
            inset 0 0 0 3px rgba(212,168,67,0.15),
            inset 0 0 60px rgba(0,0,0,0.3),
            inset 0 0 150px rgba(0,0,0,0.7),
```

- [ ] **Step 3: Replace the single lamp glow overlay with two layers**

Replace the existing single overlay div (lines 54-60):

**Old (lines 54-60):**
```tsx
        {/* Felt radial highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 50% 35% at 50% 22%, rgba(13,94,46,0.6) 0%, transparent 70%)',
          }}
        />
```

**New:**
```tsx
        {/* Outer lamp glow — wide warm spill */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 45% at 50% 18%, rgba(255,200,100,0.08) 0%, transparent 70%)',
          }}
        />
        {/* Inner lamp hotspot — tight amber focus */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 35% 20% at 50% 22%, rgba(212,168,67,0.25) 0%, transparent 60%)',
            animation: 'lamp-flicker 3.5s ease-in-out infinite',
          }}
        />
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/TableFelt.tsx
git commit -m "feat: upgrade table felt with lamp glow, layered vignette, and fabric grain texture"
```

---

### Task 3: CardComponent — export CardBack, casino pattern, face card figures, 3D shadow

**Files:**
- Modify: `src/components/Table/CardComponent.tsx`

- [ ] **Step 1: Export CardBack**

Change `function CardBack()` (line 44) to `export function CardBack()`:

```tsx
export function CardBack() {
```

- [ ] **Step 2: Rewrite CardBack with casino SVG pattern**

Replace the entire CardBack function body (lines 44-54):

**Old (lines 44-54):**
```tsx
export function CardBack() {
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
```

**New:**
```tsx
export function CardBack() {
  return (
    <div className="w-full h-full rounded-lg border-2 border-blue-400 bg-blue-700 flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 60 84" className="w-full h-full" preserveAspectRatio="none">
        {/* Navy field */}
        <rect x="0" y="0" width="60" height="84" rx="6" fill="#1a2744" />
        {/* Outer gold border */}
        <rect x="4" y="4" width="52" height="76" rx="3" fill="none" stroke="#d4a843" strokeWidth="1" />
        {/* Inner gold border */}
        <rect x="7" y="7" width="46" height="70" rx="2" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        {/* Burgundy diamond medallion */}
        <rect x="18" y="30" width="24" height="24" rx="2" fill="#7b1a2b" transform="rotate(45 30 42)" />
        {/* Diamond inner shadow */}
        <rect x="18" y="30" width="24" height="24" rx="2" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" transform="rotate(45 30 42)" />
        {/* Top-left filigree */}
        <path d="M 7,7 Q 10,11 13,7 M 7,7 Q 11,10 7,13" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        <path d="M 13,7 Q 17,15 22,10" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        {/* Top-right filigree (mirror) */}
        <path d="M 53,7 Q 50,11 47,7 M 53,7 Q 49,10 53,13" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        <path d="M 47,7 Q 43,15 38,10" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        {/* Bottom-left filigree (mirror) */}
        <path d="M 7,77 Q 10,73 13,77 M 7,77 Q 11,74 7,71" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        <path d="M 13,77 Q 17,69 22,74" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        {/* Bottom-right filigree (mirror) */}
        <path d="M 53,77 Q 50,73 47,77 M 53,77 Q 49,74 53,71" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        <path d="M 47,77 Q 43,69 38,74" fill="none" stroke="#d4a843" strokeWidth="0.5" />
      </svg>
    </div>
  )
}
```

- [ ] **Step 3: Add FaceCardFigure SVG helper**

Add a new function after the `suitColors` constant (after line 15) and before `CardFace` (before line 29):

```tsx
const faceCardSizeClasses: Record<string, string> = { sm: '24', md: '30', lg: '36' }

function FaceCardFigure({ rank, suit, size = 'md' }: { rank: string; suit: string; size: string }) {
  const color = suit === 'H' || suit === 'D' ? '#dc2626' : '#111827'
  const dim = faceCardSizeClasses[size] || '30'
  const vb = '0 0 40 40'

  if (rank === 'K') {
    return (
      <svg viewBox={vb} width={dim} height={dim} className="mx-auto">
        {/* Stylized crown */}
        <path d="M 6,28 L 4,16 L 10,22 L 14,12 L 18,22 L 24,16 L 22,28 Z" fill={color} opacity="0.85" />
        {/* Crown jewels */}
        <circle cx="10" cy="20" r="2.5" fill={color} />
        <circle cx="14" cy="12" r="2" fill={color} />
        <circle cx="18" cy="20" r="2.5" fill={color} />
        {/* Crown base band */}
        <rect x="6" y="28" width="16" height="3" rx="1" fill={color} />
        {/* Downward sword */}
        <rect x="13.5" y="28" width="1.5" height="8" rx="0.5" fill={color} opacity="0.6" />
        <rect x="12" y="34" width="4" height="2" rx="0.5" fill={color} opacity="0.6" />
      </svg>
    )
  }

  if (rank === 'Q') {
    return (
      <svg viewBox={vb} width={dim} height={dim} className="mx-auto">
        {/* Curved tiara — 5 arches */}
        <path d="M 5,28 L 2,16 Q 4,14 5,16 L 8,20 L 10,12 Q 12,10 14,12 L 16,20 L 18,16 Q 19,14 20,16 L 23,28 Z" fill={color} opacity="0.85" />
        {/* Tiara pearls */}
        <circle cx="6" cy="18" r="1.5" fill={color} />
        <circle cx="10" cy="14" r="1.5" fill={color} />
        <circle cx="14" cy="12" r="1.5" fill={color} />
        <circle cx="18" cy="14" r="1.5" fill={color} />
        <circle cx="22" cy="18" r="1.5" fill={color} />
        {/* Base band */}
        <rect x="5" y="28" width="18" height="2.5" rx="1" fill={color} />
        {/* Rose motif below */}
        <circle cx="14" cy="35" r="3" fill={color} opacity="0.5" />
        <circle cx="14" cy="35" r="1.5" fill={color} opacity="0.3" />
      </svg>
    )
  }

  if (rank === 'J') {
    return (
      <svg viewBox={vb} width={dim} height={dim} className="mx-auto">
        {/* Flat cap crown */}
        <path d="M 4,28 L 2,16 Q 6,14 14,12 Q 22,14 26,16 L 24,28 Z" fill={color} opacity="0.85" />
        {/* Cap brim */}
        <rect x="2" y="26" width="24" height="2" rx="1" fill={color} />
        {/* Feathered plume */}
        <path d="M 14,12 Q 12,6 10,4" fill="none" stroke={color} strokeWidth="1.2" opacity="0.6" />
        <path d="M 14,12 Q 14,5 16,2" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
        {/* Halberd behind */}
        <rect x="15" y="14" width="2" height="20" rx="0.5" fill={color} opacity="0.35" />
        <path d="M 12,16 L 20,16 L 18,18 L 14,18 Z" fill={color} opacity="0.35" />
      </svg>
    )
  }

  return null
}
```

- [ ] **Step 4: Modify CardFace to use FaceCardFigure for face cards**

In the `CardFace` function, replace the centered suit symbol area (lines 37-39):

**Old (lines 37-39):**
```tsx
        <div className="flex-1 flex items-center justify-center">
          <span className={`${size === 'sm' ? 'text-xl' : 'text-3xl'}`}>{suitSymbols[card.suit]}</span>
        </div>
```

**New:**
```tsx
        <div className="flex-1 flex items-center justify-center">
          {['K', 'Q', 'J'].includes(card.rank) && size !== 'sm' ? (
            <FaceCardFigure rank={card.rank} suit={card.suit} size={size} />
          ) : (
            <span className={`${size === 'sm' ? 'text-xl' : 'text-3xl'}`}>{suitSymbols[card.suit]}</span>
          )}
        </div>
```

- [ ] **Step 5: Upgrade card shadow to 3D edge shadow**

In the `CardComponent` function, replace the `shadow-xl` class with layered inline boxShadow. Replace both the className (line 79) and the existing style (lines 80-82):

**Old (lines 79-82):**
```tsx
      className={`${sizeClasses[size]} rounded-lg shadow-xl flex-shrink-0`}
      style={{
        transformStyle: 'preserve-3d',
      }}
```

**New:**
```tsx
      className={`${sizeClasses[size]} rounded-lg flex-shrink-0`}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: '0 1px 2px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Table/CardComponent.tsx
git commit -m "feat: casino card back, face card figures, 3D edge shadow, export CardBack"
```

---

### Task 4: Dealer shoe component

**Files:**
- Create: `src/components/Table/Shoe.tsx`

- [ ] **Step 1: Create Shoe.tsx**

Write the file `src/components/Table/Shoe.tsx`:

```tsx
import { useMemo } from 'react'

type Props = {
  containerWidth: number
  containerHeight: number
}

export function shoeOrigin(containerWidth: number, containerHeight: number) {
  return {
    x: containerWidth * 0.82,
    y: containerHeight * 0.08,
  }
}

export function DealerShoe({ containerWidth, containerHeight }: Props) {
  const { x, y } = useMemo(
    () => shoeOrigin(containerWidth, containerHeight),
    [containerWidth, containerHeight]
  )

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x - 30, top: y - 12, zIndex: 2 }}
    >
      <svg viewBox="0 0 60 70" width="60" height="50" className="drop-shadow-lg">
        {/* Shoe body — trapezoid */}
        <path
          d="M 6,10 L 4,50 Q 4,60 14,62 L 46,62 Q 56,60 56,48 L 54,10 Z"
          fill="#4a2c0f"
          stroke="#3a1f0a"
          strokeWidth="1"
        />
        {/* Wood grain accent lines */}
        <line x1="10" y1="20" x2="50" y2="20" stroke="#3d2310" strokeWidth="0.5" opacity="0.4" />
        <line x1="8" y1="30" x2="52" y2="30" stroke="#3d2310" strokeWidth="0.5" opacity="0.4" />
        <line x1="7" y1="40" x2="53" y2="40" stroke="#3d2310" strokeWidth="0.5" opacity="0.3" />
        {/* Front opening — dark slit */}
        <rect x="6" y="8" width="48" height="5" rx="1" fill="#1a0d00" />
        {/* Gold trim on face */}
        <rect x="5" y="7" width="50" height="2" rx="1" fill="#d4a843" opacity="0.8" />
        {/* Gold rim on top */}
        <path
          d="M 6,10 L 4,50 Q 4,60 14,62 L 46,62 Q 56,60 56,48 L 54,10"
          fill="none"
          stroke="#d4a843"
          strokeWidth="1.5"
          opacity="0.6"
        />
        {/* Card peeking from opening */}
        <rect x="15" y="2" width="20" height="8" rx="1" fill="#1a2744" />
        <rect x="16" y="3" width="18" height="6" rx="0.5" fill="none" stroke="#d4a843" strokeWidth="0.5" opacity="0.5" />
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/Shoe.tsx
git commit -m "feat: add dealer shoe SVG component with shoeOrigin helper"
```

---

### Task 5: Discard pile component

**Files:**
- Create: `src/components/Table/DiscardPile.tsx`

- [ ] **Step 1: Create DiscardPile.tsx**

Write the file `src/components/Table/DiscardPile.tsx`:

```tsx
import { CardBack } from './CardComponent'

type Props = {
  containerWidth: number
  containerHeight: number
}

const rotationSeed = [4, -2, 6, -4]

export function DiscardPile({ containerWidth, containerHeight }: Props) {
  const x = containerWidth * 0.12
  const y = containerHeight * 0.06
  const cards = 4

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x - 18, top: y - 8, zIndex: 2 }}
    >
      {Array.from({ length: cards }, (_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            transform: `rotate(${rotationSeed[i % rotationSeed.length]}deg)`,
            top: i * 1.5,
            left: i * 1.5,
            zIndex: cards - i,
            width: 32,
            height: 44,
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          <CardBack />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/DiscardPile.tsx
git commit -m "feat: add discard pile component with stacked CardBack"
```

---

### Task 6: Limit plaque component

**Files:**
- Create: `src/components/Table/LimitPlaque.tsx`

- [ ] **Step 1: Create LimitPlaque.tsx**

Write the file `src/components/Table/LimitPlaque.tsx`:

```tsx
type Props = {
  minBet: number
  maxBet: number
}

export function LimitPlaque({ minBet, maxBet }: Props) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-10" style={{ top: -14 }}>
      <svg viewBox="0 0 170 28" width="170" height="28">
        {/* Plaque body with metallic gradient */}
        <defs>
          <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a84c" />
            <stop offset="30%" stopColor="#d4a843" />
            <stop offset="50%" stopColor="#e2c06c" />
            <stop offset="70%" stopColor="#d4a843" />
            <stop offset="100%" stopColor="#a08030" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="170" height="28" rx="6" fill="url(#brass)" />
        {/* Border highlight */}
        <rect x="1" y="1" width="168" height="26" rx="5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        {/* Inner etched shadow */}
        <rect x="2" y="2" width="166" height="24" rx="4" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
        {/* Text — engraved look */}
        <text
          x="85" y="19"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="12"
          fontWeight="700"
          fill="rgba(60,30,0,0.7)"
          letterSpacing="3"
        >
          MIN ${minBet}  ·  MAX ${maxBet}
        </text>
        {/* Text highlight — sheen */}
        <text
          x="85" y="18"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="12"
          fontWeight="700"
          fill="rgba(80,40,0,0.5)"
          letterSpacing="3"
        >
          MIN ${minBet}  ·  MAX ${maxBet}
        </text>
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/LimitPlaque.tsx
git commit -m "feat: add brass limit plaque component"
```

---

### Task 7: Burn card in DealerArea

**Files:**
- Modify: `src/components/Table/DealerArea.tsx`

- [ ] **Step 1: Add CardBack import and burn card near shoe area**

Add `CardBack` to the import from CardComponent. Change line 5:

**Old:**
```tsx
import { CardComponent } from './CardComponent'
```

**New:**
```tsx
import { CardComponent, CardBack } from './CardComponent'
```

- [ ] **Step 2: Render burn card after the dealer cards section**

After the closing `</div>` of the dealer cards flex container (after line 94), add the burn card. The burn card sits near where the shoe would be — to the right of the dealer's cards.

Add after the `</div>` that closes the dealer cards flex section (the `</div>` on line 94):

```tsx
      {/* Burn card — face-down card near shoe position */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: '8%',
          top: '35%',
          transform: 'rotate(15deg)',
          width: 40,
          height: 56,
          boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          zIndex: 1,
        }}
      >
        <CardBack />
      </div>
```

Note: The `DealerArea` container div needs `position: relative` for the absolute positioning to work. Add `relative` to the container div's className. Change line 45:

**Old:**
```tsx
    <div
      className="flex flex-col items-center"
```

**New:**
```tsx
    <div
      className="flex flex-col items-center relative"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Table/DealerArea.tsx
git commit -m "feat: add burn card to dealer area"
```

---

### Task 8: Wire everything in TablePage

**Files:**
- Modify: `src/components/Table/TablePage.tsx`

- [ ] **Step 1: Import new components**

Add imports for the three new components. After line 15 (`import { TurnTimer } from './TurnTimer'`), add:

```tsx
import { DealerShoe, shoeOrigin } from './Shoe'
import { DiscardPile } from './DiscardPile'
import { LimitPlaque } from './LimitPlaque'
```

- [ ] **Step 2: Use shoeOrigin for deal animation**

The `shoeOrigin` hook already exists in TablePage (lines 98-101) as a simple `{ x: dims.width / 2, y: 10 }`. Replace with the exported `shoeOrigin` function. Update lines 98-101:

**Old:**
```tsx
  const shoeOrigin = useMemo(
    () => ({ x: dims.width / 2, y: 10 }),
    [dims]
  )
```

**New:**
```tsx
  const shoeOriginPos = useMemo(
    () => shoeOrigin(dims.width, dims.height),
    [dims]
  )
```

Then update all references to `shoeOrigin` to `shoeOriginPos` — search for `shoeOrigin` in the file. There are 4 usages:

Line 163: `originX={shoeOrigin.x - dims.width / 2}`
Line 164: `originY={shoeOrigin.y - 50}`
Line 237: `originX={shoeOrigin.x - (positions[i]?.x ?? 0)}`
Line 238: `originY={shoeOrigin.y - (positions[i]?.y ?? 0)}`

Change all `shoeOrigin` to `shoeOriginPos` in those lines.

- [ ] **Step 3: Render Shoe and DiscardPile inside TableFelt**

Inside the `TableFelt` component children, add the Shoe and DiscardPile. Add after line 177 (after the closing `</div>` of the header):

```tsx
            {/* Dealer shoe */}
            <DealerShoe containerWidth={dims.width} containerHeight={dims.height} />

            {/* Discard pile */}
            <DiscardPile containerWidth={dims.width} containerHeight={dims.height} />
```

- [ ] **Step 4: Render LimitPlaque outside TableFelt (avoids overflow: hidden clipping)**

The LimitPlaque must sit outside the felt's `overflow: hidden` div at the top edge. Place it as a sibling of `<TableFelt>` inside the `-mt-2` wrapper. Replace the wrapper div at line 169:

**Old (lines 168-169):**
```tsx
      {/* Half-oval table */}
      <div className="relative -mt-2">
```

**New:**
```tsx
      {/* Half-oval table */}
      <div className="relative -mt-2">
        <LimitPlaque minBet={game.rules.minBet} maxBet={game.rules.maxBet} />
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Table/TablePage.tsx
git commit -m "feat: wire shoe, discard pile, and limit plaque into table"
```

---

### Task 9: Verify and final commit

- [ ] **Step 1: Run the test suite**

```bash
npx vitest run
```

Expected: All 57 tests pass. No visual changes affect engine logic or `computePositions`.

- [ ] **Step 2: Run the dev server and visually verify**

```bash
npm run dev
```

Check visually:
- Table felt has visible fabric grain (not the old dots)
- Lamp glow is warm amber/gold, centered at top, with subtle flicker
- Table edges are darker than center (vignette)
- Dealer shoe visible at top-right of felt
- Discard pile visible at top-left of felt
- Burn card visible near dealer area, rotated slightly
- Limit plaque visible at top-center showing bet limits
- Card backs have navy/burgundy/gold casino pattern
- Face cards (K, Q, J) show figure icons on md/lg sizes
- Cards have visible 3D edge shadow
- BettingArea, RoundResult, ActionButtons all work unchanged

- [ ] **Step 3: Final commit**

```bash
git diff --stat
git commit -am "feat: table atmosphere and card polish complete"
```
