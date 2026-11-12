"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "cn"

function TopBar({
  href = "/",
  sub,
  action,
  position = "sticky",
  collapseBelow = "md",
  className,
  children,
}: {
  href?: string
  sub?: React.ReactNode
  action?: React.ReactNode
  position?: "sticky" | "fixed"
  collapseBelow?: "md" | "lg"
  className?: string
  children?: React.ReactNode
}) {
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const menuId = React.useId()
  const wide = collapseBelow === "lg"

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const closeOnLink = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) setOpen(false)
  }

  return (
    <header
      data-slot="top-bar"
      data-solid={scrolled || open}
      className={cn(
        position === "fixed" ? "fixed inset-x-0 top-0" : "sticky top-0",
        "z-50 border-b border-transparent transition-colors duration-500 data-[solid=true]:border-border data-[solid=true]:bg-navy/88 data-[solid=true]:backdrop-blur-md",
        className
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-page items-center justify-between gap-6 px-(--gutter) text-[13px]"
      >
        <Link
          href={href}
          className="flex shrink-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark-small-stone.svg" alt="Hunch" className="block h-6 w-auto" />
          {sub ? (
            <span className="hidden pt-0.5 text-[13px] font-medium whitespace-nowrap text-mute sm:inline">{sub}</span>
          ) : null}
        </Link>

        {children ? (
          <div
            className={cn(
              "hidden items-center gap-8",
              wide ? "lg:flex" : "md:flex"
            )}
          >
            {children}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          {action}
          {children ? (
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "-mr-2 flex size-9 flex-col items-center justify-center",
                wide ? "lg:hidden" : "md:hidden"
              )}
            >
              <span
                className={cn(
                  "block h-px w-4 bg-ink transition-transform duration-300 ease-out",
                  open && "translate-y-[3px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "mt-[5px] block h-px w-4 bg-ink transition-transform duration-300 ease-out",
                  open && "-translate-y-[3px] -rotate-45"
                )}
              />
            </button>
          ) : null}
        </div>
      </nav>

      {children ? (
        <div
          id={menuId}
          onClick={closeOnLink}
          className={cn(
            open ? "flex" : "hidden",
            "mx-auto max-w-page flex-col gap-4 px-(--gutter) pt-2 pb-6 text-2xl font-semibold tracking-tight",
            wide ? "lg:hidden" : "md:hidden"
          )}
        >
          {children}
        </div>
      ) : null}
    </header>
  )
}

function TopBarLink({
  className,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "text-fog/80 transition-colors hover:text-fog aria-[current=page]:text-fog focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink",
        className
      )}
      {...props}
    />
  )
}

export { TopBar, TopBarLink }
