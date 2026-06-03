# Fix Player Arc Positioning — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `computePositions` so player spots render on the visible table felt along a concave-down arc matching the half-oval shape.

**Architecture:** Pure parameter change in one function — flip arc from top-half (225°-315°, concave up) to bottom-half (20°-160°, concave down), adjust ellipse center and vertical radius. No component or store changes.

**Tech Stack:** TypeScript, Vitest

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/components/Table/TableFelt.tsx:13-18` | Modify | Fix `computePositions` parameters + 1-player case |
| `src/components/__tests__/TableFelt.test.ts` | Create | Unit tests for `computePositions` |

---

### Task 1: Write failing test for `computePositions`

**Files:**
- Create: `src/components/__tests__/TableFelt.test.ts`

- [ ] **Step 1: Create test file with tests that assert positions fall within table bounds**

```typescript
import { describe, it, expect } from 'vitest'
import { computePositions } from '../Table/TableFelt'

describe('computePositions', () => {
  const W = 800
  const H = 500

  it('returns empty array for 0 players', () => {
    expect(computePositions(0, W, H)).toEqual([])
  })

  it('places single player at center, lower third', () => {
    const [pos] = computePositions(1, W, H)
    expect(pos.x).toBe(W / 2)
    expect(pos.y).toBeGreaterThan(H * 0.55)
    expect(pos.y).toBeLessThan(H * 0.90)
    expect(pos.angle).toBe(0)
  })

  it('positions all players within table bounds (visible felt)', () => {
    for (const count of [2, 3, 4, 5, 6]) {
      const positions = computePositions(count, W, H)
      expect(positions).toHaveLength(count)
      for (const pos of positions) {
        // All positions must be inside the container
        expect(pos.x).toBeGreaterThan(0)
        expect(pos.x).toBeLessThan(W)
        expect(pos.y).toBeGreaterThan(0)
        expect(pos.y).toBeLessThan(H)
      }
    }
  })

  it('spreads players horizontally across the width', () => {
    const positions = computePositions(6, W, H)
    // First seat (far left) should be in left portion
    expect(positions[0].x).toBeLessThan(W * 0.35)
    // Last seat (far right) should be in right portion
    expect(positions[5].x).toBeGreaterThan(W * 0.65)
  })

  it('positions follow concave-down curve (center deeper than sides)', () => {
    const positions = computePositions(6, W, H)
    const centerPos = positions[Math.floor(positions.length / 2)]
    // Center should be lower (higher Y) than outer positions
    expect(centerPos.y).toBeGreaterThan(positions[0].y)
    expect(centerPos.y).toBeGreaterThan(positions[positions.length - 1].y)
  })

  it('produces monotonically rightward x values', () => {
    const positions = computePositions(6, W, H)
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].x).toBeGreaterThan(positions[i - 1].x)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/TableFelt.test.ts
```

Expected: multiple failures — positions outside bounds, wrong curve direction, etc.

- [ ] **Step 3: Commit failing tests**

```bash
git add src/components/__tests__/TableFelt.test.ts
git commit -m "test: add computePositions unit tests (failing)"
```

---

### Task 2: Apply the fix

**Files:**
- Modify: `src/components/Table/TableFelt.tsx:9-29`

- [ ] **Step 1: Update `computePositions` parameters**

Replace lines 13-18:

```typescript
  const cx = width / 2
  const cy = height * 0.25
  const rx = width * 0.36
  const ry = height * 0.40
  const startAngle = 225 * (Math.PI / 180)
  const endAngle = 315 * (Math.PI / 180)
```

With:

```typescript
  const cx = width / 2
  const cy = height * 0.60
  const rx = width * 0.36
  const ry = height * 0.18
  const startAngle = 160 * (Math.PI / 180)
  const endAngle = 20 * (Math.PI / 180)
```

- [ ] **Step 2: Update 1-player special case**

Replace line 11:

```typescript
  if (count === 1) return [{ x: width / 2, y: height * 0.58, angle: 0 }]
```

With:

```typescript
  if (count === 1) return [{ x: width / 2, y: height * 0.72, angle: 0 }]
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all 51 engine tests pass + all 6 new `computePositions` tests pass.

- [ ] **Step 4: Commit fix**

```bash
git add src/components/Table/TableFelt.tsx
git commit -m "fix: correct player arc to follow table's bottom curve"
```

---

### Task 3: Visual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open browser and verify**

1. Create a game with 3+ players
2. Confirm player spots spread across the lower half of the felt
3. Confirm spots follow the half-oval curve (center deeper, sides higher)
4. Test with 1 player — spot at center, lower third
5. Test with 6 players — all spots visible, no clipping

- [ ] **Step 3: Commit if any visual adjustments needed, otherwise done**

No code changes expected.
