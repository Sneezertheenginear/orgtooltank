import Link from "next/link";
import Shell from "../experiment-components/Shell";
import { categories, experiments } from "../data/experiments";
export const metadata = { title: "Categories" };
export default function CategoriesPage() {
 return <Shell><div className="wrap page-space"><p className="eyebrow">A place for every kind of idea</p><h1 className="page-title">See what’s here.</h1><p className="page-intro">Not everything has something in it yet. That’s part of the experiment.</p><div className="category-grid">{categories.map((c, i) => { const count = experiments.filter(e => e.category === c.id).length; return <Link key={c.id} className="category-drawer" href={`/experiments?category=${c.id}`}><span className="eyebrow">0{i + 1} / {count ? `${count} experiment${count === 1 ? "" : "s"}` : "Future category"}</span><h2>{c.name} ↗</h2><p>{c.description}</p></Link>; })}</div></div></Shell>;
}
