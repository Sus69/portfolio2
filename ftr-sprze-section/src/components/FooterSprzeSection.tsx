import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ThemeCat } from './ThemeCat'

gsap.registerPlugin(ScrollTrigger)

export function FooterSprzeSection() {
  const rootRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const scene = sceneRef.current
    if (!root || !scene) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const viewport = scene.querySelector<HTMLElement>('.ftr-copy-viewport')!
      const period = scene.querySelector<HTMLElement>('.ftr-period')!
      const track = scene.querySelector<HTMLElement>('.ftr-copy-track')!
      const footerReveal = scene.querySelector<HTMLElement>('.ftr-footer-reveal')!
      const footerContent = scene.querySelector<HTMLElement>('.ftr-footer-content')!
      const chrome = scene.querySelector<HTMLElement>('.ftr-chrome')!
      const caption = scene.querySelector<HTMLElement>('.ftr-caption')!
      const glows = gsap.utils.toArray<HTMLElement>('.ftr-glow', scene)
      let isActive = true
      let completionStarted = false
      let dropDistance = 0
      const HANDOFF_PROGRESS = 0.58

      const periodHandoffX = () => {
        const currentX = Number(gsap.getProperty(track, 'x')) || 0
        gsap.set(track, { x: 0 })
        const sceneBox = scene.getBoundingClientRect()
        const periodBox = period.getBoundingClientRect()
        const targetX = sceneBox.left + sceneBox.width / 2 - (periodBox.left + periodBox.width / 2)
        gsap.set(track, { x: currentX })
        return targetX
      }

      const revealGeometry = () => {
        const revealWidth = footerReveal.clientWidth
        const revealHeight = footerReveal.clientHeight
        const viewportBox = viewport.getBoundingClientRect()
        const x = viewportBox.width / 2
        const y = viewportBox.height
        const radius = Math.hypot(
          Math.max(x, revealWidth - x),
          Math.max(y, revealHeight - y),
        ) * 1.08
        return { x, y, radius }
      }

      const phaseA = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
      const phaseB = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
      gsap.set(track, { x: () => scene.clientWidth })
      gsap.set(period, { autoAlpha: 1, scale: 1, transformOrigin: 'center center' })
      gsap.set(footerReveal, {
        clipPath: () => {
          const geometry = revealGeometry()
          return `circle(0px at ${geometry.x}px ${geometry.y}px)`
        },
      })
      gsap.set(footerContent, { autoAlpha: 0, y: 44 })

      phaseA
        .to(track, { x: periodHandoffX, duration: 1 })
        .to(glows, { x: (index) => index % 2 ? '15vw' : '-12vw', y: (index) => index * 12 - 20, scale: 1.28, stagger: 0.035, duration: 1 }, '<')

      phaseB
        .to(period, { y: () => dropDistance, duration: 0.34, ease: 'power2.in' }, 0)
        .to({}, { duration: 0.06 }, 0.34)
        .to(period, {
          keyframes: [
            { scale: 2, ease: 'power1.inOut' },
            { scale: 4, ease: 'power1.inOut' },
            { scale: 8, ease: 'power1.inOut' },
          ],
          duration: 0.1,
        }, 0.4)
        .to(footerReveal, {
          clipPath: () => {
            const next = revealGeometry()!
            return `circle(${next.radius}px at ${next.x}px ${next.y}px)`
          },
          duration: 0.42,
          ease: 'power2.out',
        }, 0.48)
        .to(footerContent, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'power2.out' }, 0.76)
        .to([chrome, caption], { autoAlpha: 0, duration: 0.12 }, 0.72)

      const prepareCompletion = (preserveProgress = false) => {
        const previousProgress = phaseB.progress()
        phaseA.progress(1, true)

        const sceneBox = scene.getBoundingClientRect()
        const periodBox = period.getBoundingClientRect()
        const periodCenterY = periodBox.top - sceneBox.top + periodBox.height / 2
        const visibleHeight = Math.min(scene.clientHeight, window.innerHeight)
        const targetY = Math.max(periodBox.height / 2, visibleHeight - periodBox.height / 2)
        dropDistance = Math.max(0, targetY - periodCenterY)

        gsap.set(period, { y: dropDistance, scale: 1, autoAlpha: 1 })
        const geometry = revealGeometry()
        const closedReveal = `circle(0px at ${geometry.x}px ${geometry.y}px)`
        gsap.set(period, { y: 0, scale: 1, autoAlpha: 1 })
        gsap.set(footerReveal, { clipPath: closedReveal })
        gsap.set(footerContent, { autoAlpha: 0, y: 44 })
        completionStarted = true
        phaseB.invalidate()
        phaseB.progress(preserveProgress ? previousProgress : 0, true)
      }

      const resetCompletion = () => {
        completionStarted = false
        dropDistance = 0
        phaseB.progress(0, true)
        gsap.set(period, { y: 0, scale: 1, autoAlpha: 1 })
        gsap.set(footerReveal, {
          clipPath: () => {
            const geometry = revealGeometry()
            return `circle(0px at ${geometry.x}px ${geometry.y}px)`
          },
        })
        gsap.set(footerContent, { autoAlpha: 0, y: 44 })
        gsap.set([chrome, caption], { autoAlpha: 1 })
      }

      const trigger = ScrollTrigger.create({
        id: 'sprze-footer',
        trigger: root,
        pin: root,
        start: 'top top',
        end: () => `+=${scene.clientWidth < 700 ? 3400 : 4200}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (self.progress < HANDOFF_PROGRESS) {
            if (completionStarted) resetCompletion()
            phaseA.progress(self.progress / HANDOFF_PROGRESS)
          } else {
            if (!completionStarted) prepareCompletion()
            phaseA.progress(1, true)
            const bProgress = gsap.utils.clamp(0, 1, (self.progress - HANDOFF_PROGRESS) / (1 - HANDOFF_PROGRESS))
            phaseB.progress(bProgress)
          }
        },
        onRefresh: (self) => {
          phaseA.invalidate()
          if (self.progress < HANDOFF_PROGRESS) {
            if (completionStarted) resetCompletion()
            phaseA.progress(Math.min(self.progress / HANDOFF_PROGRESS, 1), true)
          } else {
            prepareCompletion(true)
            phaseA.progress(1, true)
            const bProgress = gsap.utils.clamp(0, 1, (self.progress - HANDOFF_PROGRESS) / (1 - HANDOFF_PROGRESS))
            phaseB.progress(bProgress, true)
          }
        },
      })
      const handleResize = () => {
        if (!isActive) return
        phaseA.invalidate()
        if (completionStarted) prepareCompletion(true)
      }
      window.addEventListener('resize', handleResize)
      ScrollTrigger.refresh()
      const fontRefresh = document.fonts?.ready.then(() => {
        if (isActive) ScrollTrigger.refresh()
      })

      return () => {
        isActive = false
        void fontRefresh
        window.removeEventListener('resize', handleResize)
        trigger.kill()
        phaseA.kill()
        phaseB.kill()
      }
    }, root)

    return () => media.revert()
  }, [])

  return (
    <main className="ftr-page">
      <section id="top" className="ftr-sprze-section" ref={rootRef} aria-label="Closing message and footer">
        <div className="ftr-scene" ref={sceneRef}>
          <div className="ftr-grain" aria-hidden="true" />
          <div className="ftr-gradient-field" aria-hidden="true">
            <span className="ftr-glow ftr-glow--coral" />
            <span className="ftr-glow ftr-glow--violet" />
            <span className="ftr-glow ftr-glow--blue" />
            <span className="ftr-glow ftr-glow--lime" />
          </div>

          <header className="ftr-chrome">
            <a className="ftr-wordmark" href="#top" aria-label="Back to top">sprze<span>↘</span></a>
            <p className="ftr-counter">06 <i>/</i> 06</p>
            <p className="ftr-scroll-note">keep going <span>↓</span></p>
          </header>

          <p className="ftr-sr-only">You will really like this one.</p>
          <div className="ftr-copy-viewport" aria-hidden="true">
            <div className="ftr-copy-track">
              <p className="ftr-phrase">you will really like this one<span className="ftr-period">.</span></p>
            </div>
          </div>
          <p className="ftr-caption">a little something for the way out</p>

          <div className="ftr-footer-reveal">
            <div className="ftr-footer-content">
              <div className="ftr-footer-topline">
                <span>sprze studio</span>
                <span>let's make the good stuff</span>
              </div>
              <div className="ftr-footer-main">
                <p className="ftr-footer-kicker">have a nice day<span>↗</span></p>
                <h2>See you<br />around.</h2>
              </div>
              <div className="ftr-cat-row">
                <p className="theme-note--footer">a cat supervised this build</p>
                <ThemeCat className="theme-cat--footer" />
              </div>
              <div className="ftr-footer-bottomline">
                <span>© 2025 — 2026</span>
                <nav aria-label="Footer links">
                  <a href="mailto:hello@sprze.studio">contact</a>
                  <a href="https://instagram.com/" target="_blank" rel="noreferrer">instagram</a>
                  <a href="#top">back to top ↑</a>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="ftr-after-space" aria-hidden="true" />
    </main>
  )
}
