"use client";

import { useEffect, useMemo, useState } from "react";

type View = "Home" | "Calendar" | "Posts" | "Analytics" | "Insights" | "How to use";
type Post = { id: string; text: string; channel: string; date: string; status: "Draft" | "Planned" | "Posted"; reach?: number; engagements?: number };
const channels = ["Instagram", "TikTok", "Facebook"];
const storeKey = "hunch.creator.posts.v1";

export default function Home() {
  const [view, setView] = useState<View>("Home");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [channel, setChannel] = useState(channels[0]);
  const [date, setDate] = useState("");
  const [notice, setNotice] = useState("");
  const [metricPost, setMetricPost] = useState<Post | null>(null);
  const [reach, setReach] = useState("");
  const [engagements, setEngagements] = useState("");

  useEffect(() => {
    try { setPosts(JSON.parse(localStorage.getItem(storeKey) || "[]")); } catch { setPosts([]); }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(storeKey, JSON.stringify(posts)); }, [loaded, posts]);

  const openComposer = (post?: Post) => {
    setEditingId(post?.id ?? null); setPostText(post?.text ?? ""); setChannel(post?.channel ?? channels[0]);
    setDate(post?.date ?? ""); setNotice(""); setShowComposer(true);
  };
  const savePost = (status: Post["status"]) => {
    if (!postText.trim()) { setNotice("Add a caption or post idea first."); return; }
    const post: Post = { id: editingId ?? crypto.randomUUID(), text: postText.trim(), channel, date, status };
    setPosts(current => editingId ? current.map(item => item.id === editingId ? post : item) : [post, ...current]);
    setShowComposer(false); setNotice(status === "Planned" ? "Added to your plan. Hunch will remind you; it won’t publish automatically." : "Draft saved on this device.");
  };
  const copyCaption = async (post: Post) => {
    try { await navigator.clipboard.writeText(post.text); setNotice("Caption copied. Open " + post.channel + " and publish it there."); }
    catch { setNotice("Copy wasn’t available. Edit the post and copy its caption manually."); }
  };
  const markPosted = (post: Post) => {
    setPosts(current => current.map(item => item.id === post.id ? { ...item, status: "Posted" } : item));
    setNotice("Marked as posted. Add its results when they’re available.");
  };
  const saveMetrics = () => {
    if (!metricPost || !reach || !engagements) return;
    setPosts(current => current.map(item => item.id === metricPost.id ? { ...item, reach: Number(reach), engagements: Number(engagements) } : item));
    setMetricPost(null); setNotice("Performance saved.");
  };
  const totals = useMemo(() => posts.reduce((acc, post) => ({ reach: acc.reach + (post.reach || 0), engagements: acc.engagements + (post.engagements || 0), measured: acc.measured + (post.reach !== undefined ? 1 : 0) }), { reach: 0, engagements: 0, measured: 0 }), [posts]);
  const visiblePosts = view === "Calendar" ? posts.filter(post => post.date).sort((a,b) => a.date.localeCompare(b.date)) : posts;
  const statusClass = (status: Post["status"]) => status === "Posted" ? "published" : status === "Planned" ? "scheduled" : "draft";

  const postRows = (items: Post[]) => items.length ? <div className="week-list">{items.map(post => <article className="week-item" key={post.id}><div className="date-block"><span>{post.date ? new Date(`${post.date}T12:00:00`).toLocaleDateString(undefined,{weekday:"short"}).toUpperCase() : "—"}</span><b>{post.date ? new Date(`${post.date}T12:00:00`).getDate() : "·"}</b></div><div className="week-detail"><strong>{post.text}</strong><small>{post.channel}{post.reach !== undefined ? ` · ${post.reach.toLocaleString()} reach` : ""}</small></div><span className={`status ${statusClass(post.status)}`}>{post.status}</span>{post.status === "Posted" ? <button className="subtle-link" onClick={() => { setMetricPost(post); setReach(String(post.reach ?? "")); setEngagements(String(post.engagements ?? "")); }}>Add results</button> : <button className="subtle-link" onClick={() => openComposer(post)}>Edit</button>}{post.status === "Planned" && <><button className="subtle-link" onClick={() => copyCaption(post)}>Copy caption</button><button className="subtle-link" onClick={() => markPosted(post)}>Mark posted</button></>}</article>)}</div> : <div className="empty-state"><h3>{view === "Calendar" ? "Nothing planned yet" : "Your post library is ready"}</h3><p>Create a draft or add a planned post. They’ll be saved in this browser.</p><button className="primary" onClick={() => openComposer()}>＋ Create a post</button></div>;

  return <main className="creator-app">
    <aside className="sidebar"><a className="brand" href="#"><span className="brand-mark">h</span> hunch</a><div className="workspace-label">CREATOR WORKSPACE</div><nav className="side-nav" aria-label="Main navigation">{(["Home", "Calendar", "Posts", "Analytics", "Insights", "How to use"] as View[]).map(item => <button key={item} className={view === item ? "side-link selected" : "side-link"} onClick={() => setView(item)}><span className="nav-icon">{{ Home: "⌂", Calendar: "▦", Posts: "▤", Analytics: "⌁", Insights: "✳", "How to use": "?" }[item]}</span>{item}</button>)}</nav><div className="sidebar-bottom"><div className="avatar">ER</div><div><strong>Elle Reyes</strong><small>Food creator · local demo</small></div></div></aside>
    <section className="main-panel"><header className="workspace-top"><div className="mobile-brand"><span className="brand-mark">h</span> hunch</div><div className="breadcrumb">My workspace <span>/</span> {view}</div><div className="top-actions"><span className="sample-pill">SAVED ON THIS DEVICE</span><div className="avatar small-avatar">ER</div></div></header>
      <div className="page-content"><div className="welcome-row"><div><p className="eyebrow">CREATOR WORKSPACE</p><h1>{view === "Home" ? "Your social, in one place." : view}</h1><p className="welcome-copy">Plan posts, hand them off to your channels, and track the results.</p></div><button className="primary create-button" onClick={() => openComposer()}>＋ <span>Create a post</span></button></div>
      {notice && <div className="success-note" role="status">{notice}</div>}
      {view === "Home" && <>
        {posts.length === 0 ? <section className="home-start"><span className="section-kicker">GET STARTED</span><h2>What do you want to post?</h2><p>Write a caption, choose a channel, and add it to your plan. You’ll publish it from the social app.</p><button className="primary" onClick={() => openComposer()}>＋ Create your first post</button><button className="subtle-link" onClick={() => setView("How to use")}>See how Hunch works</button></section> : <section className="panel home-task-panel"><div className="panel-head"><div><span className="section-kicker">YOUR NEXT ACTION</span><h2>{posts.some(post => post.status === "Planned") ? "Posts to publish" : "Keep your plan moving"}</h2></div><button className="primary" onClick={() => openComposer()}>＋ New post</button></div>{postRows(posts.filter(post => post.status !== "Posted").sort((a,b) => (a.date || "9999").localeCompare(b.date || "9999")).slice(0,5))}<div className="home-secondary"><button className="subtle-link" onClick={() => setView("Posts")}>All posts ({posts.length}) →</button><button className="subtle-link" onClick={() => setView("Analytics")}>Record performance →</button></div></section>}
      </>}
      {view === "Calendar" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">PLANNING</span><h2>Planned posts</h2></div><button className="primary" onClick={() => openComposer()}>＋ Create a post</button></div>{postRows(visiblePosts)}</section>}
      {view === "Posts" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">CONTENT LIBRARY</span><h2>Your posts</h2></div><button className="primary" onClick={() => openComposer()}>＋ Create a post</button></div>{postRows(visiblePosts)}</section>}
      {view === "Analytics" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">MANUAL RESULTS</span><h2>Performance you’ve recorded</h2></div><span className="evidence-pill">YOUR DATA</span></div><div className="metric-grid analytics-metrics"><article className="metric-card"><span>REACH</span><strong>{totals.measured ? totals.reach.toLocaleString() : "—"}</strong><div className="metric-foot">Across {totals.measured} measured posts</div></article><article className="metric-card"><span>ENGAGEMENTS</span><strong>{totals.measured ? totals.engagements.toLocaleString() : "—"}</strong><div className="metric-foot">Entered by you</div></article><article className="metric-card"><span>POSTS TRACKED</span><strong>{totals.measured}</strong><div className="metric-foot">With a reach value</div></article><article className="metric-card"><span>POSTS TOTAL</span><strong>{posts.length}</strong><div className="metric-foot">In this browser</div></article></div><p className="data-note">Results are not synced from Instagram, TikTok, or Facebook. Mark a post as posted, then add its reach and engagements from the platform.</p><button className="primary" onClick={() => setView("Posts")}>View posts to add results</button></section>}
      {view === "Insights" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">OBSERVATIONS</span><h2>What your data says</h2></div><span className="evidence-pill">BASED ON YOUR ENTRIES</span></div>{totals.measured ? <div className="insight-list"><article><span className="insight-index">01</span><div><h3>You’ve recorded results for {totals.measured} post{totals.measured === 1 ? "" : "s"}.</h3><p>Total reach is {totals.reach.toLocaleString()} and total engagements are {totals.engagements.toLocaleString()}. Record more posts before comparing formats or channels.</p></div></article></div> : <div className="empty-state"><h3>No performance data yet</h3><p>Record reach and engagements for a posted item. Insights will only use numbers you enter.</p><button className="primary" onClick={() => setView("Posts")}>Go to posts</button></div>}</section>}
      {view === "How to use" && <section className="panel full-panel guide-panel"><div className="panel-head"><div><span className="section-kicker">ABOUT THIS POC</span><h2>A simple loop for your social content</h2></div><span className="evidence-pill">PROTOTYPE</span></div><p className="guide-intro">Hunch helps small creators plan posts, keep track of what they publish, and learn from their results in one workspace.</p><div className="guide-flow"><article><span>01 · PLAN</span><h3>Draft and schedule</h3><p>Choose <b>Create a post</b>, write a caption, select a channel, and optionally add a date. Save drafts or add dated posts to your plan.</p><button className="subtle-link" onClick={() => openComposer()}>Create a post →</button></article><article><span>02 · PUBLISH</span><h3>Finish in the social app</h3><p>From a planned post, copy the caption, open Instagram, TikTok, or Facebook, and publish there. Then mark the post as posted in Hunch.</p><button className="subtle-link" onClick={() => setView("Posts")}>Open your posts →</button></article><article><span>03 · TRACK</span><h3>Record real results</h3><p>After publishing, add the reach and engagement numbers shown by that platform. Hunch doesn’t fetch analytics automatically.</p><button className="subtle-link" onClick={() => setView("Analytics")}>View analytics →</button></article><article><span>04 · LEARN</span><h3>Review what you entered</h3><p>Analytics and insights use only the numbers you record here. With more posts, compare results and decide what to try next.</p><button className="subtle-link" onClick={() => setView("Insights")}>View insights →</button></article></div><div className="guide-note"><strong>What this prototype does today</strong><p>Posts and results are saved in this browser on this device. There is no account sync, automatic scheduling, direct publishing, or automatic analytics connection yet.</p></div></section>}
      </div></section>
    {showComposer && <div className="modal-backdrop" role="presentation" onClick={() => setShowComposer(false)}><section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="composer-title" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowComposer(false)} aria-label="Close">×</button><span className="section-kicker">POST PLANNER</span><h2 id="composer-title">{editingId ? "Edit your post" : "Create a post"}</h2><label className="field-label" htmlFor="post-copy">Caption or post idea</label><textarea id="post-copy" value={postText} onChange={e => setPostText(e.target.value)} placeholder="Write a draft or start with a post idea…"/><label className="field-label" htmlFor="channel">Channel</label><select id="channel" value={channel} onChange={e=>setChannel(e.target.value)}>{channels.map(item=><option key={item}>{item}</option>)}</select><label className="field-label" htmlFor="planned-date">Planned date (optional)</label><input id="planned-date" type="date" value={date} onChange={e=>setDate(e.target.value)}/>{notice && <p role="alert" className="data-note">{notice}</p>}<div className="composer-actions"><button className="back" onClick={() => setShowComposer(false)}>Cancel</button><button className="primary" onClick={() => savePost("Draft")}>Save draft</button><button className="primary publish-button" onClick={() => savePost(date ? "Planned" : "Draft")}>{date ? "Add to plan" : "Save post"}</button></div></section></div>}
    {metricPost && <div className="modal-backdrop" role="presentation" onClick={() => setMetricPost(null)}><section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="metrics-title" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={() => setMetricPost(null)} aria-label="Close">×</button><span className="section-kicker">POST PERFORMANCE</span><h2 id="metrics-title">Add results</h2><p className="data-note">Enter the numbers shown by {metricPost.channel} for this post.</p><label className="field-label" htmlFor="reach">Reach</label><input id="reach" type="number" min="0" value={reach} onChange={e=>setReach(e.target.value)}/><label className="field-label" htmlFor="engagements">Engagements</label><input id="engagements" type="number" min="0" value={engagements} onChange={e=>setEngagements(e.target.value)}/><div className="composer-actions"><button className="back" onClick={()=>setMetricPost(null)}>Cancel</button><button className="primary" onClick={saveMetrics}>Save results</button></div></section></div>}
  </main>;
}
