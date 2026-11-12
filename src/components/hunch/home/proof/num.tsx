/** A result in the dot face. The peso sign is set in the display face, which has one. */
export function Num({ value, className }: { value: string | number; className?: string }) {
  const text = String(value)
  const peso = text.startsWith("₱")
  return (
    <b className={className ? `hh-dot ${className}` : "hh-dot"}>
      {peso ? <span className="pf-peso">₱</span> : null}
      {peso ? text.slice(1) : text}
    </b>
  )
}
