import { cn } from "@/lib/utils"

import "./mark.css"

// The drop's outline on a 100 x 100 box, drawn 1.5 inside the edge so a stroke stays within the shape.
export const MARK_PATH = "M50 1.5A48.5 48.5 0 0 1 50 98.5H9A7.5 7.5 0 0 1 1.5 91V50A48.5 48.5 0 0 1 50 1.5Z"

/** The Hunch mark, filled. Size it with a height or a width. */
export function HunchMark({ className }: { className?: string }) {
  return <span aria-hidden className={cn("hh-mark hh-drop hh-grain", className)} />
}
