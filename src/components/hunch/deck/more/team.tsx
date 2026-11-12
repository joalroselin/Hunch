"use client"

import type { SlideProps } from "../types"
import { Shell, at, useOn } from "./parts"
import "./team.css"

// Angel to confirm the names as shown and one true line each.
const PEOPLE = [
  { name: "Joal", does: "Strategy, research and the plan" },
  { name: "Angel", does: "Design, the app and the pitch" },
]

/** Team: two first names, one line each. */
export function Team({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Team" className="mo-light tm">
      <div className="tm-words">
        <h2 className="mo-h tm-h" data-in>
          Two people built Hunch.
        </h2>
        <p className="mo-line" data-in style={at(0.08)}>
          Made in Manila for sellers just starting out.
        </p>
      </div>
      <ul className="tm-people">
        {PEOPLE.map((p, i) => (
          <li key={p.name} className="tm-person" data-in style={at(0.3 + i * 0.16)}>
            <b className="tm-name">{p.name}</b>
            <span className="tm-does">{p.does}</span>
          </li>
        ))}
      </ul>
    </Shell>
  )
}
