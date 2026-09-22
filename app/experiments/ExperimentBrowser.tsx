"use client";
import { useState } from "react";
import { categories, experiments, experimentStatuses } from "../data/experiments";
import ExperimentCard from "../experiment-components/ExperimentCard";
import { useFeedbackCollection } from "../experiment-components/feedback-store";
// Public ranking can replace the local feedback collection later.
export default function ExperimentBrowser({ initialCategory }: { initialCategory: string }) {
  const [filter, setFilter] = useState(initialCategory);
  const [status, setStatus] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("newest");
  const feedback = useFeedbackCollection(experiments.map(e => e.slug));
  const visible = experiments.filter(e => (filter === "all" || filter === "newest" || e.category === filter) && (status === "all" || e.status === status) && (availability === "all" || (availability === "browser" ? e.browserAvailable : e.desktopAvailable))).sort((a, b) => {
    const score = (slug: string) => sort === "liked" ? Number(feedback[slug]?.vote === "like") : (feedback[slug]?.comments.length ?? 0);
    return sort === "newest" ? b.dateAdded.localeCompare(a.dateAdded) : score(b.slug) - score(a.slug) || b.dateAdded.localeCompare(a.dateAdded);
  });
  return <><div className="browse-controls"><div className="filter-list" aria-label="Filter experiments">{[{ id: "all", name: "All" }, { id: "newest", name: "Newest" }, ...categories].map(c => <button key={c.id} aria-pressed={filter === c.id} onClick={() => { setFilter(c.id); if(c.id === "newest") setSort("newest"); }}>{c.name}</button>)}</div><label className="sort-label">Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{experimentStatuses.map(value => <option key={value}>{value}</option>)}</select></label><label className="sort-label">Availability<select value={availability} onChange={e => setAvailability(e.target.value)}><option value="all">All projects</option><option value="browser">Try in browser</option><option value="desktop">Desktop available</option></select></label><label className="sort-label">Sort by <select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest</option><option value="liked">Most Liked</option><option value="discussed">Most Discussed</option></select></label></div><p className="small-note">Counts and activity sorting reflect this browser only. Public feedback isn’t connected yet.</p><div aria-live="polite" className="directory-grid">{visible.length ? visible.map(e => <ExperimentCard key={e.slug} experiment={e} />) : <div className="empty-state"><p className="eyebrow">No matching projects.</p><h2>Nothing matches these filters yet.</h2><p>When an idea is ready to play with, it’ll go here.</p><button className="ink-button" onClick={() => { setFilter("all"); setStatus("all"); setAvailability("all"); }}>See all experiments ↗</button></div>}</div></>;
}
