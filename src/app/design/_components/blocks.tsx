import * as React from "react"
import { cn } from "cn"

import { Kicker } from "@/components/ds"

function Block({
  index,
  name,
  title,
  description,
  className,
  children,
  id,
}: {
  index: string
  name: string
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
  children: React.ReactNode
  id?: string
}) {
  return (
    <div id={id} className={cn("scroll-mt-20", className)}>
      <div className="grid gap-3 border-t hairline pt-6 md:grid-cols-[14rem_1fr] md:gap-10">
        <Kicker as="p">
          {index} · {name}
        </Kicker>
        <div className="max-w-2xl">
          <h3 className="text-[24px] leading-tight font-semibold tracking-tight sm:text-[28px]">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 text-[15px] leading-relaxed text-mute sm:text-[16px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-8 md:mt-10">{children}</div>
    </div>
  )
}

function Spec({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("font-mono text-[12px] leading-relaxed text-mute-strong break-words", className)}
      {...props}
    />
  )
}

function Caption({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-[13px] text-mute", className)} {...props} />
}

export { Block, Spec, Caption }
