import { describe, it, expect } from 'vitest'
import { processAction } from '../actions'
import { dealInitialHands } from '../dealing'
import { createGame, addPlayer, startGame, setPlayerBet } from '../game'
import type { GameRules } from '../types'

const rules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 0,
}

function setup() {
  let game = createGame('T1', 'host', rules)
  game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
  game = addPlayer(game, { id: 'p2', name: 'Bob', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
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
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
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

describe('processAction - double', () => {
  it('blocks double when rules.doubleDown is none', () => {
    let game = createGame('T3', 'host', { ...rules, doubleDown: 'none' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '9' }, { suit: 'D', rank: '2' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    expect(() => processAction(game, { type: 'double', playerId: 'p1' })).toThrow('Double down is not allowed')
  })

  it('blocks double on 8 when rules.doubleDown is 9-10-11', () => {
    let game = createGame('T4', 'host', { ...rules, doubleDown: '9-10-11' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '5' }, { suit: 'D', rank: '3' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    expect(() => processAction(game, { type: 'double', playerId: 'p1' })).toThrow('Double down only allowed on 9, 10, or 11')
  })

  it('allows double on 10 when rules.doubleDown is 9-10-11', () => {
    let game = createGame('T5', 'host', { ...rules, doubleDown: '9-10-11' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '5' }, { suit: 'D', rank: '5' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    game = processAction(game, { type: 'double', playerId: 'p1' })
    expect(game.players[0].hands[0].isDoubled).toBe(true)
    expect(game.players[0].hands[0].bet).toBe(100)
  })

  it('blocks double after hitting (more than 2 cards)', () => {
    let game = createGame('T6', 'host', rules)
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '5' }, { suit: 'D', rank: '3' }, { suit: 'C', rank: '2' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    expect(() => processAction(game, { type: 'double', playerId: 'p1' })).toThrow()
  })
})

describe('processAction - surrender', () => {
  it('blocks surrender after hitting (more than 2 cards)', () => {
    let game = createGame('T7', 'host', { ...rules, surrender: 'late' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: '5' }, { suit: 'D', rank: '3' }, { suit: 'C', rank: '2' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    expect(() => processAction(game, { type: 'surrender', playerId: 'p1' })).toThrow('Can only surrender on initial two cards')
  })

  it('allows surrender on two cards', () => {
    let game = createGame('T8', 'host', { ...rules, surrender: 'late' })
    game = addPlayer(game, { id: 'p1', name: 'Alice', seat: 0, hands: [], activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0, insuranceDecided: false })
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = {
      ...game,
      phase: 'playing' as const,
      currentTurn: 0,
      players: game.players.map((p) => ({
        ...p,
        hands: [{ cards: [{ suit: 'H', rank: 'K' }, { suit: 'D', rank: '6' }], bet: 50, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
      })),
    }
    const result = processAction(game, { type: 'surrender', playerId: 'p1' })
    expect(result.players[0].hands[0].isSurrendered).toBe(true)
    expect(result.players[0].hands[0].result).toBe('lose')
    expect(result.players[0].chips).toBe(975) // 950 + 25 (half bet returned)
  })
})
