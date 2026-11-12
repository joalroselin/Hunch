"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const dot = (kind: "done" | "error" | "quiet") => <span aria-hidden className="ha-toast-dot" data-kind={kind} />

// Toasts are ink message bubbles with the drop as their mark. See APP-LOOK.md.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      offset={{ bottom: 28 }}
      mobileOffset={{ bottom: 96 }}
      className="toaster group"
      icons={{
        success: dot("done"),
        info: dot("quiet"),
        warning: dot("error"),
        error: dot("error"),
        loading: dot("quiet"),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "ha-toast flex items-center",
          title: "text-[14px] leading-[1.3] font-semibold tracking-[-0.01em]",
          description: "text-[13px] leading-[1.3] font-medium text-sheet/75",
          icon: "flex shrink-0 items-center",
          actionButton: "ml-1 shrink-0 rounded-full bg-sheet px-3 py-1 text-[13px] font-semibold text-ink",
          cancelButton: "ml-1 shrink-0 rounded-full bg-sheet/15 px-3 py-1 text-[13px] font-semibold text-sheet",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
