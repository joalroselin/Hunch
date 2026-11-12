"use client"

import * as React from "react"
import { cn } from "cn"
import { CircleAlertIcon } from "lucide-react"

type ControlProps = {
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
}

function Field({
  label,
  hint,
  error,
  optional = false,
  id: idProp,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
  id?: string
  children: React.ReactElement<ControlProps>
}) {
  const auto = React.useId()
  const id = idProp ?? children.props.id ?? `field-${auto}`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [children.props["aria-describedby"], error ? errorId : hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined

  const control = React.cloneElement(children, {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : children.props["aria-invalid"],
  })

  return (
    <div
      data-slot="field"
      data-invalid={error ? "" : undefined}
      className={cn("grid content-start gap-2", className)}
      {...props}
    >
      <label
        htmlFor={id}
        className="ha-label flex items-baseline justify-between gap-3"
      >
        <span>{label}</span>
        {optional ? (
          <span className="font-medium">Optional</span>
        ) : null}
      </label>
      {control}
      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-[13.5px] leading-snug font-semibold text-fail"
        >
          <CircleAlertIcon aria-hidden className="mt-px size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="ha-note">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export { Field }
