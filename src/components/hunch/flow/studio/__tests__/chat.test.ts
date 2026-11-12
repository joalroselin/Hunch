import { describe, expect, it } from "vitest"

import { sampleRunFor } from "@/lib/hunch/engine/sample/run"
import { studioFromRun, studioReduce, emptyStudio } from "@/lib/hunch/studio"

import { buildChat, landed, typingNow } from "../chat"
import { deriveView } from "../derive"

describe("Studio chat", () => {
  const run = sampleRunFor({})
  const studio = studioFromRun(run)
  const view = deriveView(studio)
  const chat = buildChat(studio, view, run.product.description)

  it("opens with the seller's line, then one message of 20 names", () => {
    expect(chat[0]).toMatchObject({ kind: "ask", text: run.product.description })
    const names = chat.filter((m) => m.kind === "names")
    expect(names).toHaveLength(1)
    expect(names[0].kind === "names" && names[0].names).toHaveLength(20)
  })

  it("gives the Skeptic one line per cut", () => {
    const cuts = chat.filter((m) => m.kind === "cut")
    expect(cuts).toHaveLength(12)
    expect(cuts[0]).toMatchObject({ name: "Candle lovers", reason: "Too broad, it fits anyone." })
  })

  it("sends the bad draft back with its quote and answers with the fix", () => {
    const a1 = chat.filter((m) => "code" in m && m.code === "A1")
    expect(a1.map((m) => m.kind)).toEqual(["draft", "back", "draft"])
    expect(a1[0]).toMatchObject({ fate: "back", quote: "Hey gays!" })
    expect(a1[1]).toMatchObject({ quote: "Hey gays!" })
    expect(a1[2]).toMatchObject({ fate: "ok", say: expect.stringMatching(/^Rewrote it .*no labels\.$/) })
  })

  it("lands all 8 posts and stops typing when the run is ready", () => {
    expect(landed(studio.events)).toHaveLength(8)
    expect(typingNow(view, true)).toEqual([])
  })

  it("shows who is writing while the run is going", () => {
    let s = emptyStudio(0)
    expect(typingNow(deriveView(s), true)).toEqual(["strategist"])
    for (const e of (run.events ?? []).slice(0, 25)) s = studioReduce(s, { type: "event", event: e })
    expect(typingNow(deriveView(s), true)).toEqual(["skeptic"])
    expect(typingNow(deriveView(s), false)).toEqual([])
  })
})
