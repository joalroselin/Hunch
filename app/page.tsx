"use client";

import { useState } from "react";

type View = "Home" | "Calendar" | "Posts" | "Analytics" | "Insights";
const week = [
  { day: "MON", date: "12", title: "A quick weeknight recipe", channel: "Instagram", status: "Published" },
  { day: "TUE", date: "13", title: "Behind the small batch", channel: "TikTok", status: "Scheduled · 6:30 PM" },
  { day: "WED", date: "14", title: "The chili oil taste test", channel: "Instagram · Facebook", status: "Draft" },
  { day: "THU", date: "15", title: "Three ways to use the last spoon", channel: "Instagram", status: "Scheduled · 11:00 AM" },
];
const channels = [
  { name: "Instagram", initials: "ig", color: "pink", note: "Demo workspace" },
  { name: "TikTok", initials: "♪", color: "black", note: "Demo workspace" },
  { name: "Facebook", initials: "f", color: "blue", note: "Demo workspace" },
];

export default function Home() {
  const [view, setView] = useState<View>("Home");
  const [showComposer, setShowComposer] = useState(false);
  const [postText, setPostText] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);

  const saveDraft = () => {
    if (postText.trim()) {
      setDraftSaved(true);
      setShowComposer(false);
      setView("Posts");
    }
  };

  return <main className="creator-app">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark">h</span> hunch</a>
      <div className="workspace-label">CREATOR WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {(["Home", "Calendar", "Posts", "Analytics", "Insights"] as View[]).map((item) => <button key={item} className={view === item ? "side-link selected" : "side-link"} onClick={() => setView(item)}><span className="nav-icon">{{ Home: "⌂", Calendar: "▦", Posts: "▤", Analytics: "⌁", Insights: "✳" }[item]}</span>{item}</button>)}
      </nav>
      <div className="sidebar-bottom"><div className="avatar">ER</div><div><strong>Elle Reyes</strong><small>Food creator</small></div><span className="more">···</span></div>
    </aside>

    <section className="main-panel">
      <header className="workspace-top"><div className="mobile-brand"><span className="brand-mark">h</span> hunch</div><div className="breadcrumb">My workspace <span>/</span> {view}</div><div className="top-actions"><span className="sample-pill">SAMPLE WORKSPACE</span><button className="icon-button" aria-label="Notifications">♧</button><div className="avatar small-avatar">ER</div></div></header>

      <div className="page-content">
        <div className="welcome-row"><div><p className="eyebrow">MONDAY, NOVEMBER 12</p><h1>{view === "Home" ? "Your social, in one place." : view}</h1><p className="welcome-copy">Plan what to post, publish across channels, and see what’s resonating.</p></div><button className="primary create-button" onClick={() => { setDraftSaved(false); setShowComposer(true); }}>＋ <span>Create a post</span></button></div>

        {view === "Home" && <>
          <div className="channel-strip"><div><span className="section-kicker">YOUR CHANNELS</span><span className="muted-mini">Demo account status</span></div><div className="channel-list">{channels.map((c) => <div className="channel-chip" key={c.name}><span className={`channel-icon ${c.color}`}>{c.initials}</span><span>{c.name}</span><span className="channel-state">Preview</span></div>)}<button className="add-channel" onClick={() => setView("Posts")}>＋ Add channel</button></div></div>
          <div className="metric-grid"><article className="metric-card"><span>POSTS THIS WEEK</span><strong>4 <small>of 5</small></strong><div className="metric-foot">1 draft · 2 scheduled · 1 published</div></article><article className="metric-card"><span>REACH</span><strong>12.8k</strong><div className="metric-foot"><i>↗ 8.4%</i> vs. last week</div></article><article className="metric-card"><span>ENGAGEMENT RATE</span><strong>6.2<small>%</small></strong><div className="metric-foot"><i>↗ 0.8%</i> vs. last week</div></article><article className="metric-card"><span>LINK CLICKS</span><strong>348</strong><div className="metric-foot"><i>↗ 12%</i> vs. last week</div></article></div>
          <div className="dashboard-grid"><section className="panel calendar-panel"><div className="panel-head"><div><span className="section-kicker">YOUR WEEK</span><h2>Content calendar</h2></div><button className="subtle-link" onClick={() => setView("Calendar")}>View calendar ↗</button></div><div className="week-list">{week.map((item) => <article className="week-item" key={item.date}><div className="date-block"><span>{item.day}</span><b>{item.date}</b></div><div className="week-detail"><strong>{item.title}</strong><small>{item.channel}</small></div><span className={item.status === "Published" ? "status published" : item.status === "Draft" ? "status draft" : "status scheduled"}>{item.status}</span><button className="more">···</button></article>)}</div></section>
            <section className="panel insight-panel"><div className="panel-head"><div><span className="section-kicker">A NOTE FROM HUNCH</span><h2>One thing to notice</h2></div><span className="spark">✳</span></div><div className="insight-copy"><span className="evidence-pill">SAMPLE INSIGHT</span><h3>Your recipe posts are getting more saves.</h3><p>In this sample week, quick recipe posts earned 24% more saves than product-only posts. Consider showing one simple way to use the chili oil in your next post.</p></div><button className="subtle-link" onClick={() => setView("Insights")}>Explore insights ↗</button></section></div>
          <section className="panel recent-panel"><div className="panel-head"><div><span className="section-kicker">RECENT PERFORMANCE</span><h2>What’s working across channels</h2></div><button className="subtle-link" onClick={() => setView("Analytics")}>Open analytics ↗</button></div><div className="chart-placeholder"><div className="chart-legend"><span><i className="legend-dot reach-dot"/>Reach</span><span><i className="legend-dot engagement-dot"/>Engagement</span><span className="evidence-pill">SAMPLE DATA</span></div><div className="chart-bars">{[38,55,44,72,58,88,66,98,75,84,63,92].map((height,i) => <div className="chart-column" key={i}><span style={{height:`${height}%`}}/><i style={{height:`${Math.max(14,height*.38)}%`}}/></div>)}</div><div className="chart-axis"><span>Nov 1</span><span>Nov 5</span><span>Nov 9</span><span>Nov 12</span></div></div></section>
        </>}

        {view === "Calendar" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">NOVEMBER 9 – 15</span><h2>This week’s plan</h2></div><button className="primary" onClick={() => setShowComposer(true)}>＋ Create a post</button></div><div className="calendar-cards">{week.map((item) => <article className="calendar-card" key={item.date}><span>{item.day} · NOV {item.date}</span><h3>{item.title}</h3><p>{item.channel}</p><span className={item.status === "Published" ? "status published" : item.status === "Draft" ? "status draft" : "status scheduled"}>{item.status}</span></article>)}</div></section>}

        {view === "Posts" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">CONTENT LIBRARY</span><h2>Your posts</h2></div><button className="primary" onClick={() => setShowComposer(true)}>＋ Create a post</button></div>{draftSaved && <div className="success-note">Draft saved to your workspace.</div>}<div className="week-list">{week.map((item) => <article className="week-item" key={item.date}><div className="date-block"><span>{item.day}</span><b>{item.date}</b></div><div className="week-detail"><strong>{item.title}</strong><small>{item.channel}</small></div><span className={item.status === "Published" ? "status published" : item.status === "Draft" ? "status draft" : "status scheduled"}>{item.status}</span><button className="subtle-link" onClick={() => setShowComposer(true)}>Edit</button></article>)}</div></section>}

        {view === "Analytics" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">LAST 7 DAYS</span><h2>Performance across channels</h2></div><span className="evidence-pill">SAMPLE DATA</span></div><div className="metric-grid analytics-metrics"><article className="metric-card"><span>REACH</span><strong>12.8k</strong><div className="metric-foot">Across 3 channels</div></article><article className="metric-card"><span>ENGAGEMENTS</span><strong>794</strong><div className="metric-foot">Likes, comments, saves, shares</div></article><article className="metric-card"><span>LINK CLICKS</span><strong>348</strong><div className="metric-foot">From posts with a tracked link</div></article><article className="metric-card"><span>TOP CHANNEL</span><strong>Instagram</strong><div className="metric-foot">By engagement rate</div></article></div><p className="data-note">Sample figures demonstrate the workspace. Connect a channel or import its report to see your own analytics.</p></section>}

        {view === "Insights" && <section className="panel full-panel"><div className="panel-head"><div><span className="section-kicker">OBSERVATIONS & IDEAS</span><h2>What to do next</h2></div><span className="evidence-pill">SAMPLE INSIGHTS</span></div><div className="insight-list"><article><span className="insight-index">01</span><div><span className="evidence-pill">FROM SAMPLE ANALYTICS</span><h3>Recipe posts are earning more saves.</h3><p>Try another quick recipe format this week and compare saves per reach.</p></div></article><article><span className="insight-index">02</span><div><span className="evidence-pill suggestion-pill">SUGGESTION</span><h3>Try a short behind-the-scenes video.</h3><p>A simple prep clip could give followers a closer look at how you make your small batches.</p></div></article></div></section>}
      </div>
    </section>

    {showComposer && <div className="modal-backdrop" role="presentation" onClick={() => setShowComposer(false)}><section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="composer-title" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowComposer(false)} aria-label="Close">×</button><span className="section-kicker">NEW POST</span><h2 id="composer-title">What would you like to share?</h2><label className="field-label" htmlFor="post-copy">Post idea or draft</label><textarea id="post-copy" value={postText} onChange={e => setPostText(e.target.value)} placeholder="Write a draft, or start with a simple idea…"/><div className="modal-channels"><span className="section-kicker">PREVIEW FOR</span>{channels.map(c => <span className="channel-chip" key={c.name}><span className={`channel-icon ${c.color}`}>{c.initials}</span>{c.name}</span>)}</div><div className="composer-actions"><button className="back" onClick={() => setShowComposer(false)}>Cancel</button><button className="primary" onClick={saveDraft}>Save draft</button><button className="primary publish-button" onClick={saveDraft}>Schedule post →</button></div></section></div>}
  </main>;
}
