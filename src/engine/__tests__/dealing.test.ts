import { describe, it, expect } from 'vitest'
import { dealInitialHands } from '../dealing'
import { createGame, addPlayer, startGame, setPlayerBet } from '../game'
import type { GameRules, PlayerState } from '../types'

const defaultRules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 30,
}

function makePlayer(id: string, name: string): PlayerState {
  return {
    id, name, seat: 0, hands: [],
    activeHandIndex: 0, chips: 1000, isActive: true, insuranceBet: 0,
  }
}

describe('dealInitialHands', () => {
  it('deals 2 cards to each player and dealer', () => {
    let game = createGame('ABC123', 'host-1', defaultRules)
    game = addPlayer(game, makePlayer('p1', 'Alice'))
    game = addPlayer(game, makePlayer('p2', 'Bob'))
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = setPlayerBet(game, 'p2', 100)
    game = dealInitialHands(game)

    expect(game.phase === 'playing' || game.phase === 'insurance' || game.phase === 'settlement').toBe(true)
    expect(game.players[0].hands[0].cards).toHaveLength(2)
    expect(game.players[1].hands[0].cards).toHaveLength(2)
    expect(game.dealerHand).toHaveLength(2)
    expect(game.shoe.length).toBe(312 - 6)
  })

  it('transitions to insurance phase when insurance enabled and dealer shows Ace', () => {
    let game = createGame('ABC123', 'host-1', { ...defaultRules, insurance: true })
    game = addPlayer(game, makePlayer('p1', 'Alice'))
    game = startGame(game)
    game = setPlayerBet(game, 'p1', 50)
    game = dealInitialHands(game)

    const dealerUpcard = game.dealerHand[0]
    if (dealerUpcard.rank === 'A') {
      expect(game.phase).toBe('insurance')
    }
  })

  it('transitions to playing phase normally', () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      let game = createGame('ABC123', 'host-1', { ...defaultRules, insurance: false })
      game = addPlayer(game, makePlayer('p1', 'Alice'))
      game = startGame(game)
      game = setPlayerBet(game, 'p1', 50)
      game = dealInitialHands(game)

      const dealerUpcard = game.dealerHand[0]
      if (dealerUpcard.rank !== 'A') {
        expect(game.phase).toBe('playing')
        return
      }
    }
  })
})
