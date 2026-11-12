import * as React from "react"
import { cn } from "cn"

// Shared by Input, Textarea and NativeSelect. Styles are .ha-field in app-look.css.
const fieldClasses = "ha-field"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClasses,
        "h-12 px-4 [&[type=file]]:h-auto [&[type=file]]:py-[0.6rem] file:mr-3 file:inline-flex file:h-8 file:rounded-full file:border-0 file:bg-(--tint) file:px-3 file:text-[13px] file:font-semibold file:text-ink",
        className
      )}
      {...props}
    />
  )
}

export { Input, fieldClasses }
