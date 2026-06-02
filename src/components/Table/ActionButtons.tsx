import type { HandState, GameRules, GamePhase } from '../../engine/types'
import { calculateHandValue, evaluateHand } from '../../engine'

type Props = {
  hand: HandState
  chips: number
  onAction: (action: any) => void
  rules: GameRules
  handIndex: number
  playerHands: HandState[]
  phase: GamePhase
  dealerUpcard: string | null
}

export function ActionButtons({ hand, chips, onAction, rules, handIndex, playerHands, phase, dealerUpcard }: Props) {
  if (phase === 'insurance') {
    return (
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={() => onAction({ type: 'insurance_yes' })}
          className="px-3 py-1.5 bg-gold hover:bg-yellow-500 text-gray-900 text-xs font-bold rounded cursor-pointer"
        >
          Insure
        </button>
        <button
          onClick={() => onAction({ type: 'insurance_no' })}
          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded cursor-pointer"
        >
          Decline
        </button>
      </div>
    )
  }

  if (phase !== 'playing') return null

  const handValue = hand.cards.length >= 2 ? evaluateHand(hand.cards).value : 0

  const canDouble = hand.cards.length === 2 &&
    chips >= hand.bet &&
    (rules.doubleDown === 'any' ||
      (rules.doubleDown === '9-10-11' && [9, 10, 11].includes(handValue)))

  const maxHands = rules.splits === 'none' ? 1
    : rules.splits === 'once' ? 2
    : rules.splits === 'twice' ? 3
    : 4

  const canSplit = hand.cards.length === 2 &&
    calculateHandValue([hand.cards[0]]) === calculateHandValue([hand.cards[1]]) &&
    chips >= hand.bet &&
    rules.splits !== 'none' &&
    playerHands.length < maxHands

  const canSurrender = rules.surrender === 'late' &&
    hand.cards.length === 2 &&
    !hand.isStood

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5 flex-wrap justify-center">
        <button onClick={() => onAction({ type: 'hit' })} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded cursor-pointer">Hit</button>
        <button onClick={() => onAction({ type: 'stand' })} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded cursor-pointer">Stand</button>
      </div>
      {(canDouble || canSplit || canSurrender) && (
        <div className="flex gap-1.5 flex-wrap justify-center">
          {canDouble && (
            <button onClick={() => onAction({ type: 'double' })} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded cursor-pointer">Double</button>
          )}
          {canSplit && (
            <button onClick={() => onAction({ type: 'split' })} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded cursor-pointer">Split</button>
          )}
          {canSurrender && (
            <button onClick={() => onAction({ type: 'surrender' })} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded cursor-pointer">Surrender</button>
          )}
        </div>
      )}
    </div>
  )
}
