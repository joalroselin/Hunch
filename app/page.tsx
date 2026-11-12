"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

type View = "Home" | "Calendar" | "Posts" | "Analytics" | "Insights" | "How to use" | "About Hunch" | "Build notes";
type Post = { id: string; text: string; channel: string; date: string; status: "Draft" | "Planned" | "Posted"; reach?: number; engagements?: number; sample?: boolean };
const navItems: View[] = ["Home", "Calendar", "Posts", "Analytics", "Insights", "How to use", "About Hunch", "Build notes"];
const navIcons: Record<View, string> = { Home: "⌂", Calendar: "▦", Posts: "▤", Analytics: "⌁", Insights: "✳", "How to use": "?", "About Hunch": "◉", "Build notes": "◇" };
const navLabels: Partial<Record<View, string>> = { "How to use": "Guide", "About Hunch": "About", "Build notes": "Build" };
const channels = ["Instagram", "TikTok", "Facebook"];
const storeKey = "hunch.creator.posts.v1";
const agents = ["Analyst", "Strategist", "Copywriter", "Skeptic", "Reviewer"];
const sampleWorkspacePosts = (): Post[] => {
  const day = (offset: number) => { const value = new Date(); value.setDate(value.getDate() + offset); return value.toISOString().slice(0,10); };
  return [
    { id: "sample-plan", text: "A 20-minute tapsilog breakfast at home", channel: "Instagram", date: day(1), status: "Planned", sample: true },
    { id: "sample-plan-2", text: "The chili oil I put on absolutely everything", channel: "TikTok", date: day(3), status: "Planned", sample: true },
    { id: "sample-posted", text: "Three-ingredient garlic rice for busy mornings", channel: "TikTok", date: day(-1), status: "Posted", reach: 2680, engagements: 215, sample: true },
    { id: "sample-posted-2", text: "Behind the scenes: our Sunday market haul", channel: "Instagram", date: day(-4), status: "Posted", reach: 1840, engagements: 126, sample: true },
    { id: "sample-draft", text: "Budget lunch series: what ₱100 gets this week", channel: "Facebook", date: "", status: "Draft", sample: true }
  ];
};
const scenarios = [
  { id: "saves", name: "Recipe videos earn saves", evidence: "Example dataset: 6 recipe videos averaged 8.1% saves per reach; 5 product-only posts averaged 4.9%.", insight: "Practical recipe videos appear to earn more saves in this sample.", next: "Try one more 20–30 second recipe video, then compare saves per reach.", draft: "POV: you have 10 minutes and one spoon of chili oil. Here’s my go-to noodle bowl…", caveat: "This is a small sample. Topic, timing, and format may all be contributing; it does not prove recipes caused the lift." },
  { id: "comments", name: "Behind-the-scenes sparks replies", evidence: "Example dataset: 4 process clips averaged 31 comments; 5 polished product shots averaged 14.", insight: "Process clips may be prompting more conversation than polished product shots.", next: "Share one short making-of clip and ask a specific question about the process.", draft: "The part you don’t see: every batch gets taste-tested. Would you go extra garlicky or extra spicy?", caveat: "Comments are not the same as sales or reach. Check whether this pattern repeats before changing your content mix." },
  { id: "low-data", name: "Not enough data yet", evidence: "Example dataset: one post with reach and engagement recorded.", insight: "There is not enough evidence to call a winning format.", next: "Post two different formats this week and record the same metrics for each.", draft: "Try a simple recipe clip and a behind-the-scenes clip; keep the caption style similar so the comparison is easier.", caveat: "One post is too little to separate a real pattern from normal variation." }
];

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
  const [scenarioId, setScenarioId] = useState("saves");
  const [agentsDone, setAgentsDone] = useState(0);
  const [agentsRunning, setAgentsRunning] = useState(false);
  const [agentResultsReady, setAgentResultsReady] = useState(false);
  const hasSamples = posts.some(post => post.sample);
  const addSampleData = () => {
    setPosts(current => current.some(post => post.sample) ? current : [
      ...sampleWorkspacePosts(),
      ...current
    ]);
    setNotice("Example posts added. They are labeled SAMPLE and can be removed any time.");
  };
  const removeSampleData = () => { setPosts(current => current.filter(post => !post.sample)); setNotice("Example posts removed."); };
  const runAgentDemo = async () => {
    setAgentsRunning(true); setAgentResultsReady(false); setAgentsDone(0);
    for (let step = 1; step <= agents.length; step++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAgentsDone(step);
    }
    setAgentsRunning(false); setAgentResultsReady(true);
  };

  useEffect(() => {
    let cancelled = false;
    const openWorkspace = async () => {
      let localPosts: Post[] = [];
      const hasLocalWorkspace = localStorage.getItem(storeKey) !== null;
      try { localPosts = JSON.parse(localStorage.getItem(storeKey) || "[]"); } catch { localPosts = []; }
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
        const cloudPosts: Post[] = (data ?? []).map(row => ({ id: row.id, text: row.caption, channel: row.channel, date: row.post_date ?? "", status: row.status, reach: row.reach ?? undefined, engagements: row.engagements ?? undefined, sample: row.is_sample }));
        if (!cancelled) { setPosts(cloudPosts.length ? cloudPosts : localPosts.length || hasLocalWorkspace ? localPosts : sampleWorkspacePosts()); setStorageMode("cloud"); setLoaded(true); }
      } catch (error) {
        if (!cancelled) { setPosts(localPosts.length || hasLocalWorkspace ? localPosts : sampleWorkspacePosts()); setStorageMode("error"); setStorageMessage(error instanceof Error ? error.message : "Could not connect to cloud storage."); setLoaded(true); }
      }
    };
    void openWorkspace();
    return () => { cancelled = true; };
  }, [supabase]);
  useEffect(() => {
    if (!loaded) return;
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
  }, [loaded, posts, storageMode, supabase]);

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
  const plannedCount = posts.filter(post => post.status === "Planned").length;
  const channelCount = new Set(posts.map(post => post.channel)).size;
  const latestMeasuredPost = posts.filter(post => post.reach !== undefined).sort((a,b) => b.date.localeCompare(a.date))[0];
  const homeQueue = posts.filter(post => post.status !== "Posted").sort((a,b) => (a.date || "9999").localeCompare(b.date || "9999")).slice(0,3);
  const visiblePosts = view === "Calendar" ? posts.filter(post => post.date).sort((a,b) => a.date.localeCompare(b.date)) : posts;
  const statusClass = (status: Post["status"]) => status === "Posted" ? "published" : status === "Planned" ? "scheduled" : "draft";
  const selectedScenario = scenarios.find(scenario => scenario.id === scenarioId) ?? scenarios[0];

  const postRows = (items: Post[]) => items.length ? <div className="week-list">{items.map(post => <article className="week-item" key={post.id}><div className="date-block"><span>{post.date ? new Date(`${post.date}T12:00:00`).toLocaleDateString(undefined,{weekday:"short"}).toUpperCase() : "—"}</span><b>{post.date ? new Date(`${post.date}T12:00:00`).getDate() : "·"}</b></div><div className="week-detail"><strong>{post.text}{post.sample && <span className="sample-tag">SAMPLE</span>}</strong><small>{post.channel}{post.reach !== undefined ? ` · ${post.reach.toLocaleString()} reach` : ""}</small></div><span className={`status ${statusClass(post.status)}`}>{post.status}</span>{post.status === "Posted" ? <button className="subtle-link" onClick={() => { setMetricPost(post); setReach(String(post.reach ?? "")); setEngagements(String(post.engagements ?? "")); }}>Add results</button> : <button className="subtle-link" onClick={() => openComposer(post)}>Edit</button>}{post.status === "Planned" && <><button className="subtle-link" onClick={() => copyCaption(post)}>Copy caption</button><button className="subtle-link" onClick={() => markPosted(post)}>Mark posted</button></>}</article>)}</div> : <div className="empty-state"><h3>{view === "Calendar" ? "Nothing planned yet" : "Your post library is ready"}</h3><p>Create a draft or add a planned post. They’ll be saved in this browser.</p><button className="primary" onClick={() => openComposer()}>＋ Create a post</button></div>;

  if (!loaded) return <main className="workspace-loading" role="status"><div className="magic-orbit" aria-hidden="true"><span>✦</span></div><strong>Opening your workspace</strong><p>Setting up your private demo space…</p></main>;

  return <main className="creator-app">
    <aside className="sidebar"><a className="brand" href="#"><span className="brand-mark">h</span> hunch</a><div className="workspace-label">CREATOR WORKSPACE</div><nav className="side-nav" aria-label="Main navigation">{navItems.map(item => <button key={item} className={view === item ? "side-link selected" : "side-link"} onClick={() => setView(item)}><span className="nav-icon">{navIcons[item]}</span><span className="nav-label">{navLabels[item] ?? item}</span></button>)}</nav><div className="sidebar-bottom"><div className="avatar">ER</div><div><strong>Elle Reyes</strong><small>Food creator · local demo</small></div></div></aside>
    <section className="main-panel"><header className="workspace-top"><div className="mobile-brand"><span className="brand-mark">h</span> hunch</div><div className="breadcrumb">My workspace <span>/</span> {view}</div><div className="top-actions"><span className="sample-pill">{storageMode === "connecting" ? "CONNECTING…" : storageMode === "cloud" ? "CLOUD WORKSPACE" : storageMode === "error" ? "LOCAL BACKUP" : "LOCAL WORKSPACE"}</span><div className="avatar small-avatar">ER</div></div></header>
      <div className="page-content"><div className="welcome-row"><div><p className="eyebrow">CREATOR WORKSPACE</p><h1>{view === "Home" ? "Your creator desk" : view}</h1><p className="welcome-copy">Plan posts, hand them off to your channels, and learn from the results.</p></div>{view !== "Home" && <button className="primary create-button" onClick={() => openComposer()}>＋ <span>Create a post</span></button>}</div>
      {notice && <div className="success-note" role="status">{notice}</div>}
      {storageMode === "error" && <div className="storage-warning" role="status">Cloud workspace isn’t available, so this browser is using local storage. {storageMessage}</div>}
      {view === "Home" && <div className="home-dashboard">
        <section className="home-hero">
          <div className="hero-message"><span className="hero-label">ONE SIMPLE CREATOR LOOP</span><h2>Every post has<br/><em>a next step.</em></h2><p>Shape the idea here. Publish from your social app. Bring the results back and decide what to try next.</p><div className="hero-actions"><button className="hero-primary" onClick={() => openComposer()}>＋ Create a post</button><button className="hero-secondary" onClick={() => setView("Insights")}>See Hunch in action <span>↗</span></button></div></div>
          <div className="workflow-card"><span className="workflow-title">THE HUNCH LOOP</span><div className="workflow-track"><article><span>01</span><b>Plan</b><small>Draft and schedule</small></article><i>→</i><article><span>02</span><b>Publish</b><small>Finish in your app</small></article><i>→</i><article><span>03</span><b>Learn</b><small>Track what happened</small></article></div><div className="workflow-foot"><span className="workflow-spark">✳</span><span>You stay in control at every step.</span></div></div>
        </section>
        <div className="home-stats"><article><span className="stat-number">{String(plannedCount).padStart(2,"0")}</span><div><b>In your plan</b><small>Posts ready for a date</small></div><span className="stat-icon">↗</span></article><article><span className="stat-number">{String(totals.measured).padStart(2,"0")}</span><div><b>Results recorded</b><small>Posts with real numbers</small></div><span className="stat-icon">⌁</span></article><article><span className="stat-number">{String(channelCount).padStart(2,"0")}</span><div><b>Channels in rotation</b><small>Across your workspace</small></div><span className="stat-icon">◉</span></article></div>
        <div className="home-columns">
          <section className="panel home-next-panel"><div className="panel-head"><div><span className="section-kicker">YOUR NEXT ACTION</span><h2>Move these posts forward</h2></div><button className="subtle-link" onClick={() => setView("Posts")}>View all {posts.length} →</button></div>{hasSamples && <div className="sample-banner"><span>DEMO WORKSPACE</span> Sample posts and numbers are labeled. <button className="subtle-link" onClick={removeSampleData}>Clear sample</button></div>}{homeQueue.length ? postRows(homeQueue) : <div className="empty-state"><h3>Your plan is clear</h3><p>Add a post idea and give it a date when you’re ready to move it forward.</p><button className="primary" onClick={() => openComposer()}>＋ Create a post</button><button className="subtle-link" onClick={addSampleData}>Load sample workspace</button></div>}<div className="home-secondary"><button className="subtle-link" onClick={() => setView("Calendar")}>Open calendar →</button><button className="subtle-link" onClick={() => setView("Analytics")}>Review performance →</button></div></section>
          <div className="home-side-stack">
            <section className="panel latest-panel"><div className="panel-head"><div><span className="section-kicker">LATEST RESULT</span><h2>{latestMeasuredPost ? latestMeasuredPost.channel + " · " + (latestMeasuredPost.date ? new Date(`${latestMeasuredPost.date}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"}) : "Posted") : "Results will show here"}</h2></div>{latestMeasuredPost?.sample && <span className="evidence-pill">SAMPLE</span>}</div>{latestMeasuredPost ? <><p className="result-caption">{latestMeasuredPost.text}</p><div className="result-pair"><div><span>REACH</span><b>{latestMeasuredPost.reach?.toLocaleString()}</b></div><div><span>ENGAGEMENTS</span><b>{latestMeasuredPost.engagements?.toLocaleString() ?? "—"}</b></div><div><span>ENGAGEMENT RATE</span><b>{latestMeasuredPost.reach ? `${((latestMeasuredPost.engagements ?? 0) / latestMeasuredPost.reach * 100).toFixed(1)}%` : "—"}</b></div></div><small className="result-foot">Calculated as engagements ÷ reach</small></> : <div className="empty-state compact-empty"><p>After publishing, add the reach and engagements from your social app.</p><button className="subtle-link" onClick={() => setView("Analytics")}>See how results work →</button></div>}<button className="panel-link" onClick={() => setView("Analytics")}>Open analytics <span>→</span></button></section>
            <section className="home-insight"><div><span className="hero-label">HUNCH AGENTS · SAMPLE</span><h3>Turn a pattern into your next post.</h3><p>See a scripted five-role review of creator data, with the caveats left in.</p><button onClick={() => setView("Insights")}>Try the insight demo <span>↗</span></button></div><span className="insight-orbit" aria-hidden="true">✳</span></section>
          </div>
        </div>
      </div>}
      {view === "Calendar" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">PLANNING</span><h2>Planned posts</h2></div><button className="primary" onClick={() => openComposer()}>＋ Create a post</button></div>{postRows(visiblePosts)}</section>}
      {view === "Posts" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">CONTENT LIBRARY</span><h2>Your posts</h2></div><button className="primary" onClick={() => openComposer()}>＋ Create a post</button></div>{postRows(visiblePosts)}</section>}
      {view === "Analytics" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">MANUAL RESULTS</span><h2>Performance you’ve recorded</h2></div><span className="evidence-pill">{hasSamples ? "SAMPLE DATA INCLUDED" : "YOUR DATA"}</span></div><div className="metric-grid analytics-metrics"><article className="metric-card"><span>REACH</span><strong>{totals.measured ? totals.reach.toLocaleString() : "—"}</strong><div className="metric-foot">Across {totals.measured} measured posts</div></article><article className="metric-card"><span>ENGAGEMENTS</span><strong>{totals.measured ? totals.engagements.toLocaleString() : "—"}</strong><div className="metric-foot">Entered by you</div></article><article className="metric-card"><span>POSTS TRACKED</span><strong>{totals.measured}</strong><div className="metric-foot">With a reach value</div></article><article className="metric-card"><span>POSTS TOTAL</span><strong>{posts.length}</strong><div className="metric-foot">In this browser</div></article></div><p className="data-note">Results are not synced from Instagram, TikTok, or Facebook. Mark a post as posted, then add its reach and engagements from the platform.</p>{hasSamples && <button className="subtle-link" onClick={removeSampleData}>Remove sample data</button>}<button className="primary" onClick={() => setView("Posts")}>View posts to add results</button></section>}
      {view === "Insights" && <section className="panel full-panel agent-demo">
        <div className="panel-head"><div><span className="section-kicker">HUNCH AGENTS · DEMO MODE</span><h2>Turn a pattern into your next post</h2></div><span className="evidence-pill">SCRIPTED SIMULATION</span></div>
        <p className="guide-intro">Choose a creator scenario and watch Hunch’s agent team analyze, plan, draft, and review a response.</p>
        <p className="agent-routing-note">Pick the scenario that matches your question. Hunch routes it through the right roles automatically—you don’t need to choose an agent.</p>
        <div className="scenario-bar"><label htmlFor="scenario-select">What are you trying to learn?</label><select id="scenario-select" disabled={agentsRunning} value={scenarioId} onChange={event => { setScenarioId(event.target.value); setAgentResultsReady(false); setAgentsDone(0); }}>{scenarios.map(scenario => <option value={scenario.id} key={scenario.id}>{scenario.name}</option>)}</select><button className="primary" disabled={agentsRunning} onClick={runAgentDemo}>{agentsRunning ? "Working the question…" : agentResultsReady ? "Run again" : "Get a recommendation"}</button></div>
        <div className="agent-team" aria-label="Agent sequence">{agents.map((agent, index) => <div className={"agent-chip" + (agentsDone > index ? " agent-complete" : "") + (agentsRunning && agentsDone === index ? " agent-active" : "")} key={agent}><span>{agentsDone > index ? "✓" : index + 1}</span>{agent}</div>)}</div>
        {agentsRunning && <div className="magic-loader" role="status" aria-live="polite"><div className="magic-orbit" aria-hidden="true"><span>✦</span><i>✧</i><b>✦</b></div><div className="magic-copy"><strong>Connecting the dots</strong><p>{agents[agentsDone] ?? "Hunch"} is working on your question…</p><div className="magic-track"><span style={{ width: `${Math.max(8, agentsDone / agents.length * 100)}%` }} /></div><small>Passing the baton through {agents.length} roles</small></div></div>}
        {agentResultsReady && <div className="agent-output"><div className="evidence-block"><span className="section-kicker">ANALYST · EXAMPLE EVIDENCE</span><p>{selectedScenario.evidence}</p></div><div className="agent-result-grid"><article><span>STRATEGIST · NEXT TEST</span><h3>{selectedScenario.next}</h3></article><article><span>SKEPTIC · LIMITATION</span><p>{selectedScenario.caveat}</p></article></div><article className="agent-draft"><div><span>COPYWRITER · DRAFT</span><p>{selectedScenario.draft}</p></div><button className="primary" onClick={() => { setPostText(selectedScenario.draft); setChannel("Instagram"); setDate(""); setEditingId(null); setShowComposer(true); }}>Use this draft</button></article><div className="review-note"><b>REVIEWER</b> No unsupported sales, health, or performance claims detected in this sample draft. Creator approval is still required.</div></div>}
        <p className="simulation-note">Demo only: agent steps and responses are prewritten scenarios, not live AI and not based on your saved posts. This screen demonstrates the intended interaction.</p>
      </section>}
      {view === "How to use" && <section className="panel full-panel guide-panel"><div className="panel-head"><div><span className="section-kicker">ABOUT THIS POC</span><h2>A simple loop for your social content</h2></div><span className="evidence-pill">PROTOTYPE</span></div><p className="guide-intro">Hunch helps small creators plan posts, keep track of what they publish, and learn from their results in one workspace.</p><div className="guide-flow"><article><span>01 · PLAN</span><h3>Draft and schedule</h3><p>Choose <b>Create a post</b>, write a caption, select a channel, and optionally add a date. Save drafts or add dated posts to your plan.</p><button className="subtle-link" onClick={() => openComposer()}>Create a post →</button></article><article><span>02 · PUBLISH</span><h3>Finish in the social app</h3><p>From a planned post, copy the caption, open Instagram, TikTok, or Facebook, and publish there. Then mark the post as posted in Hunch.</p><button className="subtle-link" onClick={() => setView("Posts")}>Open your posts →</button></article><article><span>03 · TRACK</span><h3>Record real results</h3><p>After publishing, add the reach and engagement numbers shown by that platform. Hunch doesn’t fetch analytics automatically.</p><button className="subtle-link" onClick={() => setView("Analytics")}>View analytics →</button></article><article><span>04 · LEARN</span><h3>Review what you entered</h3><p>Analytics and insights use only the numbers you record here. With more posts, compare results and decide what to try next.</p><button className="subtle-link" onClick={() => setView("Insights")}>View insights →</button></article></div><div className="guide-note"><strong>What this prototype does today</strong><p>{storageMode === "cloud" ? "Posts and results are saved to an isolated anonymous workspace. There is no account recovery, automatic scheduling, direct publishing, or automatic analytics connection yet." : "Posts and results are saved in this browser on this device until cloud storage is configured. There is no account recovery, automatic scheduling, direct publishing, or automatic analytics connection yet."}</p></div></section>}
      {view === "About Hunch" && <section className="panel full-panel about-page"><div className="about-hero"><span className="hero-label">A LITTLE MORE ROOM TO CREATE</span><h2>The work around your posts<br/><em>deserves a home, too.</em></h2><p>Hunch is a simple workspace for small creators who want to plan content, keep track of what they publish, and make their next move with more confidence.</p><button className="hero-primary" onClick={() => setView("Home")}>Explore the workspace <span>→</span></button></div><div className="about-values"><article><span>01 · PLAN</span><h3>Keep ideas moving</h3><p>Turn a rough thought into a draft and a realistic posting plan, without juggling notes and calendars.</p></article><article><span>02 · LEARN</span><h3>Use your own results</h3><p>Bring reach and engagement numbers back into the same place where you plan your next post.</p></article><article><span>03 · DECIDE</span><h3>Get a useful second opinion</h3><p>Explore how a team of AI roles could turn a pattern into a practical next test. You choose what to do.</p></article></div><div className="about-note"><div><span className="section-kicker">BUILT FOR CREATOR CONTROL</span><h3>Your channels stay yours.</h3><p>Hunch helps organize the work around social media. You still publish from Instagram, TikTok, or Facebook and decide which ideas fit your voice.</p></div><button className="subtle-link" onClick={() => setView("How to use")}>See how it works →</button></div><p className="about-footnote">Hunch is an early prototype. Posting, analytics imports, and AI recommendations are not connected yet; demo insights are labeled as examples.</p></section>}
      {view === "Build notes" && <section className="panel full-panel build-page"><div className="panel-head"><div><span className="section-kicker">HACKATHON BUILD</span><h2>One creator workflow, built end to end</h2></div><span className="evidence-pill">WORKING POC</span></div><p className="guide-intro">This page is the project brief for judges: what the prototype demonstrates, how the build maps to the judging buckets, and which parts remain scripted or planned.</p><div className="case-story"><div className="case-mark">E</div><div><span className="section-kicker">ILLUSTRATIVE CASE · NOT A REAL CUSTOMER</span><h3>Elle Reyes, food creator</h3><p>Elle has an idea for a quick recipe video. In Hunch, she drafts it, plans a posting date, copies the caption into TikTok, marks it posted, then records reach and engagements. The example figures in the demo are fictional and labeled SAMPLE.</p></div></div><h3 className="build-subhead">How the build maps to the judging buckets</h3><div className="bucket-grid"><article><div className="bucket-top"><strong>Craftsmanship</strong><b>40%</b></div><p><em>Today's evidence:</em> one responsive path from draft to planning, posting handoff, and manual results. The POC favors a small working loop over disconnected screens.</p><span className="build-state">IN PROTOTYPE</span></article><article><div className="bucket-top"><strong>Agents</strong><b>20%</b></div><p><em>Today's evidence:</em> a scripted five-role simulation shows evidence, strategy, copy, critique, and review. It is demo content, not live AI.</p><span className="build-state planned-state">SIMULATED · MODEL NOT CONNECTED</span></article><article><div className="bucket-top"><strong>Content</strong><b>20%</b></div><p><em>Today's evidence:</em> creators can draft captions and plan posts. Channel-specific adaptation and assisted ideation remain planned work.</p><span className="build-state">PARTIAL</span></article><article><div className="bucket-top"><strong>PH Community</strong><b>20%</b></div><p><em>Today's evidence:</em> the product is aimed at Filipino small creators and influencers. Interviews and credited creator feedback will strengthen the case.</p><span className="build-state">TARGET SET · VALIDATION NEEDED</span></article></div><div className="build-columns"><section><h3>Stack in this POC</h3><ul><li>Next.js 15 App Router</li><li>React 19 and TypeScript</li><li>Custom CSS responsive UI</li><li>Vercel hosting and GitHub deploys</li><li>{storageMode === "cloud" ? "Supabase Postgres, isolated by anonymous visitor" : "Browser storage (Supabase adapter and RLS migration prepared; cloud not connected)"}</li></ul></section><section><h3>Hackathon stack planned</h3><ul><li>Next.js route handlers for agent steps</li><li>Vercel AI SDK with Anthropic provider</li><li>Zod for validated structured outputs</li><li>CSV import and charting for creator metrics</li></ul><p className="data-note">The agent interaction is scripted for the demo; live model calls and analytics integrations are not connected yet.</p></section></div><button className="subtle-link build-guide-link" onClick={() => setView("How to use")}>How to use the live prototype →</button></section>}
      </div></section>
    {showComposer && <div className="modal-backdrop" role="presentation" onClick={() => setShowComposer(false)}><section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="composer-title" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowComposer(false)} aria-label="Close">×</button><span className="section-kicker">POST PLANNER</span><h2 id="composer-title">{editingId ? "Edit your post" : "Create a post"}</h2><label className="field-label" htmlFor="post-copy">Caption or post idea</label><textarea id="post-copy" value={postText} onChange={e => setPostText(e.target.value)} placeholder="Write a draft or start with a post idea…"/><label className="field-label" htmlFor="channel">Channel</label><select id="channel" value={channel} onChange={e=>setChannel(e.target.value)}>{channels.map(item=><option key={item}>{item}</option>)}</select><label className="field-label" htmlFor="planned-date">Planned date (optional)</label><input id="planned-date" type="date" value={date} onChange={e=>setDate(e.target.value)}/>{notice && <p role="alert" className="data-note">{notice}</p>}<div className="composer-actions"><button className="back" onClick={() => setShowComposer(false)}>Cancel</button><button className="primary" onClick={() => savePost("Draft")}>Save draft</button><button className="primary publish-button" onClick={() => savePost(date ? "Planned" : "Draft")}>{date ? "Add to plan" : "Save post"}</button></div></section></div>}
    {metricPost && <div className="modal-backdrop" role="presentation" onClick={() => setMetricPost(null)}><section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="metrics-title" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={() => setMetricPost(null)} aria-label="Close">×</button><span className="section-kicker">POST PERFORMANCE</span><h2 id="metrics-title">Add results</h2><p className="data-note">Enter the numbers shown by {metricPost.channel} for this post.</p><label className="field-label" htmlFor="reach">Reach</label><input id="reach" type="number" min="0" value={reach} onChange={e=>setReach(e.target.value)}/><label className="field-label" htmlFor="engagements">Engagements</label><input id="engagements" type="number" min="0" value={engagements} onChange={e=>setEngagements(e.target.value)}/><div className="composer-actions"><button className="back" onClick={()=>setMetricPost(null)}>Cancel</button><button className="primary" onClick={saveMetrics}>Save results</button></div></section></div>}
  </main>;
}
