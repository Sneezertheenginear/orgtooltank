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
  /** One-line browser vs desktop comparison, shown when both versions exist. */
  versionSummary?: { browser: string; desktop: string };
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
  {
    ...awaitingConversion("Capital Call Tracker", "capital-call-tracker", "business", "Track the capital calls you enter, see what’s overdue or due in the next 30 days, and mark calls paid. Saved only in your browser.", ["tracking", "finance", "local-first"]),
    logo: { src: "/capital-call-tracker/mark.svg", alt: "Capital Call Tracker logo" },
    status: "Browser Ready", browserAvailable: true, browserRoute: "/experiments/capital-call-tracker/try",
    limitations: ["A tracking tool, not financial, legal, or tax advice. It doesn’t verify amounts against fund documents.", "One currency (US dollars), up to 500 calls. It tracks calls only: no commitments, distributions, or document uploads.", "Saved only in this browser on this device. Clearing browser data removes it, so download a CSV now and then.", "No reminders are sent. Check the list for what’s overdue or due soon."],
    desktopBenefits: ["Keep call notices and wire confirmations with each call.", "Track commitments and what’s still unfunded for each fund.", "Local reminders before calls are due, even when no browser is open."],
  },
  awaitingConversion("Crypto Learning Lab", "crypto-learning-lab", "tools", "A place to explore crypto learning ideas. Its browser lessons and features haven’t been prepared yet.", ["learning", "crypto"]),
  awaitingConversion("Full App Researcher", "full-app-researcher", "tools", "A research project to bring into the browser one piece at a time. Scope and features still need review.", ["research"]),
  awaitingConversion("OrgTT Research App", "orgtt-research-app", "tools", "Another research experiment waiting for its browser version. Listed separately from Full App Researcher.", ["research", "notes"]),
  awaitingConversion("POD Chaser", "pod-chaser", "business", "The POD Chaser project, reserved here for a future browser experiment. Its purpose and browser scope still need a project review.", ["project review"]),
  {
    ...awaitingConversion("Rename Pro", "rename-pro", "tools", "Rename files locally in your browser. Preview changes, preserve extensions, and download renamed copies in one ZIP.", ["files", "renaming", "local-first"]),
    status: "Browser Ready", browserAvailable: true, browserRoute: "/experiments/rename-pro",
    limitations: ["Downloads renamed copies; original files stay untouched.", "ZIP batches are limited to 250 MB and 1,000 files.", "No folder access, presets, or history in this browser experiment."],
    desktopBenefits: ["Work directly with folders and rename files in place.", "Larger workflows, History and Undo, and deeper filesystem access."],
  },
  awaitingConversion("Workplace Case Builder", "workplace-case-builder", "business", "An idea for organizing workplace case information. No browser version is available to enter information into yet.", ["workplace", "organization"]),
  {
    ...awaitingConversion("Audio Converter", "audio-converter", "music", "Convert MP3 to WAV or WAV to MP3 locally in your browser. Pick an MP3 bitrate, convert one file, and download the result.", ["audio", "mp3", "wav", "local-first"]),
    logo: { src: "/audio-converter/icon.svg", alt: "Audio Converter logo" },
    status: "Browser Ready", browserAvailable: true, browserRoute: "/experiments/audio-converter/try",
    limitations: ["Converts one file at a time, MP3 to WAV or WAV to MP3. Your audio stays on your device during conversion.", "Files up to 100 MB and 15 minutes long. Conversion uses your browser’s memory, so long files can be slow on phones.", "MP3 output is constant bitrate (128–320 kbps); audio that isn’t 32, 44.1, or 48 kHz is resampled to 44.1 kHz. WAV output is 16-bit.", "Tags and cover art aren’t copied, and converting to the same format isn’t offered."],
    desktopBenefits: ["Larger files and long recordings without browser memory limits.", "Batch conversion of many files or whole folders.", "More formats, such as FLAC, AAC/M4A, and OGG.", "Deeper control over bitrate, VBR, sample rate, and channels.", "Stronger local file integration, like saving next to the original file."],
  },
  {
    ...awaitingConversion("Where Did My Money Go?", "where-did-my-money-go", "business", "I made money. Where did it go? Import bank and card CSV files, or try the demo, and see money in, money out, and where the rest went.", ["money", "csv", "local-first"]),
    dateAdded: "2026-09-23",
    logo: { src: "/where-did-my-money-go/mark.svg", alt: "Where Did My Money Go? logo" },
    status: "Browser Ready", browserAvailable: true, browserRoute: "/experiments/where-did-my-money-go/try",
    limitations: ["Reads CSV exports only. There are no bank, Stripe, Square, PayPal, or payroll connections, and Excel files need to be saved as CSV first.", "Everything stays in this page’s memory. Nothing is uploaded or saved, so refreshing or closing the page clears it.", "Up to 10 MB and 50,000 rows at a time. Regular-charge detection works best with about three months of history.", "Estimates based only on the transactions you provide. Not accounting, tax, or financial advice."],
    desktopBenefits: ["Keep your history between visits, stored privately on your own computer.", "Month-over-month comparisons, alerts, and more planning tools.", "Saved category rules that apply to every future import."],
  },
  {
    ...awaitingConversion("Compliance Watch", "compliance-watch", "business", "Track the licenses, permits, insurance, inspections, and renewals you enter, and see what’s overdue or due soon. Saved only in your browser.", ["compliance", "deadlines", "renewals", "local-first"]),
    logo: { src: "/compliance-watch/mark.svg", alt: "Compliance Watch logo" },
    status: "Browser Ready", browserAvailable: true, browserRoute: "/experiments/compliance-watch/try",
    limitations: ["An organization tool, not legal advice. It tracks only what you enter and doesn’t determine which laws or regulations apply to you.", "One organization at a time, up to 500 items. No document uploads; use Notes for where paperwork is kept.", "Saved only in this browser on this device. Clearing browser data removes it, so download a backup now and then.", "No reminders are sent. You can export a calendar file, and any reminders then come from your own calendar app."],
    desktopBenefits: ["Attach documents and keep them with each requirement.", "Track people and equipment, with renewal history over time.", "Local notifications before things are due, even when no browser is open."],
  },
  {
    ...awaitingConversion("Duplicate Finder", "duplicate-finder", "tools", "Find identical files in a folder you choose, right in your browser. Review each group, choose the copy to keep, and download a cleanup list.", ["files", "duplicates", "local-first"]),
    logo: { src: "/duplicate-finder/mark.svg", alt: "Duplicate Finder logo" },
    status: "Browser Ready", browserAvailable: true, browserRoute: "/experiments/duplicate-finder/try",
    desktopAvailable: true, desktopRoute: "/tools/duplicate-finder",
    image: { src: "/duplicate-finder/app-preview.png", alt: "Duplicate Finder desktop app preview" },
    versionSummary: { browser: "Quick duplicate scanning directly in your browser. Your files stay on your device.", desktop: "Deeper computer access for larger scans and file-management features." },
    limitations: ["Finds and reports duplicates without deleting, moving, or changing anything. You remove copies yourself using the cleanup list.", "Up to 20,000 files per scan, and up to 4 GB of same-size files compared by SHA-256.", "Scans only the folders and files you choose. On iPhone and iPad, choose individual files; folder selection isn’t available there.", "Empty files and system items such as .DS_Store, .git, and node_modules are skipped."],
    desktopBenefits: ["Deeper computer access for larger scans and file-management features. See the desktop page for platform, download, and purchase details."],
  },
  {
    ...awaitingConversion("Music Rights Ready", "music-rights-ready", "music", "For one song: who wrote it, who owns the recording, and what to register before and after release. A plain-English checklist that stays on your device.", ["music", "rights", "checklist", "local-first"]),
    logo: { src: "/music-rights-ready/mark.svg", alt: "Music Rights Ready logo" },
    status: "Browser Ready", browserAvailable: true, browserRoute: "/experiments/music-rights-ready/try",
    limitations: ["One song at a time. Albums, EPs, and catalogs aren’t covered in this version.", "An educational organization tool, not legal or financial advice. It doesn’t register anything and isn’t connected to BMI, ASCAP, SESAC, GMR, The MLC, SoundExchange, the U.S. Copyright Office, or any distributor.", "Guidance is general and U.S.-focused. Fees and procedures aren’t listed because they change; check each organization’s official site.", "Saved progress, if you turn it on, stays only in this browser on this device and is lost if you clear browser data."],
    desktopBenefits: ["Keep many songs and projects together, saved as files on your own computer.", "Attach the final audio, artwork, and agreements to each song.", "Track registration records and release details over time."],
  },
  {
    ...awaitingConversion("Organize My Files", "organize-my-files", "tools", "Sort a messy folder into tidy categories right in your browser. Preview where everything goes, then download an organized ZIP.", ["files", "organization", "local-first"]),
    logo: { src: "/organize-my-files/mark.svg", alt: "Organize My Files logo" },
    status: "Browser Ready", browserAvailable: true, browserRoute: "/experiments/organize-my-files/try",
    limitations: ["Creates organized copies in a ZIP. Your original files are never moved, renamed, or changed.", "Up to 2,000 files and 500 MB at a time. You’ll need free space for the ZIP.", "Folders you already made stay whole. Empty folders aren’t included, because browsers don’t expose them.", "On iPhone and iPad, choose individual files; folder selection isn’t available there. Files stored only in the cloud may need downloading first."],
    desktopBenefits: ["Organize folders in place instead of downloading copies.", "Undo for the last batch of changes.", "Larger folders without browser memory limits."],
  },
  awaitingConversion("OrgToolTank Publisher", "orgtooltank-publisher", "business", "A publishing project to explore in the browser later. No publishing connections are active here.", ["publishing"]),
  awaitingConversion("Pro Tools Beats", "pro-tools-beats", "music", "A beats-related project awaiting browser conversion. Audio features and integrations haven’t been prepared here yet.", ["beats", "audio"]),
];
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}
