import * as React from "react"
import { cn } from "cn"

import { fieldClasses } from "@/components/ui/input"

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(fieldClasses, "select-chevron h-12 pr-10 pl-4", className)}
      {...props}
    />
  )
}

export { NativeSelect }
