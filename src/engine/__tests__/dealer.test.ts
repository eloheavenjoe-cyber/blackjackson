import { describe, it, expect } from 'vitest'
import { playDealer } from '../dealer'
import { evaluateHand } from '../hand'
import type { GameState, GameRules } from '../types'

const s17Rules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 30,
}
const h17Rules: GameRules = { ...s17Rules, dealerSoft17: 'hit' }

describe('playDealer', () => {
  it('dealer stands on 17 with S17 rule', () => {
    const state: GameState = {
      id: 'T1', phase: 'dealer', hostId: 'host', rules: s17Rules,
      shoe: [{ suit: 'S', rank: '5' }],
      discard: [], dealerHand: [{ suit: 'H', rank: 'K' }, { suit: 'D', rank: '7' }],
      dealerHoleCard: null, players: [], currentTurn: -1,
      turnTimeLimit: 0, turnStartedAt: null, roundNumber: 1, createdAt: Date.now(),
    }
    const result = playDealer(state)
    expect(evaluateHand(result.dealerHand).value).toBe(17)
  })

  it('dealer draws to 17+', () => {
    const state: GameState = {
      id: 'T1', phase: 'dealer', hostId: 'host', rules: s17Rules,
      shoe: [{ suit: 'S', rank: '3' }, { suit: 'C', rank: 'K' }],
      discard: [], dealerHand: [{ suit: 'H', rank: '3' }, { suit: 'D', rank: '4' }],
      dealerHoleCard: null, players: [], currentTurn: -1,
      turnTimeLimit: 0, turnStartedAt: null, roundNumber: 1, createdAt: Date.now(),
    }
    const result = playDealer(state)
    expect(evaluateHand(result.dealerHand).value).toBe(20)
  })
})
