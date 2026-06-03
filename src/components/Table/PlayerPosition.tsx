import type { PlayerState } from '../../engine/types'
import { CardHand } from './CardHand'
import { motion } from 'framer-motion'

type Props = {
  player: PlayerState
  isCurrentTurn: boolean
  x: number
  y: number
  angle: number
  dealIndex?: { first: number; second: number } | null
  originX?: number
  originY?: number
}

export function PlayerPosition({
  player, isCurrentTurn,
  x, y, angle: _angle,
  dealIndex, originX, originY,
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
        className="relative w-24 h-24 rounded-full mx-auto mb-1"
        animate={isCurrentTurn ? {
          boxShadow: [
            '0 0 20px rgba(212,168,67,0.3), 0 0 0 2px rgba(212,168,67,0.25)',
            '0 0 36px rgba(212,168,67,0.5), 0 0 0 3px rgba(212,168,67,0.4)',
            '0 0 20px rgba(212,168,67,0.3), 0 0 0 2px rgba(212,168,67,0.25)',
          ],
          scale: [1, 1.03, 1],
        } : {}}
        transition={isCurrentTurn ? {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        } : {}}
      >
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold/20" />
        {isCurrentTurn && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'radial-gradient(circle, rgba(212,168,67,0.3) 0%, transparent 70%)' }}
          />
        )}
      </motion.div>

      <div className="flex justify-center" style={{ marginTop: '-64px' }}>
        {player.hands.length === 0 ? (
          <div className="w-12 h-18" />
        ) : (
          player.hands.map((hand, hi) => (
            <div key={hi} className={hi > 0 ? 'ml-2' : ''}>
              <CardHand
                hand={hand}
                handIndex={hi}
                activeHandIndex={player.activeHandIndex}
                dealIndex={dealIndex ? (hi === 0 ? dealIndex.first : dealIndex.second) : null}
                originX={originX}
                originY={originY}
              />
            </div>
          ))
        )}
      </div>

    </div>
  )
}
