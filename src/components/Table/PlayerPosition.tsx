import type { PlayerState } from '../../engine/types'
import { CardHand } from './CardHand'
import { motion } from 'framer-motion'

type Props = {
  player: PlayerState
  isCurrentTurn: boolean
  x: number
  y: number
  angle: number
}

export function PlayerPosition({
  player, isCurrentTurn,
  x, y, angle: _angle,
}: Props) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%)`,
      }}
    >
      <motion.div
        animate={{
          boxShadow: isCurrentTurn
            ? '0 0 24px rgba(212,168,67,0.4), 0 0 0 2px rgba(212,168,67,0.3)'
            : '0 0 0 1px rgba(212,168,67,0.1)',
        }}
        className="w-24 h-24 rounded-full border-2 border-dashed border-gold/20 mx-auto mb-1"
      />

      <div className="flex justify-center" style={{ marginTop: '-64px' }}>
        {player.hands.length === 0 ? (
          <div className="w-12 h-18" />
        ) : (
          player.hands.map((hand, hi) => (
            <div key={hi} className={hi > 0 ? 'ml-2' : ''}>
              <CardHand hand={hand} handIndex={hi} activeHandIndex={player.activeHandIndex} />
            </div>
          ))
        )}
      </div>

    </div>
  )
}
