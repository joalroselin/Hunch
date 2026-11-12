"use client"

import { run } from "@/components/hunch/home/data"
import { HomePost } from "@/components/hunch/home/ugc-post"

import type { SlideProps } from "../types"
import { Pesos, Shell, Src, at, useOn } from "./parts"
import "./pricing.css"

// Our plan to test in the pilot, not a price list yet.
const PLANS = [
  { price: "0", name: "First test", gets: "8 posts, the results, next week’s 7" },
  { price: "299", name: "Seller", gets: "2 tests a month" },
  { price: "699", name: "Growing", gets: "6 tests a month" },
]

const posts = [...run.versions].sort((a, b) => a.code.localeCompare(b.code))

/** Pricing: three prices growing in size. The ad money is the seller's own, paid to Meta. */
export function Pricing({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Pricing" className="pc">
      <div className="pc-words">
        <h2 className="mo-h pc-h" data-in>
          First test free, then ₱299.
        </h2>
        <p className="mo-line" data-in style={at(0.08)}>
          Sellers pay Meta for their own ads.
        </p>
      </div>

      <ul aria-label="Ad money: ₱99 a post, paid to Meta" className="pc-ads">
        {posts.map((v, i) => (
          <li key={v.id} className="pc-ad" data-in style={at(0.25 + i * 0.04)}>
            <HomePost version={v} bare className="pc-post" />
            <b>₱99</b>
          </li>
        ))}
      </ul>

      <ol className="pc-plans">
        {PLANS.map((p, i) => (
          <li key={p.name} className={`pc-plan pc-plan-${i}`} data-in style={at(0.3 + i * 0.14)}>
            <Pesos n={p.price} className="mo-num pc-price" />
            <p className="pc-name">{p.name}</p>
            <p className="pc-gets">{p.gets}</p>
          </li>
        ))}
      </ol>

      <Src d={0.8}>Prices are our plan to test in the pilot. Ad money is separate and never ours.</Src>
    </Shell>
  )
}
