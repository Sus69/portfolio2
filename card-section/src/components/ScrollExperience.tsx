import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { Card } from './Card'
import { toolkitCards } from '../data/cards'
import { createCardTimeline } from '../animations/cardTimeline'

export function ScrollExperience() {
  const rootRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const scene = sceneRef.current
    if (!root || !scene) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      return createCardTimeline(root, scene)
    }, root)
    return () => media.revert()
  }, [])

  return (
    <main>
      <section className="experience" ref={rootRef} aria-label="Toolkit scroll experience">
        <div className="scene" ref={sceneRef}>
          <div className="next-section">
            <div className="next-section__inner">
              <span className="next-section__kicker">end of toolkit</span>
              <h2>A new canvas<br />for the next idea.</h2>
              <span className="next-section__line" />
            </div>
          </div>

          <div className="scene-chrome">
            <a className="wordmark" href="#top" aria-label="Back to top">gl<span>↘</span></a>
            <nav className="nav-pill" aria-label="Section navigation">
              <a href="#journey">journey</a>
              <a className="active" href="#toolkit">toolkit</a>
              <a href="#projects">projects</a>
              <a href="#playground">playground</a>
              <a href="#contact">contact</a>
              <span className="language">EN <i>/</i> FR</span>
            </nav>
            <header className="heading-block">
              <p className="heading-block__eyebrow">selected tools / 2024—25</p>
              <h1>Toolkit</h1>
              <p className="heading-block__subtitle">
                <span className="subtitle-front">Creative Front-end</span>
                <span className="subtitle-back">Art Direction</span>
              </p>
            </header>
            <div className="progress" aria-hidden="true">
              {toolkitCards.map((card, index) => <span className="progress-bar" key={card.id} data-step={index} />)}
            </div>
            <p className="scroll-hint">scroll to explore <span>↓</span></p>
          </div>

          <div className="card-stage">
            <div className="cards">
              {toolkitCards.map((card, index) => <Card card={card} index={index} key={card.id} />)}
            </div>
          </div>

          <div className="reduced-content">
            <p className="reduced-content__label">Toolkit contents</p>
            <div className="reduced-content__grid">
              {toolkitCards.map((card) => (
                <div className="reduced-content__item" key={card.id}>
                  <strong>{card.front.title.replace('\n', ' ')}</strong>
                  <span>{card.back.title.replace('\n', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="after-space" aria-hidden="true" />
    </main>
  )
}
