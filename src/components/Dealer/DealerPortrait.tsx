import { useState } from 'react'
import { DEALER_IMAGES } from '../../constants/music'
import type { DealerPersona } from '../../engine/types'

type Props = {
  persona?: DealerPersona
}

export function DealerPortrait({ persona = 'default' }: Props) {
  const [error, setError] = useState(false)
  const src = DEALER_IMAGES[persona] ?? DEALER_IMAGES.default

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ width: 100, height: 120, background: 'linear-gradient(135deg, #2a1a3a, #1a2a3a)', border: '2px solid rgba(212,168,67,0.2)' }}
      >
        <div className="text-center text-gold/30">
          <div className="text-2xl">{'\u2660'} {'\u2665'}</div>
          <div className="text-2xl">{'\u2666'} {'\u2663'}</div>
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`${persona} dealer`}
      onError={() => setError(true)}
      className="rounded-xl object-cover shadow-lg"
      style={{ width: 100, height: 120, border: '2px solid rgba(212,168,67,0.15)' }}
    />
  )
}
