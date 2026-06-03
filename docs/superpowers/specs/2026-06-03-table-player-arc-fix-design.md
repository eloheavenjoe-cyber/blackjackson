# Blackjackson — Fix Player Arc Positioning

**Date:** 2026-06-03
**Scope:** Fix `computePositions` so player spots land on the visible felt along the bottom arc

---

## 1. Problem

`computePositions` (`src/components/Table/TableFelt.tsx:9-29`) uses an arc from 225° to 315° — the bottom-left-to-bottom-right quadrant going through the **top** of the ellipse (270°, where `sin = -1`). This produces a concave-up curve with negative Y values, pulling player positions above or outside the visible felt area. Players appear clustered in the center or clipped.

Current parameters:
- `cy = height * 0.25`, `ry = height * 0.40`
- At 270°: `y = 0.25h - 0.40h = -0.15h` (above felt)
- At 225°/315°: `y = 0.25h - 0.28h = -0.03h` (near top edge)

---

## 2. Solution

Flip the arc to the bottom half of the ellipse (20° → 160°, going through 90° where `sin = +1`), producing a concave-down curve that follows the table's half-oval shape.

### Modified: `src/components/Table/TableFelt.tsx` — `computePositions`

**Before:**
```typescript
const cx = width / 2
const cy = height * 0.25
const rx = width * 0.36
const ry = height * 0.40
const startAngle = 225 * (Math.PI / 180)
const endAngle = 315 * (Math.PI / 180)
```

**After:**
```typescript
const cx = width / 2
const cy = height * 0.60
const rx = width * 0.36
const ry = height * 0.18
const startAngle = 160 * (Math.PI / 180)
const endAngle = 20 * (Math.PI / 180)
```

### 1-player special case

**Before:** `{ x: width / 2, y: height * 0.58 }`
**After:** `{ x: width / 2, y: height * 0.72 }`

---

## 3. Geometry Verification

For default dimensions 800×500 with 6 players (150° arc, 30°/seat):

| Seat | Angle | X (% of width) | Y (% of height) |
|------|-------|-----------------|------------------|
| 0 (far left) | 160° | 16% | 66% |
| 1 | 130° | 27% | 74% |
| 2 | 100° | 44% | 78% |
| 3 (bottom center) | 70° | 62% | 77% |
| 4 | 40° | 78% | 72% |
| 5 (far right) | 20° | 84% | 66% |

All Y values fall within the visible felt (0–100%). The arc follows the table's bottom curve, deepest at center (78%) and rising toward the sides (66%).

For 1 player: dead center at 72% height.

---

## 4. What Does Not Change

- `PlayerPosition` component — still receives `x`, `y`, `angle` props
- `TablePage` — resize listener, `useMemo`, rendering loop unchanged
- `TableFelt` container — dimensions, border-radius, overflow hidden unchanged
- Angle computation in return value — still `angle - Math.PI/2` for seat rotation

---

## 5. Verification

- Run existing engine tests: `npx vitest run` (51 tests, no expected regressions)
- Visual: `npm run dev`, create game with 3+ players, confirm spots spread across lower half of felt following the table curve
