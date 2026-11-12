"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronRight, RotateCcw } from "lucide-react"

import {
  ArcDial,
  DotNumber,
  DotScatter,
  GlowCard,
  RevealWords,
  Rise,
  ThinkingGrid,
  TickGauge,
  TickStrip,
} from "@/components/ds/instruments"

import {
  ageBands,
  brand,
  genders,
  posts,
  report,
  runnerUp,
  steps,
  totalViews,
  winner,
  winnerBreakdown,
  winnerLead,
} from "./data"

const one = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 })
const levels = ["Early", "Medium", "Strong"]

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="ins-lift relative grid size-10 place-items-center rounded-full border border-border text-foreground"
    >
      {children}
    </button>
  )
}

export function InstrumentsDemo() {
  const [run, setRun] = React.useState(0)
  const [done, setDone] = React.useState(2)

  return (
    <div className="relative min-h-dvh text-foreground">
      <main className="relative mx-auto w-full max-w-[1080px] px-(--gutter) pt-6 pb-20 sm:pt-8">
        <header className="flex items-center justify-between">
          <Image src="/brand/wordmark-small-stone.svg" alt="Hunch" width={74} height={21} priority />
          <RoundButton label="Replay the animations" onClick={() => setRun((r) => r + 1)}>
            <RotateCcw aria-hidden className="size-4" strokeWidth={1.5} />
          </RoundButton>
        </header>

        <div key={run}>
          <Rise as="header" trigger="mount" className="mt-12 sm:mt-16">
            <h1 className="text-[28px] leading-[1.1] font-semibold tracking-[-0.02em] sm:text-[34px]">Instruments</h1>
            <p className="mt-1 text-[17px] leading-snug text-muted-foreground sm:text-[19px]">
              Sample report for {brand}, {posts.length} posts, ₱{report.totalSpend.toLocaleString("en-US")}, {report.days} {report.days === 1 ? "day" : "days"}
            </p>
          </Rise>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 lg:grid-cols-12">
            {/* The reveal: glow, then the name word by word, then the numbers. */}
            <GlowCard
              as="section"
              title="Your people"
              subtitle="Early signal"
              titleAs="h2"
              glow="hero"
              glowAt="50% 46%"
              padding="lg"
              className="flex min-h-[30rem] flex-col lg:col-span-7"
            >
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <RevealWords
                  as="p"
                  text={winner.audience}
                  delay={0.25}
                  step={0.08}
                  className="max-w-[16ch] text-[32px] leading-[1.08] font-semibold tracking-[-0.025em] sm:text-[40px]"
                />
                <DotNumber value={winner.score} size="xl" delay={0.6} className="mt-7" label={`${winner.score} engagements per ₱100`} />
                <Rise delay={0.75} className="mt-3 text-[15px] text-muted-foreground">
                  engagements per ₱100 for {winner.code}
                </Rise>
              </div>
              <dl className="grid grid-cols-2 gap-4 border-t border-border pt-5">
                <Rise index={0} delay={1.0} className="flex flex-col-reverse">
                  <dt className="mt-1.5 text-[13px] leading-snug text-pretty text-muted-foreground">the average of the other 7</dt>
                  <dd>
                    <DotNumber value={`${one(winnerLead)}×`} size="md" delay={1.0} label={`${one(winnerLead)} times`} />
                  </dd>
                </Rise>
                <Rise index={1} delay={1.0} className="flex flex-col-reverse">
                  <dt className="mt-1.5 text-[13px] leading-snug text-pretty text-muted-foreground">saves and shares per 1,000 views</dt>
                  <dd>
                    <DotNumber value={winner.savesShares} size="md" delay={1.07} />
                  </dd>
                </Rise>
              </dl>
            </GlowCard>

            <GlowCard
              as="section"
              title="All 8 posts"
              subtitle="Engagements per ₱100"
              delay={0.07}
              className="flex flex-col lg:col-span-5"
            >
              <div className="flex flex-1 items-center pt-8 pb-2">
                <ArcDial
                  label="Engagements per ₱100 for all 8 posts"
                  points={posts.map((p) => ({ value: p.score, label: `${p.code} · ${p.audience}` }))}
                  startCaption="H2, lowest"
                  endCaption={`${winner.code}, highest`}
                  centerLabel="8 posts"
                  centerCaption={`₱${report.perPost} each`}
                  delay={0.25}
                />
              </div>
            </GlowCard>

            <GlowCard title="Confidence" subtitle="How far to trust it" delay={0.14} className="lg:col-span-4">
              <div className="pt-7">
                <TickGauge
                  label="Confidence"
                  levels={levels}
                  value={levels.findIndex((l) => l.toLowerCase() === report.confidence)}
                  valueLabel={levels.find((l) => l.toLowerCase() === report.confidence) ?? "Early"}
                  valueCaption={`${report.days} ${report.days === 1 ? "day" : "days"} on ₱${report.totalSpend.toLocaleString("en-US")}`}
                  delay={0.2}
                />
              </div>
            </GlowCard>

            <GlowCard title="Runner-up" subtitle={`${runnerUp.code} · ${runnerUp.audience}`} delay={0.21} className="lg:col-span-4">
              <div className="mt-6">
                <DotNumber value={runnerUp.score} size="md" unit="per ₱100" unitAlign="baseline" delay={0.2} />
              </div>
              <TickStrip
                className="mt-6"
                label={`${runnerUp.code} engagements per ₱100 among all 8 posts`}
                value={runnerUp.score}
                min={Math.min(...posts.map((p) => p.score))}
                max={Math.max(...posts.map((p) => p.score))}
                marks={posts.filter((p) => p.code !== runnerUp.code).map((p) => p.score)}
                startLabel={one(Math.min(...posts.map((p) => p.score)))}
                endLabel={one(Math.max(...posts.map((p) => p.score)))}
                delay={0.3}
              />
            </GlowCard>

            <GlowCard title={`Who saw ${winner.code}`} subtitle="Age and gender" delay={0.28} className="lg:col-span-4">
              <DotScatter
                className="mt-6"
                label={`Views of ${winner.code} by age and gender. Each dot is 1% of views`}
                columns={[...ageBands]}
                rows={[...genders]}
                cells={winnerBreakdown.map((c) => ({
                  x: c.age,
                  y: c.gender,
                  value: c.views,
                  label: `${genders[c.gender]} ${ageBands[c.age]}`,
                  highlight: c.age === 1 && c.gender === 0,
                }))}
                delay={0.25}
              />
              <p className="mt-4 text-[13px] text-muted-foreground">Each dot is 1% of views. Mostly women 25-34.</p>
            </GlowCard>

            <GlowCard
              title="Writing your posts"
              subtitle={done >= steps.length ? "All steps done" : `Step ${done + 1} of ${steps.length}`}
              delay={0.07}
              className="lg:col-span-5"
              action={
                <RoundButton label="Finish this step" onClick={() => setDone((d) => (d >= steps.length ? 0 : d + 1))}>
                  <ChevronRight aria-hidden className="size-4" strokeWidth={1.5} />
                </RoundButton>
              }
            >
              <ThinkingGrid className="mt-6" steps={steps} done={done} label="Writing your posts" />
              <p className="mt-4 text-[15px] text-foreground">{done >= steps.length ? "Your 8 posts are ready" : steps[done]}</p>
            </GlowCard>

            <GlowCard
              title="The test"
              subtitle={`What went in, ${report.days} ${report.days === 1 ? "day" : "days"}`}
              delay={0.14}
              className="lg:col-span-7"
            >
              <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
                {[
                  { v: String(posts.length), l: "posts" },
                  { v: `₱${report.totalSpend.toLocaleString("en-US")}`, l: "spent in total" },
                  { v: totalViews.toLocaleString("en-US"), l: "views" },
                ].map((it, i) => (
                  <div key={it.l} className="flex flex-col-reverse">
                    <dt className="mt-2 text-[13px] text-muted-foreground">{it.l}</dt>
                    <dd>
                      <DotNumber value={it.v} size="md" delay={0.15 + i * 0.07} />
                    </dd>
                  </div>
                ))}
              </dl>
            </GlowCard>
          </div>

          <p className="mt-10 text-center text-[13px] text-muted-foreground">Every number on this page comes from the sample report.</p>
        </div>
      </main>
    </div>
  )
}
