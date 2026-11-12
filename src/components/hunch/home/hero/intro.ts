// Entrance choreography for the home hero. Web Animations, so the compositor runs most of it and a skip can rush it.

export type IntroMode = "intro" | "fade" | "done"

// Runs before the hero is parsed, so the first paint already matches the mode. A deep link skips the entrance.
export const INTRO_SCRIPT = `(function(){try{var r=document.currentScript&&document.currentScript.parentElement;if(!r)return;var m=location.hash.length>1?"done":window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches?"fade":"intro";r.setAttribute("data-hx",m)}catch(e){}})();`

export function decideMode(): IntroMode {
  if (window.location.hash.length > 1) return "done"
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "fade" : "intro"
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"
const BREATHE = "cubic-bezier(0.45, 0, 0.55, 1)"
const P = 1000
// The far plane the posts come from and go back to.
const Z0 = P - P / 0.045
const TAIL = "9% 91%"

// Milliseconds from the first frame. CSS draws the outline from 0; the script takes over at the fill.
export const BEATS = {
  fill: 470,
  burst: 880,
  flyStep: 32,
  posts: 990,
  postStep: 52,
  drain: 1820,
  words: 1900,
  wordStep: 85,
  box: 2120,
  support: 2180,
  hint: 2320,
  header: 2480,
} as const

// Fly-bys: heading in degrees, and when (share of the flight) each clears the frame.
const FLYBYS = [
  { a: -156, out: 0.82, tilt: -8 },
  { a: -24, out: 0.78, tilt: 6 },
  { a: 152, out: 0.86, tilt: 7 },
  { a: 28, out: 0.8, tilt: -5 },
  { a: -98, out: 0.74, tilt: 4 },
  { a: 82, out: 0.84, tilt: -6 },
]
const FLY_FROM = 0.08
const FLY_TO = 5
const flyScale = (t: number) => FLY_FROM * Math.pow(FLY_TO / FLY_FROM, t)

type Center = { x: number; y: number }

export type Timeline = {
  rush: (ms?: number) => void
  cancel: () => void
  finished: Promise<void>
}

function all<T extends Element>(scope: ParentNode, sel: string) {
  return Array.from(scope.querySelectorAll<T & HTMLElement>(sel))
}

function rectCenter(r: DOMRect): Center {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

// Distance from a point to the edge of the screen along an angle.
function toEdge(c: Center, rad: number) {
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)
  const w = window.innerWidth
  const h = window.innerHeight
  const tx = dx > 0 ? (w - c.x) / dx : dx < 0 ? -c.x / dx : Infinity
  const ty = dy > 0 ? (h - c.y) / dy : dy < 0 ? -c.y / dy : Infinity
  return Math.max(0, Math.min(tx, ty))
}

function rise(el: Element, delay: number, y = 12, duration = 760, blur = 6) {
  return el.animate(
    [
      { opacity: 0, transform: `translate3d(0, ${y}px, 0)`, filter: `blur(${blur}px)` },
      { opacity: 1, transform: "translate3d(0, 0, 0)", filter: "blur(0px)" },
    ],
    { duration, delay, easing: EASE, fill: "both" }
  )
}

// The posts in landing order: far ones first, the winner last.
function orderedFlies(hero: HTMLElement) {
  return all<HTMLElement>(hero, "[data-hx-fly]").sort((a, b) => Number(a.dataset.order ?? 0) - Number(b.dataset.order ?? 0))
}

export function playIntro(root: HTMLElement, hero: HTMLElement, onTyping: () => void): Timeline {
  const anims: Animation[] = []
  const add = (a: Animation | undefined) => a && anims.push(a)
  const B = BEATS

  const mark = hero.querySelector<HTMLElement>(".hx-mark")
  const heroBox = hero.getBoundingClientRect()
  const center = rectCenter((mark ?? hero).getBoundingClientRect())
  hero.style.setProperty("--cx", `${center.x - heroBox.left}px`)
  hero.style.setProperty("--cy", `${center.y - heroBox.top}px`)

  const line = hero.querySelector<SVGElement>('[data-hx-el="mark-line"]')
  const fill = hero.querySelector<HTMLElement>('[data-hx-el="mark-fill"]')
  const shell = hero.querySelector<HTMLElement>("[data-prompt-shell]")
  const hint = hero.querySelector<HTMLElement>("[data-prompt-hint]")
  const support = hero.querySelector<HTMLElement>('[data-hx-el="support"]')
  const header = root.querySelector<HTMLElement>('[data-hx-el="header"]')

  // The outline started drawing at first paint; the script picks up where it is.
  const drawing = line?.getAnimations()[0]
  const drawn = Number(drawing?.currentTime ?? B.fill)
  const lead = Math.max(0, B.fill - (Number.isFinite(drawn) ? drawn : B.fill))
  const at = (ms: number) => ms - B.fill + lead

  // Measure everything before the first animation moves anything.
  const flies = orderedFlies(hero).map((el) => ({ el, box: el.getBoundingClientRect() }))
  const flybys = all<HTMLElement>(hero, "[data-hx-flyby]").map((el) => ({ el, box: el.getBoundingClientRect() }))
  const fontSize = parseFloat(getComputedStyle(hero.querySelector("h1") ?? hero).fontSize) || 56

  // a. The outline fills with light from the tail.
  if (fill) {
    add(fill.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: at(B.fill), fill: "both" }))
    add(
      fill.animate(
        [
          { clipPath: `circle(0% at ${TAIL})`, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
          { clipPath: `circle(142% at ${TAIL})`, offset: (B.burst - B.fill - 40) / (B.drain + 460 - B.fill), easing: "linear" },
          { clipPath: `circle(142% at ${TAIL})`, offset: (B.drain - B.fill) / (B.drain + 460 - B.fill), easing: "cubic-bezier(0.6, 0, 0.3, 1)" },
          { clipPath: `circle(0% at ${TAIL})` },
        ],
        { duration: B.drain + 460 - B.fill, delay: at(B.fill), fill: "both" }
      )
    )
  }
  if (mark) {
    // It draws a small breath and lets the posts go.
    add(
      mark.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(0.92)", offset: 0.2, easing: EASE },
          { transform: "scale(1.1)", offset: 0.46, easing: BREATHE },
          { transform: "scale(1)" },
        ],
        { duration: 800, delay: at(B.burst - 170) }
      )
    )
    // As the light drains, the window opens on the winning post underneath it.
    const cue = mark.animate([{}, {}], { duration: 1, delay: at(B.drain) })
    add(cue)
    cue.finished.then(() => (mark.dataset.win = ""), () => {})
  }

  // b. The burst. First a few posts rush out of the mark and past the viewer.
  flybys.forEach(({ el, box }, i) => {
    const f = FLYBYS[i % FLYBYS.length] ?? FLYBYS[0]
    const rad = (f.a * Math.PI) / 180
    // Far enough that it clears the edge at `out`, whatever the screen.
    const half = (Math.abs(Math.cos(rad)) * box.width + Math.abs(Math.sin(rad)) * box.height) / 2
    const reach = toEdge(center, rad) / flyScale(f.out) + half
    const vx = Math.cos(rad) * reach
    const vy = Math.sin(rad) * reach
    const steps = 12
    const frames: Keyframe[] = []
    for (let k = 0; k <= steps; k++) {
      const t = k / steps
      const s = flyScale(t)
      frames.push({
        transform: `translate(-50%, -50%) translate3d(${(vx * s).toFixed(1)}px, ${(vy * s).toFixed(1)}px, 0) scale(${s.toFixed(4)}) rotate(${(f.tilt * t).toFixed(2)}deg)`,
        opacity: t === 0 ? 0 : t < 0.92 ? 1 : 0,
        filter: `blur(${t < 0.4 ? 0 : Math.min(2.5, (t - 0.4) * 6).toFixed(2)}px)`,
      })
    }
    add(el.animate(frames, { duration: 820, delay: at(B.burst + i * B.flyStep), easing: "cubic-bezier(0.3, 0.4, 0.7, 1)", fill: "both" }))
  })

  // Then the 8 leave it in its color, far to near, and turn into their photos as they land.
  flies.forEach(({ el, box }, i) => {
    const delay = at(B.posts + i * B.postStep)
    const swirl = (i % 2 ? 1 : -1) * (7 + (i % 3) * 2)
    el.style.transformOrigin = `${center.x - box.left}px ${center.y - box.top}px`
    el.style.willChange = "transform, opacity, filter"
    add(
      el.animate(
        [
          { transform: `perspective(${P}px) translate3d(0px, 0px, ${Z0}px) rotate(${swirl}deg)` },
          { transform: `perspective(${P}px) translate3d(0px, 0px, 0px) rotate(0deg)` },
        ],
        { duration: 1300, delay, easing: EASE, fill: "both" }
      )
    )
    add(el.animate([{ filter: "blur(10px)" }, { filter: "blur(0px)" }], { duration: 900, delay, easing: "cubic-bezier(0.3, 0.2, 0.2, 1)", fill: "both" }))
    add(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: delay + 30, easing: "linear", fill: "both" }))
    const photo = el.querySelector<HTMLElement>(".ugc-photo")
    if (photo) add(photo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 620, delay: delay + 300, easing: "ease-out", fill: "both" }))
  })

  // c. The headline rises word by word, then the box, the line beside it and the header.
  all<HTMLElement>(hero, "[data-hx-word]").forEach((w, k) => {
    add(rise(w, at(B.words + k * B.wordStep), Math.round(fontSize * 0.28), 820, 8))
  })
  let boxAnim: Animation | undefined
  if (shell) {
    boxAnim = rise(shell, at(B.box), 14, 760, 6)
    add(boxAnim)
  }
  if (support) add(rise(support, at(B.support), 10, 700, 4))
  if (hint) add(rise(hint, at(B.hint), 8, 700, 4))
  if (header) add(rise(header, at(B.header), -8, 760, 0))

  let typed = false
  const type = () => {
    if (typed) return
    typed = true
    onTyping()
  }
  // The first example starts typing while the box is still settling.
  const typeAt = window.setTimeout(type, at(B.box) + 420)
  boxAnim?.finished.then(type, () => {})

  const finished = Promise.all(anims.map((a) => a.finished)).then(() => {
    type()
  })

  let rushed = false
  return {
    // Skip: everything lands within `ms`.
    rush(ms = 180) {
      if (rushed) return
      rushed = true
      drawing?.finish()
      for (const a of anims) {
        if (a.playState === "finished") continue
        const end = Number(a.effect?.getComputedTiming().endTime ?? 0)
        const now = Number(a.currentTime ?? 0)
        const left = end - now
        if (left > ms) a.updatePlaybackRate(left / ms)
      }
    },
    cancel() {
      window.clearTimeout(typeAt)
      for (const a of anims) a.cancel()
      flies.forEach(({ el }) => {
        el.style.willChange = ""
        el.style.transformOrigin = ""
      })
    },
    finished,
  }
}

const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Send: the line flies into the mark, the mark fills, and the 8 posts go back into it. Resolves when it is time to leave. */
export function playSend(hero: HTMLElement, from: HTMLElement | null, line: string): Promise<void> {
  const root = hero.closest<HTMLElement>("[data-hx-root]")
  const mark = hero.querySelector<HTMLElement>(".hx-mark")
  if (reduce() || !mark || root?.getAttribute("data-hx") !== "done") return Promise.resolve()
  hero.dataset.sending = ""
  const anims: Animation[] = []
  const c = rectCenter(mark.getBoundingClientRect())

  // 1. The words lift off the box and fly into the mark, shrinking as they go.
  if (from) {
    const r = from.getBoundingClientRect()
    const cs = getComputedStyle(from)
    const ghost = document.createElement("span")
    ghost.className = "hx-ghost"
    ghost.textContent = line
    Object.assign(ghost.style, {
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing,
      lineHeight: cs.lineHeight,
    })
    document.body.appendChild(ghost)
    from.style.opacity = "0"
    // Shrink-wrap to the words so they scale around their own middle.
    const range = document.createRange()
    range.selectNodeContents(ghost)
    const words = range.getBoundingClientRect()
    ghost.style.width = `${Math.ceil(words.width) + 2}px`
    const dx = c.x - (words.left + words.width / 2)
    const dy = c.y - (words.top + words.height / 2)
    const a = ghost.animate(
      [
        { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1, filter: "blur(0px)" },
        { transform: `translate3d(${dx * 0.02}px, -8px, 0) scale(0.97)`, opacity: 1, filter: "blur(0px)", offset: 0.2, easing: "cubic-bezier(0.5, 0, 0.9, 0.5)" },
        { transform: `translate3d(${dx * 0.45}px, ${dy * 0.45}px, 0) scale(0.34)`, opacity: 0.85, filter: "blur(1px)", offset: 0.5, easing: "cubic-bezier(0.2, 0.5, 0.5, 1)" },
        { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.05)`, opacity: 0, filter: "blur(1.5px)" },
      ],
      { duration: 460, easing: "linear", fill: "forwards" }
    )
    anims.push(a)
    a.finished.then(() => ghost.remove(), () => ghost.remove())
  }

  // 2. The mark fills with light from the tail, from wherever typing left it.
  const fill = hero.querySelector<HTMLElement>('[data-hx-el="mark-fill"]')
  if (fill) {
    const now = getComputedStyle(fill).clipPath
    anims.push(
      fill.animate([{ clipPath: now && now !== "none" ? now : `circle(0% at ${TAIL})` }, { clipPath: `circle(142% at ${TAIL})` }], {
        duration: 440,
        delay: 160,
        easing: "cubic-bezier(0.3, 0, 0.2, 1)",
        fill: "forwards",
      })
    )
  }
  anims.push(
    mark.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.12)", offset: 0.55, easing: BREATHE }, { transform: "scale(1)" }],
      { duration: 620, delay: 300 }
    )
  )

  // 3. The posts turn back into light and fall into it, far ones first, the winner last.
  orderedFlies(hero).forEach((el, i) => {
    const box = el.getBoundingClientRect()
    const swirl = (i % 2 ? -1 : 1) * (8 + (i % 3) * 2)
    const delay = 140 + i * 34
    el.style.transformOrigin = `${c.x - box.left}px ${c.y - box.top}px`
    anims.push(
      el.animate(
        [
          { transform: `perspective(${P}px) translate3d(0px, 0px, 0px) rotate(0deg)`, opacity: 1 },
          { transform: `perspective(${P}px) translate3d(0px, 0px, ${Z0}px) rotate(${swirl}deg)`, opacity: 0 },
        ],
        { duration: 560, delay, easing: "cubic-bezier(0.55, 0, 0.75, 0)", fill: "forwards" }
      )
    )
    const photo = el.querySelector<HTMLElement>(".ugc-photo:not(.ugc-clip)")
    const clip = el.querySelector<HTMLElement>(".ugc-clip")
    for (const ph of [photo, clip]) {
      if (ph) anims.push(ph.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: delay - 60, easing: "ease-in", fill: "forwards" }))
    }
  })

  return new Promise((done) => window.setTimeout(done, 700))
}
