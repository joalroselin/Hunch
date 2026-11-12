import * as React from "react"
import { cn } from "cn"

type TextTag = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4"

type TagProps = React.HTMLAttributes<HTMLElement> & { as?: TextTag }

function Eyebrow({ as: Tag = "p", className, ...props }: TagProps) {
  return <Tag data-slot="eyebrow" className={cn("eyebrow", className)} {...props} />
}

const headlineSizes = {
  hero: "text-[clamp(2.1rem,5.6vw,4.5rem)]",
  section: "text-[clamp(2.2rem,5.4vw,4.75rem)]",
  md: "text-[clamp(2rem,4.6vw,3.75rem)]",
  sm: "text-[clamp(1.75rem,3.6vw,2.75rem)]",
} as const

function Headline({
  as: Tag = "h2",
  size = "section",
  tail,
  className,
  children,
  ...props
}: TagProps & {
  size?: keyof typeof headlineSizes
  tail?: React.ReactNode
}) {
  return (
    <Tag
      data-slot="headline"
      className={cn("headline text-ink", headlineSizes[size], className)}
      {...props}
    >
      {children}
      {tail ? (
        <>
          {" "}
          <span>{tail}</span>
        </>
      ) : null}
    </Tag>
  )
}

const displaySizes = {
  hero: "text-[clamp(4.2rem,16vw,13.5rem)]",
  lockup: "text-[clamp(4rem,14vw,11.5rem)]",
  md: "text-[clamp(3.25rem,10vw,7rem)]",
} as const

function Display({
  as: Tag = "h1",
  size = "hero",
  className,
  ...props
}: TagProps & { size?: keyof typeof displaySizes }) {
  return (
    <Tag
      data-slot="display"
      className={cn(
        "display inline-block pb-[0.06em] text-ink",
        displaySizes[size],
        "leading-[0.95]",
        className
      )}
      {...props}
    />
  )
}

function Lead({ as: Tag = "p", className, ...props }: TagProps) {
  return (
    <Tag
      data-slot="lead"
      className={cn(
        "text-[clamp(1.05rem,1.4vw,1.25rem)] leading-[1.22] font-medium tracking-[-0.02em] text-ink",
        className
      )}
      {...props}
    />
  )
}

function Kicker({
  as: Tag = "span",
  className,
  children,
  ...props
}: TagProps & { /** Retired: labels never wear brackets. */ brackets?: boolean }) {
  delete (props as { brackets?: boolean }).brackets
  return (
    <Tag data-slot="kicker" className={cn("kicker", className)} {...props}>
      {children}
    </Tag>
  )
}

export { Eyebrow, Headline, Display, Lead, Kicker, headlineSizes, displaySizes }
