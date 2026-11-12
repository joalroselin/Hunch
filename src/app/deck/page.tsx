import type { Metadata } from "next"

import { Deck } from "@/components/hunch/deck/deck"

export const metadata: Metadata = {
  title: "Hunch",
  robots: { index: false },
}

export default function DeckPage() {
  return <Deck />
}
