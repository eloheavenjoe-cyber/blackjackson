import type { Card } from './types'

const SUITS: Card['suit'][] = ['S', 'H', 'D', 'C']
const RANKS: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function createShoe(decks: number): Card[] {
  const cards: Card[] = []
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ suit, rank })
      }
    }
  }
  return shuffle(cards)
}

export function drawCard(shoe: Card[]): { card: Card | null; remaining: Card[] } {
  if (shoe.length === 0) return { card: null, remaining: [] }
  const [card, ...remaining] = shoe
  return { card, remaining }
}

export function needsReshuffle(shoe: Card[], deckCount: number): boolean {
  const totalCards = deckCount * 52
  const threshold = Math.floor(totalCards * 0.25)
  return shoe.length < threshold
}

export function reshuffleDiscard(discard: Card[]): Card[] {
  return shuffle([...discard])
}
