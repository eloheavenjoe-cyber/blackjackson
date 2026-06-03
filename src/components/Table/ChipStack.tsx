import { motion, AnimatePresence } from 'framer-motion'
import { Chip } from './Chip'

type ChipValue = 10 | 25 | 50 | 100 | 250 | 500

type Props = {
  amount: number
  size?: 'sm' | 'md'
}

function getChipValues(amount: number): ChipValue[] {
  const denoms: ChipValue[] = [500, 250, 100, 50, 25, 10]
  const result: ChipValue[] = []
  let remaining = amount
  for (const d of denoms) {
    while (remaining >= d && result.length < 5) {
      result.push(d)
      remaining -= d
    }
  }
  return result
}

export function ChipStack({ amount, size = 'sm' }: Props) {
  if (amount <= 0) return null
  const values = getChipValues(amount)
  const chipSize = size === 'sm' ? 'small' : 'table'
  const baseDim = size === 'sm' ? 28 : 40
  const height = baseDim + (values.length - 1) * 4

  return (
    <motion.div layout className="relative inline-flex flex-col items-center">
      <motion.div layout className="relative" style={{ height, width: size === 'sm' ? 30 : 42 }}>
        <AnimatePresence>
          {values.map((v, i) => (
            <motion.div
              key={`${i}-${v}`}
              initial={{ scale: 0, y: -10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0, y: 8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: i * 4, zIndex: values.length - i }}
            >
              <Chip value={v} size={chipSize as 'small' | 'table'} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      <motion.span
        key={amount}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="text-xs font-bold text-gold mt-1"
      >
        {amount}
      </motion.span>
    </motion.div>
  )
}
