"use client"

import { useRef, type CSSProperties } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

import { lowerFirst } from "@/components/hunch/screens/shared"

import { HomePost } from "../ugc-post"
import { runnerUp, unitWord, winner } from "./data"
import { useReveal } from "./reveal"
import { useMoving } from "../scroll/film"

type Fact = { figure: string; label: string }

/** The winning buyers, what they did, and what comes next. */
export function Winner({ onOpen }: { onOpen: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref, 24)
  const moving = useMoving()
  // The field rises as a dome that flattens, the post settles as it passes, and the words hang back as the next sheet covers them.
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start 0.12"] })
  const { scrollYProgress: pass } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const { scrollYProgress: leave } = useScroll({ target: ref, offset: ["end end", "end start"] })
  const dome = useTransform(enter, [0, 1], [1, 0])
  const tilt = useTransform(pass, [0.15, 0.85], [5, 1])
  const lift = useTransform(pass, [0.15, 0.85], [48, -24])
  const sink = useTransform(leave, [0, 1], [0, 150])
  if (!winner) return null
  const next = runnerUp && runnerUp.v.id !== winner.v.id ? runnerUp : null

  const facts: Fact[] = [{ figure: String(winner.n), label: unitWord(winner.n) }]
  if (winner.m.spend > 0) facts.push({ figure: `₱${Math.round(winner.m.spend)}`, label: "spent" })
  const second = next ? `${next.v.audienceName} came second with ${next.n} ${unitWord(next.n)}.` : null

  return (
    <div ref={ref} className="pw hh-field hh-field-sili hh-grain">
      <motion.svg aria-hidden className="pw-dome" viewBox="0 0 100 100" preserveAspectRatio="none" style={moving ? { scaleY: dome } : undefined}>
        <path d="M0 0H100V100A50 100 0 0 0 0 100Z" />
      </motion.svg>
      <motion.div className="pw-in" style={moving ? { y: sink } : undefined}>
        <div className="pw-words" data-rise>
          <p className="pw-kicker pw-rise">Most messages came from</p>
          <h3 className="pw-name hh-display pw-rise" style={{ "--rd": "0.06s" } as CSSProperties}>
            {winner.v.audienceName}
          </h3>
        </div>
        <div className="pw-stage pw-rise" data-rise style={{ "--rd": "0.12s" } as CSSProperties}>
          <motion.div style={moving ? { rotate: tilt, y: lift } : { rotate: 3 }}>
            <button type="button" className="pw-post" aria-label={`Open the post for ${lowerFirst(winner.v.audienceName)}`} onClick={() => onOpen(winner.v.id)}>
              <HomePost version={winner.v} boosted />
            </button>
          </motion.div>
        </div>
        {/* Each group rises as it comes into view; the facts sit well below the name. */}
        <div className="pw-facts" data-rise>
          <ul>
            {facts.map((f, i) => (
              <li key={f.label} className="pw-fact pw-rise" style={{ "--rd": `${i * 0.09}s` } as CSSProperties}>
                <b>{f.figure}</b>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
          {second ? (
            <p className="pw-second pw-rise" style={{ "--rd": "0.2s" } as CSSProperties}>
              {second}
            </p>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
