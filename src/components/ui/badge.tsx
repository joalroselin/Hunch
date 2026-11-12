import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border-0 px-2.5 pb-px text-[12px] leading-none font-semibold tracking-[-0.005em] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-ink text-cream",
        secondary: "bg-(--tint) text-ink [a]:hover:bg-(--tint-strong)",
        destructive: "px-0 text-destructive",
        outline: "px-0 text-ink",
        ghost: "px-0 text-ink",
        link: "px-0 font-semibold text-ink underline underline-offset-3",
        ink: "bg-ink text-cream",
        pass: "px-0 text-pass",
        warn: "px-0 text-warn",
        fail: "px-0 text-fail",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
