# Table Atmosphere & Card Polish — Design Spec

**Date:** 2026-06-04
**Scope:** 10 polish items across two categories
**Approach:** CSS for atmosphere effects, inline SVG for physical objects

---

## Overview

Enhance the Blackjack table with realistic casino atmosphere (lighting, shadows, felt texture) and physical props (dealer shoe, discard pile, plaque, burn card), plus upgrade playing card visuals (custom card back, face card figures, 3D edge shadow). All assets are inline SVG — no external image files.

---

## Section 1 — Lighting & Atmosphere

### 1.1 Lamp Glow

Replace the current simple radial highlight on the table felt with a warm hanging-lamp glow.

**Implementation:** Modify `TableFelt.tsx` — replace the existing single `radial-gradient` overlay div with two layered gradient overlays.

- **Outer glow:** `radial-gradient(ellipse 60% 45% at 50% 18%, rgba(255,200,100,0.08) 0%, transparent 70%)` — covers most of the table
- **Inner hotspot:** `radial-gradient(ellipse 35% 20% at 50% 22%, rgba(212,168,67,0.25) 0%, transparent 60%)` — focused at top-center
- **Flicker animation:** CSS `@keyframes` in `index.css` — opacity pulses between 1.0 and 0.92 over 3.5s with `ease-in-out`, applied to the inner hotspot. Barely perceptible, simulates a real lamp.

### 1.2 Dark Vignette

Enhance the existing vignette shadow. Currently a single `inset 0 0 100px rgba(0,0,0,0.5)`.

**Implementation:** Modify `TableFelt.tsx` — layer two inset shadows in the felt div's `boxShadow`:

- **Inner ring:** `inset 0 0 60px rgba(0,0,0,0.3)` — soft internal shadow near edges
- **Outer fade:** `inset 0 0 150px rgba(0,0,0,0.7)` — darker edges fading toward center
- The existing gold-ring shadow and drop shadow remain as-is
- Net effect: table edges are noticeably darker, center naturally brighter, reinforcing the lamp

### 1.3 Felt Grain Upgrade

Replace the current 4px-dot SVG pattern with an SVG `<feTurbulence>` filter producing fabric-like noise.

**Implementation:** Update the felt background in `TableFelt.tsx`:

- Use an SVG filter with `<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3">`
- Blend at very low opacity via `<feColorMatrix>` — applied as a CSS `background-image` using a `data:image/svg+xml` URI
- Base felt color `#0a3d1f` stays, grain sits on top at `opacity: 0.04`
- Remove the old dot-pattern SVG URI

---

## Section 2 — Table Objects

### 2.1 Dealer Shoe

**New component:** `src/components/Table/Shoe.tsx`

A wedge-shaped inline SVG depicting a card-dealing shoe, positioned at the table's top-right where cards originate.

**Visual:**
- Trapezoidal body: wider at back, narrowing to front opening
- Dark wood brown base color (`#4a2c0f`) with lighter wood grain accents
- Gold/metallic trim on edges (`#d4a843`)
- A visible card peeking from the front opening (reuses `CardBack` colors)
- Subtle `boxShadow` for depth on the felt surface
- Positioned via `position: absolute`, `right: 8%`, `top: 5%` within the felt

**API:**
```tsx
<DealerShoe />
```
No props — purely decorative. Accepts `originX`/`originY` as optional to position the dealing origin point used by deal animations.

### 2.2 Discard Pile

**New component:** `src/components/Table/DiscardPile.tsx`

A small stack of face-down cards staggered with slight rotations, positioned opposite the shoe.

**Visual:**
- 3-4 cards stacked, bottom cards rotate ±3° each, top card slightly off-aligned
- All cards face-down using the new custom card back design
- Top card optionally face-up with a decorative random card (not game-state-driven)
- Wrapper div with `position: absolute`, `left: 8%`, `top: 5%`

**API:**
```tsx
<DiscardPile />
```
Purely decorative, no props.

### 2.3 Burn Card

A single face-down card near the dealer shoe opening.

**Implementation:** Rendered inside `DealerArea.tsx` or as a child of `TableFelt` — positioned near the shoe:

- Uses the new `CardBack` component, slightly smaller (or `sm` size)
- Rotated ~15° via CSS `transform`
- Subtle `boxShadow`
- Purely decorative

### 2.4 Table Limit Plaque

**New component:** `src/components/Table/LimitPlaque.tsx`

A brass/gold sign at the top-center edge of the table showing min/max bet limits.

**Visual:**
- Inline SVG rectangle with rounded corners (`rx="8"`)
- Gold gradient fill simulating metallic brass
- Dark engraved-style text: "MIN $X · MAX $Y"
- Subtle border highlight for metallic sheen effect
- Positioned near the table's top rim (above felt, below shoe)

**API:**
```tsx
<LimitPlaque minBet={number} maxBet={number} />
```
Reads from `rules.minBet` and `rules.maxBet` — dynamically displays the current table limits.

---

## Section 3 — Card Polish

### 3.1 Custom Card Back

Replace the current `CardBack` component's blue 3x3 grid with a rich casino-style SVG pattern.

**File:** `src/components/Table/CardComponent.tsx` (the `CardBack` function)

**Visual:**
- Deep navy/blue field background (`#1a2744`)
- Burgundy-red diamond medallion at center (`#7b1a2b`)
- Gold filigree corner flourishes — thin `<path>` curves creating symmetrical ornaments
- Thin gold double-border inset ~3px from edges (`#d4a843`)
- Subtle internal drop-shadow on the diamond medallion
- Keeps the existing rounded card shape and border

### 3.2 Face Card Figures (K, Q, J)

Add inline SVG portrait icons to face cards, replacing the large centered suit symbol on King, Queen, and Jack cards.

**File:** `src/components/Table/CardComponent.tsx` (the `CardFace` function)

**Figures (all monochrome in the card's suit color):**

- **King (K):** 3-pointed crown with jewel accents + downward-pointing sword behind the suit symbol
- **Queen (Q):** 5-pointed curved tiara + flower/rose motif behind the suit symbol
- **Jack (J):** Simplified cap crown + feathered halberd/pike behind the suit symbol

**Sizing and rendering rules:**
- Rendered on `lg` size (dealer cards) and `md` size (player cards) — figure is ~40x40px
- `sm` size (hand overviews) keeps text-only — figure would be illegible anyway
- The existing top-left rank + suit stays unchanged
- The figure replaces the large centered suit symbol **only on face cards** (rank K, Q, J)
- Non-face cards (A, 2-10) keep the existing large centered suit symbol

**Implementation strategy:** Create a helper function `FaceCardFigure({ rank, suit, size })` that returns the appropriate SVG for the given rank, or `null` for non-face ranks.

### 3.3 Card 3D Edge Shadow

Upgrade cards from the current `shadow-xl` to a layered shadow simulating physical card stock thickness.

**File:** `src/components/Table/CardComponent.tsx`

**Layered boxShadow:**
- Tight edge shadow: `0 1px 2px rgba(0,0,0,0.8)` — the card's physical thickness
- Ambient shadow: `0 2px 8px rgba(0,0,0,0.5)` — separation from felt
- Rim light: `inset 0 1px 0 rgba(255,255,255,0.1)` — subtle top-edge highlight

### 3.4 Burn Card

Covered in Section 2.3. Reuses the new card back design.

---

## Component Impact Summary

| Component | Action | What Changes |
|-----------|--------|-------------|
| `TableFelt.tsx` | Modify | Lamp glow (2-layer), vignette (2-layer inset shadow), felt grain (SVG filter) |
| `DealerArea.tsx` | Modify | Add burn card near shoe position |
| `CardComponent.tsx` | Modify | New `CardBack` SVG, `FaceCardFigure` helper, 3D edge shadow |
| `TablePage.tsx` | Modify | Import and render `Shoe`, `DiscardPile`, `LimitPlaque` in the felt area |
| `index.css` | Modify | Lamp flicker `@keyframes`, any new utility classes |
| `Shoe.tsx` (new) | Create | Dealer dealing shoe SVG |
| `DiscardPile.tsx` (new) | Create | Discarded cards stack |
| `LimitPlaque.tsx` (new) | Create | Min/max bet plaque |

## Non-Goals

- Sound effects (separate polish category)
- Mobile layout changes (separate known issue)
- Player disconnect handling (separate known issue)
- Any gameplay or engine changes
- Any Firebase/Firestore changes

## Testing

- Visual verification: run `npm run dev` and inspect the table at various window sizes
- Existing Vitest suite must continue to pass (`npx vitest run`)
- `computePositions` test in `TableFelt.test.ts` must be unaffected
- No new unit tests required (purely visual polish)
