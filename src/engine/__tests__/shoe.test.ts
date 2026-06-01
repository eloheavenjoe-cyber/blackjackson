import { describe, it, expect } from 'vitest'
import { createShoe, drawCard, needsReshuffle } from '../shoe'

describe('createShoe', () => {
  it('creates correct number of cards', () => {
    const shoe = createShoe(1)
    expect(shoe.length).toBe(52)
  })

  it('creates 6 decks with 312 cards', () => {
    const shoe = createShoe(6)
    expect(shoe.length).toBe(312)
  })

  it('contains all ranks and suits', () => {
    const shoe = createShoe(1)
    const suits = new Set(shoe.map((c) => c.suit))
    const ranks = new Set(shoe.map((c) => c.rank))
    expect(suits.size).toBe(4)
    expect(ranks.size).toBe(13)
  })
})

describe('drawCard', () => {
  it('draws a card and reduces shoe size', () => {
    const shoe = createShoe(1)
    const initialLength = shoe.length
    const { card, remaining } = drawCard(shoe)
    expect(card).toBeDefined()
    expect(remaining.length).toBe(initialLength - 1)
  })

  it('returns null when shoe is empty', () => {
    const { card } = drawCard([])
    expect(card).toBeNull()
  })
})

describe('needsReshuffle', () => {
  it('returns true when shoe is below 25% threshold', () => {
    const shoe = createShoe(6)
    const threshold = Math.floor(312 * 0.25)
    const cutShoe = shoe.slice(0, threshold - 1)
    expect(needsReshuffle(cutShoe, 6)).toBe(true)
  })

  it('returns false when shoe is above 25% threshold', () => {
    const shoe = createShoe(6)
    expect(needsReshuffle(shoe, 6)).toBe(false)
  })
})
