import type { Card, HandEvaluation } from './types'

const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 11,
}

export function calculateHandValue(cards: Card[]): number {
  let total = 0
  let aces = 0

  for (const card of cards) {
    total += RANK_VALUES[card.rank]
    if (card.rank === 'A') aces++
  }

  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }

  return total
}

export function evaluateHand(cards: Card[]): HandEvaluation {
  const value = calculateHandValue(cards)
  const isBlackjack = cards.length === 2 && value === 21
  const isBust = value > 21

  let aces = cards.filter((c) => c.rank === 'A').length
  let total = 0
  for (const card of cards) {
    total += RANK_VALUES[card.rank]
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  const soft = aces > 0 && total <= 21

  return { value, soft, isBlackjack, isBust }
}
