"use client"

import * as React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { cachedPost, copyText, postFilename, postKey, saveBlob, usePostCache, usePostRenderer, type PostRenderProps } from "@/components/hunch/post"
import { captionText, inLanguage } from "@/lib/hunch/language"
import { hunchStore } from "@/lib/hunch/store"
import type { Language, Version } from "@/lib/hunch/types"

import { canShareFiles, handOff, notify, notifyError } from "./share"

export interface PostKit {
  // Canvas props for a post in one language.
  propsFor: (v: Version, lang: Language) => PostRenderProps
  copy: (v: Version, lang: Language) => Promise<boolean>
  save: (v: Version, lang: Language) => Promise<void>
  // Call straight from the tap handler.
  share: (v: Version, lang: Language) => void
  // Renders PNGs in the background so Share has its file ready.
  prerender: (items: { version: Version; lang: Language }[]) => void
  // The full-size PNG for this post is ready.
  isReady: (v: Version, lang: Language) => boolean
  saving: string | null
  // null until checked in the browser.
  canShare: boolean | null
}

const Ctx = createContext<PostKit | null>(null)

export function usePostKit() {
  const kit = useContext(Ctx)
  if (!kit) throw new Error("usePostKit needs a PostKitProvider")
  return kit
}

export interface PostKitProviderProps {
  // Seller or shop name, shown small on the image.
  brand?: string
  // Short price for the image, e.g. "₱350 / 180 g".
  price?: string
  // Seller's photo as a data URL; it stays the hero of every image.
  photo?: string | null
  // Per-post photo when the seller has none, e.g. a sample post's own photo.
  photoFor?: (v: Version) => string | undefined
  children: React.ReactNode
}

export function PostKitProvider({ brand, price, photo, photoFor, children }: PostKitProviderProps) {
  const { render, prerender: queue, canvas } = usePostRenderer()
  const [saving, setSaving] = useState<string | null>(null)
  const [canShare, setCanShare] = useState<boolean | null>(null)
  const tick = usePostCache()

  useEffect(() => {
    setCanShare(canShareFiles())
  }, [])

  const propsFor = useCallback(
    (v: Version, lang: Language): PostRenderProps => ({ version: inLanguage(v, lang), photo: photo ?? photoFor?.(v), brand, price }),
    [brand, price, photo, photoFor]
  )

  const copy = useCallback(async (v: Version, lang: Language) => {
    const ok = await copyText(captionText(v, lang))
    const code = /^[AH]\d$/.test(v.code) ? ` and the code ${v.code.replace(/^H/, "A")}` : ""
    if (ok) notify("Caption copied.", { description: `Hook, caption and hashtags${code}.` })
    else notifyError("Your browser blocked copying. Select the caption and copy it by hand.")
    return ok
  }, [])

  const save = useCallback(
    async (v: Version, lang: Language) => {
      setSaving(v.id)
      try {
        const blob = await render(propsFor(v, lang), { urgent: true })
        const name = postFilename(v)
        saveBlob(blob, name)
        notify("Image saved.", { description: `${name}, 1080 × 1350` })
      } catch (e) {
        notifyError(e instanceof Error && e.message ? e.message : "The image did not save. Try again.")
      } finally {
        setSaving(null)
      }
    },
    [propsFor, render]
  )

  const share = useCallback(
    (v: Version, lang: Language) => {
      const props = propsFor(v, lang)
      const blob = cachedPost(postKey(props))
      if (!blob) {
        render(props, { urgent: true }).catch(() => {})
        notify("Image not ready. Tap Share again.")
        return
      }
      handOff({
        blob,
        filename: postFilename(v),
        title: /^[AH]\d$/.test(v.code) ? `${v.code} · ${v.audienceName}` : v.audienceName,
        caption: captionText(v, lang),
        onShared: () => hunchStore.markHandedOff(v.id),
      })
    },
    [propsFor, render]
  )

  const prerender = useCallback(
    (items: { version: Version; lang: Language }[]) => queue(items.map((i) => propsFor(i.version, i.lang))),
    [propsFor, queue]
  )

  const isReady = useCallback(
    (v: Version, lang: Language) => {
      void tick
      return !!cachedPost(postKey(propsFor(v, lang)))
    },
    [propsFor, tick]
  )

  const kit = useMemo<PostKit>(
    () => ({ propsFor, copy, save, share, prerender, isReady, saving, canShare }),
    [propsFor, copy, save, share, prerender, isReady, saving, canShare]
  )

  return (
    <Ctx.Provider value={kit}>
      {children}
      {canvas}
    </Ctx.Provider>
  )
}
