import * as React from "react"
import { cn } from "cn"

const statSizes = {
  sm: "text-3xl sm:text-4xl",
  md: "text-[40px]",
  lg: "text-[clamp(3.25rem,8vw,5.5rem)]",
  xl: "text-[clamp(4.5rem,11vw,8rem)]",
} as const

// Doto's own period is a cross of dots; draw separators as one round dot.
function dotted(value: React.ReactNode) {
  if (typeof value !== "string" && typeof value !== "number") return value
  return Array.from(String(value)).map((ch, i) =>
    ch === "." || ch === "," ? (
      <span key={i} aria-hidden className="mx-[0.03em] inline-block size-[0.074em] rounded-full bg-current" />
    ) : (
      <React.Fragment key={i}>{ch}</React.Fragment>
    )
  )
}

function Stat({
  value,
  label,
  caption,
  size = "md",
  highlight = false,
  tabular = false,
  dot = false,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  value: React.ReactNode
  label?: React.ReactNode
  caption?: React.ReactNode
  size?: keyof typeof statSizes
  highlight?: boolean
  tabular?: boolean
  dot?: boolean
}) {
  return (
    <div data-slot="stat" className={cn("flex flex-col", className)} {...props}>
      {label ? (
        <p className="text-[15px] text-mute sm:text-[17px]">{label}</p>
      ) : null}
      <p
        className={cn(
          dot ? "dot-num text-ink" : "font-semibold tracking-[-0.03em] text-ink",
          tabular && "tabular",
          label && "mt-2",
          statSizes[size],
          "leading-none"
        )}
      >
        <span className={cn(highlight && "spectrum")}>{dot ? dotted(value) : value}</span>
      </p>
      {caption ? (
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-mute">
          {caption}
        </p>
      ) : null}
    </div>
  )
}

export { Stat, statSizes }
