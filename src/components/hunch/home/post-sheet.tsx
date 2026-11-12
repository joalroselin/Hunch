"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { nextSevenDays } from "./data"
import { itemFor, listFor, ranked, resolvePost, type SheetTab, type SheetTarget } from "./proof/data"
import { PostSheet, type Launch } from "./proof/sheet"

export type { SheetTab }

// open(id) takes a version id or code (A1..A8), a focus post id or P1..P7, a test id or T1..T2,
// a rejected draft id (opens the post that replaced it), or a chosen audience id.
type PostSheetApi = { open: (id: string, options?: { tab?: SheetTab }) => void; close: () => void }

const PostSheetContext = createContext<PostSheetApi>({ open: () => {}, close: () => {} })

// Where a post sits on screen: its center, drawn width and tilt, through every transform above it.
function launchOf(from: Element | null): Launch | null {
  const post = from?.closest("button, a")?.querySelector<HTMLElement>(".ugc")
  if (!post?.offsetWidth) return null
  let r = 0
  let s = 1
  for (let n: Element | null = post; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n)
    const rot = parseFloat(cs.rotate)
    if (Number.isFinite(rot)) r += rot
    const sc = parseFloat(cs.scale)
    if (Number.isFinite(sc)) s *= sc
    if (cs.transform && cs.transform !== "none") {
      const m = new DOMMatrixReadOnly(cs.transform)
      r += (Math.atan2(m.b, m.a) * 180) / Math.PI
      s *= Math.hypot(m.a, m.b)
    }
  }
  const b = post.getBoundingClientRect()
  if (b.bottom < 0 || b.top > window.innerHeight || b.right < 0 || b.left > window.innerWidth) return null
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: post.offsetWidth * s, r }
}

export function PostSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<SheetTarget | null>(null)
  const [dir, setDir] = useState(0)
  const [days, setDays] = useState<string[] | undefined>(undefined)
  const [launch, setLaunch] = useState<Launch | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const isOpen = useRef(false)
  // Safari does not focus a clicked button, so the last press stands in for it.
  const pressed = useRef<{ el: Element; at: number } | null>(null)

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (e.target instanceof Element) pressed.current = { el: e.target, at: performance.now() }
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [])

  const api = useMemo<PostSheetApi>(
    () => ({
      open(id) {
        const found = resolvePost(id)
        if (!found) {
          if (process.env.NODE_ENV !== "production") console.warn(`Post sheet: no post for "${id}"`)
          return
        }
        if (!isOpen.current) {
          const active = document.activeElement
          const press = pressed.current && performance.now() - pressed.current.at < 1500 ? pressed.current.el : null
          const from = active instanceof HTMLElement && active !== document.body ? active : press
          const button = from?.closest("button, a")
          opener.current = button instanceof HTMLElement ? button : null
          setLaunch(launchOf(from))
        }
        setDays((d) => d ?? nextSevenDays())
        setTarget(found)
        setDir(0)
        isOpen.current = true
        setOpen(true)
      },
      close() {
        isOpen.current = false
        setOpen(false)
      },
    }),
    []
  )

  const item = target ? itemFor(target, days) : null

  const step = useCallback(
    (delta: number) => {
      if (!target) return
      // The 8 step in the order the chart ranked them, best first.
      const order = target.kind === "version" ? ranked.map((r) => r.v) : []
      const list = order.some((v) => v.id === target.id) ? order : listFor(target.kind)
      const i = list.findIndex((v) => v.id === target.id)
      const next = list[(i + delta + list.length) % list.length]
      if (!next) return
      setDir(delta > 0 ? 1 : -1)
      setTarget({ kind: target.kind, id: next.id })
    },
    [target]
  )

  const onOpenChange = useCallback((next: boolean) => {
    isOpen.current = next
    setOpen(next)
  }, [])

  // Focus goes back to whatever opened the sheet; ours are plain buttons anywhere on the page.
  const onCloseAutoFocus = useCallback((e: Event) => {
    e.preventDefault()
    const el = opener.current
    opener.current = null
    if (el && el.isConnected) el.focus({ preventScroll: true })
  }, [])

  return (
    <PostSheetContext.Provider value={api}>
      {children}
      <PostSheet
        open={open}
        onOpenChange={onOpenChange}
        item={item}
        dir={dir}
        launch={launch}
        onStep={step}
        onCloseAutoFocus={onCloseAutoFocus}
      />
    </PostSheetContext.Provider>
  )
}

export function usePostSheet() {
  return useContext(PostSheetContext)
}
