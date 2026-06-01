import type { HandState } from '../../engine/types'

type Props = {
  hand: HandState
  chips: number
  onAction: (action: any) => void
}

export function ActionButtons({ hand, chips, onAction }: Props) {
  const canDouble = hand.cards.length === 2 && chips >= hand.bet
  const canSplit = hand.cards.length === 2 &&
    hand.cards[0].rank === hand.cards[1].rank &&
    chips >= hand.bet

  return (
    <div className="flex gap-1.5 flex-wrap justify-center">
      <button onClick={() => onAction({ type: 'hit' })} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded cursor-pointer">Hit</button>
      <button onClick={() => onAction({ type: 'stand' })} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded cursor-pointer">Stand</button>
      {canDouble && (
        <button onClick={() => onAction({ type: 'double' })} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded cursor-pointer">Double</button>
      )}
      {canSplit && (
        <button onClick={() => onAction({ type: 'split' })} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded cursor-pointer">Split</button>
      )}
    </div>
  )
}
