import { useMemo } from 'react'

type Props = {
  containerWidth: number
  containerHeight: number
}

export function shoeOrigin(containerWidth: number, containerHeight: number) {
  return {
    x: containerWidth * 0.82,
    y: containerHeight * 0.08,
  }
}

export function DealerShoe({ containerWidth, containerHeight }: Props) {
  const { x, y } = useMemo(
    () => shoeOrigin(containerWidth, containerHeight),
    [containerWidth, containerHeight]
  )

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x - 30, top: y - 12, zIndex: 2 }}
    >
      <svg viewBox="0 0 60 70" width="60" height="50" className="drop-shadow-lg">
        {/* Shoe body — trapezoid */}
        <path
          d="M 6,10 L 4,50 Q 4,60 14,62 L 46,62 Q 56,60 56,48 L 54,10 Z"
          fill="#4a2c0f"
          stroke="#3a1f0a"
          strokeWidth="1"
        />
        {/* Wood grain accent lines */}
        <line x1="10" y1="20" x2="50" y2="20" stroke="#3d2310" strokeWidth="0.5" opacity="0.4" />
        <line x1="8" y1="30" x2="52" y2="30" stroke="#3d2310" strokeWidth="0.5" opacity="0.4" />
        <line x1="7" y1="40" x2="53" y2="40" stroke="#3d2310" strokeWidth="0.5" opacity="0.3" />
        {/* Front opening — dark slit */}
        <rect x="6" y="8" width="48" height="5" rx="1" fill="#1a0d00" />
        {/* Gold trim on face */}
        <rect x="5" y="7" width="50" height="2" rx="1" fill="#d4a843" opacity="0.8" />
        {/* Gold rim on top */}
        <path
          d="M 6,10 L 4,50 Q 4,60 14,62 L 46,62 Q 56,60 56,48 L 54,10"
          fill="none"
          stroke="#d4a843"
          strokeWidth="1.5"
          opacity="0.6"
        />
        {/* Card peeking from opening */}
        <rect x="15" y="2" width="20" height="8" rx="1" fill="#1a2744" />
        <rect x="16" y="3" width="18" height="6" rx="0.5" fill="none" stroke="#d4a843" strokeWidth="0.5" opacity="0.5" />
      </svg>
    </div>
  )
}
