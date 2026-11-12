"use client"

import { useEffect, useRef, useState } from "react"
import { Copy, Download, ImagePlus } from "lucide-react"
import { toast } from "sonner"

import { Kicker, Section, SectionHeader, Tile } from "@/components/ds"
import { Button } from "@/components/ui/button"
import {
  PostPreview,
  copyCaption,
  downscaleDataUrl,
  fileToDataUrl,
  postFilename,
  usePostDownload,
  type PostCanvasProps,
} from "@/components/hunch/post"
import type { PostStyle, Version } from "@/lib/hunch/types"

import { sampleBrand, samplePrice, sampleVersions, standInPhoto } from "./samples"

const styles: { id: PostStyle; name: string; about: string }[] = [
  { id: "bold", name: "Bold", about: "Big hook over the photo, like a Reels or TikTok cover." },
  { id: "soft", name: "Soft", about: "Photo on top, hook in a clean panel below." },
  { id: "note", name: "Note", about: "A phone notes screenshot with a small photo." },
]

export default function PostsDemoPage() {
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [source, setSource] = useState<"stand-in" | "yours" | "none">("stand-in")
  const [saving, setSaving] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { download, canvas } = usePostDownload()

  useEffect(() => {
    if (source !== "stand-in") return
    let alive = true
    downscaleDataUrl(standInPhoto, 1600, 0.85)
      .then((url) => alive && setPhoto(url))
      .catch(() => alive && setPhoto(standInPhoto))
    return () => {
      alive = false
    }
  }, [source])

  async function onFile(file?: File) {
    if (!file) return
    try {
      setPhoto(await fileToDataUrl(file, 1600))
      setSource("yours")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "We could not open that photo.")
    }
  }

  async function onDownload(key: string, props: Omit<PostCanvasProps, "ref">, version: Version, style: PostStyle) {
    setSaving(key)
    try {
      await download(props, postFilename(version, style))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The post did not save. Try again.")
    } finally {
      setSaving(null)
    }
  }

  async function onCopy(version: Version) {
    const ok = await copyCaption(version)
    if (ok) toast.success("Caption copied")
    else toast.error("Your browser blocked copying. Select the caption and copy it by hand.")
  }

  return (
    <main className="min-h-dvh bg-background">
      <Section spacing="md" width="wide">
        <SectionHeader
          align="left"
          size="md"
          as="h1"
          eyebrow="Post templates"
          title="Three looks for one post."
          tail="Each saves as a 1080 x 1350 JPEG."
          lead="Sample posts for Elle's Candles, soy candles poured at home. Each style is shown with a photo and without one."
        />

        <Tile padding="sm" className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[15px] font-semibold text-ink">Product photo</p>
            <p className="mt-1 max-w-xl text-[13px] text-mute">
              {source === "yours"
                ? "Showing your photo. It stays in this browser."
                : source === "stand-in"
                  ? "Showing a plain color backdrop to check the layout. It shows no product."
                  : "No photo. Posts use the color block instead."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button size="sm" variant="ink" onClick={() => fileRef.current?.click()}>
              <ImagePlus /> Add your photo
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSource("stand-in")}>
              Use backdrop
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSource("none")
                setPhoto(undefined)
              }}
            >
              Remove photo
            </Button>
          </div>
        </Tile>

        {styles.map((s, si) => (
          <section key={s.id} className="mt-16">
            <Kicker>{`0${si + 1} · ${s.id}`}</Kicker>
            <h2 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-ink">{s.name}</h2>
            <p className="mt-1 text-[15px] text-mute">{s.about}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {sampleVersions.flatMap((v) =>
                [true, false].map((withPhoto) => {
                  const key = `${s.id}-${v.id}-${withPhoto}`
                  const props = {
                    version: v,
                    style: s.id,
                    photo: withPhoto ? photo : undefined,
                    brand: sampleBrand,
                    price: samplePrice,
                  }
                  return (
                    <div key={key} className="flex min-w-0 flex-col">
                      <PostPreview {...props} />
                      <p className="mt-3 font-mono text-[12px] text-mute-strong">
                        {`[ ${v.code.toLowerCase()} · ${withPhoto ? "photo" : "no photo"} ]`}
                      </p>
                      <p className="mt-1 truncate text-[14px] font-semibold text-ink">{v.audienceName}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={saving !== null}
                          onClick={() => onDownload(key, props, v, s.id)}
                        >
                          <Download /> {saving === key ? "Saving" : "Download"}
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => onCopy(v)}>
                          <Copy /> Copy caption
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        ))}

        <section className="mt-16">
          <Kicker>04 · sizes</Kicker>
          <h2 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-ink">Preview sizes</h2>
          <p className="mt-1 text-[15px] text-mute">The same post at 160, 260 and 420 px wide.</p>
          <div className="mt-6 flex flex-wrap items-end gap-6">
            {[160, 260, 420].map((w) => (
              <div key={w} style={{ width: w }} className="max-w-full">
                <PostPreview version={sampleVersions[1]} photo={photo} brand={sampleBrand} price={samplePrice} />
                <p className="mt-2 font-mono text-[12px] text-mute-strong">{`[ ${w} px ]`}</p>
              </div>
            ))}
          </div>
        </section>
      </Section>
      {canvas}
    </main>
  )
}
