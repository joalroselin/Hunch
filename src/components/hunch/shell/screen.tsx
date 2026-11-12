import * as React from "react"
import Link from "next/link"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

// The pieces every app screen is made of. See APP-LOOK.md.

/** Page container: gutter on the left, like the landing page. */
export function Screen({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("ha-page", className)} {...props} />
}

/** The screen's heading and its one support line. A plain string rises word by word. */
export function ScreenTitle({
  title,
  line,
  as: Tag = "h1",
  size = "h1",
  className,
}: {
  title: React.ReactNode
  line?: React.ReactNode
  as?: "h1" | "h2"
  size?: "h1" | "h2"
  className?: string
}) {
  const words = typeof title === "string" ? title.split(" ") : null
  return (
    <header className={className}>
      <Tag className={cn("hh-title", size === "h1" ? "ha-h1" : "ha-h2", words ? "ha-words" : "ha-rise")} aria-label={words ? (title as string) : undefined}>
        {words
          ? words.map((w, i) => (
              <React.Fragment key={i}>
                <span aria-hidden style={{ "--i": i } as React.CSSProperties}>
                  {w}
                </span>
                {i < words.length - 1 ? " " : null}
              </React.Fragment>
            ))
          : title}
      </Tag>
      {line ? (
        <p className="hh-line ha-line ha-rise" style={{ "--i": (words?.length ?? 1) + 1 } as React.CSSProperties}>
          {line}
        </p>
      ) : null}
    </header>
  )
}

/** Something the app says once: an ink message bubble. `out` puts the tail on the right. */
export function Bubble({ out, className, ...props }: React.ComponentProps<"span"> & { out?: boolean }) {
  return <span className={cn("ha-bubble ha-bubble-in block", out && "ha-bubble-out", className)} {...props} />
}

/** Nothing to show yet: the drop, one heading, one line, one button. */
export function EmptyScreen({ title, line, href, action }: { title: string; line?: string; href: string; action: string }) {
  return (
    <Screen>
      <div className="ha-empty">
        <span aria-hidden className="ha-empty-drop hh-grain ha-rise" />
        <ScreenTitle title={title} line={line} size="h2" />
        <Button asChild variant="default" size="lg" className="ha-rise mt-8" style={{ "--i": 6 } as React.CSSProperties}>
          <Link href={href}>{action}</Link>
        </Button>
      </div>
    </Screen>
  )
}

/** Saved state is loading: the drop alone. It waits 450 ms before it shows. */
export function LoadingScreen() {
  return (
    <div className="ha-loading" aria-busy="true">
      <span className="sr-only">Loading</span>
      <span aria-hidden className="hh-grain" />
    </div>
  )
}
