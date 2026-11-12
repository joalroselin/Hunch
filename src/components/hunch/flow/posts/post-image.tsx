"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { getFontEmbedCSS, toBlob } from "html-to-image"

import { POST_HEIGHT, POST_WIDTH } from "@/components/hunch/post"
import type { Version } from "@/lib/hunch/types"

import { RunPost, type PostLook } from "./run-post"

// The image a seller saves is the post they see: their photo with the words on it, 1080 x 1350, without the app's buttons.

type FrameVersion = Pick<Version, "id" | "code" | "hook" | "caption" | "cta">
type Job = { key: string; version: FrameVersion; resolve: (b: Blob) => void; reject: (e: unknown) => void }

const MAX = 40
const cache = new Map<string, Blob>()
let fontCss: Promise<string> | null = null

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)))
const isSafari = () => typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

function keyOf(v: FrameVersion, look: PostLook) {
  const photo = look.photoOf(v.code)
  return [v.id, v.code, v.hook, look.price ?? "", photo ? `${photo.length}:${photo.slice(-24)}` : "-"].join("¦")
}

async function snap(node: HTMLElement) {
  await document.fonts?.ready
  await Promise.all(Array.from(node.querySelectorAll("img")).map((img) => (img.complete ? null : img.decode().catch(() => null))))
  if (!fontCss) {
    fontCss = getFontEmbedCSS(node).catch(() => {
      fontCss = null
      return ""
    })
  }
  const opts = {
    width: POST_WIDTH,
    height: POST_HEIGHT,
    canvasWidth: POST_WIDTH,
    canvasHeight: POST_HEIGHT,
    pixelRatio: 1,
    backgroundColor: "#111111",
    fontEmbedCSS: (await fontCss) || undefined,
  }
  // Safari often drops images on the first pass.
  if (isSafari()) await toBlob(node, opts)
  const blob = await toBlob(node, opts)
  if (!blob) throw new Error("The image did not save. Try again.")
  return blob
}

/** Renders posts to PNG blobs one at a time in a hidden full-size frame. Put `canvas` somewhere in the tree. */
export function usePostImage(look: PostLook) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const chain = useRef<Promise<unknown>>(Promise.resolve())
  const alive = useRef(true)
  const [job, setJob] = useState<Job | null>(null)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    if (!job) return
    ;(async () => {
      try {
        await frame()
        await frame()
        const node = nodeRef.current
        if (!node) throw new Error("The image is not ready yet. Try again.")
        const blob = await snap(node)
        cache.delete(job.key)
        cache.set(job.key, blob)
        while (cache.size > MAX) cache.delete(cache.keys().next().value as string)
        job.resolve(blob)
      } catch (e) {
        job.reject(e)
      } finally {
        if (alive.current) setJob(null)
      }
    })()
  }, [job])

  const cached = useCallback((v: FrameVersion) => cache.get(keyOf(v, look)), [look])

  const render = useCallback(
    (v: FrameVersion): Promise<Blob> => {
      const key = keyOf(v, look)
      const hit = cache.get(key)
      if (hit) return Promise.resolve(hit)
      const p = chain.current.then(
        () =>
          new Promise<Blob>((resolve, reject) => {
            const again = cache.get(key)
            if (again) return resolve(again)
            if (!alive.current) return reject(new Error("The page closed before the image was ready."))
            setJob({ key, version: v, resolve, reject })
          })
      )
      chain.current = p.catch(() => null)
      return p
    },
    [look]
  )

  const canvas = job ? (
    <div aria-hidden style={{ position: "fixed", left: -20000, top: 0, width: POST_WIDTH, height: POST_HEIGHT, pointerEvents: "none", zIndex: -1 }}>
      <div ref={nodeRef} className="hp-export" style={{ width: POST_WIDTH, height: POST_HEIGHT }}>
        <RunPost look={look} version={job.version} feed sticker />
      </div>
    </div>
  ) : null

  return { render, cached, canvas, busy: job?.version.id ?? null }
}
