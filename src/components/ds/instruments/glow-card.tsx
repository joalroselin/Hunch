"use client"

import * as React from "react"
import { cn } from "cn"

import { motionState, usePageVisible, useReduced, useSeen } from "./hooks"
import "./instruments.css"

const paddings = {
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const

type Tag = "div" | "section" | "article" | "li" | "aside"

export type GlowCardProps = Omit<React.HTMLAttributes<HTMLElement>, "title"> & {
  /** Short bold label, e.g. "Your people". */
  title?: React.ReactNode
  /** Muted second line, e.g. "Early signal". */
  subtitle?: React.ReactNode
  /** Element for the title. Defaults to h3. */
  titleAs?: "h2" | "h3" | "h4" | "p"
  /** Right side of the header, e.g. a round icon button. */
  action?: React.ReactNode
  /** Retired. Sheets are flat paper; the prop is ignored. */
  glow?: "none" | "soft" | "hero"
  /** Retired. */
  glowAt?: string
  padding?: keyof typeof paddings
  /** Rise in from a slight blur when first seen. */
  enter?: boolean
  /** Hover lift and press feedback, for cards that are clickable. */
  interactive?: boolean
  /** Seconds before the entrance and the glow bloom. */
  delay?: number
  as?: Tag
}

function GlowCard({
  title,
  subtitle,
  titleAs: TitleTag = "h3",
  action,
  glow: _glow,
  glowAt: _glowAt,
  padding = "md",
  enter = true,
  interactive = false,
  delay = 0,
  as: Comp = "div",
  className,
  style,
  children,
  ...props
}: GlowCardProps) {
  const ref = React.useRef<HTMLElement>(null)
  const seen = useSeen(ref, 0.25)
  const reduced = useReduced()
  const visible = usePageVisible()
  void _glow
  void _glowAt

  return (
    <Comp
      ref={ref as React.Ref<never>}
      {...motionState(seen, reduced)}
      data-paused={visible ? undefined : ""}
      className={cn(
        "ins-glowcard surface-gradient relative isolate rounded-[24px] text-foreground",
        enter && "ins-enter",
        interactive && "ins-lift",
        paddings[padding],
        className
      )}
      style={{ "--ins-delay": `${delay}s`, ...style } as React.CSSProperties}
      {...props}
    >
      {title || subtitle || action ? (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? (
              <TitleTag className="text-[15px] leading-[1.25] font-extrabold tracking-[-0.015em] text-foreground">{title}</TitleTag>
            ) : null}
            {subtitle ? <p className="text-[15px] leading-[1.25] font-medium text-foreground">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </Comp>
  )
}

export { GlowCard }
