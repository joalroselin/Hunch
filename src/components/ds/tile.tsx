import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const tileVariants = cva("tile relative text-ink", {
  variants: {
    padding: {
      none: "",
      sm: "p-6",
      md: "p-7 sm:p-9",
      lg: "p-8 sm:p-10",
      xl: "p-10 sm:p-14",
    },
    interactive: {
      true: "press lift block focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink",
      false: "",
    },
  },
  defaultVariants: { padding: "lg", interactive: false },
})

type TileTag = "div" | "li" | "article" | "section" | "a" | "button"

function Tile({
  as: Tag = "div",
  padding,
  interactive,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof tileVariants> & {
    as?: TileTag
    href?: string
    type?: "button" | "submit"
  }) {
  return (
    <Tag
      data-slot="tile"
      className={cn(tileVariants({ padding, interactive }), className)}
      {...props}
    />
  )
}

export { Tile, tileVariants }
