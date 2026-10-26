import type { CSSProperties } from 'react'
import type { CardSide, ToolkitCard } from '../data/cards'

type CardProps = {
  card: ToolkitCard
  index: number
}

function CardFace({ side, face }: { side: CardSide; face: 'front' | 'back' }) {
  const titleLines = side.title.split('\n')

  return (
    <div className={`card-face card-face--${face} card-tone--${side.tone}`}>
      <div className="card-noise" aria-hidden="true" />
      <div className="card-face__meta">
        <span>{side.eyebrow}</span>
        <span className="card-face__dot" />
      </div>
      <div className="card-face__center">
        {side.mark ? <span className="card-mark">{side.mark}</span> : null}
        <h2>
          {titleLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
        <span className="card-pill">{side.label}</span>
      </div>
      <span className="card-face__index">0{face === 'front' ? 1 : 2}</span>
      {face === 'back' && side.mark ? <div className="card-expansion-cover" aria-hidden="true" /> : null}
    </div>
  )
}

export function Card({ card, index }: CardProps) {
  const style = { '--card-index': index } as CSSProperties

  return (
    <article className="card-shell" data-card-id={card.id} data-index={index} style={style}>
      <div className="card-inner">
        <CardFace side={card.front} face="front" />
        <CardFace side={card.back} face="back" />
      </div>
    </article>
  )
}
