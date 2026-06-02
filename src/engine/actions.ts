import type { GameState, PlayerAction } from './types'
import { drawCard, needsReshuffle, reshuffleDiscard } from './shoe'
import { evaluateHand, calculateHandValue } from './hand'

function draw(state: GameState): { state: GameState; card: import('./types').Card | null } {
  if (needsReshuffle(state.shoe, state.rules.decks)) {
    const reshuffled = reshuffleDiscard([...state.discard])
    return { state: { ...state, shoe: reshuffled, discard: [] }, card: null }
  }
  const { card, remaining } = drawCard(state.shoe)
  return { state: { ...state, shoe: remaining }, card }
}

function advanceTurn(state: GameState): GameState {
  const nextTurn = getNextActivePlayer(state, state.currentTurn)
  if (nextTurn === -1) {
    return { ...state, phase: 'dealer', currentTurn: -1 }
  }
  return { ...state, currentTurn: nextTurn, turnStartedAt: Date.now() }
}

function getNextActivePlayer(state: GameState, from: number): number {
  for (let i = from + 1; i < state.players.length; i++) {
    const p = state.players[i]
    const activeHand = p.hands[p.activeHandIndex]
    if (activeHand && !activeHand.isStood && !activeHand.isSurrendered) {
      const ev = evaluateHand(activeHand.cards)
      if (!ev.isBust) return i
    }
  }
  return -1
}

export function allInsuranceDecided(state: GameState): boolean {
  return state.players.every((p) => p.insuranceDecided === true)
}

export function resolveInsurance(state: GameState): GameState {
  const dealerEval = evaluateHand(state.dealerHand)
  const dealerBJ = dealerEval.isBlackjack

  const players = state.players.map((player) => {
    if (dealerBJ && player.insuranceBet > 0) {
      return { ...player, chips: player.chips + player.insuranceBet + player.insuranceBet * 2, insuranceBet: 0 }
    }
    return { ...player, insuranceBet: 0 }
  })

  if (dealerBJ) {
    return { ...state, players, phase: 'settlement' as const, currentTurn: -1 }
  }
  return { ...state, players, phase: 'playing' as const, currentTurn: 0, turnStartedAt: Date.now() }
}

export function processAction(state: GameState, action: PlayerAction): GameState {
  const playerIndex = state.players.findIndex((p) => p.id === action.playerId)
  if (playerIndex === -1) throw new Error('Player not found')
  if (playerIndex !== state.currentTurn) throw new Error('Not your turn')

  switch (action.type) {
    case 'hit': {
      const { state: s1, card } = draw(state)
      if (!card) throw new Error('Shoe empty')
      const updated = {
        ...s1,
        players: s1.players.map((p, i) =>
          i === playerIndex
            ? {
                ...p,
                hands: p.hands.map((h, hi) =>
                  hi === p.activeHandIndex
                    ? { ...h, cards: [...h.cards, card] }
                    : h
                ),
              }
            : p
        ),
      }
      const ev = evaluateHand(updated.players[playerIndex].hands[updated.players[playerIndex].activeHandIndex].cards)
      if (ev.isBust) {
        const nextState = {
          ...updated,
          players: updated.players.map((p, i) =>
            i === playerIndex
              ? {
                  ...p,
                  hands: p.hands.map((h, hi) =>
                    hi === p.activeHandIndex
                      ? { ...h, isStood: true, result: 'lose' as const }
                      : h
                  ),
                  isActive: false,
                }
              : p
          ),
        }
        return advanceTurn(nextState)
      }
      return updated
    }

    case 'stand': {
      const stood = {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex
            ? {
                ...p,
                hands: p.hands.map((h, hi) =>
                  hi === p.activeHandIndex ? { ...h, isStood: true } : h
                ),
              }
            : p
        ),
      }
      return advanceTurn(stood)
    }

    case 'double': {
      const player = state.players[playerIndex]
      const hand = player.hands[player.activeHandIndex]
      if (hand.cards.length !== 2) throw new Error('Can only double on initial two cards')
      if (state.rules.doubleDown === 'none') {
        throw new Error('Double down is not allowed')
      }
      if (state.rules.doubleDown === '9-10-11') {
        const value = evaluateHand(hand.cards).value
        if (value !== 9 && value !== 10 && value !== 11) {
          throw new Error('Double down only allowed on 9, 10, or 11')
        }
      }
      if (player.chips < hand.bet) throw new Error('Insufficient chips to double')
      const { state: s1, card } = draw(state)
      if (!card) throw new Error('Shoe empty')
      const doubled = {
        ...s1,
        players: s1.players.map((p, i) =>
          i === playerIndex
            ? {
                ...p,
                chips: p.chips - hand.bet,
                hands: p.hands.map((h, hi) =>
                  hi === p.activeHandIndex
                    ? { ...h, bet: h.bet * 2, isDoubled: true, cards: [...h.cards, card], isStood: true }
                    : h
                ),
              }
            : p
        ),
      }
      const ev = evaluateHand(doubled.players[playerIndex].hands[doubled.players[playerIndex].activeHandIndex].cards)
      if (ev.isBust) {
        const busted = {
          ...doubled,
          players: doubled.players.map((p, i) =>
            i === playerIndex
              ? { ...p, hands: p.hands.map((h, hi) => hi === p.activeHandIndex ? { ...h, result: 'lose' as const } : h), isActive: false }
              : p
          ),
        }
        return advanceTurn(busted)
      }
      return advanceTurn(doubled)
    }

    case 'surrender': {
      if (state.rules.surrender === 'none') throw new Error('Surrender not allowed')
      const player = state.players[playerIndex]
      const hand = player.hands[player.activeHandIndex]
      if (hand.cards.length !== 2) throw new Error('Can only surrender on initial two cards')
      const surrendered = {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex
            ? {
                ...p,
                chips: p.chips + Math.floor(p.hands[p.activeHandIndex].bet / 2),
                hands: p.hands.map((h, hi) =>
                  hi === p.activeHandIndex ? { ...h, isSurrendered: true, result: 'lose' as const, isStood: true } : h
                ),
              }
            : p
        ),
      }
      return advanceTurn(surrendered)
    }

    case 'split': {
      const player = state.players[playerIndex]
      const hand = player.hands[player.activeHandIndex]
      if (hand.cards.length !== 2) throw new Error('Can only split two cards')
      if (calculateHandValue([hand.cards[0]]) !== calculateHandValue([hand.cards[1]])) {
        throw new Error('Cards must be same value to split')
      }
      if (player.chips < hand.bet) throw new Error('Insufficient chips to split')
      const maxHands = state.rules.splits === 'none' ? 1
        : state.rules.splits === 'once' ? 2
        : state.rules.splits === 'twice' ? 3
        : 4
      if (player.hands.length >= maxHands) throw new Error('Max splits reached')

      const card1 = hand.cards[0]
      const card2 = hand.cards[1]
      const { state: s1, card: newCard1 } = draw(state)
      const { state: s2, card: newCard2 } = draw(s1)
      if (!newCard1 || !newCard2) throw new Error('Shoe empty on split')

      const newHands = player.hands.map((h, hi) => {
        if (hi !== player.activeHandIndex) return h
        return { ...h, cards: [card1, newCard1] }
      })
      newHands.splice(player.activeHandIndex + 1, 0, {
        cards: [card2, newCard2], bet: hand.bet, isDoubled: false,
        isSurrendered: false, isStood: false, result: 'pending' as const, payout: 0,
      })

      const splitState = {
        ...s2,
        players: s2.players.map((p, i) =>
          i === playerIndex
            ? { ...p, chips: p.chips - hand.bet, hands: newHands, activeHandIndex: player.activeHandIndex }
            : p
        ),
      }

      if (card1.rank === 'A') {
        const aceStood = {
          ...splitState,
          players: splitState.players.map((p, i) =>
            i === playerIndex
              ? { ...p, hands: p.hands.map((h) => ({ ...h, isStood: true })), activeHandIndex: p.activeHandIndex + 1 }
              : p
          ),
        }
        return advanceTurn(aceStood)
      }

      return splitState
    }

    case 'insurance_yes': {
      if (state.phase !== 'insurance') throw new Error('Not in insurance phase')
      const player = state.players[playerIndex]
      const hand = player.hands[0]
      const insuranceAmount = Math.floor(hand.bet / 2)
      if (player.chips < insuranceAmount) throw new Error('Insufficient chips for insurance')
      const updated = {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex
            ? { ...p, chips: p.chips - insuranceAmount, insuranceBet: insuranceAmount, insuranceDecided: true }
            : p
        ),
      }
      if (allInsuranceDecided(updated)) return resolveInsurance(updated)
      return updated
    }

    case 'insurance_no': {
      if (state.phase !== 'insurance') throw new Error('Not in insurance phase')
      const updated = {
        ...state,
        players: state.players.map((p, i) =>
          i === playerIndex
            ? { ...p, insuranceBet: 0, insuranceDecided: true }
            : p
        ),
      }
      if (allInsuranceDecided(updated)) return resolveInsurance(updated)
      return updated
    }

    default:
      return state
  }
}
