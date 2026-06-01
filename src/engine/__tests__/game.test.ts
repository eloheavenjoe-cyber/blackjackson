import { describe, it, expect } from 'vitest'
import { createGame, addPlayer, removePlayer, startGame } from '../game'
import type { GameRules, PlayerState } from '../types'

const defaultRules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 30,
}

describe('createGame', () => {
  it('creates game in waiting phase', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    expect(game.id).toBe('ABC123')
    expect(game.hostId).toBe('host-1')
    expect(game.phase).toBe('waiting')
    expect(game.players).toHaveLength(0)
    expect(game.shoe).toHaveLength(312)
  })
})

describe('addPlayer', () => {
  it('adds player with correct seat and chips', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    const player: PlayerState = {
      id: 'p1', name: 'Alice', seat: 0, hands: [],
      activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
    }
    const updated = addPlayer(game, player)
    expect(updated.players).toHaveLength(1)
    expect(updated.players[0].name).toBe('Alice')
  })

  it('rejects when game is full (6 players)', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    let state = game
    for (let i = 0; i < 6; i++) {
      state = addPlayer(state, {
        id: `p${i}`, name: `Player${i}`, seat: i, hands: [],
        activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
      })
    }
    expect(() => addPlayer(state, {
      id: 'p7', name: 'Extra', seat: 6, hands: [],
      activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
    })).toThrow('Game is full')
  })
})

describe('removePlayer', () => {
  it('removes player by id', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    let state = addPlayer(game, {
      id: 'p1', name: 'Alice', seat: 0, hands: [],
      activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
    })
    state = removePlayer(state, 'p1')
    expect(state.players).toHaveLength(0)
  })
})

describe('startGame', () => {
  it('transitions to betting phase and deals initial hands', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    let state = addPlayer(game, {
      id: 'p1', name: 'Alice', seat: 0, hands: [],
      activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
    })
    state = startGame(state)
    expect(state.phase).toBe('betting')
    expect(state.roundNumber).toBe(1)
  })

  it('throws if no players', () => {
    const game = createGame('ABC123', 'host-1', defaultRules)
    expect(() => startGame(game)).toThrow('Need at least one player')
  })
})
