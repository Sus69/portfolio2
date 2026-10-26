import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Real-time animation controls. These are independent of scroll distance.
const CARD_SNAP_DURATION = 0.26
const CARD_SNAP_EASE = 'back.out(0.5)'
const FAN_SHIFT_DURATION = 0.22

/** Shells arrange the hand in 2D; only inner wrappers rotate their paired faces. */
export function createCardTimeline(root: HTMLElement, scene: HTMLElement) {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.card-shell'))
  const inners = cards.map((card) => card.querySelector<HTMLElement>('.card-inner')!)
  const nextScene = root.querySelector<HTMLElement>('.next-section')!
  const stage = root.querySelector<HTMLElement>('.card-stage')!
  const progress = root.querySelectorAll('.progress-bar')
  const last = cards.length - 1
  const reverseCards = [...cards].reverse()
  const dealSpacing = 0.92
  // Used only to reconstruct settled poses in the reversible master timeline.
  const entranceSpan = 0.43

  // Measure only at setup/refresh, never on a scroll update. A shared pivot below
  // the cards makes each rotation follow an actual circular arc.
  const geometry = () => {
    const width = cards[0].offsetWidth
    const height = cards[0].offsetHeight
    const spread = Math.min(width * 0.64 * last / 2, Math.max(40, (scene.clientWidth - width * 1.3 - 40) / 2))
    const radius = spread / Math.sin(11 * Math.PI / 180)
    return { width, height, radius }
  }
  const angle = (index: number, count: number) => (index - (count - 1) / 2) * 22 / last
  const offscreen = () => scene.clientHeight - cards[0].offsetTop + cards[0].offsetHeight / 2 + 32
  const fanOrigin = () => `50% ${geometry().height / 2 + geometry().radius}px`
  const expansionScale = () => {
    const { width, height } = geometry()
    return Math.max(scene.clientWidth / width, scene.clientHeight / height) * 1.04
  }

  gsap.set(cards, {
    xPercent: -50, yPercent: -50, x: 0, y: offscreen,
    rotation: 0, scale: 1, autoAlpha: 0,
    zIndex: (index) => index + 1,
    transformOrigin: fanOrigin,
  })
  gsap.set(inners, { rotationY: 0 })
  gsap.set(nextScene, { autoAlpha: 0 })
  gsap.set(root.querySelector('.subtitle-back'), { autoAlpha: 0 })
  gsap.set(progress, { scaleX: 0.35, transformOrigin: 'left center' })

  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: 'none', lazy: false },
  })
  // A timeline-owned function value is invalidated on resize, unlike a one-off
  // gsap.set. Keep the hand's circular pivot responsive when the viewport changes.
  timeline.set(cards, { transformOrigin: fanOrigin }, 0)

  // Every arrival opens the existing hand farther to the left. Nothing collapses
  // until all eight cards have had their own entrance and reading interval.
  const deal = (orderedCards: HTMLElement[], start: number, skipFirst = false) => {
    orderedCards.forEach((card, index) => {
      if (skipFirst && index === 0) return
      const at = start + (index - (skipFirst ? 1 : 0)) * dealSpacing
      timeline.addLabel(`${skipFirst ? 'back' : 'front'}-card-${index + 1}`, at)
      timeline.set(card, { rotation: angle(index, index + 1), autoAlpha: 1 }, at)
      timeline.to(card, { y: 0, duration: entranceSpan, ease: CARD_SNAP_EASE }, at)
      orderedCards.slice(0, index).forEach((previous, previousIndex) => {
        timeline.to(previous, {
          rotation: angle(previousIndex, index + 1), duration: entranceSpan, ease: 'power2.inOut',
        }, at)
      })
      timeline.to(progress[index], { scaleX: 1, duration: 0.4 }, at)
    })
  }

  deal(cards, 0)
  timeline.addLabel('front-fan', 7.1)
  timeline.to(cards, {
    rotation: 0, x: 0, y: 0, duration: 1.15, ease: 'power3.inOut',
  }, 'front-fan+=0.4')
  timeline.addLabel('front-stack', 8.65)

  // All fronts coincide before hiding the covered cards. Shopify alone turns
  // over, revealing its actual Figma reverse. No reversed multi-card rig.
  timeline.set(cards.slice(0, last), { autoAlpha: 0 }, 'front-stack')
  timeline.addLabel('flip', 9)
  timeline.to(inners[last], { rotationY: 180, duration: 1.25, ease: 'power2.inOut' }, 'flip')
  timeline.to(root.querySelector('.subtitle-front'), { autoAlpha: 0, duration: 0.3 }, 'flip+=0.2')
  timeline.to(root.querySelector('.subtitle-back'), { autoAlpha: 1, duration: 0.3 }, 'flip+=0.8')
  timeline.addLabel('figma', 10.25)

  // Recycle only hidden cards. Reversible sets restore the front hand on rewind.
  timeline.set(cards.slice(0, last), { y: offscreen, rotation: 0 }, 'figma')
  timeline.set(inners.slice(0, last), { rotationY: 180 }, 'figma')
  timeline.set(reverseCards, { zIndex: (index) => index + 1 }, 'figma')
  timeline.set(progress, { scaleX: 0.35 }, 'figma')
  timeline.set(progress[0], { scaleX: 1 }, 'figma')
  deal(reverseCards, 10.9, true)
  timeline.addLabel('back-fan', 17.3)
  timeline.to(reverseCards, {
    rotation: 0, x: 0, y: 0, duration: 1.15, ease: 'power3.inOut',
  }, 'back-fan+=0.4')
  timeline.addLabel('back-stack', 18.85)
  timeline.set(reverseCards.slice(0, last), { autoAlpha: 0 }, 'back-stack')

  const active = cards[0]
  // At zero rotation it is safe to switch to a centered scale pivot. Compute
  // coverage from the real card dimensions, and center the expanding surface.
  timeline.addLabel('expand', 19.2)
  timeline.set(active, { transformOrigin: '50% 50%' }, 'expand')
  timeline.to(active, {
    scale: expansionScale,
    y: () => scene.clientHeight / 2 - active.offsetTop,
    duration: 1.6, ease: 'power2.inOut',
  }, 'expand')
  timeline.to(active.querySelector('.card-expansion-cover'), { opacity: 1, duration: 0.7 }, 'expand+=0.25')
  timeline.to(active, { borderRadius: 0, duration: 1.2 }, 'expand+=0.2')
  timeline.to(root.querySelector('.scene-chrome'), { autoAlpha: 0, duration: 0.5 }, 'expand+=0.2')
  // Handoff only after the cream card covers all four edges. The next scene
  // paints above the stage, which is then hidden completely, shadows included.
  timeline.set(nextScene, { autoAlpha: 1 }, 'expand+=1.6')
  timeline.set(stage, { autoAlpha: 0 }, 'expand+=1.6')
  timeline.fromTo(nextScene.querySelector('.next-section__inner'),
    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.65 }, 'expand+=1.6')
  timeline.addLabel('revealed', 21.45)
  timeline.to({}, { duration: 0.35 })

  // Prime the canonical poses before independent tweens touch the cards. The
  // master is used for stacking/flip/expansion and restoring a group on rewind;
  // it does not run or seek while that group's cards are being dealt.
  timeline.time(timeline.duration(), true).time(0, true)

  type Hand = 'front' | 'back'
  let activeHand: Hand | null = null
  let dealtCount = 0
  let playheadTween: gsap.core.Tween | undefined
  let targetTime = -1
  let pendingUpdate: ScrollTrigger | undefined
  const arrivals = new Map<Element, gsap.core.Tween>()
  const shifts = new Map<Element, gsap.core.Tween>()
  const indicators = new Map<Element, gsap.core.Tween>()

  const stopHand = () => {
    for (const tweens of [arrivals, shifts, indicators]) {
      tweens.forEach((tween) => tween.kill())
      tweens.clear()
    }
    pendingUpdate = undefined
  }

  const animate = (target: Element, vars: gsap.TweenVars, tweens: Map<Element, gsap.core.Tween>) => {
    tweens.get(target)?.kill()
    const tween = gsap.to(target, {
      ...vars,
      onComplete: () => {
        tweens.delete(target)
        if (arrivals.size === 0 && pendingUpdate) {
          const update = pendingUpdate
          pendingUpdate = undefined
          followScroll(update)
        }
      },
    })
    tweens.set(target, tween)
  }

  const renderHand = (hand: Hand, count: number, immediate: boolean) => {
    const ordered = hand === 'front' ? cards : reverseCards
    if (activeHand !== hand || immediate) {
      stopHand()
      playheadTween?.kill()
      timeline.time(hand === 'front' ? 0 : timeline.labels.figma, true)
      activeHand = hand
      dealtCount = hand === 'front' ? 0 : 1
      if (hand === 'front') gsap.set(cards, { autoAlpha: 0 })
      targetTime = -1
    }

    // No work at all for repeated scroll events within a deal. In particular,
    // an in-flight Y tween is never restarted when the next card is triggered.
    if (count === dealtCount && !immediate) return
    ordered.forEach((card, index) => {
      const visible = index < count
      const wasVisible = index < dealtCount
      const rotation = visible ? angle(index, count) : 0
      if (immediate) {
        gsap.set(card, { y: visible ? 0 : offscreen(), autoAlpha: visible ? 1 : 0, rotation })
        gsap.set(progress[index], { scaleX: visible ? 1 : 0.35 })
        return
      }

      if (visible && !wasVisible) {
        gsap.set(card, { autoAlpha: 1 })
        animate(card, { y: 0, duration: CARD_SNAP_DURATION, ease: CARD_SNAP_EASE }, arrivals)
      } else if (!visible && wasVisible) {
        animate(card, { y: offscreen(), autoAlpha: 0, duration: CARD_SNAP_DURATION, ease: 'power3.in' }, arrivals)
      }
      if (visible || wasVisible) {
        animate(card, { rotation, duration: FAN_SHIFT_DURATION, ease: 'power3.out' }, shifts)
        animate(progress[index], { scaleX: visible ? 1 : 0.35, duration: 0.18 }, indicators)
      }
    })
    dealtCount = count
  }

  const followScroll = (trigger: ScrollTrigger, immediate = false) => {
    // Pinned triggers use a tiny negative start at the document top. Ignore
    // that epsilon so merely mounting the section doesn't trigger card one.
    const scrollTime = trigger.scroll() <= Math.max(0, trigger.start)
      ? 0
      : trigger.progress * timeline.duration()
    const hand: Hand | null = scrollTime < 7.5 ? 'front'
      : scrollTime >= 10.25 && scrollTime < 17.7 ? 'back' : null

    // Let a deal finish before starting a later stage, even if a fast wheel
    // gesture crosses its boundary. A subsequent gesture updates the pending
    // destination, not the independent card animation's speed or progress.
    if (!immediate && hand !== activeHand && arrivals.size > 0) {
      pendingUpdate = trigger
      return
    }
    pendingUpdate = undefined
    if (hand) {
      const count = hand === 'front'
        ? Math.min(cards.length, Math.ceil(scrollTime / dealSpacing))
        : Math.min(cards.length, 1 + Math.max(0, Math.ceil((scrollTime - 10.9) / dealSpacing)))
      renderHand(hand, count, immediate)
      return
    }

    if (!immediate && Math.abs(scrollTime - targetTime) < 0.00001) return
    if (activeHand !== null) {
      const wasFront = activeHand === 'front'
      stopHand()
      // Start transitions from the completed hand instead of replaying its
      // entrances through a master-playhead tween.
      timeline.time(wasFront ? timeline.labels['front-fan'] : timeline.labels['back-fan'], true)
      activeHand = null
    }

    targetTime = scrollTime
    playheadTween?.kill()
    if (immediate) {
      timeline.time(scrollTime, true)
      return
    }

    playheadTween = gsap.to(timeline, {
      time: scrollTime,
      duration: 0.12,
      ease: 'power1.out',
      overwrite: true,
    })
  }

  const trigger = ScrollTrigger.create({
    id: 'toolkit', trigger: root, pin: scene,
    start: 'top top', end: () => `+=${scene.clientWidth < 700 ? 5400 : 7000}`,
    anticipatePin: 1,
    onUpdate: (self) => followScroll(self),
    onRefreshInit: () => {
      stopHand()
      playheadTween?.kill()
      timeline.time(0, true).invalidate()
      timeline.time(timeline.duration(), true).time(0, true)
      activeHand = null
      targetTime = -1
    },
    onRefresh: (self) => followScroll(self, true),
  })

  // Tweens created inside ScrollTrigger callbacks need explicit cleanup when
  // the component unmounts or the motion preference changes mid-entrance.
  return () => {
    stopHand()
    playheadTween?.kill()
    trigger.kill()
    timeline.kill()
  }
}
