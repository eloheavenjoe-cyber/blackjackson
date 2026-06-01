import { describe, it, expect } from 'vitest'
import { processAction } from '../actions'
import { dealInitialHands } from '../dealing'
import { createGame, addPlayer, startGame, setPlayerBet } from '../game'
import { evaluateHand, calculateHandValue } from '../hand'
import type { GameRules, PlayerState } from '../types'

const rules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 0,
}

function setup() {
  let game = createGame('T1', 'host', rules)
  game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0 })
  game = addPlayer(game, { id: 'p2', name: 'Bob', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0 })
  game = startGame(game)
  game = setPlayerBet(game, 'p1', 50)
  game = setPlayerBet(game, 'p2', 50)
  game = dealInitialHands(game)
  return game
}

describe('processAction - stand', () => {
  it('advances turn', () => {
    let game = setup()
    game = processAction(game, { type: 'stand', playerId: 'p1' })
    expect(game.currentTurn).toBe(1)
    expect(game.players[0].hands[0].isStood).toBe(true)
  })
})

describe('processAction - split', () => {
  it('splits a pair into two hands', () => {
    let game = createGame('T2', 'host', rules)
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0 })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '8' }, { suit: 'D', rank: '8' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    game = processAction(game, { type: 'split', playerId: 'p1' })
    expect(game.players[0].hands).toHaveLength(2)
    expect(game.players[0].hands[0].cards).toHaveLength(2)
    expect(game.players[0].hands[1].cards).toHaveLength(2)
  })
})
