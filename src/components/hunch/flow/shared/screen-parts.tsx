"use client"

import * as React from "react"
import { cn } from "cn"

import { StepAction } from "@/components/hunch/shell"

// The screen's one primary button with a short note. Inline on desktop; the shell's sticky bar on phones.
export function StepFooter({ note, children, className }: { note?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mt-10 md:mt-14 md:flex md:flex-row-reverse md:items-center md:justify-end md:gap-6", className)}>
      {note ? <div className="ha-note max-w-[40ch]">{note}</div> : null}
      <StepAction className="md:shrink-0">{children}</StepAction>
    </div>
  )
}

export function SampleLabel({ children = "Sample run", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <p className={cn("ha-label", className)} title="Sample data. No real ads were run.">
      {children}
    </p>
  )
}
