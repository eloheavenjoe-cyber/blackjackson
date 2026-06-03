import { useState, useEffect, useRef } from 'react'
import { useSound } from '../../hooks/useSound'

type Props = {
  timeLimit: number
  startedAt: number
  onTimeout?: () => void
}

export function TurnTimer({ timeLimit, startedAt, onTimeout }: Props) {
  const [remaining, setRemaining] = useState(timeLimit)
  const firedRef = useRef(false)
  const lastTickRef = useRef(Math.ceil(timeLimit))
  const { play } = useSound()
  const pct = (remaining / timeLimit) * 100

  useEffect(() => {
    firedRef.current = false
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      const left = Math.max(0, timeLimit - elapsed)
      setRemaining(left)
      const whole = Math.ceil(left)
      if (whole <= 5 && whole < lastTickRef.current) {
        lastTickRef.current = whole
        play('tick')
      }
      if (left <= 0) {
        clearInterval(interval)
        if (!firedRef.current && onTimeout) {
          firedRef.current = true
          onTimeout()
        }
      }
    }, 100)
    return () => clearInterval(interval)
  }, [timeLimit, startedAt, onTimeout])

  return (
    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-colors ${
          remaining < 5 ? 'bg-red-500' : remaining < 10 ? 'bg-yellow-500' : 'bg-gold'
        }`}
        style={{ width: `${pct}%`, transition: 'width 0.1s linear' }}
      />
    </div>
  )
}
