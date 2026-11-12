"use client"

import * as React from "react"

import { UgcPost, type UgcPostProps } from "@/components/hunch/home/ugc-post"
import { SAMPLES, sampleKeyFor, sampleKeyOf, type SampleKey } from "@/lib/hunch/engine/sample/catalog"
import type { HunchState } from "@/lib/hunch/store"
import type { TestRun, Version } from "@/lib/hunch/types"

// How a run's posts look in a phone frame: the seller's photo, handle and price sticker.
export interface PostLook {
  handle: string
  price?: string
  avatar?: string
  photoOf: (code: string) => string | undefined
}

const codeNum = (code: string) => Number(code.replace(/\D/g, "")) || 1

export const handleOf = (name?: string | null) => (name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "yourshop"

// "₱350 per 180 g jar" reads "₱350 per jar" on the sticker.
export function stickerPrice(price?: string | null) {
  const p = price?.trim()
  if (!p) return undefined
  const peso = p.match(/₱\s?[\d,]+(?:\.\d+)?/)?.[0]?.replace(/\s/g, "") ?? (/^\d[\d,.]*$/.test(p) ? `₱${p}` : undefined)
  const unit = p.match(/\b(jar|tin|bar|bottle|pack|box|pouch|piece|pc)\b/i)?.[1]?.toLowerCase()
  return peso ? (unit ? `${peso} per ${unit}` : peso) : undefined
}

// The seller's photo on every post; a sample seller's own photos when there is none.
export function samplePhotoOf(sample: SampleKey | null) {
  return (code: string) => {
    if (!sample) return undefined
    const info = SAMPLES[sample]
    const files = Object.values(info.photos).filter((f): f is string => !!f)
    const file = info.photos[code] ?? files[(codeNum(code) - 1) % files.length]
    return file ? `${info.photoDir}/${file}` : undefined
  }
}

export function postLook(s: Pick<HunchState, "run" | "product" | "photo">, replay = false): PostLook {
  const product = s.run?.product ?? s.product
  const sample = s.run ? sampleKeyOf(s.run) : replay ? sampleKeyFor(product ?? undefined) : null
  const fromSample = samplePhotoOf(sample)
  const photoOf = (code: string) => s.photo ?? fromSample(code)
  return { handle: handleOf(product?.name), price: stickerPrice(product?.price), avatar: photoOf("A6"), photoOf }
}

export function usePostLook(s: Pick<HunchState, "run" | "product" | "photo">, replay = false) {
  const { run, product, photo } = s
  return React.useMemo(() => postLook({ run, product, photo }, replay), [run, product, photo, replay])
}

// One line for a sample run that carries the seller's own name and price.
export function sampleNote(run: Pick<TestRun, "sample" | "notes"> | null | undefined) {
  if (!run) return null
  if (run.sample?.swapped.length) return `Sample run of ${run.sample.of}. Your product's name and price go into it.`
  return run.notes?.[0] ?? null
}

type FrameVersion = Pick<Version, "id" | "code" | "hook" | "caption" | "cta">

/** One of the run's posts in a phone frame. Decorative; wrap it in a button to make it open. */
export function RunPost({
  look,
  version,
  sticker,
  ...rest
}: { look: PostLook; version: FrameVersion; sticker?: boolean } & Partial<Omit<UgcPostProps, "version" | "photo" | "handle" | "price">>) {
  return (
    <UgcPost
      version={version}
      photo={look.photoOf(version.code)}
      avatar={look.avatar}
      handle={look.handle}
      price={sticker ? look.price : undefined}
      {...rest}
    />
  )
}
