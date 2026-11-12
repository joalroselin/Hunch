import { CHANNEL_LABEL } from "@/lib/hunch/language"
import type { StoredProduct } from "@/lib/hunch/store"
import type { Channel, Language } from "@/lib/hunch/types"
import { SAMPLE_PRODUCT } from "@/components/hunch/screens/demo"

export const MIN_DESCRIPTION = 10
export const MAX_DESCRIPTION = 280
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const CHANNELS: Channel[] = ["shopee", "facebook", "instagram", "tiktok", "offline"]
export const START_LANGUAGES: Language[] = ["english", "taglish", "tagalog"]

export type Draft = {
  description: string
  channels: Channel[]
  price: string // digits only
  language: Language
}

export const EMPTY_DRAFT: Draft = { description: "", channels: [], price: "", language: "taglish" }

const CUT = /\s+(?:from|made|in|delivered|for|with|sold|at|by|every|na|galing)\s+/i

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// DECISION: the spec's Start has no name field, so the product name is the first short phrase of the description.
export function nameFrom(description: string) {
  const text = description.replace(/\s+/g, " ").trim()
  const head = text.split(/\s*(?:[,;:.!?(]|\s[-–|]\s)\s*/)[0] ?? text
  const words = (head.split(CUT)[0] || head).split(" ").filter(Boolean)
  return capital(words.slice(0, 6).join(" ")).slice(0, 80) || capital(text).slice(0, 80)
}

export function whereSoldFrom(channels: Channel[]) {
  const names = CHANNELS.filter((c) => channels.includes(c)).map((c) => CHANNEL_LABEL[c])
  if (names.length <= 1) return names[0] ?? ""
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

export function priceDigits(price?: string) {
  const m = price?.replace(/,/g, "").match(/\d+(?:\.\d+)?/)
  return m ? String(Math.round(Number(m[0]))) : ""
}

export function toProduct(d: Draft): StoredProduct {
  const description = d.description.replace(/\s+/g, " ").trim().slice(0, MAX_DESCRIPTION)
  const price = d.price ? `₱${Number(d.price).toLocaleString("en-PH")}` : undefined
  return {
    name: nameFrom(description),
    description,
    price,
    whereSold: whereSoldFrom(d.channels) || undefined,
    language: d.language,
    channels: CHANNELS.filter((c) => d.channels.includes(c)),
  }
}

export function draftFrom(p: StoredProduct | null | undefined): Draft {
  if (!p) return EMPTY_DRAFT
  return {
    description: (p.description ?? "").slice(0, MAX_DESCRIPTION),
    channels: p.channels ?? [],
    price: priceDigits(p.price),
    language: p.language ?? "taglish",
  }
}

export const SAMPLE_DRAFT: Draft = draftFrom(SAMPLE_PRODUCT)

export function isSampleProduct(p: Pick<StoredProduct, "name" | "description"> | null | undefined) {
  return !!p && p.name === SAMPLE_PRODUCT.name && p.description === SAMPLE_PRODUCT.description
}

export function isSampleDraft(d: Draft) {
  return (
    d.description.trim() === SAMPLE_DRAFT.description &&
    d.price === SAMPLE_DRAFT.price &&
    d.channels.length === SAMPLE_DRAFT.channels.length &&
    SAMPLE_DRAFT.channels.every((c) => d.channels.includes(c))
  )
}

// What still stops "Write my 8 posts", in plain words.
export function missing(d: Draft, hasPhoto: boolean) {
  const out: string[] = []
  if (!hasPhoto) out.push("a photo")
  if (d.description.trim().length < MIN_DESCRIPTION) out.push("a longer description")
  if (!d.channels.length) out.push("where you sell")
  return out
}

export function listWords(items: string[]) {
  if (items.length <= 1) return items[0] ?? ""
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}
