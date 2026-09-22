import type { ReactNode } from "react";

/**
 * Content model for an Engine & Air part page, rendered by PartGuideTemplate.
 *
 * To add a new part page:
 *   1. Create guides/<slug>.tsx exporting a PartGuide (the slug must exist in parts.ts).
 *   2. Register it in guides/index.ts.
 * Art is optional; a labeled placeholder is shown until it exists.
 * Only set `oemPartNumber` once it has been verified; otherwise the page says so.
 */
export type KeyItem = { marker: string; label: string; detail: string };

export type FigureContent = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  caption: string;
  key?: KeyItem[];
  note?: string;
  art?: ReactNode;
};

export type GuideSection = { heading: string; body?: string; items?: string[]; note?: string };

export type PartGuide = {
  partName: string;
  system: string;
  status: string;
  oemPartNumber?: string;
  partFigure: FigureContent;
  locationFigure: FigureContent;
  notes: { title: string; text: string }[];
  sections: GuideSection[];
  guideOutline: { title: string; text: string }[];
};
