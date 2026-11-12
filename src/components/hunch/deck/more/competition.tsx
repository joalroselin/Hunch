"use client"

import type { CSSProperties } from "react"

import { MARK_PATH } from "@/components/hunch/home/mark"

import type { SlideProps } from "../types"
import { Shell, Src, at, useOn } from "./parts"
import "./competition.css"

// Where each option sits is our judgment from its own site. x: makes posts (0) to finds who buys (1). y: generic (0) to made for Filipino sellers (1).
const TOOLS: { name: string; price: string; x: number; y: number }[] = [
  { name: "Freelancers", price: "₱10,000 to ₱40,000", x: 0.09, y: 0.83 },
  { name: "Agencies", price: "₱25,000 to ₱75,000", x: 0.2, y: 0.64 },
  { name: "Canva", price: "₱299", x: 0.07, y: 0.31 },
  { name: "ChatGPT", price: "₱300 to ₱1,100", x: 0.27, y: 0.35 },
  { name: "Buffer", price: "Free to ₱320", x: 0.12, y: 0.17 },
  { name: "Later", price: "₱1,190", x: 0.33, y: 0.2 },
  { name: "Predis.ai", price: "₱1,210", x: 0.06, y: 0.05 },
  { name: "AdCreative.ai", price: "₱2,480", x: 0.25, y: 0.03 },
  { name: "Boost and guess", price: "Only the ad money", x: 0.55, y: 0.31 },
  { name: "Meta’s ad tools", price: "Free", x: 0.58, y: 0.13 },
  { name: "InstaAgent", price: "For consumer brands, US", x: 0.73, y: 0.04 },
]

/** Competition: a 2x2 drawn by hand. Everyone else makes posts or reaches viewers; Hunch alone finds Filipino buyers. */
export function Competition({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Competition" className="cp">
      <div className="cp-words">
        <h2 className="mo-h cp-h" data-in>
          Most tools only make posts.
        </h2>
        <p className="mo-line" data-in style={at(0.08)}>
          Hunch finds who buys, in Taglish.
        </p>
      </div>

      <div className="cp-map">
        <span aria-hidden className="cp-axis cp-axis-x" />
        <span aria-hidden className="cp-axis cp-axis-y" />
        <p className="cp-end cp-left" data-in style={at(0.35)}>
          Makes posts
        </p>
        <p className="cp-end cp-right" data-in style={at(0.4)}>
          Finds who buys
        </p>
        <p className="cp-end cp-top" data-in style={at(0.45)}>
          Made for Filipino sellers
        </p>
        <p className="cp-end cp-bottom" data-in style={at(0.5)}>
          Generic
        </p>

        <ul className="cp-tools">
          {TOOLS.map((t, i) => (
            <li
              key={t.name}
              className="cp-tool"
              data-in
              style={at(0.55 + i * 0.05, { "--x": t.x, "--y": t.y } as CSSProperties)}
            >
              <b>{t.name}</b>
              <span>{t.price}</span>
            </li>
          ))}
        </ul>

        <div className="cp-us">
          <div aria-hidden className="cp-mark">
            <svg viewBox="0 0 100 100">
              <path d={MARK_PATH} pathLength={1} />
            </svg>
            <span className="cp-fill hh-drop hh-grain" />
          </div>
          <p className="cp-us-say" data-in style={at(1.75)}>
            <b>Hunch</b>
            <span>Free first test, then ₱299</span>
          </p>
        </div>
      </div>

      <Src d={1.2}>Monthly prices from each company’s site and PH tech press, Nov 2026. US$ at ₱63.5. Canva is its 2024 PH launch price. Hunch’s price is our plan to test.</Src>
    </Shell>
  )
}
