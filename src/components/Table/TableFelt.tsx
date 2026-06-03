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
      style={{ width: 'min(92vw, 990px)', height: 'min(55vh, 528px)' }}
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
            inset 0 0 60px rgba(0,0,0,0.3),
            inset 0 0 150px rgba(0,0,0,0.7),
            0 8px 40px rgba(0,0,0,0.6)
          `,
          background: `#0a3d1f url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`,
          overflow: 'hidden',
        }}
      >
        {/* Outer lamp glow — wide warm spill */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 45% at 50% 18%, rgba(255,200,100,0.08) 0%, transparent 70%)',
          }}
        />
        {/* Inner lamp hotspot — tight amber focus */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 35% 20% at 50% 22%, rgba(212,168,67,0.25) 0%, transparent 60%)',
            animation: 'lamp-flicker 3.5s ease-in-out infinite',
          }}
        />
        {children}
      </div>
    </div>
  )
}
