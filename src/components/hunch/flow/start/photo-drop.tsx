"use client"

import * as React from "react"
import { useRef, useState } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { UgcPost } from "@/components/hunch/home/ugc-post"
import { POST_PHOTO_SIDE, fileToDataUrl } from "@/components/hunch/post"

import { MAX_PHOTO_BYTES } from "./product"

export function checkPhoto(file: File): string | null {
  if (file.type && !file.type.startsWith("image/")) return "Not a photo. Use a JPG, PNG or WebP."
  if (!file.type && !/\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name)) return "Not a photo. Use a JPG, PNG or WebP."
  if (file.size > MAX_PHOTO_BYTES) return "Over 10 MB. Use a smaller photo."
  return null
}

export type PhonePost = { handle: string; caption: string; price?: string }

// The phone is the photo picker: the drop's color while empty, a post frame once a photo is in.
export function PhotoDrop({
  photo,
  onPhoto,
  id,
  post,
  sample,
  className,
}: {
  photo: string | null
  onPhoto: (url: string | null) => void
  id: string
  post: PhonePost
  /** A sample seller's photo, shown while the seller has none of their own. */
  sample?: string
  className?: string
}) {
  const pickRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const shown = photo ?? sample

  async function take(file?: File | null) {
    if (!file) return
    const bad = checkPhoto(file)
    if (bad) {
      setError(bad)
      return
    }
    setBusy(true)
    setError(null)
    try {
      onPhoto(await fileToDataUrl(file, POST_PHOTO_SIDE, 0.85))
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "The photo did not open. Use a JPG or PNG.")
    } finally {
      setBusy(false)
      if (pickRef.current) pickRef.current.value = ""
      if (cameraRef.current) cameraRef.current.value = ""
    }
  }

  const pick = () => pickRef.current?.click()

  return (
    <div className={cn("hs-photo", className)}>
      <div
        className="hs-phone"
        data-over={over || undefined}
        data-filled={shown ? "" : undefined}
        onDragOver={(e) => {
          e.preventDefault()
          if (!over) setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          take(e.dataTransfer.files?.[0])
        }}
      >
        {shown ? (
          <UgcPost
            key={shown.slice(-48)}
            version={{ id: "start", code: "A1", hook: "", caption: post.caption, cta: "Message us" }}
            photo={shown}
            avatar={shown}
            handle={post.handle}
            price={post.price}
            boosted
          />
        ) : (
          <button
            type="button"
            id={id}
            aria-describedby={error ? errorId : hintId}
            disabled={busy}
            onClick={pick}
            className="hs-phone-empty hh-grain"
          >
            <span className="hs-phone-ask">{busy ? "Opening the photo" : over ? "Drop it here" : "Add a product photo"}</span>
            <span id={hintId} className="hs-phone-hint">
              <span className="pointer-coarse:hidden">Drag one here or click.</span>
              <span className="hidden pointer-coarse:inline">Tap to choose one.</span>
              <br />
              JPG, PNG or WebP, up to 10 MB
            </span>
          </button>
        )}
      </div>

      <div className="hs-photo-tools">
        {photo ? (
          <>
            <Button type="button" variant="secondary" size="sm" onClick={pick} disabled={busy} id={id}>
              {busy ? "Opening" : "Change photo"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onPhoto(null)
                setError(null)
              }}
            >
              Remove
            </Button>
          </>
        ) : sample ? (
          <Button type="button" variant="secondary" size="sm" onClick={pick} disabled={busy} id={id}>
            {busy ? "Opening" : "Use your photo"}
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" className="hidden pointer-coarse:inline-flex" disabled={busy} onClick={() => cameraRef.current?.click()}>
            Take a photo
          </Button>
        )}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="ha-bubble ha-bubble-in hs-photo-error">
          {error}
        </p>
      ) : null}

      <input ref={pickRef} type="file" accept="image/*" tabIndex={-1} aria-hidden className="sr-only" onChange={(e) => take(e.target.files?.[0])} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => take(e.target.files?.[0])}
      />
    </div>
  )
}
