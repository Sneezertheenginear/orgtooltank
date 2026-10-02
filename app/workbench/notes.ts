import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { findCategory, workbenchCategoryName, type Note, type SidebarKind } from "../data/workbench";

// Workbench articles are Markdown files in content/workbench/. Each file is one article:
//
//   ---
//   title: Keeping Old Computers Alive
//   category: Old Tech / Computers        (one or two categories, separated by / or a comma)
//   date: 2026-10-01
//   description: One or two sentences for the card.
//   image: keeping-old-computers-alive.webp   (a file in public/workbench/notes/, or a /path)
//   imageAlt: What the photo shows           (optional)
//   tags: [repair, linux]                     (optional)
//   ---
//
//   Write the article here in Markdown.
//
// "## What I learned", "## What I'd do differently", and "## Tools & Parts" sections go in the sidebar box,
// when an article has them. Files starting with "_" (like _template.md) are ignored.
// Articles are written by the site owner, so their Markdown (including any HTML in it) is shown as written.

const DIR = path.join(process.cwd(), "content", "workbench");

type Frontmatter = Record<string, string | string[]>;
const unquote = (s: string) => s.trim().replace(/^(["'])(.*)\1$/, "$2").trim();

/** Reads the simple `key: value` block between --- lines at the top of a file. */
function splitFrontmatter(source: string): { data: Frontmatter; body: string } {
  const m = source.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/);
  if (!m) return { data: {}, body: source };
  const data: Frontmatter = {};
  let list: string | null = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && list) { (data[list] as string[]).push(unquote(item[1])); continue; }
    const kv = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    list = null;
    if (!value.trim()) { data[key] = []; list = key; }
    else if (/^\[.*\]$/.test(value.trim())) data[key] = value.trim().slice(1, -1).split(",").map(unquote).filter(Boolean);
    else data[key] = unquote(value);
  }
  return { data, body: m[2] };
}
const text = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : v ?? "").trim();
const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : (v ?? "").split(",")).map(s => s.trim()).filter(Boolean);

/** Which sidebar section a "## …" heading starts, if any. */
function sidebarKind(heading: string): SidebarKind | undefined {
  const h = heading.toLowerCase().replace(/[’‘]/g, "'").replace(/&/g, "and").replace(/\s+/g, " ").trim();
  if (h.startsWith("what i learned")) return "learned";
  if (h.startsWith("what i'd do differently") || h.startsWith("what i would do differently")) return "differently";
  if (h.startsWith("tools and parts")) return "tools";
}
const ORDER: SidebarKind[] = ["learned", "differently", "tools"];

/** Splits the Markdown body into the main article and the sidebar sections (skipping empty ones). */
function splitSidebar(body: string) {
  const main: string[] = [], sections: { kind: SidebarKind; heading: string; lines: string[] }[] = [];
  let current: (typeof sections)[number] | null = null, fenced = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const h = !fenced && line.match(/^(#{1,2})\s+(.+?)\s*#*\s*$/);
    if (h) {
      const kind = h[1] === "##" ? sidebarKind(h[2]) : undefined;
      current = kind ? { kind, heading: h[2], lines: [] } : null;
      if (current) { sections.push(current); continue; }
    }
    (current ? current.lines : main).push(line);
  }
  const sidebar = sections
    .filter(s => s.lines.join("").trim())
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
    .map(s => ({ kind: s.kind, heading: s.heading, html: render(s.lines.join("\n")) }));
  return { main: main.join("\n"), sidebar };
}
const render = (md: string) => marked.parse(md, { gfm: true, async: false });

const warn = (file: string, problem: string) => console.warn(`[workbench] ${file}: ${problem}`);
const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));

function readNote(file: string): Note {
  const { data, body } = splitFrontmatter(fs.readFileSync(path.join(DIR, file), "utf8"));
  const slug = file.replace(/\.md$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const title = text(data.title) || (warn(file, "no title, using the file name"), slug.replace(/-/g, " "));
  const written = text(data.category).split(/\s*[/,]\s*/).filter(Boolean);
  const categories = written.flatMap(c => { const id = findCategory(c); if (!id) warn(file, `“${c}” isn’t a Workbench category, so it won’t appear under a filter`); return id ? [id] : []; });
  const date = text(data.date);
  if (date && !isDate(date)) warn(file, `date “${date}” should look like 2026-10-01`);
  const image = text(data.image);
  const src = !image ? "" : /^(https?:)?\//.test(image) ? image : `/workbench/notes/${image}`;
  if (src.startsWith("/") && process.env.NODE_ENV !== "production" && !fs.existsSync(path.join(process.cwd(), "public", src))) warn(file, `image ${src} isn’t in public/`);
  const { main, sidebar } = splitSidebar(body);
  return {
    slug, title, categories,
    categoryLabel: written.map(c => { const id = findCategory(c); return id ? workbenchCategoryName(id) : c; }).join(" / "),
    date: isDate(date) ? date : "",
    description: text(data.description),
    image: src ? { src, alt: text(data.imageAlt) || title } : undefined,
    tags: list(data.tags),
    bodyHtml: render(main),
    sidebar,
  };
}

/** Every article, newest first (same date: by title). */
export function loadNotes(): Note[] {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter(f => f.toLowerCase().endsWith(".md") && !f.startsWith("_") && !f.startsWith("."))
    .map(readNote)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}
export const loadNote = (slug: string) => loadNotes().find(n => n.slug === slug);
