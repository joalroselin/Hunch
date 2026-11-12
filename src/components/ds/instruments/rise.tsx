"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "cn"

import { useReduced, useSeen } from "./hooks"
import { DURATION, EASE_OUT, RISE, STAGGER, fadeOnly, stagger } from "./motion"

type RiseTag = "div" | "section" | "li" | "p" | "span" | "header"

const tags = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
  p: motion.p,
  span: motion.span,
  header: motion.header,
} as const

export type RiseProps = React.HTMLAttributes<HTMLElement> & {
  as?: RiseTag
  /** Position in reading order; each step adds one stagger. */
  index?: number
  /** Extra seconds before this item. */
  delay?: number
  /** "view" waits until scrolled into view; "mount" starts at once. */
  trigger?: "view" | "mount"
}

// Rises 12px from a 6px blur in reading order.
function Rise({ as = "div", index = 0, delay = 0, trigger = "view", className, children, ...props }: RiseProps) {
  const ref = React.useRef<HTMLElement>(null)
  const seen = useSeen(ref, 0.2)
  const reduced = useReduced()
  const on = trigger === "mount" || seen
  const Tag = tags[as] as typeof motion.div
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: RISE.y, filter: `blur(${RISE.blur}px)` }}
      animate={on ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={
        reduced
          ? fadeOnly(delay + stagger(index, 0.03))
          : { duration: DURATION.enter, ease: EASE_OUT, delay: delay + stagger(index) }
      }
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </Tag>
  )
}

export type RevealWordsProps = {
  text: string
  as?: "h1" | "h2" | "h3" | "p" | "span"
  /** Seconds before the first word. */
  delay?: number
  /** Seconds between words. */
  step?: number
  trigger?: "view" | "mount"
  className?: string
}

// Sets a line word by word, each rising from a slight blur. The emotional beat of a reveal.
function RevealWords({ text, as: Tag = "p", delay = 0, step = STAGGER.loose, trigger = "view", className }: RevealWordsProps) {
  const ref = React.useRef<HTMLElement>(null)
  const seen = useSeen(ref, 0.4)
  const reduced = useReduced()
  const on = trigger === "mount" || seen
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <Tag ref={ref as React.Ref<never>} className={cn(className)}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <motion.span
            className="inline-block"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={on ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            transition={
              reduced
                ? fadeOnly(delay)
                : { duration: 0.8, ease: EASE_OUT, delay: delay + i * step }
            }
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </Tag>
  )
}

export { Rise, RevealWords }
