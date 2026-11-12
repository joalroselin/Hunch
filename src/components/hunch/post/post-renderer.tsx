"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

import type { PostCanvasProps } from "./post-canvas"
import { OffscreenPostCanvas } from "./post-preview"
import { renderPostPng } from "./export"

export type PostRenderProps = Omit<PostCanvasProps, "ref">

type Job = {
  key: string
  props: PostRenderProps
  urgent: boolean
  resolve: (b: Blob) => void
  reject: (e: unknown) => void
}

// Finished PNGs, shared across screens for the tab's life.
const MAX = 40
const cache = new Map<string, Blob>()
const listeners = new Set<() => void>()
let tick = 0

function put(key: string, blob: Blob) {
  cache.delete(key)
  cache.set(key, blob)
  while (cache.size > MAX) cache.delete(cache.keys().next().value as string)
  tick++
  listeners.forEach((l) => l())
}

export function cachedPost(key: string) {
  return cache.get(key)
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// Re-renders when any post finishes rendering.
export function usePostCache() {
  return useSyncExternalStore(subscribe, () => tick, () => 0)
}

export function postKey(props: PostRenderProps) {
  const v = props.version
  const photo = props.photo ? `${props.photo.length}:${props.photo.slice(-24)}` : "-"
  return [v.id, v.code, props.style ?? v.style, props.palette ?? "", props.brand ?? "", props.price ?? "", v.hook, v.slides.join("|"), v.cta, photo].join("¦")
}

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)))

// Renders posts to 1080 x 1350 PNG blobs, one at a time, in a hidden full-size canvas.
export function usePostRenderer() {
  const nodeRef = useRef<HTMLDivElement>(null)
  const queue = useRef<Job[]>([])
  const inflight = useRef(new Map<string, Promise<Blob>>())
  const current = useRef<Job | null>(null)
  const started = useRef<Job | null>(null)
  const alive = useRef(true)
  const [job, setJob] = useState<Job | null>(null)

  const pump = useCallback(() => {
    if (current.current || !alive.current) return
    let next = queue.current.shift()
    while (next && cache.has(next.key)) {
      next.resolve(cache.get(next.key)!)
      next = queue.current.shift()
    }
    if (!next) return
    current.current = next
    setJob(next)
  }, [])

  useEffect(() => {
    alive.current = true
    const q = queue.current
    return () => {
      alive.current = false
      q.splice(0).forEach((j) => j.reject(new Error("The page closed before the image was ready.")))
    }
  }, [])

  useEffect(() => {
    if (!job || started.current === job) return
    started.current = job
    ;(async () => {
      try {
        await frame()
        await frame()
        const node = nodeRef.current
        if (!node) throw new Error("The image is not ready yet. Try again.")
        const blob = await renderPostPng(node)
        put(job.key, blob)
        job.resolve(blob)
      } catch (e) {
        job.reject(e)
      } finally {
        current.current = null
        if (alive.current) {
          setJob(null)
          window.setTimeout(pump, job.urgent || queue.current[0]?.urgent ? 0 : 90)
        }
      }
    })()
  }, [job, pump])

  const render = useCallback(
    (props: PostRenderProps, opts: { urgent?: boolean } = {}): Promise<Blob> => {
      const key = postKey(props)
      const hit = cache.get(key)
      if (hit) return Promise.resolve(hit)
      const existing = inflight.current.get(key)
      if (existing) {
        if (opts.urgent) {
          const i = queue.current.findIndex((j) => j.key === key)
          if (i > 0) {
            const [j] = queue.current.splice(i, 1)
            queue.current.unshift({ ...j, urgent: true })
          }
        }
        return existing
      }
      const p = new Promise<Blob>((resolve, reject) => {
        const j: Job = { key, props, urgent: !!opts.urgent, resolve, reject }
        if (opts.urgent) queue.current.unshift(j)
        else queue.current.push(j)
      })
      const clear = () => {
        inflight.current.delete(key)
      }
      inflight.current.set(key, p)
      p.then(clear, clear)
      pump()
      return p
    },
    [pump]
  )

  // Background renders; failures stay quiet until the seller taps.
  const prerender = useCallback(
    (list: PostRenderProps[]) => {
      for (const props of list) render(props).catch(() => {})
    },
    [render]
  )

  const canvas = job ? <OffscreenPostCanvas ref={nodeRef} {...job.props} /> : null
  return { render, prerender, canvas, busy: job !== null }
}
