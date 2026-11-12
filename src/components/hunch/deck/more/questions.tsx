"use client"

import type { Ground, SlideProps } from "../types"
import { Shell, at, useOn } from "./parts"
import { TOPICS } from "./topics"
import "./questions.css"

// A question takes the color of the slide it opens.
const FIELD: Partial<Record<Ground, string>> = {
  sili: "mq-q hh-field hh-field-sili hh-grain",
  dahon: "mq-q hh-field hh-field-dahon hh-grain",
  mangga: "mq-q hh-field hh-field-mangga hh-grain",
  gumamela: "mq-q hh-field hh-field-gumamela hh-grain",
}

/** The appendix index: the questions judges ask, as messages ready to send. */
export function Questions({ active, still, go }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Questions" className="mq">
      <div className="mq-head">
        <span aria-hidden className="mq-mark hh-grain" data-in />
        <h2 className="mo-h mq-h" data-in style={at(0.08)}>
          Ask us anything.
        </h2>
      </div>
      <ul className="mq-tray">
        {TOPICS.map((t, i) => (
          <li key={t.id} className="mq-item" style={at(0.3 + i * 0.055)}>
            <button type="button" className={FIELD[t.ground] ?? "mq-q"} onClick={() => go(t.id)}>
              {t.ask}
            </button>
          </li>
        ))}
      </ul>
    </Shell>
  )
}
