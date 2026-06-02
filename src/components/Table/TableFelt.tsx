import type { ReactNode } from 'react'

type SeatPosition = {
  x: number
  y: number
  angle: number
}

export function computePositions(count: number, width: number, height: number): SeatPosition[] {
  if (count === 0) return []
  if (count === 1) return [{ x: width / 2, y: height * 0.58, angle: 0 }]

  const cx = width / 2
  const cy = height * 0.28
  const rx = width * 0.36
  const ry = height * 0.42
  const startAngle = 220 * (Math.PI / 180)
  const endAngle = 320 * (Math.PI / 180)
  const arcSpan = endAngle - startAngle

  return Array.from({ length: count }, (_, i) => {
    const angle = startAngle + (i / (count - 1)) * arcSpan
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      angle: angle - Math.PI / 2,
    }
  })
}

export function TableFelt({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-end justify-center pb-8 sm:pb-16"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #3b2210 0%, #1a0a00 60%, #0a0400 100%)',
      }}
    >
      <div
        className="relative"
        style={{
          width: 'min(92vw, 900px)',
          height: 'min(55vh, 520px)',
        }}
      >
        {/* Flat wood rail at top edge */}
        <div
          className="absolute left-0 right-0 z-10"
          style={{
            top: -10,
            height: 20,
            borderRadius: '10px 10px 0 0',
            background: 'linear-gradient(180deg, #6b4423 0%, #5c3a1e 40%, #4a2c14 100%)',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.4)',
          }}
        />

        {/* Half-oval table body */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            borderTopLeftRadius: '5%',
            borderTopRightRadius: '5%',
            borderBottomLeftRadius: '48%',
            borderBottomRightRadius: '48%',
            border: '14px solid #5c3a1e',
            boxShadow: `
              inset 0 0 0 3px rgba(212,168,67,0.15),
              inset 0 0 100px rgba(0,0,0,0.5),
              0 8px 40px rgba(0,0,0,0.7),
              0 2px 8px rgba(0,0,0,0.5)
            `,
            background: `#0a3d1f url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='0.4' fill='%2300000022'/%3E%3C/svg%3E")`,
          }}
        >
          {/* Felt radial highlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 50% 35% at 50% 25%, rgba(13,94,46,0.6) 0%, transparent 70%)',
            }}
          />

          {/* Player arc markers (subtle rings on the felt) */}
          {children}
        </div>

        {/* Side wood rails (left and right edges extending down) */}
        <div
          className="absolute -left-2 top-0 bottom-0 w-4 z-0"
          style={{
            background: 'linear-gradient(90deg, #3b2210, #5c3a1e)',
            borderBottomLeftRadius: '48%',
            borderTopLeftRadius: '5%',
          }}
        />
        <div
          className="absolute -right-2 top-0 bottom-0 w-4 z-0"
          style={{
            background: 'linear-gradient(270deg, #3b2210, #5c3a1e)',
            borderBottomRightRadius: '48%',
            borderTopRightRadius: '5%',
          }}
        />
      </div>
    </div>
  )
}
