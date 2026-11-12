"use client"

import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { cn } from "cn"

import { POST_HEIGHT, POST_WIDTH, PostCanvas, type PostCanvasProps } from "./post-canvas"

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

export interface PostPreviewProps extends Omit<PostCanvasProps, "ref" | "className"> {
  className?: string
  // Ref to the full-size canvas inside the preview.
  canvasRef?: React.Ref<HTMLDivElement>
}

export function PostPreview({ className, canvasRef, ...canvas }: PostPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<number | null>(null)

  useIsoLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / POST_WIDTH)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={`Post preview: ${canvas.version.hook}`}
      className={cn("relative w-full overflow-hidden bg-card", className)}
      style={{ aspectRatio: `${POST_WIDTH} / ${POST_HEIGHT}` }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: POST_WIDTH,
          height: POST_HEIGHT,
          transformOrigin: "0 0",
          transform: `scale(${scale ?? 0.25})`,
          visibility: scale == null ? "hidden" : undefined,
          pointerEvents: "none",
        }}
      >
        <PostCanvas ref={canvasRef} {...canvas} />
      </div>
    </div>
  )
}

// Full-size canvas kept off screen so it can be exported at 1080 x 1350.
export function OffscreenPostCanvas(props: PostCanvasProps) {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: -20000,
        top: 0,
        width: POST_WIDTH,
        height: POST_HEIGHT,
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <PostCanvas {...props} />
    </div>
  )
}
