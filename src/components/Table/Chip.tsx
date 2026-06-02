type ChipProps = {
  value: 10 | 25 | 50 | 100 | 250 | 500
  size?: 'betting' | 'table' | 'small'
  onClick?: () => void
  dimmed?: boolean
}

const chipSpecs: Record<number, { body: string; edge: string; label: string }> = {
  10:  { body: '#1a6ec4', edge: '#ffffff', label: '10' },
  25:  { body: '#2d8c3a', edge: '#e8c547', label: '25' },
  50:  { body: '#c44141', edge: '#1a6ec4', label: '50' },
  100: { body: '#1a1a1a', edge: '#d4a843', label: '100' },
  250: { body: '#7b2d8b', edge: '#ffffff', label: '250' },
  500: { body: '#8b1a2b', edge: '#d4a843', label: '500' },
}

const sizeMap: Record<string, { dim: number; font: number; rim: number }> = {
  betting: { dim: 56, font: 22, rim: 3 },
  table:   { dim: 40, font: 16, rim: 2 },
  small:   { dim: 28, font: 11, rim: 1.5 },
}

export function Chip({ value, size = 'table', onClick, dimmed }: ChipProps) {
  const spec = chipSpecs[value]
  const s = sizeMap[size]
  const cx = s.dim / 2
  const cy = s.dim / 2
  const r = cx - 2

  const edgeSpots = [0, 120, 240].flatMap((angle) =>
    [angle - 10, angle + 10].map((a) => a)
  )

  return (
    <svg
      width={s.dim}
      height={s.dim}
      viewBox={`0 0 ${s.dim} ${s.dim}`}
      className={`inline-block select-none ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''} transition-transform ${dimmed ? 'opacity-30' : ''}`}
      onClick={onClick}
    >
      <defs>
        <radialGradient id={`grad-${value}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor={spec.body} stopOpacity="1" />
          <stop offset="100%" stopColor={spec.body} stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a0a00" strokeWidth={s.rim + 2} opacity={0.5} />
      <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="#4a3520" strokeWidth={s.rim} />
      <circle cx={cx} cy={cy} r={r - s.rim} fill={`url(#grad-${value})`} />
      {edgeSpots.map((angle) => (
        <rect
          key={angle}
          x={cx - 3}
          y={cy - r}
          width={6}
          height={s.rim + 1}
          fill={spec.edge}
          transform={`rotate(${angle}, ${cx}, ${cy})`}
          rx={1}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.65} fill="none" stroke="#d4a843" strokeWidth={0.8} opacity={0.6} />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="#d4a843" strokeWidth={0.5} opacity={0.4} />
      <text x={cx} y={cy + s.font * 0.35} textAnchor="middle" fontSize={s.font} fontWeight="bold" fontFamily="system-ui, sans-serif" fill="#1a1a1a">
        {spec.label}
      </text>
    </svg>
  )
}
