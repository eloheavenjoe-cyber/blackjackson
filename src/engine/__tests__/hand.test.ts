import { describe, it, expect } from 'vitest'
import { evaluateHand, calculateHandValue } from '../hand'
import type { Card } from '../types'

describe('evaluateHand', () => {
  it('evaluates blackjack (A + 10)', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'A' },
      { suit: 'H', rank: 'K' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(21)
    expect(result.isBlackjack).toBe(true)
    expect(result.isBust).toBe(false)
    expect(result.soft).toBe(true)
  })

  it('evaluates soft hand (A + 7)', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'A' },
      { suit: 'H', rank: '7' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(18)
    expect(result.soft).toBe(true)
    expect(result.isBlackjack).toBe(false)
  })

  it('evaluates hard 17', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'K' },
      { suit: 'H', rank: '7' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(17)
    expect(result.soft).toBe(false)
  })

  it('evaluates bust (10 + 7 + 6)', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'K' },
      { suit: 'H', rank: '7' },
      { suit: 'D', rank: '6' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(23)
    expect(result.isBust).toBe(true)
  })

  it('converts soft ace to hard when busting (A + 6 + 9)', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'A' },
      { suit: 'H', rank: '6' },
      { suit: 'D', rank: '9' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(16)
    expect(result.soft).toBe(false)
  })

  it('handles multiple aces (A + A + 9)', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'A' },
      { suit: 'H', rank: 'A' },
      { suit: 'D', rank: '9' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(21)
    expect(result.soft).toBe(true)
  })

  it('blackjack requires exactly 2 cards', () => {
    const hand: Card[] = [
      { suit: 'S', rank: 'A' },
      { suit: 'H', rank: '5' },
      { suit: 'D', rank: '5' },
    ]
    const result = evaluateHand(hand)
    expect(result.value).toBe(21)
    expect(result.isBlackjack).toBe(false)
  })
})

describe('calculateHandValue', () => {
  it('returns numeric value', () => {
    expect(calculateHandValue([
      { suit: 'S', rank: 'K' },
      { suit: 'H', rank: '6' },
    ])).toBe(16)
  })
})
