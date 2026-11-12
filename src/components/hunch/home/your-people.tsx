"use client"

import { usePostSheet } from "./post-sheet"
import { Results } from "./proof/results"
import { Winner } from "./proof/winner"
import "./proof/base.css"
import "./proof/results.css"
import "./proof/winner.css"

/** The proof: the 8 posts ranked by messages, then the buyers who won. */
export function YourPeople() {
  const sheet = usePostSheet()
  const onOpen = (id: string) => sheet.open(id)
  return (
    <section id="your-people" aria-labelledby="your-people-title">
      <Results onOpen={onOpen} />
      <Winner onOpen={onOpen} />
    </section>
  )
}
