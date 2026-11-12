"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { PostCanvasProps } from "./post-canvas"
import { OffscreenPostCanvas } from "./post-preview"
import { downloadPost } from "./export"

type Job = { id: number; props: Omit<PostCanvasProps, "ref">; filename: string }

// Renders a hidden full-size canvas on demand and downloads it as a PNG.
export function usePostDownload() {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [job, setJob] = useState<Job | null>(null)
  const pending = useRef<{ resolve: (blob: Blob) => void; reject: (e: unknown) => void } | null>(null)
  const started = useRef(0)
  const nextId = useRef(1)

  useEffect(() => {
    if (!job || started.current === job.id) return
    started.current = job.id
    const run = async () => {
      try {
        await new Promise((r) => requestAnimationFrame(() => r(null)))
        if (!nodeRef.current) throw new Error("The post is not ready yet. Try again.")
        const blob = await downloadPost(nodeRef.current, job.filename)
        pending.current?.resolve(blob)
      } catch (e) {
        pending.current?.reject(e)
      } finally {
        pending.current = null
        setJob(null)
      }
    }
    run()
  }, [job])

  const download = useCallback(
    (props: Omit<PostCanvasProps, "ref">, filename: string) =>
      new Promise<Blob>((resolve, reject) => {
        if (pending.current) {
          reject(new Error("Another post is still saving."))
          return
        }
        pending.current = { resolve, reject }
        setJob({ id: nextId.current++, props, filename })
      }),
    []
  )

  const canvas = job ? <OffscreenPostCanvas ref={nodeRef} {...job.props} /> : null
  return { download, canvas, busy: job !== null }
}
