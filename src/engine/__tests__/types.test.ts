import { describe, it, expect } from 'vitest'
import type { Card, Suit, Rank, GamePhase, GameRules, PlayerState, HandState, GameState } from '../types'

describe('Card type', () => {
  it('accepts valid card', () => {
    const card: Card = { suit: 'H', rank: 'A' }
    expect(card.suit).toBe('H')
    expect(card.rank).toBe('A')
  })
})

describe('GameRules defaults', () => {
  it('has all required fields', () => {
    const rules: GameRules = {
      decks: 6,
      dealerSoft17: 'stand',
      blackjackPayout: '3:2',
      surrender: 'none',
      insurance: false,
      doubleDown: 'any',
      splits: 'once',
      startingChips: 1000,
      minBet: 10,
      maxBet: 500,
      turnTimeLimit: 30,
    }
    expect(rules.decks).toBe(6)
  })
})
