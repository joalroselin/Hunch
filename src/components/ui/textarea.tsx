import * as React from "react"
import { cn } from "cn"

import { fieldClasses } from "@/components/ui/input"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldClasses,
        "flex field-sizing-content min-h-28 px-4 py-[0.85rem] leading-[1.4]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
