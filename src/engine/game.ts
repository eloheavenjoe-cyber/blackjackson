import type { GameState, GameRules, PlayerState } from './types'
import { createShoe } from './shoe'

export function createGame(id: string, hostId: string, rules: GameRules): GameState {
  return {
    id,
    phase: 'waiting',
    hostId,
    rules,
    shoe: createShoe(rules.decks),
    discard: [],
    dealerHand: [],
    dealerHoleCard: null,
    players: [],
    currentTurn: -1,
    turnTimeLimit: rules.turnTimeLimit,
    turnStartedAt: null,
    roundNumber: 0,
    createdAt: Date.now(),
  }
}

export function addPlayer(state: GameState, player: PlayerState): GameState {
  if (state.players.length >= 6) throw new Error('Game is full')
  if (state.phase !== 'waiting') throw new Error('Game already started')
  if (state.players.some((p) => p.id === player.id)) throw new Error('Player already in game')
  const seat = state.players.length
  return {
    ...state,
    players: [...state.players, { ...player, seat }],
  }
}

export function removePlayer(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.filter((p) => p.id !== playerId),
  }
}

export function startGame(state: GameState): GameState {
  if (state.players.length === 0) throw new Error('Need at least one player')
  return {
    ...state,
    phase: 'betting',
    roundNumber: 1,
  }
}

export function setPlayerBet(
  state: GameState,
  playerId: string,
  amount: number
): GameState {
  const player = state.players.find((p) => p.id === playerId)
  if (!player) throw new Error('Player not found')
  if (amount < state.rules.minBet) throw new Error('Bet below minimum')
  if (amount > state.rules.maxBet) throw new Error('Bet above maximum')
  if (amount > player.chips) throw new Error('Insufficient chips')

  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            hands: [{ cards: [], bet: amount, isDoubled: false, isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0 }],
            activeHandIndex: 0,
            chips: p.chips - amount,
          }
        : p
    ),
  }
}

export function allBetsPlaced(state: GameState): boolean {
  return state.players.every((p) => p.hands.length > 0 && p.hands[0].bet > 0)
}

export function startNewRound(state: GameState): GameState {
  return {
    ...state,
    phase: 'betting',
    roundNumber: state.roundNumber + 1,
    dealerHand: [],
    dealerHoleCard: null,
    currentTurn: -1,
    turnStartedAt: null,
    discard: [...state.discard, ...state.dealerHand, ...state.players.flatMap((p) => p.hands.flatMap((h) => h.cards))],
    players: state.players.map((p) => ({
      ...p,
      hands: [],
      activeHandIndex: 0,
      isActive: true,
      insuranceBet: 0,
    })),
  }
}
