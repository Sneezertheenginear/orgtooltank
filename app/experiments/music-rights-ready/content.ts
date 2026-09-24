// All guidance text lives here so it can be reviewed in one place. It deliberately contains no fees,
// prices, revenue shares, deadlines, or policy details: those change, so each item points to the
// organization's own website instead.

export const LINKS_CHECKED = "September 23, 2026";

export const officialLinks = [
  { id: "ascap", name: "ASCAP", url: "https://www.ascap.com/", about: "U.S. performing rights organization" },
  { id: "bmi", name: "BMI", url: "https://www.bmi.com/", about: "U.S. performing rights organization" },
  { id: "sesac", name: "SESAC", url: "https://www.sesac.com/", about: "U.S. performing rights organization" },
  { id: "gmr", name: "GMR (Global Music Rights)", url: "https://globalmusicrights.com/", about: "U.S. performing rights organization" },
  { id: "mlc", name: "The MLC", url: "https://www.themlc.com/", about: "U.S. digital audio mechanical royalties for songs" },
  { id: "soundexchange", name: "SoundExchange", url: "https://www.soundexchange.com/", about: "U.S. digital performance royalties for recordings" },
  { id: "copyright", name: "U.S. Copyright Office", url: "https://www.copyright.gov/registration/", about: "Copyright registration" },
] as const;

export const explainers = {
  composition: "The composition is the song itself: the lyrics, melody, and songwriting. The people who wrote it share it.",
  master: "The master is the actual recorded audio. Whoever paid for or made the recording may own it, and that isn’t always the songwriters.",
  pro: "A performing rights organization (PRO) collects performance royalties for songwriters and publishers when a song is played in public, on the radio, on TV, streamed, or performed live. In the U.S. these include ASCAP, BMI, SESAC, and GMR. A songwriter usually belongs to one PRO at a time.",
  copyright: "Copyright registration is separate from PRO registration. A PRO helps collect performance royalties; copyright registration creates a public record of a work with the U.S. Copyright Office. The song and the recording are separate works.",
  distributor: "A distributor delivers your recording to streaming services and stores. Distribution doesn’t usually change who owns the song or the recording, but read each distributor’s own terms.",
};

export type Stage = "Before release" | "At release" | "Around and after release";
export type ItemId = "splits" | "splitSheet" | "master" | "proJoin" | "proRegister" | "publishing" | "copyright" | "releaseDetails" | "isrc" | "upc" | "soundexchange" | "records";

/** The fixed checklist. `detail` is plain guidance; nothing here is an official requirement. */
export const items: { id: ItemId; stage: Stage; title: string; detail: string; links?: string[] }[] = [
  { id: "splits", stage: "Before release", title: "Agree on the songwriting splits", detail: "Decide, together, what share of the song (the composition) each songwriter has. Shares usually add up to 100%. Producers and featured artists only share in the song if everyone agrees they helped write it." },
  { id: "splitSheet", stage: "Before release", title: "Put the splits in writing", detail: "A split sheet lists every songwriter, their share, and their signature and date. It’s much easier to agree now than after the song earns money. The printed checklist includes a draft split sheet." },
  { id: "master", stage: "Before release", title: "Write down who owns the recording", detail: "Record who owns the master and in what shares. If a producer gets “points” (a share of recording income) instead of ownership, put that in a separate written agreement." },
  { id: "proJoin", stage: "Before release", title: "Each songwriter joins or confirms a PRO", detail: "Each songwriter who wants performance royalties affiliates with a PRO. Check the organization’s current official requirements and fees before joining.", links: ["ascap", "bmi", "sesac", "gmr"] },
  { id: "publishing", stage: "Before release", title: "Understand the publisher share", detail: "Songwriting income is often split into a writer’s share and a publisher’s share. If you have no publisher, you may be self-published, and you may need to set up your publishing side or use a publishing administrator to collect it. The MLC handles U.S. digital audio mechanical royalties for songs.", links: ["mlc"] },
  { id: "copyright", stage: "Before release", title: "Consider copyright registration", detail: "Registration is optional but creates a public record. Gather the title, the authors, who owns it, and the publication date if released. The song and the recording are separate works. Check current options and fees on the official site.", links: ["copyright"] },
  { id: "releaseDetails", stage: "At release", title: "Prepare your release details", detail: "A distributor may ask for the artist name, song title, songwriter names, release date, the final audio file, and artwork. Spell every name exactly the same way everywhere." },
  { id: "isrc", stage: "At release", title: "Get an ISRC for the recording", detail: "An ISRC identifies this specific recording. Many distributors can assign one for you. Keep a note of it; you’ll use it for other registrations." },
  { id: "upc", stage: "At release", title: "Get a UPC for the release, if applicable", detail: "A UPC identifies the release (the single, EP, or album) rather than the recording. Distributors often provide one." },
  { id: "proRegister", stage: "Around and after release", title: "Register the song with your PRO", detail: "List the title, every songwriter, and their agreed shares, matching your split sheet. Each songwriter’s PRO may need the song registered. Check the organization’s current requirements.", links: ["ascap", "bmi", "sesac", "gmr"] },
  { id: "soundexchange", stage: "Around and after release", title: "Review SoundExchange, if it applies", detail: "SoundExchange handles U.S. digital performance royalties for sound recordings, for recording artists and recording owners. Something to review if it applies to your recording.", links: ["soundexchange"] },
  { id: "records", stage: "Around and after release", title: "Keep your records together", detail: "Keep the split sheet, recording and producer agreements, any sample permissions, registration confirmations, and your ISRC/UPC in one safe place." },
];

/** Step 04 asks about these directly; they share the same status as the full checklist. */
export const registrationItems: ItemId[] = ["proJoin", "proRegister", "copyright", "isrc", "upc", "soundexchange"];

export const DISCLAIMER = "Music Rights Ready is an educational organization tool, not legal or financial advice. Rules, fees, and registration procedures can change. Confirm current requirements with the relevant official organization before filing or releasing music.";
