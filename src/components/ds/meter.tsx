import * as React from "react"
import { cn } from "cn"

function Meter({
  label,
  value,
  max = 100,
  display,
  description,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  value: number
  max?: number
  display?: React.ReactNode
  description?: React.ReactNode
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div data-slot="meter" className={cn("min-w-0", className)} {...props}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[17px] font-medium tracking-[-0.015em] sm:text-[19px]">
          {label}
        </p>
        <p className="tabular text-[15px] text-mute">
          {display ?? `${Math.round(pct)}%`}
        </p>
      </div>
      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={typeof label === "string" ? label : undefined}
        className="mt-3 h-[3px] overflow-hidden rounded-full bg-ink/10"
      >
        <div
          className="h-full origin-left animate-grow-x rounded-full bg-linear-to-r from-action to-action-strong transition-transform duration-900 ease-out"
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
      {description ? (
        <p className="mt-3 text-[15px] leading-relaxed text-mute">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export { Meter }
