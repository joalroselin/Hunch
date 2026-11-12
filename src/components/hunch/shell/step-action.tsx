"use client"

import * as React from "react"
import { createContext, useContext } from "react"
import { createPortal } from "react-dom"
import { cn } from "cn"

// undefined: no shell around, so the action stays inline everywhere.
export const StepBarSlot = createContext<HTMLElement | null | undefined>(undefined)

/**
 * A screen's primary button. Inline from 768px up; on phones it sits in the shell's sticky bottom bar.
 * Pass the button (or a button plus one quiet link) as children.
 */
export function StepAction({ children, className }: { children: React.ReactNode; className?: string }) {
  const slot = useContext(StepBarSlot)
  if (slot === undefined) return <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>
  return (
    <>
      <div className={cn("hidden flex-wrap items-center gap-3 md:flex", className)}>{children}</div>
      {slot ? createPortal(<div className="flex items-center gap-2 [&>*]:min-w-0 [&>*:first-child]:flex-1">{children}</div>, slot) : null}
    </>
  )
}
