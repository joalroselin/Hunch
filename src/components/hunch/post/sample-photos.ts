"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"

import { samplePhotoFor } from "@/lib/hunch/engine/sample/catalog"
import type { TestRun, Version } from "@/lib/hunch/types"

// Sample post photos in /public. A post uses one only after it has loaded, so a missing file falls back to the color block.
const loaded = new Set<string>()
const tried = new Set<string>()
const listeners = new Set<() => void>()
let tick = 0

function probe(url: string) {
  if (tried.has(url)) return
  tried.add(url)
  const img = new Image()
  img.onload = () => {
    loaded.add(url)
    tick++
    listeners.forEach((l) => l())
  }
  img.src = url
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const photoIfLoaded = (url?: string) => (url && loaded.has(url) ? url : undefined)

// Checks each URL once per tab and re-renders the caller when one loads.
export function useLoadedPhotos(urls: (string | undefined)[]) {
  const key = [...new Set(urls.filter(Boolean))].join("|")
  useEffect(() => {
    for (const u of key.split("|")) if (u) probe(u)
  }, [key])
  return useSyncExternalStore(subscribe, () => tick, () => 0)
}

// Photo lookup for a sample run's posts by code; undefined for live runs and files that are missing.
export function useSamplePhotos(run: Pick<TestRun, "id" | "sample" | "versions"> | null | undefined) {
  const urls = run ? run.versions.map((v) => samplePhotoFor(run, v)) : []
  const tick = useLoadedPhotos(urls)
  return useCallback(
    (v: Pick<Version, "code" | "audienceId">) => {
      void tick
      return photoIfLoaded(samplePhotoFor(run, v))
    },
    [run, tick]
  )
}
