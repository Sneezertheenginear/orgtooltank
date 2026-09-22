// The collection date records when a project was listed here, not when its app was built.
export const categories = [
  { id: "cars", name: "Cars", description: "Real vehicles. Repairs, questions, and things learned along the way." },
  { id: "tools", name: "Tools", description: "Small utilities for everyday jobs, files, and research." },
  { id: "music", name: "Music", description: "Things to make, explore, or play with sound." },
  { id: "business", name: "Business", description: "Ideas for organizing work, publishing, and business information." },
  { id: "random", name: "Random", description: "Ideas that don’t fit another category." },
] as const;
export type Category = typeof categories[number]["id"];
export const experimentStatuses = ["Browser Ready", "Browser Version In Progress", "Desktop Only For Now", "Untested Experiment", "Needs Browser Conversion"] as const;
export type ExperimentStatus = typeof experimentStatuses[number];
export type Experiment = {
  title: string;
  slug: string;
  description: string;
  category: Category;
  dateAdded: string;
  status: ExperimentStatus;
  image: { src: string; alt: string } | null;
  logo?: { src: string; alt: string };
  tags: string[];
  featured: boolean;
  limitations: string[];
  desktopBenefits: string[];
} & ({ browserAvailable: true; browserRoute: string } | { browserAvailable: false; browserRoute: null })
  & ({ desktopAvailable: true; desktopRoute: string } | { desktopAvailable: false; desktopRoute: null });

// These are catalog entries, not claims about implemented app capabilities.
// Enable availability only when a verified destination is ready for visitors.
function awaitingConversion(title: string, slug: string, category: Category, description: string, tags: string[]): Experiment {
  return {
    title, slug, description, category, tags,
    dateAdded: "2026-09-22", status: "Needs Browser Conversion",
    browserAvailable: false, desktopAvailable: false, browserRoute: null, desktopRoute: null,
    image: null, featured: false,
    limitations: ["There is no browser version to launch here yet.", "The existing project still needs a review before its browser features and limitations can be listed.", "Desktop availability has not been confirmed for this site. You can ask about the existing project or a custom version."],
    desktopBenefits: ["A desktop version could support a workflow that needs more access to local files or the operating system. The details need to be reviewed for this project."],
  };
}
export const experiments: Experiment[] = [
  awaitingConversion("Capital Call Tracker", "capital-call-tracker", "business", "An idea for keeping capital calls and related tracking notes together. Browser conversion is still ahead.", ["tracking", "finance"]),
  awaitingConversion("Crypto Learning Lab", "crypto-learning-lab", "tools", "A place to explore crypto learning ideas. Its browser lessons and features haven’t been prepared yet.", ["learning", "crypto"]),
  awaitingConversion("Full App Researcher", "full-app-researcher", "tools", "A research project to bring into the browser one piece at a time. Scope and features still need review.", ["research"]),
  awaitingConversion("OrgTT Research App", "orgtt-research-app", "tools", "Another research experiment waiting for its browser version. Listed separately from Full App Researcher.", ["research", "notes"]),
  awaitingConversion("POD Chaser", "pod-chaser", "business", "The POD Chaser project, reserved here for a future browser experiment. Its purpose and browser scope still need a project review.", ["project review"]),
  awaitingConversion("Rename Pro", "rename-pro", "tools", "A file-renaming idea waiting for browser conversion. File access and supported operations still need review.", ["files", "renaming"]),
  awaitingConversion("Workplace Case Builder", "workplace-case-builder", "business", "An idea for organizing workplace case information. No browser version is available to enter information into yet.", ["workplace", "organization"]),
  awaitingConversion("Audio Converter", "audio-converter", "music", "An audio conversion project. Supported formats and browser limits will be listed when its conversion is ready.", ["audio", "files"]),
  awaitingConversion("Compliance Watch", "compliance-watch", "business", "A compliance-related project awaiting review and browser conversion. No monitoring service is running here.", ["compliance", "research"]),
  {
    ...awaitingConversion("Duplicate Finder", "duplicate-finder", "tools", "An existing desktop utility for finding exact duplicate files and reviewing copies. A browser version has not been built here.", ["files", "duplicates"]),
    logo: { src: "/duplicate-finder/icon.png", alt: "Duplicate Finder logo" },
    status: "Desktop Only For Now", desktopAvailable: true, desktopRoute: "/tools/duplicate-finder",
    image: { src: "/duplicate-finder/app-preview.png", alt: "Duplicate Finder desktop app preview" },
    limitations: ["No browser version is available here yet.", "The existing desktop page has its own platform, download, and purchase information. Check those details before using it."],
    desktopBenefits: ["The existing desktop app works with local files without uploading them to a website."],
  },
  awaitingConversion("Music Rights Ready", "music-rights-ready", "music", "A music-rights project waiting for a browser version. Its workflow and supported features still need review.", ["music", "rights"]),
  awaitingConversion("Organize My Files", "organize-my-files", "tools", "An idea for making file organization easier. Browser file access and supported actions still need review.", ["files", "organization"]),
  awaitingConversion("OrgToolTank Publisher", "orgtooltank-publisher", "business", "A publishing project to explore in the browser later. No publishing connections are active here.", ["publishing"]),
  awaitingConversion("Pro Tools Beats", "pro-tools-beats", "music", "A beats-related project awaiting browser conversion. Audio features and integrations haven’t been prepared here yet.", ["beats", "audio"]),
  awaitingConversion("Security Inspector", "security-inspector", "tools", "A security inspection idea awaiting review. There is no browser scanner or inspection service running here.", ["security", "inspection"]),
  {
    title: "2007 Mazda 3 Repair Experiment", slug: "mazda-3",
    description: "A growing visual repair and maintenance experiment built while working on a real 2007 Mazda 3 2.3L.",
    category: "cars", dateAdded: "2026-09-22", status: "Browser Ready",
    browserAvailable: true, browserRoute: "/cars/mazda-3-repair",
    desktopAvailable: false, desktopRoute: null,
    image: { src: "/illustrations/mazda-3-graphite.webp", alt: "Graphite illustration of the 2007 Mazda 3" },
    tags: ["repair", "maintenance", "growing experiment"], featured: true,
    limitations: ["This is a growing, untested repair library, not a complete workshop manual.", "Some repair systems are still planned. Engine & Air guides are available.", "The vehicle viewer currently shows a single view; full rotation is still being prepared."],
    desktopBenefits: ["A custom desktop version could keep repair notes and reference material available offline.", "Local photos and job records could be considered as part of a custom request; these features are not built yet."],
  },
];
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}
