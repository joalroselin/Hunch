import { cn } from "@/lib/utils"

const glyph = (ch: string) => (ch === " " ? "\u00a0" : ch)

// Hover letter roll: letters roll up in a wave and a copy rolls in from below. Driven by the nearest `group` parent.
export function LetterRoll({ text, className, step = 18 }: { text: string; className?: string; step?: number }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex select-none overflow-hidden">
        {Array.from(text).map((ch, i) => (
          <span key={i} className="relative inline-block">
            <span
              className="inline-block transition-transform duration-[380ms] ease-expo group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
              style={{ transitionDelay: `${i * step}ms` }}
            >
              {glyph(ch)}
            </span>
            <span
              className="absolute inset-0 inline-block translate-y-full transition-transform duration-[380ms] ease-expo group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:hidden"
              style={{ transitionDelay: `${i * step}ms` }}
            >
              {glyph(ch)}
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}
