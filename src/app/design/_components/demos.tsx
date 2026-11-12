"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Chip, Field, Kicker, Meter, motionTokens } from "@/components/ds"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const tokenText = `--navy: #15192e;
--navy-deep: #0e1120;
--navy-2: #222844;
--navy-3: #2c3254;
--paper: #fbf6ef;
--mute: #a4a2a6;
--mute-strong: #c4c1c1;
--hairline: rgb(251 246 239 / 0.12);
--hairline-strong: rgb(251 246 239 / 0.24);
--indigo: #5050c8;
--indigo-strong: #6262dc;
--indigo-soft: #a7a9ef;
--pass: #6fd394;
--warn: #f0bd62;
--fail: #ff8f80;
--ease-expo: cubic-bezier(0.16, 1, 0.3, 1);`

function CopyTokensButton() {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(tokenText)
          setCopied(true)
          toast("Tokens copied.", { description: "Paste them into any stylesheet." })
          setTimeout(() => setCopied(false), 1600)
        } catch {
          toast("Could not copy.", { description: "Your browser blocked the clipboard." })
        }
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : "Copy tokens"}
    </Button>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-t hairline py-5 md:grid-cols-[9rem_1fr] md:items-center md:gap-6">
      <Kicker as="p" brackets={false}>
        {label}
      </Kicker>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

function ButtonsDemo() {
  const [busy, setBusy] = React.useState(false)
  return (
    <div>
      <Row label="variants">
        <Button>Start a test</Button>
        <Button variant="secondary">Edit product</Button>
        <Button variant="outline">Try with sample results</Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="ink">Download posts</Button>
        <Button variant="destructive">Delete run</Button>
        <Button variant="link">Read how it works</Button>
      </Row>
      <Row label="sizes">
        <Button size="lg">
          Write my 8 posts <ArrowRightIcon data-icon="inline-end" />
        </Button>
        <Button>Upload results</Button>
        <Button size="sm">See all</Button>
        <Button size="xs" variant="secondary">
          <PlusIcon data-icon="inline-start" /> Add
        </Button>
      </Row>
      <Row label="round icons">
        <Button variant="round" size="icon-lg" aria-label="Close">
          <XIcon />
        </Button>
        <Button variant="round-accent" size="icon-lg" aria-label="Confirm">
          <CheckIcon />
        </Button>
        <Button variant="round" size="icon" aria-label="Edit">
          <PencilIcon />
        </Button>
        <Button variant="round" size="icon-sm" aria-label="Download">
          <DownloadIcon />
        </Button>
        <Button variant="round" size="sm">
          Sun / Manila
        </Button>
      </Row>
      <Row label="states">
        <Button disabled>Disabled</Button>
        <Button
          aria-busy={busy}
          disabled={busy}
          onClick={() => {
            setBusy(true)
            setTimeout(() => setBusy(false), 1800)
          }}
        >
          {busy ? <Loader2Icon className="animate-spin" /> : null}
          {busy ? "Writing posts" : "Press to load"}
        </Button>
        <Button variant="outline" aria-invalid>
          Invalid
        </Button>
      </Row>
    </div>
  )
}

function FormDemo() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="What are you selling?" hint="One product. Name it the way you would to a friend.">
        <Input placeholder="Ube cheese pandesal" defaultValue="" />
      </Field>
      <Field label="Price" optional>
        <Input placeholder="₱120 for 6" />
      </Field>
      <Field label="Where do you sell?">
        <NativeSelect defaultValue="Facebook page">
          {["Facebook page", "Shopee", "TikTok Shop", "Instagram", "Sari-sari store"].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Budget" error="Add a budget of at least ₱400.">
        <Input defaultValue="₱150" />
      </Field>
      <Field label="Describe it" className="md:col-span-2">
        <Textarea placeholder="Soft pandesal with ube and cheese, baked every morning in Marikina." />
      </Field>
    </div>
  )
}

function ChipsDemo() {
  return (
    <div>
      <Row label="chips">
        <Chip>Neutral</Chip>
        <Chip dot>Sample run</Chip>
        <Chip tone="accent">Your people</Chip>
        <Chip tone="pass" dot>
          Passed
        </Chip>
        <Chip tone="warn" dot>
          Rewritten
        </Chip>
        <Chip tone="fail" dot>
          Failed
        </Chip>
      </Row>
      <Row label="badges">
        <Badge>Winner</Badge>
        <Badge variant="secondary">A3</Badge>
        <Badge variant="outline">Bold style</Badge>
        <Badge variant="ink">New</Badge>
        <Badge variant="pass">Safe to post</Badge>
        <Badge variant="warn">Small sample</Badge>
        <Badge variant="fail">Blocked</Badge>
      </Row>
      <Row label="live">
        <span className="inline-flex items-center gap-2 text-[14px] text-fog">
          <span aria-hidden className="size-2 rounded-full bg-live" />
          Test running
        </span>
      </Row>
    </div>
  )
}

function TabsDemo() {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All 8</TabsTrigger>
          <TabsTrigger value="passed">Passed</TabsTrigger>
          <TabsTrigger value="fixed">Fixed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="text-mute">Every version, in the order Hunch wrote them.</TabsContent>
        <TabsContent value="passed" className="text-mute">Versions that passed all 3 checks first time.</TabsContent>
        <TabsContent value="fixed" className="text-mute">Versions that were sent back and rewritten.</TabsContent>
      </Tabs>
      <Tabs defaultValue="reach">
        <TabsList variant="line">
          <TabsTrigger value="reach">Reach</TabsTrigger>
          <TabsTrigger value="clicks">Clicks</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
        </TabsList>
        <TabsContent value="reach" className="text-mute">People who saw at least one post.</TabsContent>
        <TabsContent value="clicks" className="text-mute">Taps on the link or the message button.</TabsContent>
        <TabsContent value="cost" className="text-mute">Pesos spent for each engagement.</TabsContent>
      </Tabs>
    </div>
  )
}

function OverlayCard({ label, note, children }: { label: string; note: string; children: React.ReactNode }) {
  return (
    <div className="tile flex flex-col justify-between gap-6 p-6">
      <div>
        <p className="text-[15px] font-medium">{label}</p>
        <p className="mt-1 text-[14px] text-mute">{note}</p>
      </div>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  )
}

function OverlaysDemo() {
  return (
    <TooltipProvider>
      <div className="grid gap-4 sm:grid-cols-2">
        <OverlayCard label="Dialog" note="Confirms one decision. Esc or the scrim closes it.">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete this run</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this run?</DialogTitle>
                <DialogDescription>The 8 versions and their results go with it. This cannot be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Keep it</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive" onClick={() => toast("Run deleted.", { description: "Ube cheese pandesal" })}>
                    Delete run
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </OverlayCard>
        <OverlayCard label="Sheet" note="Details anchored to the bottom like a drawer.">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open version A3</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[min(560px,calc(100dvh-24px))]">
              <SheetHeader>
                <SheetTitle>Version A3</SheetTitle>
                <SheetDescription>Night-shift BPO agents</SheetDescription>
              </SheetHeader>
              <SheetBody className="sm:px-10 sm:py-10">
                <Kicker as="p">h3 · bold style</Kicker>
                <p className="mt-4 max-w-xl text-[clamp(1.75rem,4.4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.035em]">
                  3 AM break, may pandesal ka ba?
                </p>
              </SheetBody>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
                <Button>Download post</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </OverlayCard>
        <OverlayCard label="Tooltip and menu" note="One short sentence. Menus sit on navy 3.">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="round" size="icon" aria-label="Copy caption">
                <CopyIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy the caption</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                Actions <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuLabel>Version A3</DropdownMenuLabel>
              <DropdownMenuItem>
                <PencilIcon /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DownloadIcon /> Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2Icon /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </OverlayCard>
        <OverlayCard label="Toast" note="Bottom center, navy 3 with a hairline.">
          <Button
            variant="secondary"
            onClick={() =>
              toast("Posts downloaded.", {
                description: "8 images saved to your phone.",
                action: { label: "Open", onClick: () => {} },
              })
            }
          >
            Show a toast
          </Button>
          <Button variant="ghost" onClick={() => toast.success("Test started.")}>
            Success
          </Button>
        </OverlayCard>
      </div>
    </TooltipProvider>
  )
}

function ProgressDemo() {
  const [v, setV] = React.useState(38)
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="tile p-6">
        <div className="flex items-baseline justify-between">
          <p className="text-[15px] font-medium">Writing posts</p>
          <p className="tabular text-[13px] text-mute">{v}%</p>
        </div>
        <Progress value={v} className="mt-4" />
        <div className="mt-5 flex gap-2">
          <Button size="xs" variant="secondary" onClick={() => setV((x) => Math.max(0, x - 20))}>
            Less
          </Button>
          <Button size="xs" variant="secondary" onClick={() => setV((x) => Math.min(100, x + 20))}>
            More
          </Button>
        </div>
      </div>
      <div className="tile p-6">
        <Meter label="Night-shift agents" value={62} description="Share of all engagements in the sample run." />
      </div>
      <div className="tile grid gap-3 p-6 md:col-span-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

// Motion specimens. Replay remounts them.
function MotionDemo() {
  const [run, setRun] = React.useState(0)
  const [on, setOn] = React.useState(true)
  const cols = 18
  const rows = 6
  const locked = 2

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[14px] text-mute">Under reduced motion these become fades, and loops stop.</p>
        <Button variant="round" size="sm" onClick={() => setRun((r) => r + 1)}>
          <RotateCcwIcon /> Replay
        </Button>
      </div>
      <div key={run} className="grid gap-4 md:grid-cols-2">
        <div className="tile p-6">
          <Kicker as="p">entrance · 70ms stagger</Kicker>
          <ul className="mt-5 grid gap-2">
            {["Your product", "8 posts for 8 audiences", "Who responded", "Your people"].map((t, i) => (
              <li key={t} className="animate-enter flex items-center justify-between border-b hairline pb-2 text-[15px]" style={{ animationDelay: `${i * 70}ms` }}>
                {t}
                <span className="font-mono text-[11px] text-mute">{String(i + 1).padStart(2, "0")}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="tile p-6">
          <Kicker as="p">thinking grid · rows lock as steps finish</Kicker>
          <div aria-hidden className="mt-5 grid gap-[7px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: rows * cols }, (_, k) => {
              const r = Math.floor(k / cols)
              const c = k % cols
              const isLocked = r < locked
              return (
                <span
                  key={k}
                  className={
                    isLocked
                      ? "mx-auto size-1.5 rounded-full bg-action-soft"
                      : "animate-dot-wave mx-auto size-1.5 rounded-full bg-action-strong"
                  }
                  style={isLocked ? undefined : { animationDelay: `${c * 90 + r * 70}ms` }}
                />
              )
            })}
          </div>
        </div>

        <div className="tile flex items-center gap-8 p-6">
          <svg viewBox="0 0 120 70" className="w-40 shrink-0" aria-hidden>
            <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="var(--hairline)" strokeWidth="1" />
            <path
              d="M10 62 A50 50 0 0 1 110 62"
              pathLength={1}
              fill="none"
              stroke="var(--paper)"
              strokeWidth="1"
              strokeDasharray="1"
              className="animate-draw"
            />
            {[0.18, 0.34, 0.52, 0.7].map((t, i) => {
              const a = Math.PI * (1 - t)
              return (
                <circle
                  key={t}
                  cx={60 + 50 * Math.cos(a)}
                  cy={62 - 50 * Math.sin(a)}
                  r="2.2"
                  fill="var(--mute-strong)"
                  className="animate-enter"
                  style={{ animationDelay: `${700 + i * 90}ms` }}
                />
              )
            })}
            <g transform={`translate(${60 + 50 * Math.cos(Math.PI * 0.12)} ${62 - 50 * Math.sin(Math.PI * 0.12)})`}>
              <circle r="6" fill="var(--indigo-strong)" opacity="0" className="animate-bloom" style={{ animationDelay: "1300ms", transformBox: "fill-box", transformOrigin: "center" }} />
              <circle r="3" fill="var(--indigo-soft)" className="animate-enter" style={{ animationDelay: "1200ms" }} />
            </g>
          </svg>
          <div>
            <Kicker as="p">arc draw · dots land · winner blooms</Kicker>
            <p className="mt-2 text-[14px] leading-relaxed text-mute">The line draws in, the scores land one by one, and the winner arrives last with one halo.</p>
          </div>
        </div>

        <div className="tile p-6">
          <Kicker as="p">spring · stiffness 250 · damping 30</Kicker>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Spring specimen"
            onClick={() => setOn((x) => !x)}
            className="mt-5 flex h-8 w-16 items-center rounded-full border border-hairline-strong bg-ink/5 p-1 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
            style={{ justifyContent: on ? "flex-end" : "flex-start" }}
          >
            <motion.span layout transition={motionTokens.spring} className={on ? "size-6 rounded-full bg-action" : "size-6 rounded-full bg-mute"} />
          </button>
          <div className="mt-6 h-[3px] overflow-hidden rounded-full bg-ink/10">
            <div className="h-full w-[62%] origin-left animate-grow-x rounded-full bg-linear-to-r from-action to-action-strong" />
          </div>
          <p className="mt-2 text-[13px] text-mute">Bars grow once from zero.</p>
        </div>
      </div>
    </div>
  )
}

export { ButtonsDemo, ChipsDemo, CopyTokensButton, FormDemo, MotionDemo, OverlaysDemo, ProgressDemo, TabsDemo }
