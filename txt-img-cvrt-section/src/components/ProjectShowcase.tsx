import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects, type Project } from '../data/projects'
import { ThemeCat } from './ThemeCat'

gsap.registerPlugin(ScrollTrigger)

const PREVIEW_HOLD_MS = 600

type LetterProps = {
  character: string
  index: number
  project: Project
  active: boolean
  closing: boolean
  onActivate: (index: number) => void
  onLeave: () => void
  onClose: () => void
}

function Letter({ character, index, project, active, closing, onActivate, onLeave, onClose }: LetterProps) {
  const rotation = ((index * 17 + project.name.length * 5) % 13) - 6
  const width = 1.45 + ((index * 11) % 4) * 0.12
  const height = 1.18 + ((index * 7) % 3) * 0.12
  const radians = Math.abs(rotation) * Math.PI / 180
  const slotWidth = width * Math.cos(radians) + height * Math.sin(radians) + 0.06
  const image = project.images[index % project.images.length]

  return (
    <button
      type="button"
      className="project-letter"
      data-active={active}
      data-closing={closing}
      aria-pressed={active}
      aria-label={`${project.name}: preview ${index + 1}, letter ${character}`}
      onPointerEnter={(event) => { if (event.pointerType !== 'touch') onActivate(index) }}
      onPointerLeave={(event) => { if (event.pointerType !== 'touch') onLeave() }}
      onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) onActivate(index) }}
      onBlur={onLeave}
      onClick={() => active ? onLeave() : onActivate(index)}
      onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}
      style={{
        '--letter-rotation': `${rotation}deg`,
        '--preview-width': `${width}em`,
        '--preview-height': `${height}em`,
        '--preview-space': `${slotWidth}em`,
      } as CSSProperties}
    >
      <span className="project-letter__measure" aria-hidden="true">{character}</span>
      <span className="project-letter__character" aria-hidden="true">{character}</span>
      <span className="project-letter__preview" aria-hidden="true">
        <img src={image.src} alt={image.alt} width="320" height="420" draggable={false} />
      </span>
    </button>
  )
}

function ProjectRow({ project }: { project: Project }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [closingIndices, setClosingIndices] = useState<Set<number>>(() => new Set())
  const closeTimers = useRef(new Map<number, number>())
  const nameRef = useRef<HTMLHeadingElement>(null)

  const cancelClose = (index: number) => {
    const timer = closeTimers.current.get(index)
    if (timer !== undefined) window.clearTimeout(timer)
    closeTimers.current.delete(index)
    setClosingIndices((current) => {
      const next = new Set(current)
      next.delete(index)
      return next
    })
  }

  const beginClose = (index: number) => {
    if (closeTimers.current.has(index)) return
    setClosingIndices((current) => new Set(current).add(index))
    const timer = window.setTimeout(() => {
      closeTimers.current.delete(index)
      setClosingIndices((current) => {
        const next = new Set(current)
        next.delete(index)
        return next
      })
    }, PREVIEW_HOLD_MS)
    closeTimers.current.set(index, timer)
  }

  const activate = (index: number) => {
    if (activeIndex !== null && activeIndex !== index) beginClose(activeIndex)
    cancelClose(index)
    setActiveIndex(index)
  }

  const close = (index = activeIndex) => {
    if (index === null) return
    if (activeIndex === index) setActiveIndex(null)
    beginClose(index)
  }

  useEffect(() => () => closeTimers.current.forEach((timer) => window.clearTimeout(timer)), [])

  useLayoutEffect(() => {
    const letters = Array.from(nameRef.current!.querySelectorAll<HTMLElement>('.project-letter'))
    const measure = () => letters.forEach((letter) => {
      const glyph = letter.querySelector<HTMLElement>('.project-letter__measure')!
      letter.style.setProperty('--glyph-width', `${getComputedStyle(glyph).width}`)
    })
    measure()
    const observer = new ResizeObserver(measure)
    letters.forEach((letter) => observer.observe(letter.querySelector('.project-letter__measure')!))
    return () => observer.disconnect()
  }, [])

  return (
    <article className="project-row" data-project={project.name} data-active-index={activeIndex ?? undefined}>
      <div className="project-row__main">
        <h2 className="project-row__name" ref={nameRef} aria-label={project.name}>
          {Array.from(project.name).map((character, index) => (
            <Letter key={`${project.name}-${index}`} character={character} index={index} project={project}
              active={activeIndex === index} closing={closingIndices.has(index)} onActivate={activate}
              onLeave={() => close()} onClose={() => close(index)} />
          ))}
        </h2>
      </div>
    </article>
  )
}

export function ProjectShowcase() {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const rows = gsap.utils.toArray<HTMLElement>('.project-row__main', section)
      const ticks = gsap.utils.toArray<HTMLElement>('.projects-scroll-feedback__tick', section)
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: true,
          start: 'top top',
          end: () => `+=${Math.max(1200, window.innerHeight * 1.8)}`,
          scrub: 0.45,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            section.style.setProperty('--project-progress', String(self.progress))
            const active = Math.min(projects.length - 1, Math.floor(self.progress * projects.length))
            ticks.forEach((tick, index) => tick.classList.toggle('is-active', index === active))
          },
        },
      })
      gsap.set(rows, { autoAlpha: 0, y: 18 })
      ticks.forEach((tick, index) => tick.classList.toggle('is-active', index === 0))
      rows.forEach((row, index) => {
        timeline.to(row, { autoAlpha: 1, y: 0, duration: 0.32, ease: 'power2.out' }, index * 0.2)
      })
    }, section)
    return () => media.revert()
  }, [])

  return (
    <section id="projects" className="projects-section" ref={sectionRef} aria-label="Selected projects">
      <p className="theme-note--projects">psst — hover a letter</p>
      <ThemeCat className="theme-cat--projects" />
      <div className="projects-scroll-feedback" aria-hidden="true">
        <span className="projects-scroll-feedback__track"><span className="projects-scroll-feedback__fill" /></span>
        {projects.map((project) => <span className="projects-scroll-feedback__tick" key={project.name} />)}
      </div>
      <div className="projects-list">
        {projects.map((project) => <ProjectRow key={project.name} project={project} />)}
      </div>
    </section>
  )
}
