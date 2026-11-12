"use client"

import * as React from "react"
import { cn } from "cn"

type DisclosureItem = {
  id: string
  question: React.ReactNode
  answer: React.ReactNode
}

function Disclosure({
  items,
  defaultOpen,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  items: DisclosureItem[]
  defaultOpen?: string | null
}) {
  const [open, setOpen] = React.useState<string | null>(
    defaultOpen === undefined ? (items[0]?.id ?? null) : defaultOpen
  )
  const base = React.useId()

  return (
    <div data-slot="disclosure" className={cn("border-t hairline", className)} {...props}>
      {items.map((item) => {
        const isOpen = open === item.id
        const panelId = `${base}-${item.id}`
        const buttonId = `${panelId}-q`
        return (
          <div key={item.id} className="border-b hairline">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
              >
                <span className="text-[19px] font-semibold tracking-tight sm:text-[21px]">
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "text-2xl leading-none text-mute transition-transform duration-300 ease-out",
                    isOpen && "rotate-45"
                  )}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-all duration-500 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden pr-10 text-[17px] leading-relaxed text-mute" inert={!isOpen}>
                <div className="pb-6">{item.answer}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { Disclosure, type DisclosureItem }
