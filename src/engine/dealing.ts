import type { GameState } from './types'
import { drawCard, needsReshuffle, reshuffleDiscard } from './shoe'

function draw(state: GameState): { state: GameState; card: import('./types').Card | null } {
  if (needsReshuffle(state.shoe, state.rules.decks)) {
    const reshuffled = reshuffleDiscard([...state.discard])
    return { state: { ...state, shoe: reshuffled, discard: [] }, card: null }
  }
  const { card, remaining } = drawCard(state.shoe)
  return { state: { ...state, shoe: remaining }, card }
}

export function dealInitialHands(state: GameState): GameState {
  let currentState = state

  for (let round = 0; round < 2; round++) {
    for (const player of currentState.players) {
      const { state: s1, card } = draw(currentState)
      if (!card) {
        currentState = { ...s1 }
        const { card: c2 } = draw(currentState)
        if (!c2) throw new Error('Shoe empty after reshuffle')
        currentState = {
          ...currentState,
          players: currentState.players.map((p) =>
            p.id === player.id
              ? { ...p, hands: p.hands.map((h, hi) => hi === 0 ? { ...h, cards: [...h.cards, c2] } : h) }
              : p
          ),
        }
        continue
      }
      currentState = {
        ...s1,
        players: s1.players.map((p) =>
          p.id === player.id
            ? { ...p, hands: p.hands.map((h, hi) => hi === 0 ? { ...h, cards: [...h.cards, card] } : h) }
            : p
        ),
      }
    }

    const { state: s2, card: dealerCard } = draw(currentState)
    if (!dealerCard) throw new Error('Shoe empty on dealer deal')
    currentState = {
      ...s2,
      dealerHand: [...currentState.dealerHand, dealerCard],
    }
  }

  const dealerUpcard = currentState.dealerHand[0]

  if (currentState.rules.insurance && dealerUpcard.rank === 'A') {
    return { ...currentState, phase: 'insurance' }
  }

  if (['10', 'J', 'Q', 'K'].includes(dealerUpcard.rank)) {
    const holeCard = currentState.dealerHand[1]
    if (holeCard.rank === 'A') {
      return { ...currentState, phase: 'settlement' }
    }
  }

  return { ...currentState, phase: 'playing', currentTurn: 0 }
}
