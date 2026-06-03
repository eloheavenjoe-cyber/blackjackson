export type Suit = 'S' | 'H' | 'D' | 'C'

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export type Card = {
  suit: Suit
  rank: Rank
}

export type GamePhase =
  | 'waiting'
  | 'betting'
  | 'dealing'
  | 'insurance'
  | 'playing'
  | 'dealer'
  | 'settlement'
  | 'round_end'

export type GameRules = {
  decks: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  dealerSoft17: 'stand' | 'hit'
  blackjackPayout: '3:2' | '6:5'
  surrender: 'none' | 'late'
  insurance: boolean
  doubleDown: 'any' | '9-10-11' | 'none'
  splits: 'none' | 'once' | 'twice' | 'unlimited'
  startingChips: number
  minBet: number
  maxBet: number
  turnTimeLimit: number
}

export type HandState = {
  cards: Card[]
  bet: number
  isDoubled: boolean
  isSurrendered: boolean
  isStood: boolean
  result: 'win' | 'lose' | 'push' | 'blackjack' | 'pending'
  payout: number
}

export type PlayerState = {
  id: string
  name: string
  seat: number
  hands: HandState[]
  activeHandIndex: number
  chips: number
  isActive: boolean
  insuranceBet: number
  insuranceDecided: boolean
}

export type PlayerAction =
  | { type: 'hit'; playerId: string }
  | { type: 'stand'; playerId: string }
  | { type: 'double'; playerId: string }
  | { type: 'split'; playerId: string }
  | { type: 'surrender'; playerId: string }
  | { type: 'insurance_yes'; playerId: string }
  | { type: 'insurance_no'; playerId: string }
  | { type: 'bet'; playerId: string; amount: number }

export type HandEvaluation = {
  value: number
  soft: boolean
  isBlackjack: boolean
  isBust: boolean
}

export type GameState = {
  id: string
  phase: GamePhase
  hostId: string
  rules: GameRules
  shoe: Card[]
  discard: Card[]
  dealerHand: Card[]
  dealerHoleCard: Card | null
  players: PlayerState[]
  currentTurn: number
  turnTimeLimit: number
  turnStartedAt: number | null
  roundNumber: number
  createdAt: number
  removedPlayers?: { id: string; name: string; reason: 'bust' | 'kicked' | 'disconnected' }[]
  lastActionAt?: Record<string, number>
  gameOver?: boolean
  pendingBets?: Record<string, number>
}
