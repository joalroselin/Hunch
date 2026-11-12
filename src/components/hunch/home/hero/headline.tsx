import { Fragment } from "react"

const LINES = [
  ["Meet", "your"],
  ["suki."],
]

export const HEADLINE = LINES.map((l) => l.join(" ")).join(" ")
// No-break spaces keep each number with its noun.
export const SUPPORT = "Tell Hunch what you sell. You get 8\u00a0posts, each for a potential buyer."

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
