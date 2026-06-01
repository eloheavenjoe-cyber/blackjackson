import type { GameState } from './types'
import { drawCard } from './shoe'
import { evaluateHand } from './hand'

export function playDealer(state: GameState): GameState {
  let current = { ...state, dealerHoleCard: null }
  let ev = evaluateHand(current.dealerHand)

  const shouldHit = (): boolean => {
    if (ev.isBust) return false
    if (ev.value > 17) return false
    if (ev.value === 17) {
      return ev.soft && current.rules.dealerSoft17 === 'hit'
    }
    return ev.value < 17
  }

  while (shouldHit()) {
    const { card, remaining } = drawCard(current.shoe)
    current = { ...current, shoe: remaining }
    if (!card) break
    current = { ...current, dealerHand: [...current.dealerHand, card] }
    ev = evaluateHand(current.dealerHand)
  }

  return { ...current, phase: 'settlement' }
}
