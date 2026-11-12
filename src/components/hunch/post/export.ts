"use client"

import { getFontEmbedCSS, toBlob, toJpeg } from "html-to-image"

import type { Version } from "@/lib/hunch/types"
import { POST_HEIGHT, POST_WIDTH } from "./post-canvas"

let fontCss: Promise<string> | null = null

// Every canvas lists Schibsted and Geist, so the first node's font CSS covers all posts.
function embedFonts(node: HTMLElement) {
  if (!fontCss) {
    fontCss = getFontEmbedCSS(node).catch(() => {
      fontCss = null
      return ""
    })
  }
  return fontCss
}

async function imagesReady(node: HTMLElement) {
  const imgs = Array.from(node.querySelectorAll("img"))
  await Promise.all(imgs.map((img) => (img.complete ? null : img.decode().catch(() => null))))
}

const isSafari = () =>
  typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

async function options(node: HTMLElement) {
  await document.fonts?.ready
  await imagesReady(node)
  return {
    width: POST_WIDTH,
    height: POST_HEIGHT,
    canvasWidth: POST_WIDTH,
    canvasHeight: POST_HEIGHT,
    pixelRatio: 1,
    backgroundColor: "#ffffff",
    fontEmbedCSS: (await embedFonts(node)) || undefined,
    style: { transform: "none", margin: "0" },
  }
}

// Renders a full-size PostCanvas node to a 1080 x 1350 PNG blob.
export async function renderPostPng(node: HTMLElement): Promise<Blob> {
  const opts = await options(node)
  // Safari often drops images on the first pass.
  if (isSafari()) await toBlob(node, opts)
  const blob = await toBlob(node, opts)
  if (!blob) throw new Error("The image did not render. Try again.")
  return blob
}

// Kept for older callers.
export async function renderPostJpeg(node: HTMLElement, quality = 0.92) {
  const opts = { ...(await options(node)), quality }
  if (isSafari()) await toJpeg(node, opts)
  return toJpeg(node, opts)
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export async function downloadPost(node: HTMLElement, filename = "post.png") {
  const blob = await renderPostPng(node)
  saveBlob(blob, /\.png$/i.test(filename) ? filename : `${filename.replace(/\.(jpe?g)$/i, "")}.png`)
  return blob
}

export function captionText(version: Pick<Version, "caption" | "hashtags">) {
  const tags = version.hashtags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t.replace(/\s+/g, "")}`))
  return tags.length ? `${version.caption.trim()}\n\n${tags.join(" ")}` : version.caption.trim()
}

// Writes text to the clipboard. Resolves false if the browser blocked it.
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand("copy")
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

// Copies caption plus hashtags. Resolves false if the browser blocked it.
export async function copyCaption(version: Pick<Version, "caption" | "hashtags">) {
  return copyText(captionText(version))
}

export function postFilename(version: Pick<Version, "code" | "audienceName">, style?: string) {
  const slug = version.audienceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
  const lead = /^P\d$/.test(version.code) ? `day-${version.code.slice(1)}` : version.code.toLowerCase()
  return [lead, slug, style].filter(Boolean).join("-") + ".png"
}
