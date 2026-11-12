"use client"

import * as React from "react"
import { useRef } from "react"
import {
  BatteryFull,
  ChevronLeft,
  Ellipsis,
  Share,
  SignalHigh,
  Wifi,
} from "lucide-react"

import type { PostStyle, Version } from "@/lib/hunch/types"
import { estimateFontSize, useFitText } from "./use-fit-text"

export const POST_WIDTH = 1080
export const POST_HEIGHT = 1350

// The seller's colors (brand book p. 21): chili, garlic and cream. Never Hunch navy or indigo.
export const postColors = {
  chili: "#C8361B",
  chiliLight: "#CF3B21",
  chiliDeep: "#8F2310",
  garlic: "#F2C46B",
  garlicLight: "#F8D88F",
  garlicDeep: "#DDA845",
  cream: "#FFF8EC",
  creamDeep: "#F4E7D0",
  brown: "#2B1A0B",
  brownSoft: "#6B5440",
  ember: "#4A2414",
  photoBase: "#1A120A",
  paper: "#FFFDF7",
  noteAmber: "#D99A00",
  noteGrey: "#9A958C",
} as const

export type PostPaletteId = "chili" | "garlic" | "ember" | "cream"

export interface PostPalette {
  id: PostPaletteId
  ground: [string, string, string] // light, mid, deep
  onGround: string // text on the ground
  accent: string // circle, dot, highlight
  onAccent: string // text on the accent
  pill: string // CTA pill on the ground
  onPill: string
  panel: string // soft post text panel
  panelInk: string
  panelSoft: string
  panelPop: string // soft post CTA
}

const c = postColors

// A small fixed set. Every text pair clears 4.5:1.
export const POST_PALETTES: Record<PostPaletteId, PostPalette> = {
  chili: {
    id: "chili",
    ground: [c.chiliLight, c.chili, c.chiliDeep],
    onGround: c.cream,
    accent: c.garlic,
    onAccent: c.brown,
    pill: c.cream,
    onPill: c.brown,
    panel: c.cream,
    panelInk: c.brown,
    panelSoft: c.brownSoft,
    panelPop: c.chili,
  },
  garlic: {
    id: "garlic",
    ground: [c.garlicLight, c.garlic, c.garlicDeep],
    onGround: c.brown,
    accent: c.chili,
    onAccent: c.cream,
    pill: c.brown,
    onPill: c.cream,
    panel: c.cream,
    panelInk: c.brown,
    panelSoft: c.brownSoft,
    panelPop: c.chili,
  },
  ember: {
    id: "ember",
    ground: [c.ember, c.brown, c.photoBase],
    onGround: c.cream,
    accent: c.garlic,
    onAccent: c.brown,
    pill: c.garlic,
    onPill: c.brown,
    panel: c.cream,
    panelInk: c.brown,
    panelSoft: c.brownSoft,
    panelPop: c.chili,
  },
  cream: {
    id: "cream",
    ground: [c.paper, c.cream, c.creamDeep],
    onGround: c.brown,
    accent: c.chili,
    onAccent: c.cream,
    pill: c.chili,
    onPill: c.cream,
    panel: c.brown,
    panelInk: c.cream,
    panelSoft: c.creamDeep,
    panelPop: c.garlic,
  },
}

const BOLD_ORDER: PostPaletteId[] = ["chili", "garlic", "ember", "cream"]
const SOFT_ORDER: PostPaletteId[] = ["cream", "garlic", "ember", "chili"]

// DECISION: palette comes from the code and style, so a post keeps its colors everywhere and the 8 differ.
export function paletteFor(version: Pick<Version, "code" | "style">): PostPalette {
  const n = Number(version.code.replace(/\D/g, "")) || 1
  const id =
    version.style === "soft" ? SOFT_ORDER[(n + Math.floor(n / 4)) % 4] : BOLD_ORDER[n % 4]
  return POST_PALETTES[id]
}

// Schibsted has no peso sign, so the sign is set in Geist.
const GEIST = 'var(--font-geist), "Geist", system-ui, sans-serif'
const FONT = `var(--font-schibsted), "Schibsted Grotesk", ${GEIST}`

export function withPeso(text: string): React.ReactNode {
  if (!text.includes("₱")) return text
  return text.split("₱").map((part, i) =>
    i === 0 ? (
      part
    ) : (
      <React.Fragment key={i}>
        <span style={{ fontFamily: GEIST }}>₱</span>
        {part}
      </React.Fragment>
    )
  )
}

export interface PostCanvasProps {
  version: Version
  // Downscaled JPEG data URL.
  photo?: string
  // Overrides version.style.
  style?: PostStyle
  // Overrides the palette picked from the code.
  palette?: PostPaletteId
  // Seller or shop name, shown small on the post.
  brand?: string
  // e.g. "₱149 / 100 g"
  price?: string
  // Notes-style date line.
  noteDate?: string
  className?: string
  ref?: React.Ref<HTMLDivElement>
}

export function supportingLines(version: Version) {
  const hook = version.hook.trim()
  return version.slides
    .map((s) => s.trim())
    .filter((s) => s && s !== hook)
    .slice(0, 2)
}

export function PostCanvas({
  version,
  photo,
  style,
  palette,
  brand,
  price,
  noteDate,
  className,
  ref,
}: PostCanvasProps) {
  const kind = style ?? version.style ?? "bold"
  const pal = palette ? POST_PALETTES[palette] : paletteFor({ code: version.code, style: kind })
  const inner =
    kind === "soft" ? (
      <SoftPost version={version} photo={photo} brand={brand} price={price} pal={pal} />
    ) : kind === "note" ? (
      <NotePost version={version} photo={photo} noteDate={noteDate} />
    ) : (
      <BoldPost version={version} photo={photo} brand={brand} price={price} pal={pal} />
    )

  return (
    <div
      ref={ref}
      data-post-canvas={kind}
      data-palette={kind === "note" ? undefined : pal.id}
      className={className}
      style={{
        position: "relative",
        width: POST_WIDTH,
        height: POST_HEIGHT,
        overflow: "hidden",
        fontFamily: FONT,
        WebkitFontSmoothing: "antialiased",
        textRendering: "optimizeLegibility",
        flexShrink: 0,
      }}
    >
      {inner}
    </div>
  )
}

type InnerProps = Pick<PostCanvasProps, "version" | "photo" | "brand" | "price"> & { pal: PostPalette }

function Photo({ src, style }: { src: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      style={{ display: "block", objectFit: "cover", ...style }}
    />
  )
}

function BoldPost({ version, photo, brand, price, pal }: InnerProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const lines = supportingLines(version)
  const hasPhoto = Boolean(photo)
  const ink = hasPhoto ? "#FFFFFF" : pal.onGround
  const top = hasPhoto ? 500 : 200
  const min = 60
  const max = hasPhoto ? 128 : 150
  const chars = version.hook.length + lines.join(" ").length * 0.35
  const initial = estimateFontSize(chars, 936, POST_HEIGHT - top - 220, min, max)
  useFitText(boxRef, textRef, min, max, `${version.hook}|${lines.join("|")}|${hasPhoto}`)
  // On a photo the brand book keeps garlic for the dot and highlight.
  const mark = hasPhoto ? postColors.garlic : pal.accent
  const onMark = hasPhoto ? postColors.brown : pal.onAccent

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: hasPhoto
          ? postColors.photoBase
          : `radial-gradient(120% 80% at 15% 0%, ${pal.ground[0]} 0%, ${pal.ground[1]} 45%, ${pal.ground[2]} 100%)`,
      }}
    >
      {photo ? (
        <>
          <Photo src={photo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.86) 80%, rgba(0,0,0,0.92) 100%)",
            }}
          />
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            right: -200,
            top: -330,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: pal.accent,
            opacity: 0.92,
          }}
        />
      )}

      {brand ? (
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 72,
            maxWidth: 640,
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: ink,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              flexShrink: 0,
              borderRadius: "50%",
              background: hasPhoto ? mark : pal.onGround,
            }}
          />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{withPeso(brand)}</span>
        </div>
      ) : null}

      <div
        ref={boxRef}
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top,
          bottom: 210,
          display: "flex",
          flexDirection: "column",
          justifyContent: hasPhoto ? "flex-end" : "center",
        }}
      >
        <div ref={textRef} style={{ fontSize: initial, width: "100%" }}>
          <div
            style={{
              color: ink,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              textWrap: "balance",
              overflowWrap: "normal",
              textShadow: hasPhoto ? "0 2px 24px rgba(0,0,0,0.35)" : undefined,
            }}
          >
            {withPeso(version.hook)}
          </div>
          {lines.length ? (
            <div style={{ marginTop: "0.42em", fontSize: "0.34em", lineHeight: 1.5 }}>
              {lines.map((line, i) => (
                <div key={i} style={{ marginTop: i ? "0.2em" : 0 }}>
                  <span
                    style={{
                      background: hasPhoto ? mark : pal.onGround,
                      color: hasPhoto ? onMark : pal.ground[2],
                      fontWeight: 700,
                      padding: "0.1em 0.32em",
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {withPeso(line)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {version.cta ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 88,
              padding: "0 40px",
              borderRadius: 999,
              background: hasPhoto ? "#FFFFFF" : pal.pill,
              color: hasPhoto ? postColors.brown : pal.onPill,
              fontSize: 36,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: price ? 600 : 936,
            }}
          >
            {withPeso(version.cta)}
          </span>
        ) : (
          <span />
        )}
        {price ? (
          <span
            style={{
              color: ink,
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {withPeso(price)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function SoftPost({ version, photo, brand, price, pal }: InnerProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const lines = supportingLines(version).slice(0, 1)
  const hasPhoto = Boolean(photo)
  const photoH = 740
  const min = 44
  const max = 92
  const chars = version.hook.length + lines.join(" ").length * 0.3
  const initial = estimateFontSize(chars, 936, 400, min, max)
  useFitText(boxRef, textRef, min, max, `${version.hook}|${lines.join("|")}`)
  const meta = [brand, price].filter(Boolean).join("  ·  ")
  const title = brand ?? price ?? ""

  return (
    <div style={{ position: "absolute", inset: 0, background: pal.panel }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: photoH, overflow: "hidden" }}>
        {photo ? (
          <Photo src={photo} style={{ width: "100%", height: "100%" }} />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(160deg, ${pal.ground[0]} 0%, ${pal.ground[1]} 50%, ${pal.ground[2]} 100%)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -140,
                bottom: -260,
                width: 620,
                height: 620,
                borderRadius: "50%",
                background: pal.accent,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 72,
                bottom: 64,
                maxWidth: 760,
                textAlign: "right",
                color: pal.onGround,
                fontSize: title.length > 12 ? 120 : 160,
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: "-0.05em",
                textWrap: "balance",
              }}
            >
              {withPeso(title)}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: photoH + 56,
          display: "flex",
          justifyContent: "space-between",
          color: pal.panelSoft,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "0",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{withPeso(hasPhoto ? meta : brand ? (price ?? "") : "")}</span>
      </div>

      <div
        ref={boxRef}
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: photoH + 116,
          bottom: 150,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <div ref={textRef} style={{ fontSize: initial, width: "100%" }}>
          <div
            style={{
              color: pal.panelInk,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              textWrap: "balance",
              overflowWrap: "normal",
            }}
          >
            {withPeso(version.hook)}
          </div>
          {lines.length ? (
            <div
              style={{
                marginTop: "0.45em",
                fontSize: "0.42em",
                lineHeight: 1.3,
                fontWeight: 500,
                color: pal.panelSoft,
                textWrap: "pretty",
              }}
            >
              {withPeso(lines[0])}
            </div>
          ) : null}
        </div>
      </div>

      {version.cta ? (
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            bottom: 72,
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: pal.panelPop,
            fontSize: 34,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <span style={{ width: 40, height: 4, background: pal.panelPop, flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{withPeso(version.cta)}</span>
        </div>
      ) : null}
    </div>
  )
}

function NotePost({
  version,
  photo,
  noteDate = "Today at 8:47 PM",
}: Pick<PostCanvasProps, "version" | "photo" | "noteDate">) {
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const lines = supportingLines(version)
  const body = version.cta ? [...lines, version.cta] : lines
  const hasPhoto = Boolean(photo)
  const top = 330
  const bottom = hasPhoto ? 72 + 360 + 48 : 72
  const min = 28
  const max = 66
  const chars = version.hook.length * 1.5 + body.join(" ").length
  const initial = estimateFontSize(chars, 936, POST_HEIGHT - top - bottom, min, max, 0.9)
  useFitText(boxRef, textRef, min, max, `${version.hook}|${body.join("|")}|${hasPhoto}`)
  const amber = postColors.noteAmber

  return (
    <div style={{ position: "absolute", inset: 0, background: postColors.paper, color: "#1C1A17" }}>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 64,
          top: 44,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 38,
          fontWeight: 600,
        }}
      >
        <span style={{ paddingLeft: 24 }}>8:47</span>
        <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SignalHigh size={40} strokeWidth={2.6} />
          <Wifi size={40} strokeWidth={2.6} />
          <BatteryFull size={52} strokeWidth={2} />
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 40,
          right: 64,
          top: 140,
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: amber,
          fontSize: 42,
          fontWeight: 500,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ChevronLeft size={60} strokeWidth={2.4} />
          Notes
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <Share size={42} strokeWidth={2.2} />
          <Ellipsis size={46} strokeWidth={2.4} />
          <span style={{ fontWeight: 700 }}>Done</span>
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 250,
          textAlign: "center",
          color: postColors.noteGrey,
          fontSize: 28,
          fontWeight: 500,
        }}
      >
        {noteDate}
      </div>

      <div
        ref={boxRef}
        style={{ position: "absolute", left: 72, right: 72, top, bottom }}
      >
        <div ref={textRef} style={{ fontSize: initial, width: "100%" }}>
          <div
            style={{
              fontSize: "1.45em",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
              textWrap: "pretty",
              overflowWrap: "normal",
            }}
          >
            {withPeso(version.hook)}
          </div>
          {body.map((line, i) => (
            <p
              key={i}
              style={{
                margin: 0,
                marginTop: i === 0 ? "0.8em" : "0.55em",
                lineHeight: 1.36,
                fontWeight: 400,
                textWrap: "pretty",
              }}
            >
              {withPeso(line)}
            </p>
          ))}
        </div>
      </div>

      {photo ? (
        <Photo
          src={photo}
          style={{
            position: "absolute",
            left: 72,
            bottom: 72,
            width: 360,
            height: 360,
            borderRadius: 28,
          }}
        />
      ) : null}
    </div>
  )
}
