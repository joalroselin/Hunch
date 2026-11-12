import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Slot } from "radix-ui"

import { LetterRoll } from "@/components/hunch/home/letter-roll"

// Pills. Ink is the one strong button; "go" is a step's forward button and ends in the drop. See APP-LOOK.md.
const INK = "bg-ink text-cream hover:bg-black aria-expanded:bg-black"
const QUIET = "bg-(--tint) text-ink hover:bg-(--tint-strong) aria-expanded:bg-(--tint-strong)"

const buttonVariants = cva(
  "group group/button press inline-flex shrink-0 items-center justify-center gap-[0.4rem] rounded-full border-0 pb-px font-semibold tracking-[-0.01em] whitespace-nowrap outline-none select-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-3 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 aria-invalid:text-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: INK,
        accent: INK,
        ink: INK,
        go: cn(INK, "justify-between"),
        outline: QUIET,
        secondary: QUIET,
        ghost: "bg-transparent text-ink hover:bg-(--tint) aria-expanded:bg-(--tint)",
        destructive: "bg-destructive/12 text-destructive hover:bg-destructive/18 focus-visible:outline-destructive",
        link: "rounded-none bg-transparent font-bold text-ink underline decoration-[1.5px] underline-offset-3",
        round: QUIET,
        "round-accent": INK,
      },
      size: {
        default:
          "h-11 px-5 text-[15px] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-3 text-[13px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-[14px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-14 px-7 text-[17px] has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6 [&_svg:not([class*='size-'])]:size-[18px]",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-14 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    compoundVariants: [
      { variant: "link", className: "h-auto px-0 py-0" },
      { variant: "go", size: "lg", className: "pr-2 pl-7" },
      { variant: "go", size: "default", className: "pr-1.5 pl-5" },
      { variant: ["round", "round-accent"], className: "[&_svg]:stroke-[1.75]" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const ROLLS = new Set(["default", "accent", "ink", "go", "round-accent"])

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const go = variant === "go" && !asChild
  // A plain text label rolls on hover, like the landing page's pills.
  const label = !asChild && typeof children === "string" && ROLLS.has(variant ?? "default") ? <LetterRoll text={children} /> : children

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {go ? (
        <>
          <span className="min-w-0 truncate">{label}</span>
          <span aria-hidden className="ha-go-drop hh-grain">
            <ArrowUpRight strokeWidth={2.4} />
          </span>
        </>
      ) : (
        label
      )}
    </Comp>
  )
}

/** A step's forward button as a link: the ink pill that ends in the drop. */
function GoLink({
  href,
  size = "lg",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "children"> & { size?: "default" | "lg"; children: string }) {
  return (
    <Link href={href} data-slot="button" data-variant="go" data-size={size} className={cn(buttonVariants({ variant: "go", size, className }))} {...props}>
      <span className="min-w-0 truncate">
        <LetterRoll text={children} />
      </span>
      <span aria-hidden className="ha-go-drop hh-grain">
        <ArrowUpRight strokeWidth={2.4} />
      </span>
    </Link>
  )
}

export { Button, GoLink, buttonVariants }
