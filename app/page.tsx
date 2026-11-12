"use client";

import { useEffect, useMemo, useState } from "react";
import ChatSidebar from "./chat-sidebar";
import Insights from "../components/insights";
import Build from "../components/build";
import Calendar from "../components/calendar";
import { validPostDate } from "../lib/calendar";
import Analytics from "../components/analytics";
import { campaignFor } from "../lib/analytics";
import { mergeDemoPlatform, refreshSamplePosts, samplePhotoFor, sampleWorkspacePosts, type Post } from "../lib/demo-workspace";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

type View = "Home" | "Calendar" | "Posts" | "Analytics" | "Insights" | "How to use" | "About Hunch" | "Build notes";

const navItems: View[] = ["Home", "Calendar", "Posts", "Analytics", "Insights", "How to use", "About Hunch", "Build notes"];
const navLabels: Partial<Record<View, string>> = { "How to use": "Guide", "About Hunch": "About", "Build notes": "Build" };
const channels = ["Instagram", "TikTok", "Facebook"];
const storeKey = "hunch.creator.posts.v1";



export default function Home() {
  const [view, setView] = useState<View>("Home");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageMode, setStorageMode] = useState<"connecting" | "local" | "cloud" | "error">("connecting");
  const [storageMessage, setStorageMessage] = useState("");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [channel, setChannel] = useState(channels[0]);
  const [date, setDate] = useState("");
  const [notice, setNotice] = useState("");
  const [metricPost, setMetricPost] = useState<Post | null>(null);
  const [reach, setReach] = useState("");
  const [engagements, setEngagements] = useState("");
  const [spend, setSpend] = useState("");
  const [messages, setMessages] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [demoImporting, setDemoImporting] = useState(false);
  const [demoPlatforms, setDemoPlatforms] = useState<string[]>([]);
  const importDemoPlatform = (platform: string | null) => {
    if (platform === null) {
      setView("Analytics"); setDemoImporting(true); setDemoPlatforms([]);
      setNotice("Demo replay: loading fictional platform data. Your own posts are kept.");
    } else {
      setDemoPlatforms(current => [...current, platform]);
      if (platform === "Facebook") { setDemoImporting(false); setNotice("Demo data ready · Three example channels loaded. Preparing your next post."); }
    }
    setPosts(current => mergeDemoPlatform(current, platform));
  };
  const hasSamples = posts.some(post => post.sample);
  const addSampleData = () => {
    setPosts(current => current.some(post => post.sample) ? current : [
      ...sampleWorkspacePosts(),
      ...current
    ]);
    setNotice("Example posts added. They are labeled Sample and can be removed any time.");
  };
  const removeSampleData = () => { setPosts(current => current.filter(post => !post.sample)); setNotice("Example posts removed."); };


  useEffect(() => {
    let cancelled = false;
    const openWorkspace = async () => {
      let localPosts: Post[] = [];
      const hasLocalWorkspace = localStorage.getItem(storeKey) !== null;
      try { localPosts = refreshSamplePosts(JSON.parse(localStorage.getItem(storeKey) || "[]")); } catch { localPosts = []; }
      if (!supabase) {
        if (!cancelled) { setPosts(localPosts.length || hasLocalWorkspace ? localPosts : sampleWorkspacePosts()); setStorageMode("local"); setLoaded(true); }
        return;
      }
      try {
        let { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) {
          const result = await supabase.auth.signInAnonymously();
          if (result.error) throw result.error;
          session = result.data.session;
        }
        const { data, error: readError } = await supabase.from("creator_posts").select("id,caption,channel,post_date,status,reach,engagements,is_sample").order("post_date", { ascending: true, nullsFirst: false });
        if (readError) throw readError;
        const cloudPosts: Post[] = (data ?? []).map(row => ({ id: row.id, text: row.caption, channel: row.channel, date: row.post_date ?? "", status: row.status, reach: row.reach ?? undefined, engagements: row.engagements ?? undefined, sample: row.is_sample, spend: localPosts.find(post => post.id === row.id)?.spend, messages: localPosts.find(post => post.id === row.id)?.messages }));
        if (!cancelled) { setPosts(cloudPosts.length ? refreshSamplePosts(cloudPosts) : localPosts.length || hasLocalWorkspace ? localPosts : sampleWorkspacePosts()); setStorageMode("cloud"); setLoaded(true); }
      } catch (error) {
        if (!cancelled) { setPosts(localPosts.length || hasLocalWorkspace ? localPosts : sampleWorkspacePosts()); setStorageMode("error"); setStorageMessage(error instanceof Error ? error.message : "Could not connect to cloud storage."); setLoaded(true); }
      }
    };
    void openWorkspace();
    return () => { cancelled = true; };
  }, [supabase]);
  useEffect(() => {
    if (!loaded || demoImporting) return;
    localStorage.setItem(storeKey, JSON.stringify(posts));
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

  const openComposer = (post?: Post) => {
    setEditingId(post?.id ?? null); setPostText(post?.text ?? ""); setChannel(post?.channel ?? channels[0]);
    setDate(post?.date ?? ""); setNotice(""); setShowComposer(true);
  };
  const planFollowup = (post: Post) => {
        const campaign = campaignFor(post);
        const existing = campaign?.followupId ? posts.find(item => item.status !== "Posted" && (item.id === campaign.followupId || item.id.startsWith(`${campaign.followupId}-`))) : undefined;
        openComposer(existing);
        if (!existing?.text.includes("\n")) setPostText(campaign?.followupCaption ?? post.text);
        setChannel(existing?.channel ?? post.channel);
  };
  const savePost = (status: Post["status"]) => {
    if (!postText.trim()) { setNotice("Add a caption or post idea first."); return; }
    if (date && !validPostDate(date)) { setNotice("Choose a valid calendar date."); return; }
    const post: Post = { ...posts.find(post => post.id === editingId), id: editingId ?? crypto.randomUUID(), text: postText.trim(), channel, date, status };
    setPosts(current => editingId ? current.map(item => item.id === editingId ? post : item) : [post, ...current]);
    setShowComposer(false); setNotice(status === "Planned" ? "Added to your plan. Publish from your social app when ready." : "Draft saved on this device.");
  };
  const copyCaption = async (post: Post) => {
    try { await navigator.clipboard.writeText(post.text); setNotice("Caption copied. Open " + post.channel + " and publish it there."); }
    catch { setNotice("Copy wasn’t available. Edit the post and copy its caption manually."); }
  };
  const markPosted = (post: Post) => {
    setPosts(current => current.map(item => item.id === post.id ? { ...item, status: "Posted" } : item));
    setNotice("Marked as posted. Add its results when they’re available.");
  };
  const openMetrics = (post: Post) => {
    const campaign = campaignFor(post);
    setMetricPost(post); setReach(String(post.reach ?? "")); setEngagements(String(post.engagements ?? "")); setSpend(String(campaign?.spend ?? "")); setMessages(String(campaign?.results ?? "")); setNotice("");
  };
  const saveMetrics = () => {
    if (!metricPost) return;
    const r = reach.trim() ? Number(reach) : undefined;
    const e = engagements.trim() ? Number(engagements) : undefined;
    const s = spend.trim() ? Number(spend) : undefined;
    const m = messages.trim() ? Number(messages) : undefined;
    if ([r,e,m].some(value => value !== undefined && (!Number.isInteger(value) || value < 0)) || (s !== undefined && (!Number.isFinite(s) || s < 0))) { setNotice("Use nonnegative whole numbers for counts and a nonnegative amount for spend."); return; }
    if ((s === undefined) !== (m === undefined)) { setNotice("Enter both spend and conversations to calculate cost per conversation, or leave both blank."); return; }
    setPosts(current => current.map(item => item.id === metricPost.id ? { ...item, reach: r, engagements: e, spend: s, messages: m } : item));
    setMetricPost(null); setNotice("Results saved. Spend and conversations are kept on this device.");
  };
  const totals = useMemo(() => posts.reduce((acc, post) => ({ reach: acc.reach + (post.reach || 0), engagements: acc.engagements + (post.engagements || 0), measured: acc.measured + (post.reach !== undefined ? 1 : 0) }), { reach: 0, engagements: 0, measured: 0 }), [posts]);
  const plannedCount = posts.filter(post => post.status === "Planned").length;
  const channelCount = new Set(posts.map(post => post.channel)).size;
  const latestMeasuredPost = posts.filter(post => post.reach !== undefined).sort((a,b) => b.date.localeCompare(a.date))[0];
  const homeQueue = posts.filter(post => post.status !== "Posted").sort((a,b) => (a.date || "9999").localeCompare(b.date || "9999")).slice(0,3);
  const visiblePosts = view === "Calendar" ? posts.filter(post => post.date).sort((a,b) => a.date.localeCompare(b.date)) : posts;
  const statusClass = (status: Post["status"]) => status === "Posted" ? "published" : status === "Planned" ? "scheduled" : "draft";

  const postRows = (items: Post[]) => items.length ? <div className="week-list">{items.map(post => <article className="week-item" key={post.id}>{view === "Posts" && samplePhotoFor(post) && <img className="post-gallery-photo" src={samplePhotoFor(post)} alt="" loading="lazy" />}<div className="date-block"><span>{post.date ? new Date(`${post.date}T12:00:00`).toLocaleDateString(undefined,{weekday:"short"}) : "—"}</span><b>{post.date ? new Date(`${post.date}T12:00:00`).getDate() : "·"}</b></div><div className="week-detail"><strong>{post.text}{post.sample && <span className="sample-tag">Sample</span>}</strong><small>{post.channel}{post.reach !== undefined ? ` · ${post.reach.toLocaleString()} reach` : ""}</small></div><span className={`status ${statusClass(post.status)}`}>{post.status}</span>{post.status === "Posted" ? <button className="subtle-link" onClick={() => openMetrics(post)}>Add results</button> : <button className="subtle-link" onClick={() => openComposer(post)}>Edit</button>}{post.status === "Planned" && <><button className="subtle-link" onClick={() => copyCaption(post)}>Copy caption</button><button className="subtle-link" onClick={() => markPosted(post)}>Mark posted</button></>}</article>)}</div> : <div className="empty-state"><h3>{view === "Calendar" ? "Nothing planned yet" : "Your post library is ready"}</h3><p>Create a draft or add a planned post. They’ll be saved in this browser.</p><button className="primary" onClick={() => openComposer()}>Create a post</button></div>;

  if (!loaded) return <main className="workspace-loading" role="status"><div className="magic-orbit" aria-hidden="true" /><strong>Opening your workspace</strong><p>Setting up your private demo space…</p></main>;

  return <main className={"creator-app" + (chatOpen ? " chat-open" : "")}>
    <aside className="sidebar"><a className="brand" href="#"><span className="brand-mark" aria-hidden="true" /><img className="brand-word" src="/brand/wordmark.svg" alt="hunch" /></a><div className="workspace-label">Creator workspace</div><nav className="side-nav" aria-label="Main navigation">{navItems.map(item => <button key={item} className={view === item ? "side-link selected" : "side-link"} onClick={() => setView(item)}><span className="nav-label">{navLabels[item] ?? item}</span></button>)}</nav><div className="sidebar-bottom"><div className="avatar">ER</div><div><strong>Elle Reyes</strong><small>Candle creator · sample</small></div></div></aside>
    <section className={"main-panel" + (view === "Analytics" || view === "Home" ? " analytics-active" : "") + (view === "Analytics" && (demoImporting || demoPlatforms.length) ? " demo-replay" : "")}><header className="workspace-top"><div className="mobile-brand"><span className="brand-mark" aria-hidden="true" /><img className="brand-word" src="/brand/wordmark.svg" alt="hunch" /></div><div className="breadcrumb">My workspace <span>/</span> {view}</div><div className="top-actions"><button className="back chat-toggle" aria-expanded={chatOpen} aria-controls="hunch-chat" onClick={() => setChatOpen(open => !open)}>Ask Hunch</button><span className="sample-pill">{storageMode === "connecting" ? "Connecting…" : storageMode === "cloud" ? "Cloud workspace" : storageMode === "error" ? "Local backup" : "Local workspace"}</span><div className="avatar small-avatar">ER</div></div></header>
      <div className="page-content"><div className="welcome-row"><div><h1>{view === "Home" ? "Your creator desk" : view}</h1></div>{<button className="primary create-button" onClick={() => openComposer()}><span>Create a post</span></button>}</div>
      {notice && <div className="success-note" role="status">{notice}</div>}
      {storageMode === "error" && <div className="storage-warning" role="status">Cloud workspace isn’t available, so this browser is using local storage. {storageMessage}</div>}
      {view === "Home" && <div className="home-dashboard">
        <div className="home-stats"><article><span className="stat-number">{String(plannedCount).padStart(2,"0")}</span><div><b>In your plan</b><small>Dated posts to publish</small></div></article><article><span className="stat-number">{String(totals.measured).padStart(2,"0")}</span><div><b>Results recorded</b><small>Sample or entered results</small></div></article><article><span className="stat-number">{String(channelCount).padStart(2,"0")}</span><div><b>Channels in rotation</b><small>Across your workspace</small></div></article></div>
        <div className="home-columns">
          <section className="panel home-next-panel"><div className="panel-head"><div><span className="section-kicker">Your next action</span><h2>Move these posts forward</h2></div><button className="subtle-link" onClick={() => setView("Posts")}>View all {posts.length}</button></div>{hasSamples && <div className="sample-banner"><span>Demo workspace</span> Sample posts and numbers are labeled. <button className="subtle-link" onClick={removeSampleData}>Clear sample</button></div>}{homeQueue.length ? postRows(homeQueue.slice(0,1)) : <div className="empty-state"><h3>Your plan is clear</h3><p>Add a post idea and give it a date when you’re ready to move it forward.</p><button className="primary" onClick={() => openComposer()}>Create a post</button><button className="subtle-link" onClick={addSampleData}>Load sample workspace</button></div>}<div className="home-secondary"><button className="subtle-link" onClick={() => setView("Calendar")}>Open calendar</button><button className="subtle-link" onClick={() => setView("Analytics")}>Review performance</button></div></section>
          <div className="home-side-stack">
            <section className="panel latest-panel"><div className="panel-head"><div><span className="section-kicker">Latest result</span><h2>{latestMeasuredPost ? latestMeasuredPost.channel + " · " + (latestMeasuredPost.date ? new Date(`${latestMeasuredPost.date}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"}) : "Posted") : "Results will show here"}</h2></div>{latestMeasuredPost?.sample && <span className="evidence-pill">Sample</span>}</div>{latestMeasuredPost ? <><p className="result-caption">{latestMeasuredPost.text}</p><div className="result-pair"><div><span>Reach</span><b>{latestMeasuredPost.reach?.toLocaleString()}</b></div><div><span>Engagements</span><b>{latestMeasuredPost.engagements?.toLocaleString() ?? "—"}</b></div><div><span>Engagement rate</span><b>{latestMeasuredPost.reach ? `${((latestMeasuredPost.engagements ?? 0) / latestMeasuredPost.reach * 100).toFixed(1)}%` : "—"}</b></div></div><small className="result-foot">Calculated as engagements ÷ reach</small></> : <div className="empty-state compact-empty"><p>After publishing, add the reach and engagements from your social app.</p><button className="subtle-link" onClick={() => setView("Analytics")}>See how results work</button></div>}<button className="panel-link" onClick={() => setView("Analytics")}>Open analytics</button></section>

          </div>
        </div>
      </div>}
      {view === "Calendar" && <Calendar posts={posts} onPlan={(day,post) => { openComposer(post); setDate(day); }} onEdit={openComposer} onResults={openMetrics} onCopy={copyCaption} onPosted={markPosted} />}
      {view === "Posts" && <section className="panel full-panel posts-photo-gallery"><div className="panel-head"><div><span className="section-kicker">Content library</span><h2>Your posts</h2></div><button className="primary" onClick={() => openComposer()}>Create a post</button></div>{postRows(visiblePosts)}</section>}
      {(view === "Analytics" || view === "Home") && <Analytics posts={posts} onInspect={post => openComposer(post)} onAddResults={() => setView("Posts")} onPlan={planFollowup} />}
      {view === "Insights" && <Insights posts={posts} onResults={() => setView("Posts")} onInspect={openComposer} onPlan={planFollowup} />}
      {view === "How to use" && <section className="panel full-panel guide-panel"><div className="panel-head"><div><span className="section-kicker">About this POC</span><h2>A simple loop for your social content</h2></div><span className="evidence-pill">Prototype</span></div><p className="guide-intro">Hunch helps small creators plan posts, keep track of what they publish, and learn from their results in one workspace.</p><div className="guide-flow"><article><span>01 · Plan</span><h3>Draft and schedule</h3><p>Choose <b>Create a post</b>, write a caption, select a channel, and optionally add a date. Save drafts or add dated posts to your plan.</p><button className="subtle-link" onClick={() => openComposer()}>Create a post</button></article><article><span>02 · Publish</span><h3>Finish in the social app</h3><p>From a planned post, copy the caption, open Instagram, TikTok, or Facebook, and publish there. Then mark the post as posted in Hunch.</p><button className="subtle-link" onClick={() => setView("Posts")}>Open your posts</button></article><article><span>03 · Track</span><h3>Record real results</h3><p>After publishing, add the reach and engagement numbers shown by that platform. Hunch doesn’t fetch analytics automatically.</p><button className="subtle-link" onClick={() => setView("Analytics")}>View analytics</button></article><article><span>04 · Learn</span><h3>Review what you entered</h3><p>Analytics and insights use only the numbers you record here. With more posts, compare results and decide what to try next.</p><button className="subtle-link" onClick={() => setView("Insights")}>View insights</button></article></div><div className="guide-note"><strong>What this prototype does today</strong><p>{storageMode === "cloud" ? "Posts and results are saved to an isolated anonymous workspace. There is no account recovery, automatic scheduling, direct publishing, or automatic analytics connection yet." : "Posts and results are saved in this browser on this device until cloud storage is configured. There is no account recovery, automatic scheduling, direct publishing, or automatic analytics connection yet."}</p></div></section>}
      {view === "About Hunch" && <section className="panel full-panel about-page"><div className="about-hero"><span className="hero-label">A little more room to create</span><h2>The work around your posts<br/><em>deserves a home, too.</em></h2><p>Hunch is a simple workspace for small creators who want to plan content, keep track of what they publish, and make their next move with more confidence.</p><button className="hero-primary" onClick={() => setView("Home")}>Explore the workspace</button></div><div className="about-values"><article><span>01 · Plan</span><h3>Keep ideas moving</h3><p>Turn a rough thought into a draft and a realistic posting plan, without juggling notes and calendars.</p></article><article><span>02 · Learn</span><h3>Use your own results</h3><p>Bring reach and engagement numbers back into the same place where you plan your next post.</p></article><article><span>03 · Decide</span><h3>Get a useful second opinion</h3><p>Explore how a team of AI roles could turn a pattern into a practical next test. You choose what to do.</p></article></div><div className="about-note"><div><span className="section-kicker">Built for creator control</span><h3>Your channels stay yours.</h3><p>Hunch helps organize the work around social media. You still publish from Instagram, TikTok, or Facebook and decide which ideas fit your voice.</p></div><button className="subtle-link" onClick={() => setView("How to use")}>See how it works</button></div><figure className="about-qr"><img src="/hunch-journey-qr.png" alt="QR code for the Hunch journey" width="240" height="240"/><figcaption><span className="section-kicker">Explore Hunch</span><h3>Take the journey with you.</h3><p>Scan this code with your phone’s camera.</p></figcaption></figure><p className="about-footnote">Hunch is an early prototype. Posting, analytics imports, and AI recommendations are not connected yet; demo insights are labeled as examples.</p></section>}
      {view === "Build notes" && <Build cloud={storageMode === "cloud"} />}
      </div></section>
    <ChatSidebar onDemoImport={importDemoPlatform} open={chatOpen} view={view} onClose={() => setChatOpen(false)} onUseDraft={(draft, suggestedChannel) => { setPostText(draft); setChannel(suggestedChannel ?? "Instagram"); setDate(""); setEditingId(null); setNotice(""); setShowComposer(true); }} />
    {showComposer && <div className="modal-backdrop" role="presentation" onClick={() => setShowComposer(false)}><section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="composer-title" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowComposer(false)} aria-label="Close">×</button><span className="section-kicker">Post planner</span><h2 id="composer-title">{editingId ? "Edit your post" : "Create a post"}</h2><label className="field-label" htmlFor="post-copy">Caption or post idea</label><textarea id="post-copy" value={postText} onChange={e => setPostText(e.target.value)} placeholder="Write a draft or start with a post idea…"/><label className="field-label" htmlFor="channel">Channel</label><select id="channel" value={channel} onChange={e=>setChannel(e.target.value)}>{channels.map(item=><option key={item}>{item}</option>)}</select><label className="field-label" htmlFor="planned-date">Planned date (optional)</label><input id="planned-date" type="date" value={date} onInput={e=>setDate(e.currentTarget.value)} onChange={e=>setDate(e.target.value)}/>{notice && <p role="alert" className="data-note">{notice}</p>}<div className="composer-actions"><button className="back" onClick={() => setShowComposer(false)}>Cancel</button><button className="primary" onClick={() => savePost("Draft")}>Save draft</button><button className="primary publish-button" onClick={() => savePost(date ? "Planned" : "Draft")}>{date ? "Add to plan" : "Save post"}</button></div></section></div>}
    {metricPost && <div className="modal-backdrop" role="presentation" onClick={() => setMetricPost(null)}><section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="metrics-title" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={() => setMetricPost(null)} aria-label="Close">×</button><span className="section-kicker">Post performance</span><h2 id="metrics-title">Add results</h2><p className="data-note">Enter the numbers shown by {metricPost.channel} for this post.</p><label className="field-label" htmlFor="reach">Reach</label><input id="reach" type="number" min="0" value={reach} onChange={e=>setReach(e.target.value)}/><label className="field-label" htmlFor="engagements">Engagements</label><input id="engagements" type="number" min="0" value={engagements} onChange={e=>setEngagements(e.target.value)}/><label className="field-label" htmlFor="ad-spend">Ad spend, ₱ (optional)</label><input id="ad-spend" type="number" min="0" step="0.01" value={spend} onChange={event => setSpend(event.target.value)} /><label className="field-label" htmlFor="conversations">Conversations started (optional)</label><input id="conversations" type="number" min="0" step="1" value={messages} onChange={event => setMessages(event.target.value)} /><p className="data-note">Use the messaging-conversation count from your ad report. Spend and conversations are saved on this device.</p>{notice && <p role="alert" className="data-note">{notice}</p>}<div className="composer-actions"><button className="back" onClick={()=>setMetricPost(null)}>Cancel</button><button className="primary" onClick={saveMetrics}>Save results</button></div></section></div>}
  </main>;
}
