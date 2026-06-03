import { CardBack } from './CardComponent'

type Props = {
  containerWidth: number
  containerHeight: number
}

const rotationSeed = [4, -2, 6, -4]

export function DiscardPile({ containerWidth, containerHeight }: Props) {
  const x = containerWidth * 0.12
  const y = containerHeight * 0.06
  const cards = 4

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x - 18, top: y - 8, zIndex: 2 }}
    >
      {Array.from({ length: cards }, (_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            transform: `rotate(${rotationSeed[i % rotationSeed.length]}deg)`,
            top: i * 1.5,
            left: i * 1.5,
            zIndex: cards - i,
            width: 32,
            height: 44,
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          <CardBack />
        </div>
      ))}
    </div>
  )
}
