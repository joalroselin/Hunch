import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-[10px] bg-(--tint)", className)}
      {...props}
    />
  )
}

export { Skeleton }
