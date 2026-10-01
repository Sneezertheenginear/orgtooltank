import Link from "next/link";
import Shell from "../experiment-components/Shell";
import { categories, experiments } from "../data/experiments";
export const metadata = { title: "Categories" };
// Shop isn't an experiment category (it holds products, not experiments), so it's added here
// rather than to the experiment categories, which also drive the experiment filters.
type Drawer = { id: string; name: string; description: string; href: string; label: string };
const drawers: Drawer[] = categories.flatMap<Drawer>(c => {
  const count = experiments.filter(e => e.category === c.id).length;
  const drawer: Drawer = { id: c.id, name: c.name, description: c.description, href: `/experiments?category=${c.id}`, label: count ? `${count} experiment${count === 1 ? "" : "s"}` : "Future category" };
  return c.id === "business" ? [drawer, { id: "shop", name: "Shop", description: "Original clothing, accessories, and physical products from OrgToolTank.", href: "/shop", label: "Coming soon" }] : [drawer];
});
export default function CategoriesPage() {
 return <Shell><div className="wrap page-space"><p className="eyebrow">A place for every kind of idea</p><h1 className="page-title">See what’s here.</h1><p className="page-intro">Not everything has something in it yet. That’s part of the experiment.</p><div className="category-grid">{drawers.map((c, i) => <Link key={c.id} className="category-drawer" href={c.href}><span className="eyebrow">{String(i + 1).padStart(2, "0")} / {c.label}</span><h2>{c.name} ↗</h2><p>{c.description}</p></Link>)}</div></div></Shell>;
}
