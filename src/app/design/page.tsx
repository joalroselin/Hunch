import type { Metadata } from "next"
import { cn } from "cn"

import Link from "next/link"
import { Chip, Kicker, Lead, Section, SectionHeader, Stat, Tile, TopBar, TopBarLink } from "@/components/ds"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Block, Spec } from "./_components/blocks"
import {
  ButtonsDemo,
  ChipsDemo,
  CopyTokensButton,
  FormDemo,
  MotionDemo,
  OverlaysDemo,
  ProgressDemo,
  TabsDemo,
} from "./_components/demos"

export const metadata: Metadata = {
  title: "Design system · Hunch",
  description: "Colors, type, components and motion for the Hunch app.",
}

const nav = [
  ["#color", "Color"],
  ["#gradients", "Gradients"],
  ["#type", "Type"],
  ["#components", "Components"],
  ["#motion", "Motion"],
  ["#voice", "Voice"],
]

type Swatch = { name: string; token: string; value: string; usage: string; contrast: string; fill: string }

const core: Swatch[] = [
  { name: "Navy", token: "--navy · bg-background · bg-stone", value: "#15192e", usage: "The page. Every screen sits on it.", contrast: "Paper on navy 16.1:1", fill: "#15192e" },
  { name: "Navy 2", token: "--navy-2 · bg-card · bg-field", value: "#222844", usage: "Cards, tiles, inputs. One step up.", contrast: "Paper on navy 2 13.4:1", fill: "#222844" },
  { name: "Paper", token: "--paper · text-ink · text-foreground", value: "#fbf6ef", usage: "Text, icons, focus outlines, thin lines.", contrast: "16.1:1 on navy", fill: "#fbf6ef" },
  { name: "Indigo", token: "--action · bg-primary", value: "#5050c8", usage: "The one action that moves a test forward.", contrast: "Paper on indigo 5.9:1", fill: "#5050c8" },
]

const supporting: Swatch[] = [
  { name: "Navy deep", token: "--navy-deep", value: "#0e1120", usage: "Outer page edges and the overlay scrim.", contrast: "Decorative", fill: "#0e1120" },
  { name: "Navy 3", token: "--navy-3 · bg-popover", value: "#2c3254", usage: "Menus, tooltips, toasts, the active tab.", contrast: "Paper on it 11.5:1", fill: "#2c3254" },
  { name: "Mute", token: "--mute · text-mute", value: "#a4a2a6", usage: "Second lines, labels, the quiet half of a headline.", contrast: "6.9:1 on navy, 5.7:1 on navy 2", fill: "#a4a2a6" },
  { name: "Mute strong", token: "--mute-strong", value: "#c4c1c1", usage: "Mono kickers and captions under 13px.", contrast: "9.7:1 on navy, 8.1:1 on navy 2", fill: "#c4c1c1" },
  { name: "Indigo hover", token: "--action-strong", value: "#6262dc", usage: "Hover and open state of indigo buttons. Chart winner.", contrast: "Paper on it 4.5:1", fill: "#6262dc" },
  { name: "Indigo soft", token: "--action-soft · text-action-soft", value: "#a7a9ef", usage: "Indigo as text or a thin stroke on navy.", contrast: "7.9:1 on navy", fill: "#a7a9ef" },
  { name: "Hairline", token: "--hairline · border-border", value: "paper 12%", usage: "Dividers and tile edges. Strong is 24%.", contrast: "Decorative", fill: "rgb(251 246 239 / 0.12)" },
  { name: "Placeholder", token: "text-placeholder", value: "#7c7c85", usage: "Placeholder text only.", contrast: "3.5:1 on navy 2", fill: "#7c7c85" },
]

const status: Swatch[] = [
  { name: "Pass", token: "--pass · tint 14%", value: "#6fd394", usage: "A check that passed.", contrast: "5.8:1 on its tint", fill: "#6fd394" },
  { name: "Warn", token: "--warn · tint 14%", value: "#f0bd62", usage: "Rewritten drafts, small samples.", contrast: "6.2:1 on its tint", fill: "#f0bd62" },
  { name: "Fail", token: "--fail · tint 14%", value: "#ff8f80", usage: "Failed checks and destructive actions.", contrast: "5.1:1 on its tint", fill: "#ff8f80" },
  { name: "Live", token: "--live", value: "#30d158", usage: "The dot beside a running test. Always with words.", contrast: "Dot only", fill: "#30d158" },
]

const chart = [
  { token: "chart-1", value: "#6262dc", name: "Winner", h: 92 },
  { token: "chart-2", value: "#fbf6ef", name: "Runner-up", h: 74 },
  { token: "chart-3", value: "#a4a2a6", name: "Others", h: 58 },
  { token: "chart-4", value: "#a7a9ef", name: "Benchmark", h: 46 },
  { token: "chart-5", value: "#4a4e66", name: "Rest", h: 30 },
]

function SwatchTile({ s, large = false }: { s: Swatch; large?: boolean }) {
  return (
    <Tile padding="none" as="li" className="flex flex-col overflow-hidden">
      <div
        className={cn(large ? "h-24 sm:h-32" : "h-16", "border-b hairline")}
        style={{ background: s.fill }}
        aria-hidden
      />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[16px] font-semibold tracking-[-0.015em]">{s.name}</p>
        <p className="text-[13px] text-mute">{s.value}</p>
        <Spec className="mt-2">{s.token}</Spec>
        <p className="mt-3 text-[14px] leading-relaxed text-mute">{s.usage}</p>
        <p className="mt-auto pt-4 text-[13px] font-medium text-ink">{s.contrast}</p>
      </div>
    </Tile>
  )
}

const gradients = [
  { name: "glow-indigo", note: "Hero numbers and the Your people card. One per screen area.", cls: "glow-indigo" },
  { name: "surface-gradient", note: "Card fill: navy 2 to a touch darker, with a faint top light.", cls: "surface-gradient" },
  { name: "page-backdrop", note: "The body. A fixed field that drifts over 26 seconds.", cls: "bg-navy bg-[radial-gradient(70%_60%_at_50%_0%,rgb(80_80_200/0.32),transparent_70%),radial-gradient(90%_80%_at_50%_45%,transparent_50%,rgb(14_17_32/0.95)_100%)]" },
  { name: "dot-grid", note: "A faint 20px paper dot texture at under 5%. Shown here at 3x.", cls: "bg-navy-deep bg-[radial-gradient(circle,rgb(251_246_239/0.16)_1px,transparent_1.4px)] bg-size-[20px_20px]" },
]

const fonts = [
  {
    name: "Geist",
    role: "All interface text",
    spec: "--font-geist · font-sans · 100 to 900 · OFL",
    sample: <p className="text-[clamp(2rem,4.6vw,3.25rem)] leading-none font-semibold tracking-[-0.035em]">Night-shift BPO agents</p>,
  },
  {
    name: "Geist Mono",
    role: "Small labels, codes, kickers",
    spec: "--font-geist-mono · font-mono · OFL",
    sample: <p className="font-mono text-[15px] text-mute-strong">[ h3 · bold style ] · 8 versions · ₱800 · 4 days</p>,
  },
  {
    name: "Doto",
    role: "Hero numbers only",
    spec: "--font-doto · font-dot · dot-num · ROND 100 · OFL",
    sample: <p className="dot-num text-[clamp(4rem,10vw,7rem)]">62%</p>,
  },
]

const typeScale = [
  ["Hero number", "dot-num · clamp(4.5rem, 11vw, 8rem)", <p key="a" className="dot-num text-[clamp(3rem,8vw,5rem)]">62</p>],
  ["Headline", "600 · clamp(2.2rem, 5.4vw, 4.75rem) · -0.035em", <p key="b" className="headline text-[clamp(2rem,4.6vw,3.5rem)]">Your people work nights. <span className="text-mute">Probably.</span></p>],
  ["Title", "600 · 28px · -0.025em", <p key="c" className="text-[24px] leading-tight font-semibold tracking-[-0.025em] sm:text-[28px]">Ube cheese pandesal, 6 for ₱120</p>],
  ["Label pair", "600 15px + 400 13px mute", <div key="d"><p className="text-[15px] font-semibold tracking-[-0.01em]">Night shift</p><p className="text-[13px] text-mute">Agents / Pasig</p></div>],
  ["Body", "400 · 17px · 1.625", <p key="e" className="max-w-xl text-[17px] leading-relaxed text-mute">Hunch writes eight posts for eight different people, runs them for a few days, and shows you who stopped scrolling.</p>],
  ["Kicker", "Geist Mono 11.5px · lowercase", <Kicker key="f" as="p">03 · night shift</Kicker>],
] as const

const motionTokens = [
  ["ease-expo", "cubic-bezier(0.16, 1, 0.3, 1)", "Every arrival, hover and color change"],
  ["animate-enter", "700ms · rise 12px from blur 6px", "Things arriving in reading order"],
  ["stagger-*", "70ms per step", "Order inside a group, 50 to 90ms"],
  ["animate-route", "500ms · rise 8px", "Route changes, applied by the shell"],
  ["animate-draw", "900ms · stroke-dashoffset", "Thin arcs and lines, with pathLength 1"],
  ["animate-bloom", "1.6s once", "The winner dot halo"],
  ["animate-grow-x", "900ms once", "Bars and meters growing from zero"],
  ["animate-dot-wave", "2.4s loop", "The thinking grid while Hunch works"],
  ["animate-glow", "10s loop", "Hero glow breathing, low amplitude"],
  ["animate-drift", "26s loop", "The page backdrop"],
  ["spring", "stiffness 250 · damping 30", "Small interactive things (motionTokens.spring)"],
  ["springNeedle", "stiffness 220 · damping 22", "Gauge needles, one slight settle"],
  ["press / lift", "scale 0.97 · lift 2px · 180ms", "Buttons and interactive tiles"],
] as const

const voice = [
  ["Headlines", "Your people: night-shift BPO agents.", "Congratulations! We found your ideal customer persona!"],
  ["Buttons", "Start a test · Upload results", "Click here · Let's go!"],
  ["Errors", "That file has no ad names. Export it again with the Ad name column on.", "Error 422: invalid input."],
  ["Numbers", "3.4 engagements per ₱100, from ₱800 over 4 days.", "Engagement improved significantly!"],
] as const

export default function DesignPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <TopBar sub="Design system" href="/design" collapseBelow="lg" action={<CopyTokensButton />}>
        {nav.map(([href, label]) => (
          <TopBarLink key={href} href={href}>
            {label}
          </TopBarLink>
        ))}
      </TopBar>

      <main id="main">
        <section className="relative isolate flex min-h-[calc(100svh-3rem)] flex-col items-center justify-center overflow-hidden px-(--gutter) pt-16 pb-16 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
            <div className="glow-indigo animate-glow size-[min(900px,130vw)]" />
          </div>
          <Kicker as="p" className="animate-enter stagger-0">
            v0.2 · dark system
          </Kicker>
          <p className="dot-num animate-enter stagger-1 mt-8 text-[clamp(7rem,22vw,15rem)]" aria-label="8 posts">
            08
          </p>
          <p className="animate-enter stagger-2 mt-4 text-[17px] font-semibold tracking-[-0.01em]">Posts per test</p>
          <p className="animate-enter stagger-2 text-[15px] text-mute">8 audiences / 1 answer</p>
          <Lead className="animate-enter stagger-4 mt-10 max-w-[36rem]">
            Navy ground, paper text and one indigo. Numbers are drawn in dots, lines are thin, and the only glow sits behind
            the answer.
          </Lead>
          <div className="animate-enter stagger-5 mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <a href="#components">Browse components</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#motion">See the motion</a>
            </Button>
          </div>
        </section>

        <Section id="color" className="scroll-mt-14">
          <SectionHeader
            align="left"
            eyebrow="Color"
            title="Navy, paper and one indigo."
            tail="Status colors report."
            lead="Every Hunch token kept its name, so existing classes still work: ink is now the text color (paper) and stone is the ground (navy)."
          />
          <div className="mt-14 grid gap-16">
            <Block index="01" name="core" title="Core palette" description="If you can build the screen with these four, do.">
              <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {core.map((s) => (
                  <SwatchTile key={s.name} s={s} large />
                ))}
              </ul>
            </Block>
            <Block index="02" name="supporting" title="Supporting tones" description="Lines are paper at low opacity, never a new gray. Indigo soft is the only way indigo appears as text.">
              <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {supporting.map((s) => (
                  <SwatchTile key={s.name} s={s} />
                ))}
              </ul>
            </Block>
            <Block index="03" name="status" title="Status" description="Re-tuned for navy. Each one ships with a word, so color is never the only signal.">
              <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {status.map((s) => (
                  <SwatchTile key={s.name} s={s} />
                ))}
              </ul>
            </Block>
            <Block index="04" name="charts" title="Chart colors" description="The winner is indigo hover, which clears 3:1 on navy. Everyone else steps down through paper and grays.">
              <Tile padding="lg">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[15px] text-mute">Engagements per ₱100</p>
                  <p className="text-[13px] text-mute">Specimen</p>
                </div>
                <div className="mt-8 grid h-44 grid-cols-5 items-end gap-3 sm:gap-6">
                  {chart.map((c) => (
                    <div key={c.token} className="flex h-full min-w-0 flex-col justify-end">
                      <div className="w-full" style={{ height: `${c.h * 0.85}%`, background: c.value }} />
                      <p className="mt-3 truncate text-[12px] text-mute">{c.name}</p>
                      <Spec>{c.value}</Spec>
                    </div>
                  ))}
                </div>
              </Tile>
            </Block>
          </div>
        </Section>

        <Section id="gradients" className="scroll-mt-14">
          <SectionHeader
            align="left"
            eyebrow="Gradients"
            title="Light comes from behind the answer."
            lead="Gradients use navy, navy 2 and indigo only, with at most a faint paper light. No neon, no rainbow, no glass stacks. At most one strong glow per screen area."
          />
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gradients.map((g) => (
              <Tile key={g.name} as="li" padding="none" className="overflow-hidden">
                <div className={cn("h-40 border-b hairline", g.cls)} aria-hidden />
                <div className="p-5">
                  <p className="font-mono text-[13px]">{g.name}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-mute">{g.note}</p>
                </div>
              </Tile>
            ))}
          </ul>
          <div className="relative isolate mt-4 overflow-hidden rounded-[20px] border border-hairline p-8 sm:p-12">
            <div aria-hidden className="glow-indigo animate-glow pointer-events-none absolute inset-0 -z-10" />
            <p className="text-[15px] text-mute">Your people</p>
            <p className="mt-3 headline text-[clamp(2.2rem,5vw,4rem)]">Night-shift BPO agents</p>
            <p className="mt-2 text-[15px] text-mute">Pattern for the reveal card: a glow layer behind, content on top.</p>
            <Spec className="mt-6">{'<div aria-hidden className="glow-indigo animate-glow pointer-events-none absolute inset-0 -z-10" />'}</Spec>
          </div>
        </Section>

        <Section id="type" className="scroll-mt-14">
          <SectionHeader
            align="left"
            eyebrow="Type"
            title="Three faces, each with one job."
            lead="All three are bundled locally under the SIL Open Font License, so builds never touch the network. Schibsted Grotesk stays loaded only for post images."
          />
          <div className="mt-14 grid gap-4">
            {fonts.map((f) => (
              <Tile key={f.name} padding="md" className="grid gap-6 md:grid-cols-[14rem_1fr] md:items-center">
                <div>
                  <p className="text-[17px] font-semibold tracking-[-0.015em]">{f.name}</p>
                  <p className="text-[14px] text-mute">{f.role}</p>
                  <Spec className="mt-2">{f.spec}</Spec>
                </div>
                <div className="min-w-0">{f.sample}</div>
              </Tile>
            ))}
          </div>
          <ul className="mt-12 border-t hairline">
            {typeScale.map(([name, spec, sample]) => (
              <li key={name} className="grid gap-3 border-b hairline py-6 md:grid-cols-[14rem_1fr] md:items-center md:gap-6">
                <div>
                  <p className="text-[15px] font-medium">{name}</p>
                  <Spec>{spec}</Spec>
                </div>
                <div className="min-w-0">{sample}</div>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="components" className="scroll-mt-14">
          <SectionHeader
            align="left"
            eyebrow="Components"
            title="Every export kept its name."
            tail="Only the paint changed."
            lead="Restyled shadcn parts in src/components/ui and Hunch primitives in src/components/ds."
          />
          <div className="mt-14 grid gap-16">
            <Block index="05" name="buttons" title="Buttons" description="Indigo for the one action that moves a test forward. Round outline icons for close, confirm and small tools.">
              <ButtonsDemo />
            </Block>
            <Block index="06" name="fields" title="Inputs and selects" description="Navy 2 fill, hairline border, an indigo ring on focus.">
              <FormDemo />
            </Block>
            <Block index="07" name="chips" title="Chips and badges">
              <ChipsDemo />
            </Block>
            <Block index="08" name="tabs" title="Tabs">
              <TabsDemo />
            </Block>
            <Block index="09" name="cards" title="Cards and tiles" description="Surface gradient with a hairline edge. Interactive tiles lift 2px and brighten their edge.">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Night shift</CardTitle>
                    <CardDescription>Agents / Pasig</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Stat dot size="lg" value="3.4" caption="Engagements per ₱100" />
                  </CardContent>
                  <CardFooter>
                    <Chip tone="accent" size="sm">
                      Your people
                    </Chip>
                  </CardFooter>
                </Card>
                <Tile interactive as="a" href="#components" padding="md" className="flex flex-col justify-between">
                  <p className="text-[15px] text-mute">Interactive tile</p>
                  <p className="mt-10 text-[21px] font-semibold tracking-[-0.02em]">Hover me</p>
                </Tile>
                <Tile padding="md">
                  <p className="text-[15px] font-semibold">Plain tile</p>
                  <p className="text-[13px] text-mute">Second line in mute</p>
                  <p className="mt-6 text-[15px] leading-relaxed text-mute">Tiles carry the same surface as cards and never need a shadow.</p>
                </Tile>
              </div>
            </Block>
            <Block index="10" name="progress" title="Progress, meter, skeleton">
              <ProgressDemo />
            </Block>
            <Block index="11" name="overlays" title="Dialog, sheet, tooltip, menu, toast" description="Floating layers sit on navy 2 or navy 3 with a strong hairline over a deep navy scrim. No backdrop blur.">
              <OverlaysDemo />
            </Block>
            <Block index="12" name="instruments" title="Instruments" description="Dot-matrix numbers, line arcs, tick dials, dot scatters and the thinking grid live in src/components/ds/instruments. They always draw real numbers from the run or report.">
              <p className="text-[14px] text-mute">
                See them with the sample report on the{" "}
                <Link href="/instruments-demo" className="link-inline text-ink">
                  instruments page
                </Link>
                .
              </p>
            </Block>
          </div>
        </Section>

        <Section id="motion" className="scroll-mt-14">
          <SectionHeader
            align="left"
            eyebrow="Motion"
            title="A hunch turning into an answer."
            tail="Calm, warm, never flashy."
            lead="One expo curve. Things rise from a slight blur in reading order, lines draw in, dots land, and the winner arrives last. Only the backdrop and the hero glow loop, and both rest while the tab is hidden."
          />
          <div className="mt-14 grid gap-12">
            <MotionDemo />
            <ul className="border-t hairline">
              {motionTokens.map(([name, value, use]) => (
                <li key={name} className="grid gap-1 border-b hairline py-4 md:grid-cols-[12rem_16rem_1fr] md:gap-6">
                  <p className="font-mono text-[13px]">{name}</p>
                  <p className="text-[14px] text-mute-strong">{value}</p>
                  <p className="text-[14px] text-mute">{use}</p>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section id="voice" className="scroll-mt-14">
          <SectionHeader align="left" eyebrow="Voice" title="Say it plainly." tail="Then stop." />
          <ul className="mt-14 grid gap-4">
            {voice.map(([topic, yes, no]) => (
              <Tile as="li" key={topic} padding="none" className="grid md:grid-cols-[10rem_1fr_1fr]">
                <p className="px-6 pt-6 text-[15px] font-semibold md:py-6">{topic}</p>
                <div className="px-6 py-5 md:py-6">
                  <p className="text-[13px] font-medium text-pass">Write</p>
                  <p className="mt-1 text-[16px] leading-relaxed">{yes}</p>
                </div>
                <div className="px-6 pb-6 md:py-6">
                  <p className="text-[13px] font-medium text-fail">Not</p>
                  <p className="mt-1 text-[16px] leading-relaxed text-mute line-through decoration-fail/40">{no}</p>
                </div>
              </Tile>
            ))}
          </ul>
          <p className="mt-12 text-center text-[13px] text-mute">The full spec lives in DESIGN.md.</p>
        </Section>
      </main>
    </>
  )
}
