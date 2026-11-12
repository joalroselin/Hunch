// Entrance choreography for the home hero. Web Animations, so the compositor runs most of it and a skip can rush it.

export const INTRO_KEY = "hunch-home-intro"
export type IntroMode = "intro" | "fade" | "done"

// Runs before the hero is parsed, so the first paint already matches the mode. The entrance plays on every load.
export const INTRO_SCRIPT = `(function(){try{var r=document.currentScript&&document.currentScript.parentElement;if(!r)return;var s=false;var m=s?"done":window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches?"fade":"intro";r.setAttribute("data-hx",m)}catch(e){}})();`

export function decideMode(): IntroMode {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "fade" : "intro"
}

export function markSeen() {
  try {
    window.sessionStorage.setItem(INTRO_KEY, "1")
  } catch {}
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"
const BREATHE = "cubic-bezier(0.45, 0, 0.55, 1)"
const P = 1000

// Milliseconds from the first frame.
export const BEATS = {
  line: 0,
  fill: 470,
  burst: 880,
  flyStep: 32,
  posts: 990,
  postStep: 52,
  drain: 1820,
  words: 1900,
  wordStep: 85,
  support: 2180,
  box: 2120,
  hint: 2320,
  header: 2480,
} as const

// Where each fly-by heads, in degrees, and how far out it sits at full size (share of the hero's width).
const FLYBYS = [
  { a: -156, r: 0.2, tilt: -8 },
  { a: -24, r: 0.19, tilt: 6 },
  { a: 152, r: 0.17, tilt: 7 },
  { a: 28, r: 0.18, tilt: -5 },
  { a: -98, r: 0.15, tilt: 4 },
  { a: 82, r: 0.16, tilt: -6 },
]
const TAIL = "9% 91%"

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

function rise(el: Element, delay: number, y = 12, duration = 760, blur = 6) {
  return el.animate(
    [
      { opacity: 0, transform: `translate3d(0, ${y}px, 0)`, filter: `blur(${blur}px)` },
      { opacity: 1, transform: "translate3d(0, 0, 0)", filter: "blur(0px)" },
    ],
    { duration, delay, easing: EASE, fill: "both" }
  )
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

  // Measure everything before the first animation moves anything.
  const flies = all<HTMLElement>(hero, "[data-hx-fly]").map((el) => ({ el, box: el.getBoundingClientRect() }))
  const fontSize = parseFloat(getComputedStyle(hero.querySelector("h1") ?? hero).fontSize) || 56

  // a. The mark draws its outline, then fills with light from the tail.
  if (line) {
    add(line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: B.line, fill: "both" }))
    add(line.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 620, delay: B.line, easing: "cubic-bezier(0.5, 0, 0.2, 1)", fill: "both" }))
  }
  if (fill) {
    add(fill.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: B.fill, fill: "both" }))
    add(
      fill.animate(
        [
          { clipPath: `circle(0% at ${TAIL})`, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
          { clipPath: `circle(142% at ${TAIL})`, offset: (B.burst - B.fill - 40) / (B.drain + 460 - B.fill), easing: "linear" },
          { clipPath: `circle(142% at ${TAIL})`, offset: (B.drain - B.fill) / (B.drain + 460 - B.fill), easing: "cubic-bezier(0.6, 0, 0.3, 1)" },
          { clipPath: `circle(0% at ${TAIL})` },
        ],
        { duration: B.drain + 460 - B.fill, delay: B.fill, fill: "both" }
      )
    )
  }
  // It draws a small breath and lets the posts go.
  if (mark) {
    add(
      mark.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(0.92)", offset: 0.2, easing: EASE },
          { transform: "scale(1.1)", offset: 0.46, easing: BREATHE },
          { transform: "scale(1)" },
        ],
        { duration: 800, delay: B.burst - 170 }
      )
    )
  }

  // b. The burst. First a few posts rush out of the mark and past the viewer.
  all<HTMLElement>(hero, "[data-hx-flyby]").forEach((el, i) => {
    const f = FLYBYS[i % FLYBYS.length] ?? FLYBYS[0]
    const rad = (f.a * Math.PI) / 180
    const reach = Math.max(heroBox.width, 640) * f.r
    const vx = Math.cos(rad) * reach
    const vy = Math.sin(rad) * reach
    const steps = 10
    const frames: Keyframe[] = []
    for (let k = 0; k <= steps; k++) {
      const t = k / steps
      const s = 0.08 * Math.pow(3.2 / 0.08, t)
      frames.push({
        transform: `translate(-50%, -50%) translate3d(${(vx * s).toFixed(1)}px, ${(vy * s).toFixed(1)}px, 0) scale(${s.toFixed(4)}) rotate(${(f.tilt * t).toFixed(2)}deg)`,
        opacity: t === 0 ? 0 : t < 0.7 ? 1 : t < 0.8 ? 0.55 : t < 0.9 ? 0.15 : 0,
        filter: `blur(${t < 0.7 ? 0 : ((t - 0.7) * 5).toFixed(2)}px)`,
      })
    }
    add(el.animate(frames, { duration: 800, delay: B.burst + i * B.flyStep, easing: "cubic-bezier(0.3, 0.4, 0.7, 1)", fill: "both" }))
  })

  // Then the 8 leave it, far to near, and land around the headline.
  const z0 = P - P / 0.045
  flies.forEach(({ el, box }, i) => {
    const delay = B.posts + i * B.postStep
    const ox = center.x - box.left
    const oy = center.y - box.top
    const swirl = (i % 2 ? 1 : -1) * (7 + (i % 3) * 2)
    el.style.transformOrigin = `${ox}px ${oy}px`
    el.style.willChange = "transform, opacity, filter"
    add(
      el.animate(
        [
          { transform: `perspective(${P}px) translate3d(0px, 0px, ${z0}px) rotate(${swirl}deg)` },
          { transform: `perspective(${P}px) translate3d(0px, 0px, 0px) rotate(0deg)` },
        ],
        { duration: 1300, delay, easing: EASE, fill: "both" }
      )
    )
    add(
      el.animate([{ filter: "blur(10px)" }, { filter: "blur(0px)" }], {
        duration: 900,
        delay,
        easing: "cubic-bezier(0.3, 0.2, 0.2, 1)",
        fill: "both",
      })
    )
    add(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: delay + 30, easing: "linear", fill: "both" }))
    // Each post leaves in the mark's own color and turns into its photo as it lands.
    const photo = el.querySelector<HTMLElement>(".ugc-photo")
    if (photo) add(photo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 620, delay: delay + 300, easing: "ease-out", fill: "both" }))
  })

  // c. The headline rises word by word, then the box, the line beside it and the header.
  all<HTMLElement>(hero, "[data-hx-word]").forEach((w, k) => {
    add(rise(w, B.words + k * B.wordStep, Math.round(fontSize * 0.28), 820, 8))
  })
  let boxAnim: Animation | undefined
  if (shell) {
    boxAnim = rise(shell, B.box, 14, 760, 6)
    add(boxAnim)
  }
  if (support) add(rise(support, B.support, 10, 700, 4))
  if (hint) add(rise(hint, B.hint, 8, 700, 4))
  if (header) add(rise(header, B.header, -8, 760, 0))

  let typed = false
  const type = () => {
    if (typed) return
    typed = true
    onTyping()
  }
  // The first example starts typing while the box is still settling.
  const typeAt = window.setTimeout(type, B.box + 420)
  boxAnim?.finished.then(type, () => {})

  const finished = Promise.all(anims.map((a) => a.finished)).then(() => {
    type()
  })

  let rushed = false
  return {
    // Skip: everything lands within `ms`; the intro-only actors just fade out.
    rush(ms = 180) {
      if (rushed) return
      rushed = true
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
