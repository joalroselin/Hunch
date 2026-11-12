"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, MotionConfig, animate, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { focus, metricsByVersion, photoUrlOf, run } from "@/components/hunch/home/data";
import { cachedPost, postKey, postFilename, saveBlob, usePostRenderer } from "@/components/hunch/post";
import { canShareFiles, handOff } from "@/components/hunch/flow/shared/share";
import { HunchMark } from "@/components/hunch/home/mark";
import { runnerUp, spendEach, winner } from "@/components/hunch/home/proof/data";
import { HomePost, UgcPost } from "@/components/hunch/home/ugc-post";
import { manilaToday, type ChatDraft } from "@/lib/demo-chat";
import { mergeDemoPlatform, publishedPost, refreshSamples, resetSamplePosts, sampleWorkspacePosts, type Post } from "@/lib/demo-workspace";
import { captionText, normalizeLanguage } from "@/lib/hunch/language";
import type { Version } from "@/lib/hunch/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import ChatSidebar from "./chat-sidebar";
import { BuildDescription } from "./build";

// photo and audience are display only; they never go to Supabase.
type WPost = Post & { photo?: string; audience?: string; code?: string };
type Row = { id: string; caption: string; channel: string; post_date: string | null; status: Post["status"]; reach: number | null; engagements: number | null; is_sample: boolean };
type View = "Week" | "Posts" | "Results" | "Build";
type Crop = { zoom: number; at: string };
type Copy = { hook: string; caption: string; cta?: string };
type Toast = { id: number; text: string; action?: { label: string; run: () => void } };

const views: View[] = ["Week", "Posts", "Results", "Build"];
const channels = ["Facebook", "Instagram", "TikTok"];
const storeKey = "hunch.creator.posts.v2";
const oldStoreKey = "hunch.creator.posts.v1";
const ease = [0.16, 1, 0.3, 1] as const;

const handle = run.product.name.toLowerCase().replace(/[^a-z0-9]/g, "");
const avatar = photoUrlOf(run.versions[5] ?? run.versions[0]);
// A photo used again is framed differently, as on the Next week screen.
const CROPS: Crop[] = [
  { zoom: 1.5, at: "70% 78%" },
  { zoom: 1.9, at: "22% 34%" },
  { zoom: 1.35, at: "86% 20%" },
  { zoom: 2.1, at: "60% 92%" },
  { zoom: 1.6, at: "10% 70%" },
  { zoom: 1.75, at: "40% 60%" },
];
const TILTS = [3, -2, 2.5, -3, 2, -2.5, 3.5, -1.5];
const LIFTS = [16, 0, 24, 4, 20, 0, 12, 6];

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayIso = () => manilaToday();
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoOf(d);
};
const dateOf = (iso: string) => new Date(`${iso}T12:00:00`);
const dayLabel = (iso: string) => (iso ? dateOf(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "No day yet");
const shortDay = (iso: string) => (iso ? `${dateOf(iso).toLocaleDateString("en-US", { weekday: "short" })} ${dateOf(iso).getDate()}` : "No day");
const byDate = (a: WPost, b: WPost) => (a.date || "9999").localeCompare(b.date || "9999");
// Lowers the first letter for use mid-sentence, but keeps names like "Salcedo Saturday".
const lowerFirst = (s: string) => {
  const [first = "", second = ""] = s.split(" ");
  return /^[A-Z]{2}/.test(first) || /^[A-Z]/.test(second) ? s : s.charAt(0).toLowerCase() + s.slice(1);
};
const firstLine = (s: string) => s.split("\n").map(l => l.trim()).find(Boolean) ?? "";
const cut = (s: string, max: number) => {
  if (s.length <= max) return s;
  const space = s.lastIndexOf(" ", max - 1);
  return `${s.slice(0, space > max * 0.6 ? space : max - 1).trimEnd()}…`;
};
const count = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const parseCount = (s: string) => {
  const n = Number(s.replace(/[,\s]/g, ""));
  return s.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};
const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
};

// Elle's posts are found by their words, so a frame gets the real on-video text and photo.
const known: Version[] = [...run.versions, ...focus.posts, ...focus.tests];
const language = normalizeLanguage(run.product.language);
const byCode = new Map(known.map(v => [v.code, v]));
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const matches = new Map<string, { v: Version; copy: Copy } | null>();
function knownFor(text: string) {
  const t = norm(text);
  const hit = matches.get(t);
  if (hit !== undefined) return hit;
  let best: { v: Version; copy: Copy } | null = null;
  let size = 0;
  for (const v of known) {
    const more = (v as { copy?: Partial<Record<"english" | "tagalog", Copy>> }).copy;
    for (const copy of [{ hook: v.hook, caption: v.caption, cta: v.cta }, more?.english, more?.tagalog]) {
      if (!copy) continue;
      for (const s of [copy.hook, firstLine(copy.caption)]) {
        const n = norm(s);
        if (n.length >= 12 && n.length > size && t.includes(n)) {
          best = { v, copy };
          size = n.length;
        }
      }
    }
  }
  if (matches.size > 400) matches.clear();
  matches.set(t, best);
  return best;
}

function frameOf(p: Pick<WPost, "id" | "text" | "photo" | "code">) {
  const k = knownFor(p.text);
  const v = (p.code ? byCode.get(p.code) : undefined) ?? k?.v;
  const lines = p.text.split("\n").map(l => l.trim()).filter(Boolean);
  const m = v ? metricsByVersion.get(v.id) : undefined;
  return {
    version: {
      id: p.id,
      code: v?.code ?? `N${(hash(p.id) % 8) + 1}`,
      hook: k?.copy.hook ?? cut(lines[0] ?? "", 72),
      caption: k?.copy.caption ?? (lines.slice(1).join(" ") || lines[0] || ""),
      cta: k?.copy.cta ?? "Message us",
    },
    photo: p.photo ?? (v ? photoUrlOf(v) : undefined),
    stats: m ? { likes: m.reactions ?? 0, comments: m.comments ?? 0, saves: m.saves ?? 0, shares: m.shares ?? 0 } : undefined,
  };
}
const titleOf = (p: WPost) => p.audience || (p.code ? byCode.get(p.code)?.audienceName : undefined) || knownFor(p.text)?.v.audienceName || cut(firstLine(p.text), 48) || "New post";

// Repeats of one photo in a row get a different crop each time.
function cropsFor(list: WPost[]) {
  const seen = new Map<string, number>();
  return list.map(p => {
    const key = frameOf(p).photo ?? "";
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    return key && n > 0 ? CROPS[(n - 1) % CROPS.length] : undefined;
  });
}

/** A post as it looks on a phone. Only a post marked to play shows its clip. */
function Frame({ post, crop, play, bare }: { post: Pick<WPost, "id" | "text" | "photo" | "code">; crop?: Crop; play?: boolean; bare?: boolean }) {
  const f = frameOf(post);
  return (
    <span className="ws-frame" data-play={play ? "" : undefined} style={crop ? ({ "--zoom": crop.zoom, "--at": crop.at } as CSSProperties) : undefined}>
      <UgcPost version={f.version} photo={f.photo} avatar={avatar} handle={handle} stats={f.stats} bare={bare || !f.version.hook} />
    </span>
  );
}

/** A number that counts up to its value. */
function Count({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const controls = animate(start, value, {
      duration: Math.min(1.2, 0.35 + Math.abs(value - start) * 0.06),
      ease,
      onUpdate: v => {
        from.current = v;
        setShown(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value, reduce]);
  return (
    <>
      <span aria-hidden="true">{shown.toLocaleString("en-US")}</span>
      <span className="ws-sr">{value.toLocaleString("en-US")}</span>
    </>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="ws-empty ws-rise" style={{ "--i": 2 } as CSSProperties}>{children}</div>;
}

export function Workspace({ initialView = "Week" }: { initialView?: View } = {}) {
  const [view, setView] = useState<View>(initialView);
  const [posts, setPosts] = useState<WPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageMode, setStorageMode] = useState<"connecting" | "local" | "cloud" | "error">("connecting");
  const [storageMessage, setStorageMessage] = useState("");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [today, setToday] = useState("");
  const [phone, setPhone] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [channel, setChannel] = useState(channels[0]);
  const [date, setDate] = useState("");
  const [formNote, setFormNote] = useState("");
  const [metricPost, setMetricPost] = useState<WPost | null>(null);
  const [reach, setReach] = useState("");
  const [engagements, setEngagements] = useState("");
  const [chatSession, setChatSession] = useState(0);
  const [canShare, setCanShare] = useState(false);
  const [savingPost, setSavingPost] = useState<string | null>(null);
  const { render, canvas } = usePostRenderer();
  const [chatOpen, setChatOpen] = useState(false);
  const [demoImporting, setDemoImporting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const importTimer = useRef<number | undefined>(undefined);
  const askDock = useRef<HTMLButtonElement>(null);
  const askBar = useRef<HTMLButtonElement>(null);

  const say = useCallback((text: string, action?: Toast["action"]) => setToast({ id: Date.now(), text, action }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toast.action ? 5600 : 3000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Phones start with the chat closed; wide screens keep it open beside the week.
  useEffect(() => {
    setToday(todayIso());
    setCanShare(canShareFiles());
    const small = window.matchMedia("(max-width: 700px)");
    const sync = () => setPhone(small.matches);
    sync();
    small.addEventListener("change", sync);
    if (initialView !== "Build" && window.matchMedia("(min-width: 1280px)").matches) setChatOpen(true);
    return () => small.removeEventListener("change", sync);
  }, [initialView]);

  const go = (next: View) => {
    setView(next);
    if (next === "Build") setChatOpen(false);
    window.scrollTo({ top: 0 });
  };

  const importDemoPlatform = (platform: string | null) => {
    window.clearTimeout(importTimer.current);
    if (platform === null) {
      go("Results");
      setDemoImporting(true);
    }
    // The replay ends after the last channel, or on its own if one never arrives.
    if (platform === "Facebook") setDemoImporting(false);
    else importTimer.current = window.setTimeout(() => setDemoImporting(false), 9000);
    setPosts(current => mergeDemoPlatform(current, platform) as WPost[]);
  };
  useEffect(() => () => window.clearTimeout(importTimer.current), []);

  const hasSamples = posts.some(post => post.sample);
  const addSampleData = () => {
    setPosts(current => (current.some(post => post.sample) ? current : [...(sampleWorkspacePosts() as WPost[]), ...current]));
    say("Sample posts are back.");
  };
  const resetDemo = () => {
    const before = posts;
    window.clearTimeout(importTimer.current);
    setDemoImporting(false);
    setPosts(current => resetSamplePosts(current));
    setSelectedId(null);
    setChatSession(session => session + 1);
    go("Week");
    say("Sample week reset. Your own posts were kept.", { label: "Undo", run: () => setPosts(before) });
  };
  const removeSampleData = () => {
    const before = posts;
    setPosts(current => current.filter(post => !post.sample));
    say("Sample posts removed.", { label: "Undo", run: () => setPosts(before) });
  };

  useEffect(() => {
    let cancelled = false;
    const read = (key: string): WPost[] | null => {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? null : (JSON.parse(raw) as WPost[]);
      } catch {
        return null;
      }
    };
    const openWorkspace = async () => {
      const v2 = read(storeKey);
      const v1 = v2 === null ? read(oldStoreKey) : null;
      const hasLocalWorkspace = v2 !== null || v1 !== null;
      const localPosts = v2 ?? v1 ?? [];
      // Stored sample rows from older sample sets are dropped; a fresh workspace gets Elle's set.
      const settle = (stored: WPost[] | null): WPost[] => (stored ? (refreshSamples(stored) as WPost[]) : (sampleWorkspacePosts() as WPost[]));
      const finish = (list: WPost[], mode: "local" | "cloud" | "error", message = "") => {
        if (cancelled) return;
        setPosts(list);
        setStorageMode(mode);
        setStorageMessage(message);
        setLoaded(true);
        try { localStorage.removeItem(oldStoreKey); } catch {}
      };
      if (!supabase) {
        finish(settle(hasLocalWorkspace ? localPosts : null), "local");
        return;
      }
      try {
        const { data: current, error } = await supabase.auth.getSession();
        if (error) throw error;
        let session = current.session;
        if (!session) {
          const result = await supabase.auth.signInAnonymously();
          if (result.error) throw result.error;
          session = result.data.session;
        }
        const { data, error: readError } = await supabase.from("creator_posts").select("id,caption,channel,post_date,status,reach,engagements,is_sample").order("post_date", { ascending: true, nullsFirst: false });
        if (readError) throw readError;
        const cloudPosts: WPost[] = ((data ?? []) as Row[]).map(row => ({ id: row.id, text: row.caption, channel: row.channel, date: row.post_date ?? "", status: row.status, reach: row.reach ?? undefined, engagements: row.engagements ?? undefined, sample: row.is_sample }));
        finish(settle(cloudPosts.length ? cloudPosts : hasLocalWorkspace ? localPosts : null), "cloud");
      } catch (error) {
        finish(settle(hasLocalWorkspace ? localPosts : null), "error", error instanceof Error ? error.message : "Could not connect to cloud storage.");
      }
    };
    void openWorkspace();
    return () => { cancelled = true; };
  }, [supabase]);

  useEffect(() => {
    if (!loaded || demoImporting) return;
    try { localStorage.setItem(storeKey, JSON.stringify(posts)); } catch {}
    if (storageMode !== "cloud" || !supabase) return;
    const saveCloud = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (posts.length) {
        const rows = posts.map(post => ({ id: post.id, user_id: user.id, caption: post.text, channel: post.channel, post_date: post.date || null, status: post.status, reach: post.reach ?? null, engagements: post.engagements ?? null, is_sample: !!post.sample }));
        const { error } = await supabase.from("creator_posts").upsert(rows);
        if (error) { setStorageMode("error"); setStorageMessage(error.message); return; }
        const ids = posts.map(post => post.id);
        const { error: deleteError } = await supabase.from("creator_posts").delete().eq("user_id", user.id).not("id", "in", `(${ids.join(",")})`);
        if (deleteError) { setStorageMode("error"); setStorageMessage(deleteError.message); }
      } else {
        const { error } = await supabase.from("creator_posts").delete().eq("user_id", user.id);
        if (error) { setStorageMode("error"); setStorageMessage(error.message); }
      }
    };
    void saveCloud();
  }, [loaded, posts, storageMode, supabase, demoImporting]);

  const failedOnce = useRef(false);
  useEffect(() => {
    if (storageMode !== "error" || failedOnce.current) return;
    failedOnce.current = true;
    say("Couldn't save online. Saved on this device.");
  }, [storageMode, say]);

  // The next 7 days, for the day picker and for new posts.
  const nextDays = useMemo(() => (today ? Array.from({ length: 7 }, (_, i) => addDays(today, i + 1)) : []), [today]);
  const firstFreeDay = () => {
    if (!today) return "";
    for (let i = 1; i <= 60; i++) {
      const day = addDays(today, i);
      if (!posts.some(post => post.date === day && post.status !== "Draft")) return day;
    }
    return "";
  };

  // The picked day is scrolled into view, so a later date is never hidden off the edge.
  useEffect(() => {
    if (!showComposer) return;
    const t = window.setTimeout(() => document.querySelector(".dlg-days input:checked")?.parentElement?.scrollIntoView({ block: "nearest", inline: "center" }), 60);
    return () => window.clearTimeout(t);
  }, [showComposer]);

  const openComposer = (post?: WPost, day?: string) => {
    setEditingId(post?.id ?? null);
    setPostText(post?.text ?? "");
    setChannel(post?.channel ?? channels[0]);
    setDate(post ? post.date : day ?? firstFreeDay());
    setFormNote("");
    setShowComposer(true);
  };
  const editing = editingId ? posts.find(post => post.id === editingId) : undefined;
  const savePost = () => {
    const text = postText.trim();
    if (!text) { setFormNote("Write the caption first."); return; }
    const status: Post["status"] = editing?.status === "Posted" ? "Posted" : date ? "Planned" : "Draft";
    const post: WPost = editing ? { ...editing, text, channel, date, status } : { id: crypto.randomUUID(), text, channel, date, status };
    setPosts(current => (editing ? current.map(item => (item.id === editing.id ? post : item)) : [post, ...current]));
    setShowComposer(false);
    if (status === "Planned") setSelectedId(post.id);
    if (!editing && status === "Planned" && view !== "Week") go("Week");
    say(editing ? "Changes saved." : status === "Planned" ? "Added to your week." : "Draft saved.");
  };
  const deletePost = () => {
    if (!editing) return;
    const removed = editing;
    setPosts(current => current.filter(post => post.id !== removed.id));
    setShowComposer(false);
    say("Post deleted.", { label: "Undo", run: () => setPosts(current => [removed, ...current]) });
  };
  // A sample post stores only its hook; copy the whole caption, as the Next week screen does.
  const fullCaption = (post: WPost) => {
    const v = post.code ? byCode.get(post.code) : undefined;
    return v && norm(post.text) === norm(v.hook) ? captionText(v, language) : post.text;
  };
  const copyCaption = async (post: WPost) => {
    try {
      await navigator.clipboard.writeText(fullCaption(post));
      say(`Caption copied. Paste it on ${post.channel}.`);
    } catch {
      say("Copy blocked. Open the post and copy it there.");
    }
  };
  // Results come in on their own: a posted post's numbers climb for a few seconds.
  const track = (id: string) => {
    const h = hash(id);
    const reachTo = 900 + (h % 2200);
    const engageTo = Math.round(reachTo * (0.03 + (h % 5) / 100));
    const steps = [0.08, 0.2, 0.37, 0.55, 0.72, 0.86, 0.95, 1];
    steps.forEach((f, i) => {
      window.setTimeout(() => {
        setPosts(current => current.map(item => (item.id === id && item.status === "Posted" ? { ...item, reach: Math.round(reachTo * f), engagements: Math.round(engageTo * f) } : item)));
      }, 700 + i * 1100);
    });
  };
  const markPosted = (post: WPost) => {
    const done = publishedPost(post, today);
    setPosts(current => current.map(item => (item.id === post.id ? done : item)));
    say(post.sample ? "Sample post marked as posted. Playing back example results." : "Marked as posted. Add its results when they’re ready.");
    if (post.sample) track(post.id);
  };
  const saveMetrics = () => {
    if (!metricPost) return;
    const r = parseCount(reach);
    const e = parseCount(engagements);
    if (r === null || e === null) { setFormNote("Add both numbers."); return; }
    setPosts(current => current.map(item => (item.id === metricPost.id ? { ...item, reach: r, engagements: e } : item)));
    setMetricPost(null);
    say("Results saved.");
  };

  const toggleChat = () => setChatOpen(open => !open);
  const closeChat = () => {
    setChatOpen(false);
    window.requestAnimationFrame(() => (phone ? askDock : askBar).current?.focus());
  };
  const takeDraft = (draft: string, suggestedChannel?: string) => {
    const k = knownFor(draft);
    const existing = k ? posts.find(post => post.status !== "Posted" && (post.code ?? knownFor(post.text)?.v.code) === k.v.code) : undefined;
    setEditingId(existing?.id ?? null);
    setPostText(draft);
    setChannel(suggestedChannel && channels.includes(suggestedChannel) ? suggestedChannel : channels[0]);
    setDate(existing?.date || firstFreeDay());
    setFormNote("");
    setShowComposer(true);
    if (phone) setChatOpen(false);
  };
  const planChatDraft = (draft: ChatDraft, day: string) => {
    const existing = posts.find(post => post.id === draft.postId && post.status !== "Posted");
    const post: WPost = { ...existing, id: existing?.id ?? crypto.randomUUID(), text: draft.text, channel: draft.channel, date: day, status: "Planned", code: draft.code };
    setPosts(current => existing ? current.map(item => item.id === existing.id ? post : item) : [post, ...current]);
    setSelectedId(post.id);
    go("Week");
    say(`Planned for ${dayLabel(day)}.`);
    if (phone) setChatOpen(false);
    return post.id;
  };
  const showChatEvidence = (id: string) => {
    setSelectedId(id);
    go("Results");
    window.setTimeout(() => document.getElementById(`result-${id}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 100);
    if (phone) setChatOpen(false);
  };

  // Week: what is planned, in date order. Tomorrow leads unless another day is picked.
  const line = useMemo(() => posts.filter(post => post.status === "Planned").sort(byDate), [posts]);
  const drafts = useMemo(() => posts.filter(post => post.status === "Draft"), [posts]);
  const posted = useMemo(() => posts.filter(post => post.status === "Posted").sort((a, b) => b.date.localeCompare(a.date)), [posts]);
  const lead = line.find(post => post.id === selectedId) ?? line.find(post => today && post.date >= today) ?? line[0];
  const lineCrops = useMemo(() => cropsFor(line), [line]);
  const runnerName = runnerUp && runnerUp !== winner ? runnerUp.v.audienceName : null;
  const showTest = !!winner && run.versions.every(version => {
    const metric = metricsByVersion.get(version.id);
    return posts.some(post => post.sample && post.code === version.code && post.status === "Posted" && post.reach === metric?.reach && post.engagements === metric?.engagements);
  });

  const measured = useMemo(() => posted.filter(post => post.reach !== undefined || post.engagements !== undefined).sort((a, b) => (b.engagements ?? 0) - (a.engagements ?? 0) || (b.reach ?? 0) - (a.reach ?? 0)), [posted]);
  const waiting = posted.filter(post => post.reach === undefined && post.engagements === undefined);
  const totals = measured.reduce((sum, post) => ({ reach: sum.reach + (post.reach ?? 0), engagements: sum.engagements + (post.engagements ?? 0) }), { reach: 0, engagements: 0 });
  const most = Math.max(1, ...measured.map(post => post.engagements ?? 0));
  const chartCrops = useMemo(() => cropsFor(measured), [measured]);

  const exportProps = (post: WPost) => {
    const frame = frameOf(post);
    const base = post.code ? byCode.get(post.code) : knownFor(post.text)?.v;
    return { version: { ...(base ?? run.versions[0]), ...frame.version, audienceName: titleOf(post), slides: [frame.version.hook], hashtags: [], copy: undefined }, photo: frame.photo, brand: run.product.name, price: run.product.price };
  };
  useEffect(() => {
    if (canShare && lead) void render(exportProps(lead)).catch(() => {});
    // Prepare the selected image before the tap so native sharing keeps user activation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canShare, lead?.id, lead?.text, lead?.photo, render]);
  const saveImage = async (post: WPost) => {
    if (savingPost) return;
    setSavingPost(post.id);
    try {
      const props = exportProps(post);
      const blob = await render(props, { urgent: true });
      saveBlob(blob, postFilename(props.version));
      say("Post image saved. Copy the caption and publish in your social app.");
    } catch (error) {
      say(error instanceof Error ? error.message : "The image couldn’t be saved. Try again.");
    } finally { setSavingPost(null); }
  };
  const shareImage = (post: WPost) => {
    const props = exportProps(post);
    const blob = cachedPost(postKey(props));
    if (!blob) { void render(props, { urgent: true }).catch(() => {}); say("Preparing the image. Tap Share post again in a moment."); return; }
    handOff({ blob, filename: postFilename(props.version), title: titleOf(post), caption: fullCaption(post), onShared: () => say("Shared to your chosen app. Mark it as posted after publishing.") });
  };

  const saveWord = storageMode === "cloud" ? "Saved" : storageMode === "connecting" ? "Saving" : "Saved on this device";
  const primaryLabel = editing ? "Save changes" : date ? "Add to the week" : "Save as draft";
  const dayOptions = ["", ...[...new Set([...(today ? [today] : []), ...nextDays, ...(date ? [date] : [])])].sort()];
  const onDialogKey = (event: KeyboardEvent, close: () => void) => {
    if (event.key === "Escape") { event.stopPropagation(); close(); }
  };

  if (!loaded) {
    return (
      <main className="ws-loading" role="status">
        <HunchMark className="ws-loading-drop" />
        <strong>Opening your week.</strong>
      </main>
    );
  }

  const isTest = (post: WPost) => !!runnerName && post.audience === runnerName;
  const act = (post: WPost) => (
    <>
      <p className="wk-act-day">{dayLabel(post.date)}</p>
      <p className="wk-act-who">{`On ${post.channel}${post.audience && !isTest(post) ? `, for ${lowerFirst(post.audience)}` : ""}.`}</p>
      {isTest(post) ? <span className="ws-tag">Testing the runner-up</span> : null}
      <div className="wk-act-do">
        <button type="button" className="primary" onClick={() => void copyCaption(post)}>Copy caption</button>
        <button type="button" className="back" onClick={() => markPosted(post)}>Mark as posted</button>
      </div>
      <button type="button" className="ws-link" disabled={!!savingPost} onClick={() => void saveImage(post)}>{savingPost === post.id ? "Saving image…" : "Save image"}</button>
      {canShare ? <button type="button" className="ws-link" onClick={() => shareImage(post)}>Share post</button> : null}
      <button type="button" className="ws-link wk-act-edit" onClick={() => openComposer(post)}>Edit post</button>
    </>
  );

  const weekView = (
    <section className="wk" aria-labelledby="wk-title">
      <div className="wk-head">
        <div className="wk-words ws-rise">
          <h1 id="wk-title" className="ws-h1">{line.length ? "Post one a day." : "Plan your week."}</h1>
          <p className="ws-line">
            {line.length ? (line.length > 1 ? `${dayLabel(line[0].date)} to ${dayLabel(line[line.length - 1].date)}` : dayLabel(line[0].date)) : "Write a post and give it a day."}
          </p>
        </div>
        {showTest && winner ? (
          <button type="button" className="wk-ticket hh-field hh-field-sili hh-grain ws-rise" style={{ "--i": 2 } as CSSProperties} onClick={() => go("Results")} aria-label={`${count(winner.n, "message")} from ${lowerFirst(winner.v.audienceName)}. See the results.`}>
            <span className="wk-ticket-words" aria-hidden="true">
              <span className="wk-ticket-n">
                <b><Count value={winner.n} /></b>
                <span>messages</span>
              </span>
              <span className="wk-ticket-line">{winner.v.audienceName} came first.</span>
            </span>
            <span className="wk-ticket-post" aria-hidden="true">
              <HomePost version={winner.v} bare />
            </span>
          </button>
        ) : null}
      </div>

      {line.length && lead ? (
        <LayoutGroup id="week">
          <motion.ol className="wk-line" aria-label="Planned posts" layoutScroll>
            <AnimatePresence initial={false} mode="popLayout">
              {line.map((post, i) => {
                const isLead = post.id === lead.id;
                const big = isLead && !phone;
                return (
                  <motion.li
                    key={post.id}
                    layout
                    className="wk-day"
                    data-lead={isLead ? "" : undefined}
                    data-side={line.length > 2 && i > (line.length - 1) / 2 ? "left" : undefined}
                    style={{ "--r": `${isLead ? -2 : TILTS[i % TILTS.length]}deg`, "--up": isLead ? 0 : LIFTS[i % LIFTS.length], "--i": i } as CSSProperties}
                    exit={{ opacity: 0, y: -56, rotate: -6, transition: { duration: 0.45, ease } }}
                    transition={{ layout: { duration: 0.6, ease } }}
                  >
                    <motion.button
                      layout
                      type="button"
                      className="wk-post"
                      aria-pressed={isLead}
                      aria-label={`${dayLabel(post.date)}. ${titleOf(post)}${big ? ". Edit post" : ""}`}
                      onClick={() => (big ? openComposer(post) : setSelectedId(post.id))}
                      transition={{ layout: { duration: 0.6, ease } }}
                    >
                      <span className="wk-hang">
                        <Frame post={post} crop={lineCrops[i]} play={big} bare={phone} />
                      </span>
                    </motion.button>
                    {big ? (
                      <motion.div className="wk-act" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease, delay: 0.2 }}>
                        {act(post)}
                      </motion.div>
                    ) : (
                      <motion.p layout="position" className="wk-when" transition={{ layout: { duration: 0.6, ease } }}>
                        <span>{phone ? shortDay(post.date) : dayLabel(post.date)}</span>
                        {isTest(post) && !phone ? <span className="ws-tag">Testing the runner-up</span> : null}
                      </motion.p>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ol>
          {phone ? (
            <div className="wk-focus">
              <AnimatePresence mode="wait" initial={false}>
                <motion.button
                  key={lead.id}
                  type="button"
                  className="wk-post wk-focus-post"
                  aria-label={`${titleOf(lead)}. Edit post`}
                  onClick={() => openComposer(lead)}
                  initial={{ opacity: 0, x: 28, rotate: 2 }}
                  animate={{ opacity: 1, x: 0, rotate: -2 }}
                  exit={{ opacity: 0, x: -28, rotate: -6 }}
                  transition={{ duration: 0.35, ease }}
                >
                  <Frame post={lead} crop={lineCrops[line.indexOf(lead)]} play />
                </motion.button>
              </AnimatePresence>
              <div className="wk-act">{act(lead)}</div>
            </div>
          ) : null}
        </LayoutGroup>
      ) : (
        <>
          <ol className="wk-line wk-blank" aria-label="Your next 7 days">
            {nextDays.map((day, i) => (
              <li key={day} className="wk-day" style={{ "--r": `${TILTS[i % TILTS.length] * 0.6}deg`, "--up": LIFTS[i % LIFTS.length], "--i": i } as CSSProperties}>
                <button type="button" className="wk-post wk-slot" aria-label={`Write a post for ${dayLabel(day)}`} onClick={() => openComposer(undefined, day)}>
                  <span className="wk-hang"><span className="wk-slot-face" /></span>
                </button>
                <p className="wk-when"><span>{phone ? shortDay(day) : dayLabel(day)}</span></p>
              </li>
            ))}
          </ol>
          {!hasSamples ? (
            <Empty>
              <button type="button" className="ws-link" onClick={addSampleData}>Add sample posts</button>
            </Empty>
          ) : null}
        </>
      )}

      {drafts.length ? (
        <section className="wk-drafts" aria-labelledby="wk-drafts">
          <h2 id="wk-drafts" className="ws-h2">No day yet.</h2>
          <ul className="wk-shelf">
            {drafts.map((post, i) => (
              <li key={post.id} style={{ "--r": `${i % 2 ? 2.5 : -2.5}deg` } as CSSProperties}>
                <button type="button" className="wk-post" aria-label={`Edit ${titleOf(post)}`} onClick={() => openComposer(post)}>
                  <span className="wk-hang"><Frame post={post} /></span>
                </button>
                <button type="button" className="back" onClick={() => openComposer(post)}>Pick a day</button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );

  const row = (post: WPost) => {
    const results = post.reach !== undefined || post.engagements !== undefined;
    const d = post.date ? dateOf(post.date) : null;
    return (
      <li key={post.id} className="pl-row" data-status={post.status}>
        <button type="button" className="pl-thumb" aria-label={`Edit ${titleOf(post)}`} onClick={() => openComposer(post)}>
          <Frame post={post} bare />
        </button>
        <p className="pl-day" aria-label={dayLabel(post.date)}>
          {d ? (
            <>
              <span>{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <b>{d.getDate()}</b>
              <span>{d.toLocaleDateString("en-US", { month: "short" })}</span>
            </>
          ) : (
            <span>No day</span>
          )}
        </p>
        <div className="pl-text">
          <p className="pl-cap">{firstLine(post.text)}</p>
          <p className="pl-meta">
            {post.channel}
            {post.audience ? `, for ${lowerFirst(post.audience)}` : ""}
          </p>
        </div>
        <div className="pl-do">
          {post.status === "Planned" ? (
            <>
              <button type="button" className="back" onClick={() => void copyCaption(post)}>Copy caption</button>
              <button type="button" className="primary" onClick={() => markPosted(post)}>Mark as posted</button>
            </>
          ) : post.status === "Draft" ? (
            <button type="button" className="back" onClick={() => openComposer(post)}>Pick a day</button>
          ) : results ? (
            <span className="pl-nums" aria-live="polite">
              <span><b>{(post.reach ?? 0).toLocaleString("en-US")}</b> reached</span>
              <span><b>{(post.engagements ?? 0).toLocaleString("en-US")}</b> engagements</span>
            </span>
          ) : (
            <button type="button" className="back" onClick={() => { setMetricPost(post); setReach(""); setEngagements(""); }}>Add results</button>
          )}
        </div>
      </li>
    );
  };
  const postsLine = [line.length ? `${line.length} to post` : "", drafts.length ? count(drafts.length, "draft") : "", posted.length ? `${posted.length} posted` : ""].filter(Boolean).join(", ");

  const postsView = (
    <section className="pl" aria-labelledby="pl-title">
      <div className="pl-head ws-rise">
        <h1 id="pl-title" className="ws-h1">All posts.</h1>
        <p className="ws-line">{postsLine ? `${postsLine}.` : "Write one and give it a day."}</p>
      </div>
      {posts.length ? (
        <>
          {[
            { key: "plan", title: "To post", list: line },
            { key: "draft", title: "No day yet", list: drafts },
            { key: "done", title: "Posted", list: posted },
          ]
            .filter(group => group.list.length)
            .map((group, gi) => (
              <section key={group.key} className="pl-group ws-rise" style={{ "--i": gi + 1 } as CSSProperties} aria-labelledby={`pl-${group.key}`}>
                <h2 id={`pl-${group.key}`} className="ws-h2">
                  {group.title} <span className="pl-n">{group.list.length}</span>
                </h2>
                <ul className="pl-list">{group.list.map(row)}</ul>
              </section>
            ))}
          <div className="pl-foot">
            {hasSamples ? (
              <><button type="button" className="ws-link" onClick={resetDemo}>Reset sample week</button><button type="button" className="ws-link" onClick={removeSampleData}>Remove sample posts</button></>
            ) : (
              <button type="button" className="ws-link" onClick={addSampleData}>Add sample posts</button>
            )}
          </div>
        </>
      ) : (
        <Empty>
          <button type="button" className="primary" onClick={() => openComposer()}>New post</button>
          <button type="button" className="ws-link" onClick={addSampleData}>Add sample posts</button>
        </Empty>
      )}
    </section>
  );

  const resultsView = (
    <section className="rs" aria-labelledby="rs-title">
      {showTest && winner ? (
        <div className="rs-poster hh-field hh-field-sili hh-grain">
          <div className="rs-words">
            <h1 id="rs-title" className="rs-h1">
              <span className="rs-kicker ws-rise">Most messages came from</span>
              <span className="rs-name ws-rise" style={{ "--i": 1 } as CSSProperties}>{winner.v.audienceName}</span>
            </h1>
            <ul className="rs-facts">
              <li className="ws-rise" style={{ "--i": 2 } as CSSProperties}>
                <b><Count value={winner.n} /></b>
                <span>messages</span>
              </li>
              <li className="ws-rise" style={{ "--i": 3 } as CSSProperties}>
                <b>₱{Math.round(spendEach)}</b>
                <span>spent</span>
              </li>
            </ul>
            {runnerUp && runnerName ? (
              <p className="rs-second ws-rise" style={{ "--i": 4 } as CSSProperties}>{`${runnerName} came second with ${count(runnerUp.n, "message")}.`}</p>
            ) : null}
          </div>
          <div className="rs-winner" aria-hidden="true">
            <div className="rs-winner-tilt">
              <HomePost version={winner.v} boosted />
            </div>
          </div>
        </div>
      ) : null}

      {waiting.length ? (
        <section className="rs-wait ws-rise" style={{ "--i": 2 } as CSSProperties} aria-labelledby="rs-wait">
          <h2 id="rs-wait" className="ws-h2">{waiting.length === 1 ? "Tracking 1 post." : `Tracking ${waiting.length} posts.`}</h2>
          <ul className="rs-wait-list">
            {waiting.map(post => (
              <li key={post.id}>
                <span className="rs-wait-post"><Frame post={post} bare /></span>
                <span className="rs-wait-when">
                  <b>{dayLabel(post.date)}</b>
                  <span>{post.channel}</span>
                </span>
                <span className="ws-line">Results coming in</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rs-board" aria-labelledby={showTest ? "rs-board" : "rs-title"}>
        <div className="rs-board-head ws-rise" style={{ "--i": 3 } as CSSProperties}>
          {showTest ? (
            <h2 id="rs-board" className="ws-h2">How your posts did.</h2>
          ) : (
            <div>
              <h1 id="rs-title" className="ws-h1">How your posts did.</h1>
              {!measured.length && !demoImporting ? <p className="ws-line">Mark a post as posted, then add its results from your social app.</p> : null}
            </div>
          )}
          {measured.length ? (
            <dl className="rs-totals">
              <div>
                <dt>reached</dt>
                <dd><Count value={totals.reach} /></dd>
              </div>
              <div>
                <dt>engagements</dt>
                <dd><Count value={totals.engagements} /></dd>
              </div>
            </dl>
          ) : null}
        </div>
        {measured.length ? (
          <LayoutGroup id="chart">
            <ol className="rs-chart">
              {measured.map((post, i) => (
                <motion.li
                  key={post.id}
                  layout
                  className="rs-item"
                  id={`result-${post.id}`}
                  data-chat-evidence={selectedId === post.id ? "" : undefined}
                  data-best={i === 0 ? "" : undefined}
                  style={{ "--h": (post.engagements ?? 0) / most, "--i": i } as CSSProperties}
                  transition={{ layout: { duration: 0.6, ease } }}
                >
                  <b className="rs-count"><Count value={post.engagements ?? 0} /></b>
                  <button type="button" className="rs-post" aria-label={`Open the post for ${titleOf(post)}`} onClick={() => openComposer(post)}>
                    <Frame post={post} crop={chartCrops[i]} bare />
                  </button>
                  <span className={"rs-bar" + (i === 0 ? " hh-grain" : "")} aria-hidden="true" />
                  <span className="rs-name-sm">{titleOf(post)}</span>
                  <span className="rs-when">{`${(post.reach ?? 0).toLocaleString("en-US")} reached`}</span>
                </motion.li>
              ))}
            </ol>
          </LayoutGroup>
        ) : (
          <>
            <ol className="rs-chart rs-ghost" data-busy={demoImporting ? "" : undefined} aria-hidden="true">
              {[0.55, 0.9, 0.4, 0.7, 0.3, 0.8, 0.5, 0.2].map((h, i) => (
                <li key={i} className="rs-item" style={{ "--h": h, "--i": i } as CSSProperties}>
                  <span className="rs-ghost-post" />
                  <span className="rs-bar" />
                </li>
              ))}
            </ol>
            {!demoImporting ? (
              <Empty>
                <button type="button" className="primary" onClick={() => go("Week")}>Go to your week</button>
              </Empty>
            ) : null}
          </>
        )}
      </section>
    </section>
  );

  const composerPreview = { id: editingId ?? "new-post", text: postText, photo: editing?.photo, code: editing?.code };

  return (
    <MotionConfig reducedMotion="user">
      <div className={"ws" + (chatOpen ? " chat-open" : "")} data-view={view}>
        <header className="ws-bar">
          <Link className="ws-logo" href="/" aria-label="Hunch, home">
            <HunchMark className="ws-logo-drop" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ws-word" src="/brand/wordmark.svg" alt="" />
          </Link>
          <nav className="ws-nav" aria-label="Workspace">
            {views.map(item => (
              <button key={item} type="button" className="ws-tab" aria-current={view === item ? "page" : undefined} onClick={() => go(item)}>
                {view === item ? <motion.span layoutId="ws-tab" className="ws-tab-pill" transition={{ duration: 0.45, ease }} /> : null}
                <span className="ws-tab-word">{item}</span>
              </button>
            ))}
          </nav>
          <div className="ws-end">
            {hasSamples ? <button type="button" className="ws-link ws-sample-reset" onClick={resetDemo}>Reset sample</button> : null}
            <span className="ws-saved" data-state={storageMode} title={storageMode === "error" ? storageMessage : undefined}>
              <i aria-hidden="true" />
              {saveWord}
            </span>
            <button ref={askBar} type="button" className="ws-ask chat-toggle" aria-expanded={chatOpen} aria-controls="hunch-chat" onClick={toggleChat}>
              <HunchMark className="ws-ask-drop" />
              Ask Hunch
            </button>
            <button type="button" className="primary ws-new" onClick={() => openComposer()}>New post</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ws-me" src={avatar} alt="Elle's Candles" title="Elle's Candles" />
          </div>
        </header>

        <main className="ws-main" id="main">
          <div key={view} className="ws-view">
            {view === "Week" ? weekView : view === "Posts" ? postsView : view === "Build" ? <BuildDescription /> : resultsView}
          </div>
        </main>

        <nav className="ws-dock" aria-label="Workspace">
          {views.map(item => (
            <button key={item} type="button" className="ws-dock-tab" aria-current={view === item ? "page" : undefined} onClick={() => { setChatOpen(false); go(item); }}>
              {view === item && !chatOpen ? <motion.span layoutId="ws-dock" className="ws-dock-pill" transition={{ duration: 0.45, ease }} /> : null}
              <span>{item}</span>
            </button>
          ))}
          <button ref={askDock} type="button" className="ws-dock-ask" aria-expanded={chatOpen} aria-controls="hunch-chat" onClick={toggleChat}>
            {chatOpen ? <motion.span layoutId="ws-dock" className="ws-dock-pill" transition={{ duration: 0.45, ease }} /> : null}
            <HunchMark className="ws-ask-drop" />
            <span>Ask</span>
          </button>
        </nav>

        <ChatSidebar key={chatSession} posts={posts} onPlanDraft={planChatDraft} onViewEvidence={showChatEvidence} onDemoImport={importDemoPlatform} open={chatOpen} view={view} onClose={closeChat} onUseDraft={takeDraft} />

        {canvas}
        <div className="ws-toasts" role="status" aria-live="polite">
          <AnimatePresence>
            {toast ? (
              <motion.div key={toast.id} className="ws-toast" initial={{ opacity: 0, y: 14, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }} transition={{ duration: 0.35, ease }}>
                <span>{toast.text}</span>
                {toast.action ? (
                  <button type="button" onClick={() => { toast.action?.run(); setToast(null); }}>
                    {toast.action.label}
                  </button>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {showComposer ? (
          <div className="dlg-back" role="presentation" onClick={() => setShowComposer(false)}>
            <section className="dlg" role="dialog" aria-modal="true" aria-labelledby="composer-title" onClick={event => event.stopPropagation()} onKeyDown={event => onDialogKey(event, () => setShowComposer(false))}>
              <div className="dlg-side" aria-hidden="true">
                <div className="dlg-preview">
                  <Frame post={composerPreview} play bare={!postText.trim()} />
                </div>
              </div>
              <div className="dlg-body">
                <button type="button" className="dlg-x" onClick={() => setShowComposer(false)} aria-label="Close" />
                <h2 id="composer-title">{editing ? "Edit post." : "New post."}</h2>
                <label className="dlg-label" htmlFor="post-copy">Caption</label>
                <textarea id="post-copy" autoFocus value={postText} onChange={event => { setPostText(event.target.value); setFormNote(""); }} placeholder="Write the caption." />
                <fieldset className="dlg-set">
                  <legend className="dlg-label">Post on</legend>
                  <div className="dlg-seg">
                    {channels.map(item => (
                      <label key={item} className="dlg-opt">
                        <input type="radio" name="post-channel" value={item} checked={channel === item} onChange={() => setChannel(item)} />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="dlg-set">
                  <legend className="dlg-label">Day</legend>
                  <div className="dlg-days">
                    {dayOptions.map(day => (
                      <label key={day || "none"} className="dlg-opt">
                        <input type="radio" name="post-day" value={day} checked={date === day} onChange={() => setDate(day)} />
                        <span>{day === "" ? "No day" : day === today ? "Today" : dayLabel(day)}</span>
                      </label>
                    ))}
                    <label className="dlg-opt dlg-other">
                      <input
                        type="date"
                        aria-label="Other day"
                        value={date}
                        onChange={event => setDate(event.target.value)}
                        onClick={event => { try { event.currentTarget.showPicker(); } catch {} }}
                      />
                      <span>Other day</span>
                    </label>
                  </div>
                </fieldset>
                {formNote ? <p role="alert" className="dlg-note">{formNote}</p> : null}
                <div className="dlg-actions">
                  {editing ? <button type="button" className="ws-link dlg-del" onClick={deletePost}>Delete post</button> : null}
                  <button type="button" className="primary" onClick={savePost}>{primaryLabel}</button>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {metricPost ? (
          <div className="dlg-back" role="presentation" onClick={() => setMetricPost(null)}>
            <section className="dlg dlg-small" role="dialog" aria-modal="true" aria-labelledby="metrics-title" onClick={event => event.stopPropagation()} onKeyDown={event => onDialogKey(event, () => setMetricPost(null))}>
              <div className="dlg-side" aria-hidden="true">
                <div className="dlg-preview">
                  <Frame post={metricPost} />
                </div>
              </div>
              <div className="dlg-body">
                <button type="button" className="dlg-x" onClick={() => setMetricPost(null)} aria-label="Close" />
                <h2 id="metrics-title">{metricPost.reach !== undefined || metricPost.engagements !== undefined ? "Edit results." : "Add results."}</h2>
                <p className="dlg-sub">{`${dayLabel(metricPost.date)} on ${metricPost.channel}`}</p>
                <div className="dlg-nums">
                  <label className="dlg-num">
                    <span className="dlg-label">Reach</span>
                    <input id="reach" autoFocus inputMode="numeric" autoComplete="off" value={reach} onChange={event => { setReach(event.target.value); setFormNote(""); }} placeholder="0" />
                  </label>
                  <label className="dlg-num">
                    <span className="dlg-label">Engagements</span>
                    <input id="engagements" inputMode="numeric" autoComplete="off" value={engagements} onChange={event => { setEngagements(event.target.value); setFormNote(""); }} placeholder="0" />
                  </label>
                </div>
                {formNote ? <p role="alert" className="dlg-note">{formNote}</p> : null}
                <div className="dlg-actions">
                  <button type="button" className="primary" onClick={saveMetrics}>Save results</button>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </MotionConfig>
  );
}
