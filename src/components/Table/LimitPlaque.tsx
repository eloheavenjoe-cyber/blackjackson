type Props = {
  minBet: number
  maxBet: number
}

export function LimitPlaque({ minBet, maxBet }: Props) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-10" style={{ top: -14 }}>
      <svg viewBox="0 0 170 28" width="170" height="28">
        {/* Plaque body with metallic gradient */}
        <defs>
          <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a84c" />
            <stop offset="30%" stopColor="#d4a843" />
            <stop offset="50%" stopColor="#e2c06c" />
            <stop offset="70%" stopColor="#d4a843" />
            <stop offset="100%" stopColor="#a08030" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="170" height="28" rx="6" fill="url(#brass)" />
        {/* Border highlight */}
        <rect x="1" y="1" width="168" height="26" rx="5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        {/* Inner etched shadow */}
        <rect x="2" y="2" width="166" height="24" rx="4" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
        {/* Text — engraved look */}
        <text
          x="85" y="19"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="12"
          fontWeight="700"
          fill="rgba(60,30,0,0.7)"
          letterSpacing="3"
        >
          MIN ${minBet}  ·  MAX ${maxBet}
        </text>
        {/* Text highlight — sheen */}
        <text
          x="85" y="18"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="12"
          fontWeight="700"
          fill="rgba(80,40,0,0.5)"
          letterSpacing="3"
        >
          MIN ${minBet}  ·  MAX ${maxBet}
        </text>
      </svg>
    </div>
  )
}
