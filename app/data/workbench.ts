// The Workbench categories. The articles themselves are Markdown files in content/workbench/
// (see app/workbench/notes.ts); nothing needs to be added here for a new article.

export const workbenchCategories = [
  { id: "computers", name: "Computers" },
  { id: "electronics", name: "Electronics" },
  { id: "programming", name: "Programming" },
  { id: "audio", name: "Audio" },
  { id: "repair", name: "Repair" },
  { id: "buying-tips", name: "Buying Tips" },
  { id: "old-tech", name: "Old Tech" },
  { id: "projects", name: "Projects" },
  { id: "tools-parts", name: "Tools & Parts" },
] as const;
export type WorkbenchCategory = typeof workbenchCategories[number]["id"];
export const workbenchCategoryName = (id: WorkbenchCategory) => workbenchCategories.find(c => c.id === id)!.name;

const simplify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
/** Matches a category as written in an article ("Old Tech", "old-tech", "Tools and Parts") to a known one. */
export const findCategory = (text: string): WorkbenchCategory | undefined =>
  workbenchCategories.find(c => simplify(c.name) === simplify(text) || simplify(c.id) === simplify(text))?.id;

/** An optional sidebar section, written in the article as one of these headings. */
export type SidebarKind = "learned" | "differently" | "tools";

export type Note = {
  /** From the file name: content/workbench/<slug>.md → /workbench/<slug> */
  slug: string;
  title: string;
  /** The known categories this article is filed under (used by the filters). */
  categories: WorkbenchCategory[];
  /** The category line as shown on the card, e.g. "Old Tech / Computers". */
  categoryLabel: string;
  /** YYYY-MM-DD, or "" if it's missing or not a date. */
  date: string;
  description: string;
  image?: { src: string; alt: string };
  tags: string[];
  /** The article, rendered from Markdown (without the sidebar sections). */
  bodyHtml: string;
  /** Sidebar sections the article actually has, in a fixed order. */
  sidebar: { kind: SidebarKind; heading: string; html: string }[];
};
