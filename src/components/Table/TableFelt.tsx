import type { ReactNode } from 'react'

type SeatPosition = {
  x: number
  y: number
  angle: number
}

export function computePositions(count: number, width: number, height: number): SeatPosition[] {
  if (count === 0) return []
  if (count === 1) return [{ x: width / 2, y: height * 0.72, angle: 0 }]

  const cx = width / 2
  const cy = height * 0.60
  const rx = width * 0.36
  const ry = height * 0.18
  const startAngle = 160 * (Math.PI / 180)
  const endAngle = 20 * (Math.PI / 180)
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
      className="relative mx-auto"
      style={{ width: 'min(92vw, 900px)', height: 'min(55vh, 480px)' }}
    >
      <div
        className="absolute inset-0"
        style={{
          borderTopLeftRadius: '3%',
          borderTopRightRadius: '3%',
          borderBottomLeftRadius: '48%',
          borderBottomRightRadius: '48%',
          border: '14px solid #5c3a1e',
          boxShadow: `
            inset 0 0 0 3px rgba(212,168,67,0.15),
            inset 0 0 100px rgba(0,0,0,0.5),
            0 8px 40px rgba(0,0,0,0.6)
          `,
          background: `#0a3d1f url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='0.4' fill='%2300000022'/%3E%3C/svg%3E")`,
          overflow: 'hidden',
        }}
      >
        {/* Felt radial highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 50% 35% at 50% 22%, rgba(13,94,46,0.6) 0%, transparent 70%)',
          }}
        />
        {children}
      </div>
    </div>
  )
}
