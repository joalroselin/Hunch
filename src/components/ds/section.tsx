import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { Eyebrow, Headline, Lead } from "@/components/ds/type"

const sectionVariants = cva("relative px-(--gutter)", {
  variants: {
    spacing: {
      none: "",
      sm: "py-16",
      md: "py-20 sm:py-28",
      lg: "py-32 sm:py-40",
    },
    tone: {
      stone: "bg-background",
      card: "surface-gradient",
      none: "",
    },
  },
  defaultVariants: { spacing: "md", tone: "none" },
})

const containerWidths = {
  page: "max-w-page",
  wide: "max-w-sheet",
  list: "max-w-list",
  reading: "max-w-reading",
  form: "max-w-form",
  // The 7 app steps share one left edge, lined up with the shell header.
  flow: "max-w-[84rem]",
  full: "max-w-none",
} as const

function Section({
  spacing,
  tone,
  width = "page",
  className,
  innerClassName,
  children,
  ...props
}: React.ComponentProps<"section"> &
  VariantProps<typeof sectionVariants> & {
    width?: keyof typeof containerWidths
    innerClassName?: string
  }) {
  return (
    <section
      data-slot="section"
      className={cn(sectionVariants({ spacing, tone }), className)}
      {...props}
    >
      <div className={cn("mx-auto w-full", containerWidths[width], innerClassName)}>
        {children}
      </div>
    </section>
  )
}

function SectionHeader({
  eyebrow,
  title,
  tail,
  lead,
  align = "center",
  size = "section",
  as = "h2",
  className,
  ...props
}: Omit<React.ComponentProps<"header">, "title"> & {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  tail?: React.ReactNode
  lead?: React.ReactNode
  align?: "center" | "left"
  size?: "hero" | "section" | "md" | "sm"
  as?: "h1" | "h2" | "h3"
}) {
  return (
    <header
      data-slot="section-header"
      className={cn(
        align === "center" ? "mx-auto text-center" : "text-left",
        "max-w-3xl",
        className
      )}
      {...props}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Headline as={as} size={size} tail={tail} className={cn(eyebrow ? "mt-3" : undefined)}>
        {title}
      </Headline>
      {lead ? (
        <Lead className={cn("mt-5 max-w-2xl", align === "center" && "mx-auto")}>
          {lead}
        </Lead>
      ) : null}
    </header>
  )
}

function InfoStrip({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="info-strip"
      className={cn(
        "bg-cream-deep px-(--gutter) py-2 text-center text-[13px] font-medium text-ink",
        className
      )}
      {...props}
    />
  )
}

export { Section, SectionHeader, InfoStrip, sectionVariants, containerWidths }
