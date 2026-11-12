"use client"

import { useEffect, useRef, type CSSProperties } from "react"

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
  className?: string
  style?: CSSProperties
}

const STYLES: TextStyle[] = ["box", "dark", "box", "box", "classic", "box", "classic", "box"]
// Where the text sits, as % of post height; creators move it around.
const SPOTS = [14, 24, 18, 30, 16, 22, 34, 20]

const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean)
const bare = (s: string) => s.replace(/[.!?]+$/, "")
const lower = (s: string) => (s.length > 1 && /[A-Z0-9]/.test(s[1] ?? "") ? s : s.charAt(0).toLowerCase() + s.slice(1))

// Wraps words into short lines for the white text boxes; breaks early after a colon or a comma near the limit.
function boxLines(text: string, max = 22) {
  const out: string[] = []
  let line = ""
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && (next.length > max || /:$/.test(line) || (/,$/.test(line) && next.length > max - 5))) {
      out.push(line)
      line = word
    } else line = next
  }
  if (line) out.push(line)
  // No lone short word on the last line.
  const last = out[out.length - 1] ?? ""
  const prev = out[out.length - 2]?.split(" ") ?? []
  if (last.length < 8 && prev.length > 2) {
    out[out.length - 1] = `${prev.pop()} ${last}`
    out[out.length - 2] = prev.join(" ")
  }
  return out
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

// Sample candle posts have a silent clip next to the photo; it plays only while on screen.
const clipOf = (photo?: string) => (photo && /\/sample\/candles\/A\d\.jpg$/.test(photo) ? photo.replace(/\.jpg$/, ".mp4") : null)

function Clip({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        if (!v.src) v.src = src
        v.play().catch(() => {})
      } else v.pause()
    }, { threshold: 0.2 })
    io.observe(v)
    return () => io.disconnect()
  }, [src])
  return (
    <video
      ref={ref}
      className="ugc-photo ugc-clip"
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      onPlaying={(e) => (e.currentTarget.dataset.in = "")}
    />
  )
}

/** One post as it looks on a phone: the seller's photo, the hook as on-video text, the app's own chrome. */
export function UgcPost({ version, photo, avatar, handle, price, boosted, stats, feed, bare: photoOnly, className, style }: UgcPostProps) {
  const index = Math.max(0, Number(version.code.replace(/\D/g, "")) - 1)
  const text = onVideo(version.hook, index)
  const caption = sentences(version.caption)[0] ?? version.caption
  const played = 22 + ((index * 37) % 50)
  return (
    <span
      className={cn("ugc", feed && "ugc--feed", className)}
      style={{ "--played": `${played}%`, "--copy-y": `${SPOTS[index % SPOTS.length]}%`, ...style } as CSSProperties}
    >
      <span className="ugc-fill" />
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ugc-photo" src={photo} alt="" draggable={false} ref={shown} onLoad={(e) => shown(e.currentTarget)} />
      ) : null}
      {clipOf(photo) && !photoOnly ? <Clip src={clipOf(photo)!} poster={photo!} /> : null}
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
            <span className="like">{stats?.likes ?? 0}</span>
            <span className="comment">{stats?.comments ?? 0}</span>
            <span className="save">{stats?.saves ?? 0}</span>
            <span className="share">{stats?.shares ?? 0}</span>
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
      {...rest}
    />
  )
}
