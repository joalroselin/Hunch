"use client"

export const POST_PHOTO_SIDE = 1600
export const API_PHOTO_SIDE = 768

type Drawable = { source: CanvasImageSource; width: number; height: number; done: () => void }

async function decode(blob: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" })
      return { source: bmp, width: bmp.width, height: bmp.height, done: () => bmp.close() }
    } catch {}
  }
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.src = url
  try {
    await img.decode()
  } catch {
    URL.revokeObjectURL(url)
    throw new Error("We could not open that photo. Try a JPG or PNG.")
  }
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    done: () => URL.revokeObjectURL(url),
  }
}

// Downscales an image so its longest side is at most maxSide, returns a JPEG data URL.
export async function fileToDataUrl(file: Blob, maxSide = POST_PHOTO_SIDE, quality = 0.85) {
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("That file is not a photo. Pick a JPG, PNG or WebP image.")
  }
  const img = await decode(file)
  try {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("This browser could not resize the photo.")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, w, h)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img.source, 0, 0, w, h)
    return canvas.toDataURL("image/jpeg", quality)
  } finally {
    img.done()
  }
}

// Shrinks an existing data URL, e.g. a post-size photo down to API size.
export async function downscaleDataUrl(dataUrl: string, maxSide = API_PHOTO_SIDE, quality = 0.8) {
  const blob = await (await fetch(dataUrl)).blob()
  return fileToDataUrl(blob, maxSide, quality)
}
