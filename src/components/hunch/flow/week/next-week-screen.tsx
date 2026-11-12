"use client"

import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button, GoLink } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UgcPost } from "@/components/hunch/home/ugc-post"
import { copyText, useSamplePhotos } from "@/components/hunch/post"
import { applyDemo, nextSevenDays, stripDemoParam } from "@/components/hunch/screens/demo"
import { lowerFirst, shortPrice } from "@/components/hunch/screens/shared"
import { Bubble, EmptyScreen, LoadingScreen, Screen, ScreenTitle, StepAction } from "@/components/hunch/shell"
import { errorText, fetchFocus } from "@/lib/hunch/client"
import { captionText } from "@/lib/hunch/language"
import { getHunch, hunchStore, languageFor, reportKey, useHunch } from "@/lib/hunch/store"
import type { FocusPlan, FocusPost, Language, ResultsReport, TestRun, Version } from "@/lib/hunch/types"

import { PostKitProvider, usePostKit } from "../shared/post-kit"
import { notify, notifyError } from "../shared/share"
import { usePostFrame } from "../test/run-post"
import { LanguageSeg, PostDialog, type OpenPost } from "./post-dialog"
import "./week.css"

const dayOf = (p: FocusPost, i: number) => p.dayNumber ?? i + 1
const isTest = (p: FocusPost, i: number) => p.purpose === "runner_up_test" || (!p.purpose && dayOf(p, i) === 4)

// The tag says it, so the theme drops a leading "Testing runner-up:".
function themeOf(p: FocusPost) {
  const t = (p.theme ?? p.hook).replace(/^testing (the )?runner-up\s*[:,.-]\s*/i, "")
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// Where each day hangs: width in design pixels, lift and tilt. Tomorrow leads.
const HANG = [
  { w: 300, up: 0, r: -3 },
  { w: 150, up: 26, r: 3 },
  { w: 132, up: 0, r: -2 },
  { w: 176, up: 34, r: 4 },
  { w: 132, up: 6, r: -3 },
  { w: 150, up: 30, r: 2 },
  { w: 132, up: 0, r: -2.5 },
]
// A photo used again is framed differently each time.
const CROPS = [
  { zoom: 1.5, at: "70% 78%" },
  { zoom: 1.9, at: "22% 34%" },
  { zoom: 1.35, at: "86% 20%" },
  { zoom: 2.1, at: "60% 92%" },
  { zoom: 1.6, at: "10% 70%" },
  { zoom: 1.75, at: "40% 60%" },
]
const COPY_FAILED = "Copy blocked. Open the post and select its caption."

function WeekView({ plan, run }: { plan: FocusPlan; run: TestRun }) {
  const s = useHunch()
  const router = useRouter()
  const kit = usePostKit()
  const frame = usePostFrame(run)
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [said, setSaid] = useState<{ id: string; text: string } | null>(null)
  // Plans that only say "Day 1" get the real dates, known in the browser.
  const [dates, setDates] = useState<string[] | null>(null)
  useEffect(() => setDates(nextSevenDays()), [])
  useEffect(() => {
    if (!said) return
    const t = window.setTimeout(() => setSaid(null), 2400)
    return () => window.clearTimeout(t)
  }, [said])

  const posts = useMemo(() => [...plan.posts].sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0)), [plan.posts])
  const globalLang = s.language ?? run.product.language
  const langOf = useCallback((id: string) => languageFor(s, id), [s])
  const langKey = posts.map((p) => `${p.id}:${langOf(p.id)}`).join("|")
  const runnerUp = posts.find((p, i) => isTest(p, i))
  const whenOf = (p: FocusPost, i: number) => (/^day\s*\d+$/i.test(p.day.trim()) ? (dates?.[i] ?? " ") : p.day)

  const { prerender } = kit
  useEffect(() => {
    const t = window.setTimeout(() => {
      prerender(posts.map((p) => ({ version: p, lang: languageFor(getHunch(), p.id) })))
    }, 1200)
    return () => window.clearTimeout(t)
  }, [prerender, posts, langKey])

  const copyOne = async (p: FocusPost) => {
    const ok = await copyText(captionText(p, langOf(p.id)))
    if (ok) setSaid({ id: p.id, text: "Caption copied." })
    else notifyError(COPY_FAILED)
  }

  const copyAll = async () => {
    const text = posts.map((p, i) => `${whenOf(p, i)}\n\n${captionText(p, langOf(p.id))}`).join("\n\n\n")
    const ok = await copyText(text)
    if (ok) notify(`${posts.length} captions copied.`)
    else notifyError(COPY_FAILED)
  }

  const startOver = () => {
    setConfirm(false)
    hunchStore.reset()
    router.push("/start")
  }

  // Crops for photos that repeat across the week.
  const crops = useMemo(() => {
    const seen = new Map<string, number>()
    return posts.map((p) => {
      const key = frame(p).photo ?? ""
      const n = seen.get(key) ?? 0
      seen.set(key, n + 1)
      return n > 0 ? CROPS[(n - 1) % CROPS.length] : null
    })
  }, [posts, frame])

  const all: Version[] = useMemo(() => [...posts, ...plan.tests], [posts, plan.tests])
  const openIndex = all.findIndex((p) => p.id === openId)
  const openV = openIndex >= 0 ? all[openIndex] : null
  const open: OpenPost | null = openV
    ? openIndex < posts.length
      ? {
          version: openV,
          day: whenOf(posts[openIndex], openIndex),
          title: themeOf(posts[openIndex]),
          line: `For ${lowerFirst(openV.audienceName)}`,
          test: isTest(posts[openIndex], openIndex),
          shared: !!s.handedOff[openV.id],
        }
      : { version: openV, title: openV.audienceName, shared: !!s.handedOff[openV.id] }
    : null
  const step = useCallback(
    (dir: 1 | -1) => {
      setOpenId((id) => {
        const i = all.findIndex((p) => p.id === id)
        return i < 0 ? id : all[(i + dir + all.length) % all.length].id
      })
    },
    [all]
  )
  const notes = plan.notes?.filter((n) => !/day 4 tests the runner-up/i.test(n)) ?? []

  return (
    <>
      <Screen aria-label="Next week" className="hw">
        <div className="hw-top">
          <ScreenTitle
            className="hw-head"
            title="Post to them next week."
            line={
              runnerUp
                ? `Post ${posts.length - 1} days for ${lowerFirst(plan.audience.name)} and 1 for ${lowerFirst(runnerUp.audienceName)}.`
                : `Post ${posts.length} days for ${lowerFirst(plan.audience.name)}.`
            }
          />
          <ol className="hw-week" aria-label="The next 7 days">
            {posts.map((p, i) => {
              const h = HANG[i % HANG.length]
              const f = frame(p, langOf(p.id))
              const when = whenOf(p, i)
              const test = isTest(p, i)
              const crop = crops[i]
              const copied = said?.id === p.id
              return (
                <li
                  key={p.id}
                  className="hw-day"
                  data-lead={i === 0 ? "" : undefined}
                  style={{ "--w": h.w, "--up": h.up, "--r": `${h.r}deg`, "--i": i, "--zoom": crop?.zoom, "--at": crop?.at } as React.CSSProperties}
                >
                  <button
                    type="button"
                    className="hw-post"
                    aria-label={`${when.trim() ? `${when}. ` : ""}Open the post for ${lowerFirst(p.audienceName)}`}
                    onClick={() => setOpenId(p.id)}
                  >
                    <UgcPost version={f.version} photo={f.photo} avatar={f.avatar} handle={f.handle} price={i === 0 ? f.sticker : undefined} />
                  </button>
                  <div className="hw-under">
                    <p className="hw-when">
                      <span>{when}</span>
                      {test ? <span className="hw-tag">Testing the runner-up</span> : null}
                      {s.handedOff[p.id] ? <span className="hw-shared">Shared</span> : null}
                    </p>
                    {i === 0 ? (
                      <div className="hw-copy-lead">
                        <Button onClick={() => copyOne(p)}>Copy the caption</Button>
                        <span role="status" aria-live="polite">
                          {copied ? <Bubble out>{said?.text}</Bubble> : null}
                        </span>
                      </div>
                    ) : (
                      <button type="button" className="hw-copy" aria-label={`Copy the caption for ${when}`} data-done={copied || undefined} onClick={() => copyOne(p)}>
                        {copied ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="hw-send ha-rise" style={{ "--i": 12 } as React.CSSProperties}>
          <StepAction>
            <GoLink href="https://hunch-joalroselins-projects.vercel.app/" className="w-full md:w-auto">
              Plan and post them
            </GoLink>
          </StepAction>
          <Button variant="outline" size="lg" className="w-full md:w-auto" onClick={copyAll}>
            {`Copy all ${posts.length} captions`}
          </Button>
          <LanguageSeg value={globalLang} onChange={(l: Language) => hunchStore.setLanguage(l)} label="Language for all 7 posts" />
          <Button variant="ghost" size="lg" className="hw-new" onClick={() => setConfirm(true)}>
            Start a new product
          </Button>
          {notes.map((n) => (
            <p key={n} className="ha-note">
              {n}
            </p>
          ))}
        </div>

        {plan.tests.length ? (
          <section className="hw-tests" aria-labelledby="week-tests">
            <div>
              <h2 id="week-tests" className="hh-title hw-tests-title">{`Try ${plan.tests.length} small ${plan.tests.length === 1 ? "test" : "tests"}.`}</h2>
              <p className="hh-line ha-line">{`Spend ₱${s.setup.perPost} on each to check a second hunch.`}</p>
            </div>
            <ul>
              {plan.tests.map((t) => {
                const f = frame(t, langOf(t.id))
                return (
                  <li key={t.id}>
                    <button type="button" className="hw-post" aria-label={`Open the post for ${lowerFirst(t.audienceName)}`} onClick={() => setOpenId(t.id)}>
                      <UgcPost version={f.version} photo={f.photo} avatar={f.avatar} handle={f.handle} />
                    </button>
                    <p className="hw-when">{t.audienceName}</p>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}
      </Screen>

      <PostDialog
        post={open}
        frame={frame}
        lang={openV ? langOf(openV.id) : globalLang}
        onLanguage={(l) => openV && hunchStore.setPostLanguage(openV.id, l)}
        onClose={() => setOpenId(null)}
        onStep={all.length > 1 ? step : undefined}
      />

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new product.</DialogTitle>
            <DialogDescription>This clears the product, its posts, results and next week from this browser. Copy what you want to keep first.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Keep this week
            </Button>
            <Button onClick={startOver}>Start over</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Nothing streams here, so the drop only shows that work is happening.
function PlanLoading() {
  return (
    <Screen aria-busy="true">
      <div className="ha-empty">
        <span aria-hidden className="ha-empty-drop hh-grain hw-wait" />
        <ScreenTitle title="Writing next week." line="Wait for 7 new posts." size="h2" />
      </div>
    </Screen>
  )
}

function PlanError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Screen>
      <div className="ha-empty">
        <ScreenTitle title="Next week did not load." size="h2" />
        <Bubble role="alert" className="mt-6">
          {message}
        </Bubble>
        <Button size="lg" className="mt-8" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Screen>
  )
}

function usePlan(run: TestRun | null, report: ResultsReport | null, enabled: boolean) {
  const s = useHunch()
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const key = report ? reportKey(report) : null
  const plan = s.focus && key && s.focusFor === key ? s.focus : null

  useEffect(() => {
    if (!enabled || !run || !report || plan) return
    const ac = new AbortController()
    setError(null)
    fetchFocus({ run, report }, ac.signal)
      .then((p) => hunchStore.setFocus(p, report))
      .catch((e) => {
        if (!ac.signal.aborted) setError(errorText(e, "Could not make next week's posts. Try again.") || "Could not make next week's posts. Try again.")
      })
    return () => ac.abort()
  }, [enabled, run, report, plan, attempt])

  return { plan, error, retry: () => setAttempt((a) => a + 1) }
}

export function NextWeekScreen({ demo }: { demo: boolean }) {
  const s = useHunch()
  const [demoPending, setDemoPending] = useState(demo)

  useEffect(() => {
    if (!demo) return
    let alive = true
    applyDemo("next-week").finally(() => {
      if (!alive) return
      setDemoPending(false)
      stripDemoParam()
    })
    return () => {
      alive = false
    }
  }, [demo])

  const run = s.run
  const report = run && s.report && s.report.runId === run.id ? s.report : null
  const { plan, error, retry } = usePlan(run, report, s.ready && !demoPending)
  const photoFor = useSamplePhotos(run)

  if (!s.ready || demoPending) return <LoadingScreen />
  if (!run) {
    return <EmptyScreen title="No posts yet." line="Type what you sell to get 8 posts." href="/start" action="Go to Start" />
  }
  if (!report) {
    return <EmptyScreen title="No results yet." line="Add your test numbers to get next week's posts." href="/results" action="Go to Results" />
  }
  if (!plan) return error ? <PlanError message={error} onRetry={retry} /> : <PlanLoading />

  return (
    <PostKitProvider brand={run.product.name} price={shortPrice(run.product.price)} photo={s.photo} photoFor={photoFor}>
      <WeekView plan={plan} run={run} />
    </PostKitProvider>
  )
}
