"use client"

import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react"

import type { Version } from "@/lib/hunch/types"
import { cn } from "@/lib/utils"

import { metricsByVersion, photoUrlOf, run } from "./data"
import "./ugc.css"

type TextStyle = "classic" | "box" | "dark"

export type UgcStats = { likes: number; comments: number; saves: number; shares: number }

export type UgcPostProps = {
  /** On-video text, the handle line and the caption all come from this post. */
  version: Pick<Version, "id" | "code" | "hook" | "caption" | "cta">
  photo?: string
  avatar?: string
  handle: string
  /** Price sticker text, e.g. "₱350 per jar". Leave out for no sticker. */
  price?: string
  /** Shows "Sponsored" and the message button, the way a boosted post looks. */
  boosted?: boolean
  stats?: UgcStats
  /** 4:5 feed crop instead of 9:16. */
  feed?: boolean
  /** Photo only, with the progress bar: for very small posts. */
  bare?: boolean
  /** Under a resting cursor the clip plays and the heart takes a like. Landing page only. */
  alive?: boolean
  className?: string
  style?: CSSProperties
}

const STYLES: TextStyle[] = ["box", "dark", "box", "box", "classic", "box", "classic", "box"]
// Where the text sits, as % of post height; creators move it around.
const SPOTS = [14, 24, 18, 30, 16, 22, 34, 20]

const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean)
const bare = (s: string) => s.replace(/[.!?]+$/, "")
const lower = (s: string) => (s.length > 1 && /[A-Z0-9]/.test(s[1] ?? "") ? s : s.charAt(0).toLowerCase() + s.slice(1))

const isEmoji = (cp: number) => cp >= 0x1f000 || (cp >= 0x2600 && cp <= 0x27bf)
const isJoiner = (cp: number) => cp === 0x200d || cp === 0xfe0f
// Width in letters; an emoji takes about two.
function widthOf(s: string) {
  let n = 0
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0
    n += isJoiner(cp) ? 0 : isEmoji(cp) ? 2 : 1
  }
  return n
}
const trails = (w: string) => Array.from(w).every((ch) => {
  const cp = ch.codePointAt(0) ?? 0
  return isEmoji(cp) || isJoiner(cp) || ch === ")"
})

// Words that lead into the next one: a line should not end on them, and a phrase starts well with them.
const LEADS = new Set(["ng", "ang", "sa", "at", "ni", "si", "kay", "nang", "mga", "yung", "pero", "o", "the", "a", "an", "of", "to", "and", "for", "in", "on", "my", "your"])
const OPENS = new Set(["ng", "ang", "sa", "na", "pang", "o", "at", "ni", "si", "kay", "nang", "mga", "yung", "pero", "para", "kasi", "galing", "kung", "this", "the", "for", "with"])
const SHORT = 10
const wrapped = new Map<string, string[]>()

// Breaks a hook into the white boxes the way a careful creator would: fewest lines, even lengths, whole phrases.
function boxLines(text: string, max = 24): string[] {
  const hit = wrapped.get(text)
  if (hit) return hit
  const units: string[] = []
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (units.length && trails(w)) units[units.length - 1] += ` ${w}`
    else units.push(w)
  }
  const head = units.length > 2 && /^pov:$/i.test(units[0] ?? "") ? [units.shift() as string] : []
  const n = units.length
  const w = units.map(widthOf)
  const span = (i: number, j: number) => w.slice(i, j).reduce((a, b) => a + b, 0) + (j - i - 1)
  const total = span(0, n)

  const solve = (lines: number) => {
    const target = total / lines
    // Lines within 3 letters of even cost nothing, so phrases decide between them.
    const cost = (i: number, j: number) => {
      const len = span(i, j)
      if (len > max && j - i > 1) return Infinity
      const end = j === n
      const word = units[j - 1]?.toLowerCase() ?? ""
      let c = Math.max(0, Math.abs(len - target) - 3) ** 2
      if (lines > 1 && len < SHORT) c += 200
      if (!end && LEADS.has(word)) c += 40
      if (!end && len >= SHORT && /[:,?!]$/.test(word)) c -= 25
      if (units.slice(i, j - 1).some((u) => /:$/.test(u))) c += 30
      if (i > 0 && (OPENS.has(units[i]?.toLowerCase() ?? "") || /^\(/.test(units[i] ?? ""))) c -= 12
      return c
    }
    // best[k][j]: cheapest way to set the first j units in k lines.
    const best = Array.from({ length: lines + 1 }, () => new Array<number>(n + 1).fill(Infinity))
    const from = Array.from({ length: lines + 1 }, () => new Array<number>(n + 1).fill(0))
    best[0]![0] = 0
    for (let k = 1; k <= lines; k++) {
      for (let j = k; j <= n; j++) {
        for (let i = k - 1; i < j; i++) {
          const c = best[k - 1]![i]! + cost(i, j)
          if (c < best[k]![j]!) {
            best[k]![j] = c
            from[k]![j] = i
          }
        }
      }
    }
    const score = best[lines]![n]!
    if (!Number.isFinite(score)) return null
    const out: string[] = []
    for (let k = lines, j = n; k > 0; k--) {
      const i = from[k]![j]!
      out.unshift(units.slice(i, j).join(" "))
      j = i
    }
    return { out, score: score + 70 * lines }
  }

  let lines = Math.max(1, Math.ceil(total / max))
  let pick = solve(lines)
  while (!pick && lines < n) pick = solve(++lines)
  const more = lines < n ? solve(lines + 1) : null
  if (pick && more && more.score < pick.score) pick = more
  const result = [...head, ...(pick?.out ?? units)]
  wrapped.set(text, result)
  return result
}

// One block in TikTok's own text tool: one style per post, no colored words.
function onVideo(hook: string, index: number) {
  const style = STYLES[index % STYLES.length] ?? "classic"
  const text = lower(bare(sentences(hook).join(" ")))
  return { style, lines: style === "classic" ? [text] : boxLines(text) }
}

// Photos fade in once decoded, so none pops in.
const shown = (img: HTMLImageElement | null) => {
  if (img?.complete && img.naturalWidth > 0) img.dataset.in = ""
}

// Sample candle posts have a silent clip next to the photo.
const clipOf = (photo?: string) => (photo && /\/sample\/candles\/A\d\.jpg$/.test(photo) ? photo.replace(/\.jpg$/, ".mp4") : null)

// Clips share one budget (two at once, big and on screen, after the entrance) and end by fading back to their photo, their own first frame.
type Live = {
  v: HTMLVideoElement
  host: HTMLElement
  src: string
  seen: boolean
  on: boolean
  hover: boolean
  rest: number
  last: number
  off: number
}

const MAX = 2
const clips = new Set<Live>()
const byVideo = new WeakMap<Element, Live>()
const byHost = new WeakMap<Element, Live>()
let lastStart = -Infinity
let frame = 0
let tick = 0
let io: IntersectionObserver | null = null
let watching = false

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

function opacityOf(el: HTMLElement) {
  let o = 1
  for (let n: HTMLElement | null = el; n && o >= 0.05; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity) || 0
  return o
}

function show(c: Live) {
  if (!c.on) return
  c.v.dataset.in = ""
  c.host.style.setProperty("--dur", `${Math.max(1, c.v.duration || 6)}s`)
  c.host.dataset.live = ""
}

function start(c: Live) {
  window.clearTimeout(c.off)
  c.on = true
  const v = c.v
  if (!v.getAttribute("src")) v.src = c.src
  if (!v.paused) {
    v.currentTime = 0
    show(c)
    return
  }
  if (v.currentTime > 0.05) v.currentTime = 0
  v.play().catch(() => {
    c.on = false
  })
}

function halt(c: Live, rest: number, release = false) {
  window.clearTimeout(c.off)
  if (c.on) {
    c.on = false
    c.last = performance.now()
  }
  c.rest = performance.now() + rest
  delete c.v.dataset.in
  delete c.host.dataset.live
  c.off = window.setTimeout(() => {
    const v = c.v
    v.pause()
    if (release && v.getAttribute("src")) {
      v.removeAttribute("src")
      v.load()
    } else if (v.currentTime) v.currentTime = 0
  }, release ? 0 : 560)
}

function plan() {
  frame = 0
  if (document.hidden || still()) return
  const now = performance.now()
  // Nothing plays during the hero entrance, and the first clip waits a beat after it.
  const root = document.querySelector("[data-hx-root]")
  if (root && root.getAttribute("data-hx") !== "done") {
    lastStart = now
    return
  }
  const modal = document.querySelector('[role="dialog"][data-state="open"]')
  const minW = Math.min(180, window.innerWidth * 0.3)
  const rows: { c: Live; ok: boolean; area: number }[] = []
  for (const c of clips) {
    let ok = c.seen && (!modal || modal.contains(c.v))
    let area = 0
    if (ok) {
      const r = c.host.getBoundingClientRect()
      const w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0)
      const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)
      area = w > 0 && h > 0 ? w * h : 0
      ok = area > 0.5 * r.width * r.height && (c.hover || r.width >= minW) && opacityOf(c.host) >= 0.6
    }
    rows.push({ c, ok, area })
  }
  for (const { c, ok } of rows) if (c.on && !ok) halt(c, 1200)
  let hovering = false
  for (const { c, ok } of rows) {
    if (!c.hover || !ok) continue
    hovering = true
    if (!c.on && now >= c.rest) start(c)
  }
  const room = MAX - (hovering ? 1 : 0)
  const auto = rows.filter(({ c, ok }) => c.on && ok && !c.hover).sort((a, b) => b.area - a.area)
  auto.slice(room).forEach(({ c }) => halt(c, 1500))
  if (auto.length >= room || now - lastStart < 1400) return
  const next = rows
    .filter(({ c, ok }) => ok && !c.on && !c.hover && now >= c.rest)
    .sort((a, b) => a.c.last - b.c.last || b.area - a.area)[0]
  if (next) {
    start(next.c)
    lastStart = now
  }
}

function soon() {
  if (!frame) frame = window.requestAnimationFrame(plan)
  const any = Array.from(clips).some((c) => c.seen)
  if (any && !tick) tick = window.setInterval(plan, 700)
  if (!any && tick) {
    window.clearInterval(tick)
    tick = 0
  }
}

// Clips wait for the tab and the reader.
function watch() {
  if (watching) return
  watching = true
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clips.forEach((c) => halt(c, 0))
    else soon()
  })
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const c = byVideo.get(e.target)
        if (!c) continue
        c.seen = e.isIntersecting
        if (!c.seen) halt(c, 0, true)
      }
      soon()
    },
    { threshold: 0.2 }
  )
}

function enlist(v: HTMLVideoElement, host: HTMLElement, src: string) {
  watch()
  const c: Live = { v, host, src, seen: false, on: false, hover: false, rest: 0, last: 0, off: 0 }
  clips.add(c)
  byVideo.set(v, c)
  byHost.set(host, c)
  const onPlaying = () => show(c)
  // Near the end the clip dissolves back to the photo, then rests before its next turn.
  const onTime = () => {
    if (c.on && v.duration - v.currentTime < 0.75) {
      halt(c, c.hover ? 650 : 3000 + Math.random() * 3000)
      soon()
    }
  }
  v.addEventListener("playing", onPlaying)
  v.addEventListener("timeupdate", onTime)
  io?.observe(v)
  return () => {
    io?.unobserve(v)
    v.removeEventListener("playing", onPlaying)
    v.removeEventListener("timeupdate", onTime)
    window.clearTimeout(c.off)
    v.pause()
    clips.delete(c)
    soon()
  }
}

function Clip({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    const host = v?.closest<HTMLElement>(".ugc")
    if (!v || !host) return
    return enlist(v, host, src)
  }, [src])
  return <video ref={ref} className="ugc-photo ugc-clip" muted playsInline preload="none" aria-hidden />
}

// A resting cursor brings a post to life: its clip plays from the start and the heart takes a like.
const dwell = new WeakMap<Element, number>()
function wake(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return
  const host = e.currentTarget
  window.clearTimeout(dwell.get(host))
  dwell.set(
    host,
    window.setTimeout(() => {
      host.dataset.liked = ""
      const c = byHost.get(host)
      if (!c || still()) return
      c.hover = true
      c.rest = 0
      soon()
    }, 120)
  )
}
function lull(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return
  const host = e.currentTarget
  window.clearTimeout(dwell.get(host))
  delete host.dataset.liked
  const c = byHost.get(host)
  if (!c?.hover) return
  c.hover = false
  halt(c, 2500)
  soon()
}

/** One post as it looks on a phone: the seller's photo, the hook as on-video text, the app's own chrome. */
export function UgcPost({ version, photo, avatar, handle, price, boosted, stats, feed, bare: photoOnly, alive, className, style }: UgcPostProps) {
  const index = Math.max(0, Number(version.code.replace(/\D/g, "")) - 1)
  const text = onVideo(version.hook, index)
  const caption = sentences(version.caption)[0] ?? version.caption
  const played = (22 + ((index * 37) % 50)) / 100
  const clip = photoOnly ? null : clipOf(photo)
  const likes = stats?.likes
  return (
    <span
      className={cn("ugc", feed && "ugc--feed", className)}
      style={{ "--played": played, "--copy-y": `${SPOTS[index % SPOTS.length]}%`, ...style } as CSSProperties}
      onPointerEnter={alive && !photoOnly ? wake : undefined}
      onPointerLeave={alive && !photoOnly ? lull : undefined}
    >
      <span className="ugc-fill" />
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ugc-photo" src={photo} alt="" draggable={false} ref={shown} onLoad={(e) => shown(e.currentTarget)} />
      ) : null}
      {clip ? <Clip src={clip} /> : null}
      {photoOnly ? null : (
        <>
          <span className="ugc-copy">
            <span className={cn("ugc-text", text.style)}>
              {text.lines.map((l, i) => (
                <span key={i}>{l}</span>
              ))}
            </span>
          </span>
          {price ? (
            <b className={cn("ugc-price", text.style === "dark" && "dark")}>
              {price}
            </b>
          ) : null}
          <span className="ugc-rail">
            <span className="who">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {avatar ? <img src={avatar} alt="" draggable={false} /> : null}
            </span>
            <span className="like">
              {likes == null ? null : alive ? (
                <span className="ugc-n">
                  <span>{likes}</span>
                  <span aria-hidden>{likes + 1}</span>
                </span>
              ) : (
                likes
              )}
            </span>
            <span className="comment">{stats?.comments}</span>
            <span className="save">{stats?.saves}</span>
            <span className="share">{stats?.shares}</span>
            <span className="disc" />
          </span>
          <span className="ugc-meta">
            <b>@{handle}</b>
            {boosted ? <i>Sponsored</i> : null}
            <span className="ugc-cap">{caption}</span>
            <small>original audio · {handle}</small>
            {boosted ? <span className="ugc-cta">{version.cta || "Message us"}</span> : null}
          </span>
        </>
      )}
    </span>
  )
}

// Elle's run, for the landing page.
const handle = run.product.name.toLowerCase().replace(/[^a-z0-9]/g, "")
const avatar = photoUrlOf(run.versions[5] ?? run.versions[0])

/** A post from the sample run by version. Decorative by default; wrap it in a button to make it open. */
export function HomePost({ version, ...rest }: { version: Version } & Partial<Omit<UgcPostProps, "version">>) {
  const m = metricsByVersion.get(version.id)
  return (
    <UgcPost
      version={version}
      photo={photoUrlOf(version)}
      avatar={avatar}
      handle={handle}
      stats={m ? { likes: m.reactions ?? 0, comments: m.comments ?? 0, saves: m.saves ?? 0, shares: m.shares ?? 0 } : undefined}
      alive
      {...rest}
    />
  )
}
