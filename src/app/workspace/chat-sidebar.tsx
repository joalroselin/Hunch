"use client";

import { useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/demo-workspace";
import { demoReply, importPrompt, platformPrompt, scenarios, type ChatDraft, type ChatMessage } from "@/lib/demo-chat";

export default function ChatSidebar({ open, onClose, onUseDraft, onDemoImport, posts, onPlanDraft, onViewEvidence }: {
  open: boolean;
  posts: Post[];
  onPlanDraft: (draft: ChatDraft, date: string) => string;
  onViewEvidence: (id: string) => void;
  view: string;
  onClose: () => void;
  onUseDraft: (draft: string, channel?: string) => void;
  onDemoImport: (platform: string | null) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [draft, setDraft] = useState<ChatDraft>();
  const thread = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const wasOpen = useRef(open);
  const followThread = useRef(true);
  const importStep = useRef(onDemoImport);
  const planStep = useRef(onPlanDraft);

  useEffect(() => { importStep.current = onDemoImport; planStep.current = onPlanDraft; }, [onDemoImport, onPlanDraft]);

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
      if (message.draft) {
        const postId = message.planDate ? planStep.current(message.draft, message.planDate) : message.draft.postId;
        setDraft({ ...message.draft, postId });
      }
      if (!message.platform) setMessages(current => [...current, message]);
      setStreamingText("");
      setPending(current => current.slice(1));
    };
    const timer = window.setTimeout(() => {
      if (message.platform || reducedMotion) { finish(); return; }
      interval = window.setInterval(() => {
        revealed += 3;
        setStreamingText(words.slice(0, revealed).join(" "));
        if (revealed >= words.length) {
          window.clearInterval(interval);
          finishTimer = window.setTimeout(finish, 350);
        }
      }, 45);
    }, reducedMotion ? 150 : message.platform ? 1000 : 500);
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

  const send = (text: string, currentDraft = draft) => {
    if (!text.trim() || pending.length) return;
    const reply = demoReply(text.trim(), posts, currentDraft);
    if (reply.some(message => message.platform)) onDemoImport(null);
    followThread.current = true;
    setMessages(current => [...current, { role: "You", text: text.trim() }]);
    setQuestion("");
    setPending(reply);
  };


  return <aside id="hunch-chat" className="chat-panel" aria-labelledby="chat-title" hidden={!open} onKeyDown={event => { if (event.key === "Escape") close(); }}>
    <header className="chat-header">
      <div className="chat-heading"><span className="brand-mark" aria-hidden="true" /><div><h2 id="chat-title">Ask Hunch</h2><small>See what to post next</small></div></div>
      <button className="back chat-close" onClick={close} aria-label="Close chat">
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      </button>
    </header>
    <div className="chat-thread" ref={thread} role="log" aria-label="Chat with Hunch" aria-live="polite" aria-relevant="additions" onScroll={event => { const element = event.currentTarget; followThread.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }}>
      {!messages.length && <div className="chat-welcome"><h3>How did your<br />posts do?</h3><p>{"Review the results, shape a caption, and put it on a day."}</p></div>}
      {messages.map((message, index) => <article key={index} className={"chat-message" + (message.role === "You" ? " chat-message-user" : "")}>
        <span className="chat-role">{message.role}</span>
        <p>{message.text}</p>
        {message.evidence && <button className="chat-evidence" onClick={() => { if (message.evidence) onViewEvidence(message.evidence.postId); }}>{message.evidence.label} ↗</button>}
        {message.draft && !message.planDate && <div className="chat-draft"><p>{message.draft.text}</p><small>{message.draft.channel} · {message.draft.language}</small><button className="primary" disabled={!!pending.length} onClick={() => { if (message.draft) send("Plan this for Friday", message.draft); }}>Plan for Friday</button><button className="back" onClick={() => { if (message.draft) onUseDraft(message.draft.text, message.draft.channel); }}>Edit caption</button></div>}
      </article>)}
      {!!pending.length && (pending[0].platform ? <div className="chat-working" role="status">{pending[0].text}</div> : <><span className="ws-sr" role="status">Writing a reply</span><article className="chat-message chat-message-streaming" aria-hidden="true"><span className="chat-role">Hunch</span>{streamingText ? <p>{streamingText}<span className="chat-caret" /></p> : <div className="chat-thinking"><i /><i /><i /></div>}</article></>)}
    </div>
    <div className="chat-prompts" role="group" aria-label="Questions to try">{(draft ? ["Make it more Taglish", "Make it shorter", "Plan this for Friday"] : [platformPrompt, ...scenarios.map(scenario => scenario.name)]).map(prompt => <button key={prompt} disabled={!!pending.length} onClick={() => send(prompt)}>{prompt}</button>)}{!messages.length && <button disabled={!!pending.length} onClick={() => send(importPrompt)}>{importPrompt}</button>}</div>
    <form className="chat-composer" onSubmit={event => { event.preventDefault(); send(question); }}>
      <label className="chat-input-label" htmlFor="chat-question">Your question</label>
      <textarea ref={input} id="chat-question" rows={2} maxLength={2000} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Type a question" onKeyDown={event => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(question); }
      }} />
      <div className="chat-composer-footer"><small>{"Prepared replies · Uses this workspace."}</small><button className="primary" type="submit" disabled={!question.trim() || !!pending.length}>Send</button></div>
    </form>
  </aside>;
}
