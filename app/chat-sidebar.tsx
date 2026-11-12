"use client";

import { useEffect, useRef, useState } from "react";
import { demoReply, platformPrompt, roleActivity, scenarios, type ChatMessage } from "../lib/demo-chat";

export default function ChatSidebar({ open, view, onClose, onUseDraft, onDemoImport }: {
  open: boolean;
  view: string;
  onClose: () => void;
  onUseDraft: (draft: string, channel?: string) => void;
  onDemoImport: (platform: string | null) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [sequence, setSequence] = useState<string[]>([]);
  const thread = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const wasOpen = useRef(open);
  const followThread = useRef(true);
  const importStep = useRef(onDemoImport);

  useEffect(() => { importStep.current = onDemoImport; }, [onDemoImport]);

  useEffect(() => {
    if (!pending.length) return;
    const message = pending[0];
    const words = message.text.split(" ");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let revealed = 0;
    let interval: number | undefined;
    let finishTimer: number | undefined;
    const finish = () => {
      if (message.platform) importStep.current(message.platform);
      setMessages(current => [...current, message]);
      setStreamingText("");
      setPending(current => current.slice(1));
    };
    const timer = window.setTimeout(() => {
      if (reducedMotion) { finish(); return; }
      interval = window.setInterval(() => {
        revealed += 3;
        setStreamingText(words.slice(0, revealed).join(" "));
        if (revealed >= words.length) {
          window.clearInterval(interval);
          finishTimer = window.setTimeout(finish, 350);
        }
      }, 45);
    }, reducedMotion ? 150 : 750);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); window.clearTimeout(finishTimer); };
  }, [pending]);

  useEffect(() => {
    if (thread.current && followThread.current) thread.current.scrollTop = thread.current.scrollHeight;
  }, [messages, pending, streamingText, open]);

  useEffect(() => {
    if (open && !wasOpen.current) input.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const send = (text: string) => {
    if (!text.trim() || pending.length) return;
    const reply = demoReply(text.trim(), view);
    if (reply.some(message => message.platform)) onDemoImport(null);
    followThread.current = true;
    setMessages(current => [...current, { role: "You", text: text.trim() }]);
    setQuestion("");
    setSequence(reply.map(message => message.role));
    setPending(reply);
  };

  return <aside id="hunch-chat" className="chat-panel" aria-labelledby="chat-title" hidden={!open} onKeyDown={event => {
    if (event.key === "Escape") {
      onClose();
      document.querySelector<HTMLButtonElement>(".chat-toggle")?.focus();
    }
  }}>
    <header className="chat-header">
      <div className="chat-heading"><span className="brand-mark" aria-hidden="true" /><div><h2 id="chat-title">Ask Hunch</h2><small>A little help with your next move</small></div></div>
      <button className="back chat-close" onClick={() => { onClose(); document.querySelector<HTMLButtonElement>(".chat-toggle")?.focus(); }} aria-label="Close Hunch chat">×</button>
    </header>
    <div className="chat-context"><span>Alongside {view}</span><span className="chat-demo-label">Scripted demo</span></div>
    {!!sequence.length && <div className={"chat-run" + (pending.length ? " is-running" : "")}>
      <div className="chat-run-title" role="status"><span className="brand-mark" aria-hidden="true" /><div><strong>{pending.length ? roleActivity[pending[0].role] : "Ready for your next move"}</strong><small>{pending.length ? `Step ${sequence.length - pending.length + 1} of ${sequence.length} · Demo playback` : "Review the draft below"}</small></div></div>
      <div className="chat-run-track" aria-label="Demo steps">{sequence.map((role, index) => <span key={index} title={role} className={index < sequence.length - pending.length ? "step-done" : index === sequence.length - pending.length ? "step-active" : ""} />)}</div>
    </div>}
    <div className="chat-thread" ref={thread} role="log" aria-label="Hunch conversation" aria-live="polite" aria-relevant="additions" onScroll={event => { const element = event.currentTarget; followThread.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }}>
      {!messages.length && <div className="chat-welcome"><span className="hero-label">Your creative second opinion</span><h3>What’s your<br />next move?</h3><p>Try an example and watch the team turn evidence into a draft, with a little healthy skepticism along the way.</p><small>Examples use fictional data, not your saved posts.</small></div>}
      {messages.map((message, index) => <article key={index} className={"chat-message" + (message.role === "You" ? " chat-message-user" : "")}>
        <span className="chat-role">{message.role}</span>
        <p>{message.text}</p>
        {message.draft && <button className="primary" onClick={() => { if (message.draft) onUseDraft(message.draft, message.channel); }}>Review and add to plan</button>}
      </article>)}
      {!!pending.length && <article className="chat-message chat-message-streaming" aria-hidden="true"><span className="chat-role">{pending[0].role}<span className="chat-writing-label">{streamingText ? "Writing" : "Working"}</span></span>{streamingText ? <p>{streamingText}<span className="chat-caret" /></p> : <div className="chat-thinking"><i /><i /><i /></div>}</article>}
    </div>
    <div className="chat-prompts" aria-label="Example questions"><button className="platform-demo-trigger" disabled={!!pending.length} onClick={() => send(platformPrompt)}>↻ Replay platform import → insights → draft</button>{!messages.length && scenarios.map(scenario => <button key={scenario.id} disabled={!!pending.length} onClick={() => send(scenario.name)}>{scenario.name}<span aria-hidden="true"> ↗</span></button>)}</div>
    <form className="chat-composer" onSubmit={event => { event.preventDefault(); send(question); }}>
      <label className="chat-input-label" htmlFor="chat-question">Message Hunch</label>
      <textarea ref={input} id="chat-question" rows={2} maxLength={2000} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask about your next post…" onKeyDown={event => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(question); }
      }} />
      <div className="chat-composer-footer"><small>Live AI isn’t connected yet.</small><button className="primary" type="submit" disabled={!question.trim() || !!pending.length}>Send</button></div>
    </form>
  </aside>;
}
