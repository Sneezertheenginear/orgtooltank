"use client";
import { useState } from "react";
import { categories, experiments, experimentStatuses } from "../data/experiments";
import ExperimentCard from "../experiment-components/ExperimentCard";
export default function ExperimentBrowser({ initialCategory }: { initialCategory: string }) {
  const [filter, setFilter] = useState(initialCategory);
  const [status, setStatus] = useState("all");
  const [availability, setAvailability] = useState("all");
  const visible = experiments.filter(e => (filter === "all" || filter === "newest" || e.category === filter) && (status === "all" || e.status === status) && (availability === "all" || (availability === "browser" ? e.browserAvailable : e.desktopAvailable))).sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  return <><div className="browse-controls"><div className="filter-list" aria-label="Filter experiments">{[{ id: "all", name: "All" }, { id: "newest", name: "Newest" }, ...categories].map(c => <button key={c.id} aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>{c.name}</button>)}</div><label className="sort-label">Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{experimentStatuses.map(value => <option key={value}>{value}</option>)}</select></label><label className="sort-label">Availability<select value={availability} onChange={e => setAvailability(e.target.value)}><option value="all">All projects</option><option value="browser">Try in browser</option><option value="desktop">Desktop available</option></select></label></div><div aria-live="polite" className="directory-grid">{visible.length ? visible.map(e => <ExperimentCard key={e.slug} experiment={e} />) : <div className="empty-state"><p className="eyebrow">No matching projects.</p><h2>Nothing matches these filters yet.</h2><p>When an idea is ready to play with, it’ll go here.</p><button className="ink-button" onClick={() => { setFilter("all"); setStatus("all"); setAvailability("all"); }}>See all experiments ↗</button></div>}</div></>;
}
