import type { CSSProperties } from "react"

import { photoUrlOf, run, winnerCode } from "../data"
import { MARK_PATH } from "../mark"

// Four post photos for the window, the winning post first.
const winner = run.versions.find((v) => v.code === winnerCode)
const rest = run.versions.filter((v) => v !== winner)
const shots = [winner, rest[1], rest[4], rest[6]].flatMap((v) => (v ? [photoUrlOf(v)] : []))

// The mark as the hero's opening: the posts come out of it, then it shows their photos.
export function HeroMark() {
  return (
    <div aria-hidden className="hx-mark" style={{ "--n": shots.length } as CSSProperties}>
      <svg className="hx-mark-line" viewBox="0 0 100 100">
        <path className="hx-hide" data-hx-el="mark-line" d={MARK_PATH} pathLength={1} strokeDasharray="1" />
      </svg>
      <div className="hx-mark-fill hh-drop hh-grain hx-hide" data-hx-el="mark-fill" />
      <div className="hx-mark-win">
        {shots.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" draggable={false} style={{ "--i": i } as CSSProperties} />
        ))}
        <span className="hx-mark-sun hh-grain" />
      </div>
    </div>
  )
}
