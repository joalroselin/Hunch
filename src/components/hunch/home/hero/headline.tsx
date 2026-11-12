import { Fragment } from "react"

const LINES = [
  ["Find", "out"],
  ["who", "buys."],
]

export const HEADLINE = LINES.map((l) => l.join(" ")).join(" ")
export const SUPPORT = "Hunch writes 8 posts for 8 kinds of buyers. Promote each for 3 days and see who messages."

// One line on wide screens, two on phones.
export function HeroHeadline() {
  return (
    <h1 id="hero-title" className="hx-h1 hh-display">
      {LINES.map((words, i) => (
        <Fragment key={i}>
          <span className="hx-line">
            {words.map((w, k) => (
              <Fragment key={k}>
                <span className="hx-w hx-hide" data-hx-word>
                  {w}
                </span>
                {k < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </span>
          {i < LINES.length - 1 ? " " : null}
        </Fragment>
      ))}
    </h1>
  )
}
