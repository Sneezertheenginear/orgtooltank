// The site's one way for visitors to send something back: an email to the maker. Nothing is stored or posted.
//
// Every contact action (Workbench notes, experiments, the Shop, custom builds) is described the same way,
// as source + title + reason, and this file turns that into:
//   - the subject, in a fixed format Gmail filters can sort on: "Workbench — Experience — <title>"
//   - a short starter message the visitor can edit or delete
//   - a mailto link (opens the visitor's own email app), or a Contact page link with the same message filled in.

export const CONTACT_EMAIL = "orgtooltank@gmail.com";

/**
 * Where a message comes from: the subject prefix (keep these, Gmail filters rely on them), the Gmail label
 * those filters sort it into, and that label's color. The label and a dot in its color are shown under each
 * email action ("● Gmail: Workbench"); the colors match the Gmail labels.
 */
export const CONTACT_SOURCES = {
  workbench: { prefix: "Workbench", about: "Workbench note", gmail: "Workbench", gmailColor: "#4a86e8" },      // blue
  experiment: { prefix: "Experiment", about: "Experiment", gmail: "Experiments", gmailColor: "#16a766" },     // green
  shop: { prefix: "Shop", about: "Shop", gmail: "Shop", gmailColor: "#e8453c" },                             // red
  "custom-build": { prefix: "Custom Build", about: "Custom build", gmail: "Custom Builds", gmailColor: "#f6a13a" }, // orange
} as const;
export type ContactSource = keyof typeof CONTACT_SOURCES;
/** The Gmail label a source's emails are sorted into, and its color. Display only; it doesn't change the email. */
export const gmailLabel = (source: ContactSource) => CONTACT_SOURCES[source].gmail;
export const gmailColor = (source: ContactSource) => CONTACT_SOURCES[source].gmailColor;

/** Why someone's writing, per source: the subject's middle part and the starter message. */
const REASONS = {
  workbench: {
    experience: { label: "Experience", action: "Send me your experience", intro: "I'm writing about this Workbench note:", ask: "Here's what I wanted to add:" },
    "better-way": { label: "Better Way", action: "Found a better way?", intro: "I'm writing about this Workbench note:", ask: "Here's another way I've handled it:" },
    correction: { label: "Correction", action: "Found something wrong?", intro: "I'm writing about this Workbench note:", ask: "Here's what I think may need correcting:" },
  },
  experiment: {
    worked: { label: "Worked", action: "It worked", intro: "I used:", ask: "Here's what worked for me:" },
    problem: { label: "Problem", action: "Something went wrong", intro: "I used:", ask: "Here's what went wrong:" },
    suggestion: { label: "Suggestion", action: "I have an idea", intro: "I used:", ask: "Here's an idea I had:" },
    // The "About this experiment" page's feedback box (it keeps its own starter questions).
    feedback: { label: "Feedback", action: "Email feedback to the maker", intro: "I used:", ask: "Here's my feedback:", choice: false },
  },
  shop: {
    question: { label: "Question", action: "Ask about this", intro: "I have a question about:", ask: "Here's what I'd like to know:" },
    similar: { label: "Similar Request", action: "Request something similar", intro: "I'm looking for something similar to:", ask: "Here's what I have in mind:" },
  },
  "custom-build": {
    request: { label: "Request", action: "Ask about a custom build", intro: "I'm interested in a custom build related to:", ask: "Here's what I'm trying to make or solve:" },
    // Request an App (its message is the visitor's reviewed form draft).
    "app-request": { label: "App Request", action: "Request an app", intro: "I'd like a custom app:", ask: "Here's what it should do:", choice: false },
  },
} as const;
export type ContactReason<S extends ContactSource> = keyof (typeof REASONS)[S] & string;
/** `choice: false` keeps a reason off the Contact page's list of choices (it's used by one specific form). */
type ReasonInfo = { label: string; action: string; intro: string; ask: string; choice?: boolean };

/** One contact action. Each source only accepts its own reasons (a Workbench note can't be "worked"). */
export type ContactRequest = { [S in ContactSource]: {
  source: S;
  /** The article, experiment, item, or category it's about. May be empty: the subject then ends at the reason. */
  title: string;
  reason: ContactReason<S>;
  /** Replaces the standard starter message. */
  starter?: string;
} }[ContactSource];

const reasonInfo = (source: ContactSource, reason: string): ReasonInfo | undefined => (REASONS[source] as Record<string, ReasonInfo>)[reason];
/** The reasons a source offers, in order (e.g. a Workbench note: experience, better way, correction). */
export const reasonsFor = (source: ContactSource) =>
  Object.entries(REASONS[source] as Record<string, ReasonInfo>).map(([id, r]) => ({ id, label: r.label, action: r.action, choice: r.choice !== false }));

/** The finished message: subject, starter text, and a plain-words line saying what it's about. */
export function contactMessage({ source, title, reason, starter }: ContactRequest) {
  const r = reasonInfo(source, reason)!, s = CONTACT_SOURCES[source];
  return {
    subject: [s.prefix, r.label, title].filter(Boolean).join(" — "),
    body: starter ?? `${r.intro}\n\n${title}\n\n${r.ask}\n\n`,
    about: title ? `${s.about}: ${title}` : s.about,
  };
}

/** A mailto link with the subject and message filled in. */
export function mailtoHref(subject: string, body = "") {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;
}
/** Opens the visitor's email app with this request's subject and starter message. */
export function contactHref(request: ContactRequest) {
  const m = contactMessage(request);
  return mailtoHref(m.subject, m.body);
}

/** The Contact page with this message filled in, for visitors without an email app. Reason is optional there. */
export function contactPageHref(source: ContactSource, title: string, reason?: string) {
  const q = new URLSearchParams({ about: source, title });
  if (reason) q.set("reason", reason);
  return `/contact?${q}`;
}

/** Reads the Contact page's ?about=…&title=…&reason=… back into a request, ignoring anything it doesn't recognise. */
export function contactFromQuery(q: { about?: string; title?: string; reason?: string }): ContactRequest | null {
  const source = q.about && q.about in CONTACT_SOURCES ? (q.about as ContactSource) : null;
  const title = (q.title ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
  if (!source || !title) return null;
  const choices = reasonsFor(source).filter(r => r.choice);
  const reason = q.reason && choices.some(r => r.id === q.reason) ? q.reason : choices[0].id;
  return { source, title, reason } as ContactRequest;
}
