"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"

import { nextSevenDays } from "./data"
import { itemFor, listFor, resolvePost, type SheetTab, type SheetTarget } from "./proof/data"
import { PostSheet } from "./proof/sheet"

export type { SheetTab }

// open(id) takes a version id or code (A1..A8), a focus post id or P1..P7, a test id or T1..T2,
// a rejected draft id (opens the post that replaced it), or a chosen audience id.
type PostSheetApi = { open: (id: string, options?: { tab?: SheetTab }) => void; close: () => void }

const PostSheetContext = createContext<PostSheetApi>({ open: () => {}, close: () => {} })

export function PostSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<SheetTarget | null>(null)
  const [dir, setDir] = useState(0)
  const [days, setDays] = useState<string[] | undefined>(undefined)
  const opener = useRef<HTMLElement | null>(null)
  const isOpen = useRef(false)

  const api = useMemo<PostSheetApi>(
    () => ({
      open(id) {
        const found = resolvePost(id)
        if (!found) {
          if (process.env.NODE_ENV !== "production") console.warn(`Post sheet: no post for "${id}"`)
          return
        }
        if (!isOpen.current) {
          const el = document.activeElement
          opener.current = el instanceof HTMLElement && el !== document.body ? el : null
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
      const list = listFor(target.kind)
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
      <PostSheet open={open} onOpenChange={onOpenChange} item={item} dir={dir} onStep={step} onCloseAutoFocus={onCloseAutoFocus} />
    </PostSheetContext.Provider>
  )
}

export function usePostSheet() {
  return useContext(PostSheetContext)
}
