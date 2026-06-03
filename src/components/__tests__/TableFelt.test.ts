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
