"use client"

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Button, GoLink } from "@/components/ui/button"
import { copyText, postFilename, saveBlob } from "@/components/hunch/post"
import { applyDemo, stripDemoParam } from "@/components/hunch/screens/demo"
import { lowerFirst } from "@/components/hunch/screens/shared"
import { EmptyScreen, LoadingScreen, Screen, ScreenTitle, StepAction } from "@/components/hunch/shell"
import { errorText, retryPost } from "@/lib/hunch/client"
import { LANGUAGES, LANGUAGE_LABEL, captionText, copyFor, hasLanguage, inLanguage } from "@/lib/hunch/language"
import { getHunch, hunchStore, languageFor, useHunch } from "@/lib/hunch/store"
import type { Language, TestRun, Version } from "@/lib/hunch/types"

import { canShareFiles, handOff, notify, notifyError } from "../shared/share"
import { AgentMark } from "../studio/chat-parts"
import "../studio/studio.css"
import { usePostImage } from "./post-image"
import { RunPost, sampleNote, usePostLook } from "./run-post"
import "./posts.css"

const codeNum = (v: Version) => Number(v.code.replace(/\D/g, "")) || 0
const TILT = [-4, 3, -2, 5, -3, 2, -5, 3]

// What the Reviewer sent back, in its own words: the first draft's line and the reasons.
function sentBack(run: TestRun, v: Version) {
  const r = run.rejected
    .filter((x) => x.fixedVersionId === v.id || x.audienceId === v.audienceId)
    .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))[0]
  if (r) return { draft: r.draft.hook, quote: r.reasons.find((x) => x.quote)?.quote, notes: [...new Set(r.reasons.map((x) => x.note))].slice(0, 2) }
  const rev = v.revisions?.[0]
  if (rev?.issues.length) return { draft: undefined, quote: rev.issues[0].quote, notes: [...new Set(rev.issues.map((x) => x.note))].slice(0, 2) }
  return null
}

function Marked({ text, quote }: { text: string; quote?: string }) {
  const at = quote ? text.indexOf(quote) : -1
  if (!quote || at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <del>{quote}</del>
      {text.slice(at + quote.length)}
    </>
  )
}

function Review({ run, v }: { run: TestRun; v: Version }) {
  const issue = v.status === "needs_attention" || v.openIssues?.length ? v.openIssues?.[0] : null
  const back = issue ? null : sentBack(run, v)
  if (!issue && !back) return null
  return (
    <div className="hp-review">
      <p className="hc-who">
        <AgentMark agent="reviewer" />
        Reviewer
      </p>
      {issue ? (
        <p className="hc-bubble">
          <span className="hc-reply">
            <b className="hc-for">Check this before you post</b>
            {issue.quote ? <span>{issue.quote}</span> : null}
          </span>
          {issue.note}
        </p>
      ) : back ? (
        back.notes.map((note, i) => (
          <p key={i} className="hc-bubble">
            {i === 0 && back.draft ? (
              <span className="hc-reply">
                <b className="hc-for">First draft, sent back</b>
                <span>
                  <Marked text={back.draft} quote={back.quote} />
                </span>
              </span>
            ) : null}
            {note}
          </p>
        ))
      ) : null}
    </div>
  )
}

function PostsView({ run }: { run: TestRun }) {
  const s = useHunch()
  const look = usePostLook(s)
  const image = usePostImage(look)
  const rail = useRef<HTMLDivElement>(null)
  const versions = useMemo(() => [...run.versions].sort((a, b) => codeNum(a) - codeNum(b)), [run.versions])
  const [code, setCode] = useState(() => versions[0]?.code ?? "")
  const [everyPost, setEveryPost] = useState(() => Object.keys(getHunch().postLanguage).length === 0)
  const [saving, setSaving] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [canShare, setCanShare] = useState(false)

  // Your 8 hunches links here with the post's code in the hash.
  useEffect(() => {
    const want = window.location.hash.slice(1)
    if (want && versions.some((x) => x.code === want)) setCode(want)
    setCanShare(canShareFiles())
    // Read once on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const v = versions.find((x) => x.code === code) ?? versions[0]
  const lang = languageFor(s, v.id)
  const shown = inLanguage(v, lang)
  const c = copyFor(v, lang)
  const body = c.caption.startsWith(c.hook) ? c.caption.slice(c.hook.length).trim() : c.caption
  const index = versions.indexOf(v)

  // Phones that can share get every image ready ahead of the tap.
  const { render } = image
  const langKey = versions.map((x) => languageFor(s, x.id)).join("|")
  useEffect(() => {
    if (!canShare) return
    const t = window.setTimeout(() => {
      for (const x of versions) if (!x.error) render(inLanguage(x, languageFor(getHunch(), x.id))).catch(() => {})
    }, 1200)
    return () => window.clearTimeout(t)
  }, [canShare, render, versions, langKey])

  const setLang = (l: Language) => {
    if (everyPost) hunchStore.setLanguage(l)
    else hunchStore.setPostLanguage(v.id, l)
  }

  const go = (i: number, focus = false) => {
    const next = versions[(i + versions.length) % versions.length]
    if (!next) return
    setCode(next.code)
    if (focus) rail.current?.querySelector<HTMLElement>(`[data-code="${next.code}"]`)?.focus()
  }

  const copy = async () => {
    const ok = await copyText(captionText(v, lang))
    if (ok) notify("Caption copied.")
    else notifyError("Copy blocked. Select the caption and copy it by hand.")
  }

  const save = async () => {
    setSaving(true)
    try {
      saveBlob(await render(shown), postFilename(v))
      notify("Image saved.")
    } catch (e) {
      notifyError(e instanceof Error && e.message ? e.message : "The image did not save. Try again.")
    } finally {
      setSaving(false)
    }
  }

  // Runs inside the tap: the share sheet needs the file at once.
  const share = () => {
    const blob = image.cached(shown)
    if (!blob) {
      render(shown).catch(() => {})
      notify("Image not ready. Tap Share again.")
      return
    }
    handOff({ blob, filename: postFilename(v), title: v.audienceName, caption: captionText(v, lang), onShared: () => hunchStore.markHandedOff(v.id) })
  }

  const retry = async () => {
    const audience = run.chosen.find((a) => a.id === v.audienceId)
    if (!audience) return
    setRetrying(true)
    try {
      const res = await retryPost({ product: run.product, audience, code: v.code })
      const cur = getHunch().run
      if (!cur || cur.id !== run.id) return
      hunchStore.fill({
        run: {
          ...cur,
          versions: cur.versions.map((x) => (x.code === v.code ? res.version : x)),
          rejected: [...cur.rejected, ...res.rejected],
          events: [...(cur.events ?? []), ...res.events],
        },
      })
    } catch (e) {
      notifyError(errorText(e, "Could not write this post. Try again."))
    } finally {
      setRetrying(false)
    }
  }

  // Phones: the row of posts scrolls sideways, so keep the one in hand in view.
  useEffect(() => {
    const box = rail.current
    const el = box?.querySelector<HTMLElement>(`[data-code="${code}"]`)
    if (!box || !el || box.scrollWidth <= box.clientWidth) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" })
  }, [code])

  const sharedAt = s.handedOff[v.id]
  const note = sampleNote(run)

  return (
    <Screen aria-label="Your 8 posts">
      <div className="hp">
        <div className="hp-main">
          <ScreenTitle title={`Post these ${versions.length}.`} line="Copy each caption and save its image." />

          <div
            ref={rail}
            className="hp-rail"
            role="group"
            aria-label="Your posts"
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
              e.preventDefault()
              go(index + (e.key === "ArrowRight" ? 1 : -1), true)
            }}
          >
            {versions.map((x, i) => {
              const on = x.code === v.code
              return (
                <button
                  key={x.id}
                  type="button"
                  data-code={x.code}
                  className="hp-thumb"
                  aria-pressed={on}
                  aria-label={`Post for ${lowerFirst(x.audienceName)}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setCode(x.code)}
                  style={{ "--r": `${TILT[i % 8]}deg`, "--i": i } as React.CSSProperties}
                >
                  <RunPost look={look} version={inLanguage(x, languageFor(s, x.id))} />
                </button>
              )
            })}
          </div>

          <section key={v.id} className="hp-words" aria-labelledby="hp-name">
            <h2 id="hp-name" className="hh-title ha-h2 ha-rise">
              {v.audienceName}
            </h2>

            {v.error ? (
              <div className="hp-broken ha-rise" style={{ "--i": 1 } as React.CSSProperties}>
                <p className="ha-bubble" role="alert">
                  This post did not finish. {v.error}
                </p>
                {run.mode === "live" ? (
                  <Button onClick={retry} disabled={retrying} aria-busy={retrying || undefined}>
                    {retrying ? "Writing it again" : "Try again"}
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="hp-lang ha-rise" style={{ "--i": 1 } as React.CSSProperties}>
                  <div
                    className="ha-seg"
                    role="radiogroup"
                    aria-label="Post language"
                    onKeyDown={(e) => {
                      const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
                      if (!dir) return
                      e.preventDefault()
                      e.stopPropagation()
                      const open = LANGUAGES.filter((l) => hasLanguage(v, l))
                      const next = open[(open.indexOf(lang) + dir + open.length) % open.length]
                      if (!next) return
                      setLang(next)
                      e.currentTarget.querySelector<HTMLElement>(`[data-lang="${next}"]`)?.focus()
                    }}
                  >
                    {LANGUAGES.map((l) => (
                      <button
                        key={l}
                        type="button"
                        role="radio"
                        data-lang={l}
                        aria-checked={lang === l}
                        tabIndex={lang === l ? 0 : -1}
                        disabled={!hasLanguage(v, l)}
                        onClick={() => setLang(l)}
                      >
                        {LANGUAGE_LABEL[l]}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="ha-chip"
                    aria-pressed={everyPost}
                    onClick={() => {
                      const next = !everyPost
                      setEveryPost(next)
                      if (next) hunchStore.setLanguage(lang)
                    }}
                  >
                    All {versions.length} posts
                  </button>
                </div>

                <div className="ha-sheet hp-caption ha-rise" style={{ "--i": 2 } as React.CSSProperties} lang={lang === "english" ? "en" : "fil"}>
                  <p className="hp-hook">{c.hook}</p>
                  {body ? <p>{body}</p> : null}
                  {v.hashtags.length ? <p>{v.hashtags.join(" ")}</p> : null}
                  {/^[AH]\d$/.test(v.code) ? <p>{v.code.replace(/^H/, "A")}</p> : null}
                </div>

                <div className="hp-actions ha-rise" style={{ "--i": 3 } as React.CSSProperties}>
                  <Button onClick={copy}>Copy the caption</Button>
                  <Button variant="secondary" onClick={save} disabled={saving} aria-busy={saving || undefined}>
                    {saving ? "Saving the image" : "Save the image"}
                  </Button>
                  {canShare ? (
                    <Button variant="secondary" onClick={share}>
                      Share
                    </Button>
                  ) : null}
                  {sharedAt ? (
                    <p className="hp-shared" title={new Date(sharedAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}>
                      Shared
                    </p>
                  ) : null}
                </div>

                <Review run={run} v={v} />
              </>
            )}
          </section>

          <div className="hp-next">
            <StepAction>
              <GoLink href="/test" className="w-full md:w-auto">
                Run the test
              </GoLink>
            </StepAction>
            {note ? <p className="ha-note">{note}</p> : null}
          </div>
        </div>

        <div className="hp-lead">
          <div key={`${v.id}:${lang}`} className="hp-phone">
            <RunPost look={look} version={shown} boosted sticker />
          </div>
        </div>
      </div>
      {image.canvas}
    </Screen>
  )
}

export function PostsScreen({ demo }: { demo: boolean }) {
  const s = useHunch()
  const [demoPending, setDemoPending] = useState(demo)

  useEffect(() => {
    if (!demo) return
    let alive = true
    applyDemo("posts").finally(() => {
      if (!alive) return
      setDemoPending(false)
      stripDemoParam()
    })
    return () => {
      alive = false
    }
  }, [demo])

  if (!s.ready || demoPending) return <LoadingScreen />

  if (s.studio?.status === "running") {
    return <EmptyScreen title="Still writing your 8 posts." line="Watch each draft get written and checked." href="/studio" action="Open the Studio" />
  }

  const run = s.run
  if (!run || !run.versions.length) {
    const stopped = s.studio && (s.studio.status === "failed" || s.studio.status === "interrupted")
    return stopped ? (
      <EmptyScreen title="The run stopped early." line="Start it again in the Studio. Your product is saved." href="/studio" action="Open the Studio" />
    ) : (
      <EmptyScreen title="No posts yet." line="Type what you sell to get 8 posts." href="/start" action="Go to Start" />
    )
  }

  return <PostsView run={run} />
}
