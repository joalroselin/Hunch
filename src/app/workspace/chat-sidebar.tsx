"use client";

import { useEffect, useRef, useState } from "react";
import { demoReply, platformPrompt, roleActivity, scenarios, type ChatMessage } from "@/lib/demo-chat";

export default function ChatSidebar({ open, onClose, onUseDraft, onDemoImport }: {
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
  const [showRun, setShowRun] = useState(false);
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

  const close = () => {
    onClose();
    document.querySelector<HTMLButtonElement>(".chat-toggle")?.focus();
  };

  const send = (text: string) => {
    if (!text.trim() || pending.length) return;
    const reply = demoReply(text.trim());
    if (reply.some(message => message.platform)) onDemoImport(null);
    followThread.current = true;
    setMessages(current => [...current, { role: "You", text: text.trim() }]);
    setQuestion("");
    setShowRun(reply.length > 1);
    setPending(reply);
  };

  const unasked = scenarios.filter(scenario => !messages.some(message => message.role === "You" && message.text === scenario.name));

  return <aside id="hunch-chat" className="chat-panel" aria-labelledby="chat-title" hidden={!open} onKeyDown={event => { if (event.key === "Escape") close(); }}>
    <header className="chat-header">
      <div className="chat-heading"><span className="brand-mark" aria-hidden="true" /><div><h2 id="chat-title">Ask Hunch</h2><small>See what to post next</small></div></div>
      <button className="back chat-close" onClick={close} aria-label="Close chat">
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      </button>
    </header>
    {showRun && <div className={"chat-run" + (pending.length ? " is-running" : "")}>
      <div className="chat-run-title" role="status"><span className="brand-mark" aria-hidden="true" /><div><strong>{pending.length ? roleActivity[pending[0].role] : "Your post is ready"}</strong></div></div>
    </div>}
    <div className="chat-thread" ref={thread} role="log" aria-label="Chat with Hunch" aria-live="polite" aria-relevant="additions" onScroll={event => { const element = event.currentTarget; followThread.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }}>
      {!messages.length && <div className="chat-welcome"><h3>How did your<br />posts do?</h3><p>{"Tap a question to see Elle's sample."}</p></div>}
      {messages.map((message, index) => <article key={index} className={"chat-message" + (message.role === "You" ? " chat-message-user" : "")}>
        <span className="chat-role">{message.role}</span>
        <p>{message.text}</p>
        {message.draft && <button className="primary" onClick={() => { if (message.draft) onUseDraft(message.draft, message.channel); }}>Plan this post</button>}
      </article>)}
      {!!pending.length && <article className="chat-message chat-message-streaming" aria-hidden="true"><span className="chat-role">{pending[0].role}</span>{streamingText ? <p>{streamingText}<span className="chat-caret" /></p> : <div className="chat-thinking"><i /><i /><i /></div>}</article>}
    </div>
    <div className="chat-prompts" role="group" aria-label="Questions to try"><button className="platform-demo-trigger" disabled={!!pending.length} onClick={() => send(platformPrompt)}>{platformPrompt}</button>{unasked.map(scenario => <button key={scenario.id} disabled={!!pending.length} onClick={() => send(scenario.name)}>{scenario.name}</button>)}</div>
    <form className="chat-composer" onSubmit={event => { event.preventDefault(); send(question); }}>
      <label className="chat-input-label" htmlFor="chat-question">Your question</label>
      <textarea ref={input} id="chat-question" rows={2} maxLength={2000} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Type a question" onKeyDown={event => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(question); }
      }} />
      <div className="chat-composer-footer"><small>{"Answers use Elle's sample for now."}</small><button className="primary" type="submit" disabled={!question.trim() || !!pending.length}>Send</button></div>
    </form>
  </aside>;
}
