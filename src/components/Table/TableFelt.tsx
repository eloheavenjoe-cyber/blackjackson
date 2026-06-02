import type { ReactNode } from 'react'

type SeatPosition = {
  x: number
  y: number
  angle: number
}

export function computePositions(count: number, width: number, height: number): SeatPosition[] {
  if (count === 0) return []
  if (count === 1) return [{ x: width / 2, y: height * 0.7, angle: 0 }]

  const cx = width / 2
  const cy = height * 0.62
  const radius = Math.min(width * 0.35, height * 0.42)
  const startAngle = 210 * (Math.PI / 180)
  const endAngle = 330 * (Math.PI / 180)
  const arcSpan = endAngle - startAngle

  return Array.from({ length: count }, (_, i) => {
    const angle = startAngle + (i / (count - 1)) * arcSpan
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      angle: angle - Math.PI / 2,
    }
  })
}

export function TableFelt({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a0a00' }}>
      <div
        className="flex-1 m-2 sm:m-3 rounded-[3rem] overflow-hidden relative"
        style={{
          border: '16px solid #5c3a1e',
          boxShadow: 'inset 0 0 0 3px #d4a84333, inset 0 0 120px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.8)',
          background: `#0a3d1f url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='0.4' fill='%2300000022'/%3E%3C/svg%3E")`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(13,94,46,0.5) 0%, transparent 70%)',
          }}
        />
        {children}
      </div>
    </div>
  )
}
