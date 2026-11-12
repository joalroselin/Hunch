import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const chipVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border-0 font-semibold tracking-[-0.005em] whitespace-nowrap [&>svg]:size-3.5 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "px-0! text-ink",
        accent: "bg-ink pb-px text-cream",
        pass: "px-0! text-pass",
        warn: "px-0! text-warn",
        fail: "px-0! text-fail",
      },
      size: {
        sm: "h-6 px-2.5 text-[12px] leading-none",
        md: "h-8 px-3.5 text-[13px] leading-none",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  }
)

const dotTone = {
  neutral: "bg-ink",
  accent: "bg-cream",
  pass: "bg-pass",
  warn: "bg-warn",
  fail: "bg-fail",
} as const

function Chip({
  tone = "neutral",
  size,
  dot = false,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof chipVariants> & { dot?: boolean }) {
  return (
    <span
      data-slot="chip"
      data-tone={tone}
      className={cn(chipVariants({ tone, size }), className)}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn("size-1.5 shrink-0 rounded-full", dotTone[tone ?? "neutral"])}
        />
      ) : null}
      {children}
    </span>
  )
}

export { Chip, chipVariants }
