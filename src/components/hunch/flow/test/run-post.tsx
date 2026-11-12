"use client"

import { useMemo } from "react"

import type { UgcPostProps } from "@/components/hunch/home/ugc-post"
import { useSamplePhotos } from "@/components/hunch/post"
import { shortPrice } from "@/components/hunch/screens/shared"
import { inLanguage } from "@/lib/hunch/language"
import { useHunch } from "@/lib/hunch/store"
import type { Language, TestRun, Version } from "@/lib/hunch/types"

const handleOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "yourshop"

// "₱350 per 180 g jar" reads "₱350 per jar" on the sticker.
function stickerOf(price?: string | null) {
  const peso = price?.match(/₱\s?[\d,]+(?:\.\d+)?/)?.[0]?.replace(/\s/g, "")
  const unit = price?.match(/\b(jar|tin|bar|bottle|pack|box|pouch|piece|pc)\b/i)?.[1]?.toLowerCase()
  return peso ? (unit ? `${peso} per ${unit}` : peso) : shortPrice(price)
}

export type FrameProps = Pick<UgcPostProps, "version" | "photo" | "avatar" | "handle"> & { sticker?: string }

/** Props for a run's post in a phone frame: the seller's photo, or the sample post's own. */
export function usePostFrame(run: TestRun) {
  const { photo } = useHunch()
  const photoFor = useSamplePhotos(run)
  return useMemo(() => {
    const handle = handleOf(run.product.name)
    const sticker = stickerOf(run.product.price)
    const face = run.versions[5] ?? run.versions[0]
    return (v: Version, lang?: Language): FrameProps => ({
      version: lang ? inLanguage(v, lang) : v,
      photo: photo ?? photoFor(v),
      avatar: photo ?? (face ? photoFor(face) : undefined),
      handle,
      sticker,
    })
  }, [run, photo, photoFor])
}
