import * as React from "react"
import Link from "next/link"
import { cn } from "cn"

function LinkArrow({
  href,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"a">, "href"> & { href: string }) {
  const external = /^https?:\/\//.test(href)
  const inner = (
    <>
      <span>{children}</span>
      <span
        aria-hidden
        className="inline-block transition-transform duration-200 ease-out group-hover/link:translate-x-[3px]"
      >
        ›
      </span>
    </>
  )
  const classes = cn(
    "group/link link-arrow focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink",
    className
  )
  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer" {...props}>
        {inner}
      </a>
    )
  }
  return (
    <Link href={href} className={classes} {...props}>
      {inner}
    </Link>
  )
}

function TextLink({
  href,
  className,
  ...props
}: Omit<React.ComponentProps<"a">, "href"> & { href: string }) {
  return <Link href={href} className={cn("link-inline", className)} {...props} />
}

export { LinkArrow, TextLink }
