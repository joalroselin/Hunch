"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"

import { RunPost, type PostLook } from "../posts/run-post"
import { NAME_OF, TEAM, type ChatMsg, type Speaker } from "./chat"

// Each agent's mark: the drop in its own color, with one small sign for the job.
const GLYPH: Record<Speaker, React.ReactNode> = {
  strategist: (
    <g fill="currentColor" stroke="none">
      <circle cx="4.6" cy="10.4" r="1.5" />
      <circle cx="8" cy="5.6" r="1.5" />
      <circle cx="11.4" cy="10.4" r="1.5" />
    </g>
  ),
  skeptic: <path d="M4.6 11.4 11.4 4.6" />,
  copywriter: <path d="M4.4 6.1h7.2M4.4 9.9h4.4" />,
  reviewer: <circle cx="8" cy="8" r="3.1" />,
  analyst: <path d="M4.6 11.4V9.2M8 11.4V6.8M11.4 11.4V4.4" />,
  planner: (
    <g fill="currentColor" stroke="none">
      <circle cx="5.6" cy="5.6" r="1.4" />
      <circle cx="10.4" cy="5.6" r="1.4" />
      <circle cx="5.6" cy="10.4" r="1.4" />
      <circle cx="10.4" cy="10.4" r="1.4" />
    </g>
  ),
}

export function AgentMark({ agent, className }: { agent: Speaker; className?: string }) {
  return (
    <span aria-hidden data-agent={agent} className={className ? `hc-mark ${className}` : "hc-mark"}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {GLYPH[agent]}
      </svg>
    </span>
  )
}

/** The six on the team. The ones at work are full ink; the rest wait. */
export function Team({ active, typing }: { active: Set<string>; typing: Speaker[] }) {
  return (
    <ul className="hc-team" aria-label="The team">
      {TEAM.map((t, i) => {
        const on = active.has(t.id) || typing.includes(t.id)
        return (
          <li key={t.id} data-on={on ? "" : undefined} data-typing={typing.includes(t.id) ? "" : undefined} className="ha-rise" style={{ "--i": 4 + i } as React.CSSProperties}>
            <AgentMark agent={t.id} />
            {t.name}
          </li>
        )
      })}
    </ul>
  )
}

function Dots() {
  return (
    <span aria-hidden className="hc-dots">
      <i />
      <i />
      <i />
    </span>
  )
}

// The draft's words, with the part the Reviewer quoted crossed out.
function Quoted({ text, quote }: { text: string; quote?: string }) {
  const at = quote ? text.indexOf(quote) : -1
  if (!quote || at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <del>{quote}</del>
      {text.slice(at + quote.length)}
    </>
  )
}

export interface ThreadProps {
  msgs: ChatMsg[]
  typing: Speaker[]
  look: PostLook
  photo?: string | null
  // A transcript that is already over arrives in one calm stagger.
  settled: boolean
  stopped?: string | null
  retry?: { can: (code: string) => boolean; busy: string[]; run: (code: string) => void }
  endRef?: React.Ref<HTMLLIElement>
}

export function Thread({ msgs, typing, look, photo, settled, stopped, retry, endRef }: ThreadProps) {
  let prev: string | null = null
  return (
    <ol className="hc-thread" aria-label="Team chat" data-settled={settled ? "" : undefined}>
      {msgs.map((m, i) => {
        const who = m.kind === "ask" ? "you" : (m.agent ?? "hunch")
        const first = who !== prev
        prev = who
        const style = settled ? ({ "--i": Math.min(i, 16) } as React.CSSProperties) : undefined
        const head =
          first && m.kind !== "ask" && m.agent ? (
            <p className="hc-who">
              <AgentMark agent={m.agent} />
              {NAME_OF[m.agent]}
            </p>
          ) : null

        if (m.kind === "ask") {
          return (
            <li key={m.id} className="hc-msg hc-ask" style={style}>
              <span className="sr-only">You: </span>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Your product photo" className="hc-ask-photo" />
              ) : null}
              <p className="hc-bubble">{m.text}</p>
            </li>
          )
        }

        if (m.kind === "names") {
          return (
            <li key={m.id} className="hc-msg" data-first="" style={style}>
              {head}
              <p className="hc-bubble hc-names">
                {m.names.map((c) => (
                  <React.Fragment key={c.id}>
                    <span className="hc-name" data-fate={c.fate} title={c.fate === "cut" ? c.reason : undefined}>
                      <span>{c.label}.</span>
                    </span>{" "}
                  </React.Fragment>
                ))}
              </p>
            </li>
          )
        }

        if (m.kind === "cut") {
          return (
            <li key={m.id} className="hc-msg" data-first={first ? "" : undefined} style={style}>
              {head}
              <p className="hc-bubble">
                {m.name ? (
                  <>
                    <del className="hc-cut">{m.name}</del>{" "}
                  </>
                ) : null}
                {m.reason}
              </p>
            </li>
          )
        }

        if (m.kind === "draft") {
          return (
            <li key={m.id} className="hc-msg hc-draft" data-first={first ? "" : undefined} data-fate={m.fate} style={style}>
              {head}
              <div className="hc-row">
                <span className="hc-thumb" aria-hidden>
                  <RunPost look={look} version={{ id: m.id, code: m.code, hook: m.hook ?? "", caption: "", cta: "" }} bare />
                </span>
                <p className="hc-bubble">
                  <b className="hc-for">{m.label}</b>
                  {m.say ? <span className="hc-say">{m.say}</span> : null}
                  {m.hook ? (
                    <span className="hc-hook">
                      <Quoted text={m.hook} quote={m.fate === "back" ? m.quote : undefined} />
                    </span>
                  ) : null}
                  {m.fate === "ok" ? (
                    <span className="hc-ok">
                      <AgentMark agent="reviewer" />
                      <span className="sr-only">The Reviewer approved it.</span>
                    </span>
                  ) : null}
                </p>
              </div>
            </li>
          )
        }

        if (m.kind === "back") {
          return (
            <li key={m.id} className="hc-msg" data-first={first ? "" : undefined} style={style}>
              {head}
              <p className="hc-bubble">
                <span className="hc-reply">
                  <b className="hc-for">{m.label}</b>
                  {m.hook ? (
                    <span>
                      <Quoted text={m.hook} quote={m.quote} />
                    </span>
                  ) : null}
                </span>
                {m.reason}
              </p>
            </li>
          )
        }

        if (m.kind === "flag") {
          return (
            <li key={m.id} className="hc-msg" data-first={first ? "" : undefined} style={style}>
              {head}
              <p className="hc-bubble">
                <b className="hc-for">{m.label}</b>
                Check this one before you post. {m.reason}
              </p>
            </li>
          )
        }

        const open = !!m.code && !!retry?.can(m.code)
        const busy = !!m.code && !!retry?.busy.includes(m.code)
        return (
          <li key={m.id} className="hc-msg hc-fail" data-first={first ? "" : undefined} style={style}>
            {head}
            <p className="hc-bubble" role="alert">
              {m.text}
            </p>
            {open && m.code ? (
              <Button variant="secondary" size="sm" className="mt-2" disabled={busy} aria-busy={busy || undefined} onClick={() => retry?.run(m.code!)}>
                {busy ? "Writing it again" : "Try again"}
              </Button>
            ) : null}
          </li>
        )
      })}

      {stopped ? (
        <li className="hc-msg hc-fail" data-first="">
          <p className="hc-bubble" role="alert">
            {stopped}
          </p>
        </li>
      ) : null}

      <li ref={endRef} className="hc-typing" data-on={typing.length ? "" : undefined} aria-hidden={typing.length ? undefined : true}>
        {typing.length ? (
          <>
            <span className="hc-typers">
              {typing.map((t) => (
                <AgentMark key={t} agent={t} />
              ))}
            </span>
            <span className="hc-bubble">
              <Dots />
              <span className="sr-only">{typing.map((t) => NAME_OF[t]).join(" and ")} {typing.length > 1 ? "are" : "is"} writing</span>
            </span>
          </>
        ) : null}
      </li>
    </ol>
  )
}

const TILT = [-6, 4, -3, 7, -5, 3, -7, 5]
const DROP = [0, 9, -4, 11, 2, -6, 8, 1]
const SCALE = [1, 0.9, 0.96, 0.86, 1, 0.9, 0.95, 0.88]

/** The posts the Reviewer let through, landing one by one. */
export function Fan({ codes, look }: { codes: string[]; look: PostLook }) {
  if (!codes.length) return null
  return (
    <div className="hc-fan">
      <span className="sr-only">
        {codes.length} of 8 posts ready
      </span>
      {codes.map((code, i) => (
        <span
          key={code}
          aria-hidden
          className="hc-fan-post"
          style={{ "--r": `${TILT[i % 8]}deg`, "--d": `${DROP[i % 8]}px`, "--s": SCALE[i % 8], zIndex: i } as React.CSSProperties}
        >
          <RunPost look={look} version={{ id: code, code, hook: "", caption: "", cta: "" }} bare />
        </span>
      ))}
    </div>
  )
}
