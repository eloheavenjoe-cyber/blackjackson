import { describe, it, expect } from 'vitest'
import { settleHands } from '../settlement'
import type { GameState, GameRules } from '../types'

const rules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 30,
}

describe('settleHands', () => {
  it('player wins if higher than dealer', () => {
    const state: GameState = {
      id: 'T1', phase: 'settlement', hostId: 'host', rules,
      shoe: [], discard: [],
      dealerHand: [{ suit: 'H', rank: 'K' }, { suit: 'D', rank: '6' }],
      dealerHoleCard: null,
      players: [{
        id: 'p1', name: 'Alice', seat: 0,
        hands: [{ cards: [{ suit: 'S', rank: 'K' }, { suit: 'C', rank: '8' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: true, result: 'pending', payout: 0 }],
        activeHandIndex: 0, chips: 950, isActive: true, insuranceBet: 0,
      }],
      currentTurn: -1, turnTimeLimit: 0, turnStartedAt: null,
      roundNumber: 1, createdAt: Date.now(),
    }
    const result = settleHands(state)
    expect(result.players[0].hands[0].result).toBe('win')
    expect(result.players[0].chips).toBe(1050)
  })

  it('player blackjack pays 3:2', () => {
    const state: GameState = {
      id: 'T1', phase: 'settlement', hostId: 'host', rules,
      shoe: [], discard: [],
      dealerHand: [{ suit: 'H', rank: 'K' }, { suit: 'D', rank: '9' }],
      dealerHoleCard: null,
      players: [{
        id: 'p1', name: 'Alice', seat: 0,
        hands: [{ cards: [{ suit: 'S', rank: 'A' }, { suit: 'C', rank: 'K' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: true, result: 'pending', payout: 0 }],
        activeHandIndex: 0, chips: 950, isActive: true, insuranceBet: 0,
      }],
      currentTurn: -1, turnTimeLimit: 0, turnStartedAt: null,
      roundNumber: 1, createdAt: Date.now(),
    }
    const result = settleHands(state)
    expect(result.players[0].hands[0].result).toBe('blackjack')
    expect(result.players[0].chips).toBe(1075) // 950 existing + 50 bet returned + 75 winnings
  })
})
