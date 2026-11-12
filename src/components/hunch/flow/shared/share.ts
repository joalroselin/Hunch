"use client"

import { toast } from "sonner"

import { copyText } from "@/components/hunch/post"

// Phones get toasts at the top so they never cover the sticky primary button.
export function toastAt() {
  if (typeof window === "undefined") return undefined
  return window.matchMedia("(max-width: 767px)").matches ? ("top-center" as const) : undefined
}

export function notify(message: string, opts: { description?: string; duration?: number } = {}) {
  toast(message, { position: toastAt(), ...opts })
}

export function notifyError(message: string) {
  toast.error(message, { position: toastAt() })
}

const PROBE = [137, 80, 78, 71, 13, 10, 26, 10]

// DECISION: Share shows only on phones and tablets that can share files. Desktop browsers that can
// share files still get Save and Copy, since the handoff is for the Instagram, Facebook and TikTok apps.
export function canShareFiles() {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false
  try {
    const file = new File([new Uint8Array(PROBE)], "post.png", { type: "image/png" })
    if (typeof navigator.share !== "function" || !navigator.canShare?.({ files: [file] })) return false
  } catch {
    return false
  }
  const ua = navigator.userAgent
  const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  const coarse = window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(hover: none)").matches
  return coarse || touchMac || /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
}

export const SHARE_HINT = "Open Hunch on your phone to share in one tap."
export const COPIED_TOAST = "Caption copied. Paste it in the app."

// Spec share handoff. Runs inside the tap handler: copy first, then share the PNG file only.
export function handOff(opts: { blob: Blob; filename: string; title: string; caption: string; onShared: () => void }) {
  const file = new File([opts.blob], opts.filename, { type: "image/png" })
  const copied = copyText(opts.caption)
  let shared: Promise<void>
  try {
    shared = navigator.share({ files: [file], title: opts.title })
  } catch (e) {
    shared = Promise.reject(e)
  }
  copied.then((ok) => {
    if (ok) notify(COPIED_TOAST, { duration: 4000 })
    else notifyError("The caption did not copy. Tap Copy caption after you share.")
  })
  shared.then(opts.onShared, (e: unknown) => {
    if (e instanceof Error && e.name === "AbortError") return
    if (typeof e === "object" && e && (e as { name?: string }).name === "AbortError") return
    notifyError("Sharing did not open. Save the image and post it from your photos.")
  })
}
