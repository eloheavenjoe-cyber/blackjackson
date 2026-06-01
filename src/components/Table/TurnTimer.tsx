import { useState, useEffect } from 'react'

type Props = {
  timeLimit: number
  startedAt: number
}

export function TurnTimer({ timeLimit, startedAt }: Props) {
  const [remaining, setRemaining] = useState(timeLimit)
  const pct = (remaining / timeLimit) * 100

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      const left = Math.max(0, timeLimit - elapsed)
      setRemaining(left)
      if (left <= 0) clearInterval(interval)
    }, 100)
    return () => clearInterval(interval)
  }, [timeLimit, startedAt])

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
