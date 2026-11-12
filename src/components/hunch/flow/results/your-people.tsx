"use client"

import * as React from "react"
import { useRef } from "react"

import { useReveal } from "@/components/hunch/home/proof/reveal"
import { BusyDots } from "@/components/hunch/screens/shared"
import { Bubble } from "@/components/hunch/shell"
import type { ResultsReport } from "@/lib/hunch/types"

/** Your people: who they are, what the test said, and what to post for them. */
export function YourPeople({ report, writing }: { report: ResultsReport; writing: boolean }) {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const v = report.verdict
  const icp = report.icp
  // The warnings that fired; with none, the one caveat unless the result is a sure one.
  const caveats = v.caveats.length ? v.caveats : v.confidence === "high" || !icp.caveat ? [] : [icp.caveat]
  const lists = [
    { title: "What worked", items: icp.whatWorked },
    { title: "Post next", items: icp.whatToPostNext },
  ].filter((l) => l.items.length)

  return (
    <section ref={ref} className="hr-people" aria-labelledby="people-title">
      <div className="hr-people-who" data-rise>
        <h2 id="people-title" className="hh-title hr-h2 hr-rise">
          Meet your people.
        </h2>
        <p className="hh-line hr-who hr-rise" style={{ "--rd": "0.08s" } as React.CSSProperties}>
          {icp.who}
        </p>
        <div className="hr-thread" aria-live="polite">
          {writing ? (
            <Bubble className="hr-rise" style={{ "--rd": "0.2s" } as React.CSSProperties}>
              <span className="sr-only">Writing</span>
              <BusyDots />
            </Bubble>
          ) : (
            <Bubble className="hr-rise" style={{ "--rd": "0.2s" } as React.CSSProperties}>
              {v.explanation}
            </Bubble>
          )}
          {caveats.map((c, i) => (
            <Bubble key={c} className="hr-rise" style={{ "--rd": `${0.3 + i * 0.1}s` } as React.CSSProperties}>
              {c}
            </Bubble>
          ))}
        </div>
      </div>
      <div className="hr-people-lists" data-rise>
        {lists.map((l, k) => (
          <div key={l.title} className="hr-rise" style={{ "--rd": `${0.1 + k * 0.1}s` } as React.CSSProperties}>
            <h3 className="hh-title hr-h3">{l.title}</h3>
            <ul>
              {l.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
