// The warning-sign checklist: questions, the warning each answer can raise, and the glossary.
// Educational only. It never says anything is safe or legitimate; it only points out warning signs.

export type Answer = "yes" | "no" | "unsure";
export type Severity = "stop" | "caution";

export type Question = {
  id: string;
  text: string;
  /** Shown under questions that use a confusing word or idea. */
  hint?: string;
  /** Which answer is the warning sign. "Not sure" always raises a softer "check this first". */
  warnWhen: "yes" | "no";
  severity: Severity;
  warning: { title: string; why: string; next: string };
  /** Glossary entries used by this question. */
  terms: string[];
};

export const questions: Question[] = [
  {
    id: "seed-phrase", text: "Has anyone, or any website or app, asked for your seed phrase or private key?",
    hint: "These are the secret words or code that control a wallet. See the glossary below.",
    warnWhen: "yes", severity: "stop", terms: ["seed-phrase", "private-key"],
    warning: { title: "Someone asked for your seed phrase or private key", why: "Anyone who has these can take everything in the wallet, and it can’t be undone. Real support teams, exchanges, and wallet apps don’t ask for them.", next: "Don’t share them. If you already did, move what’s left to a new wallet you set up yourself, as soon as possible." },
  },
  {
    id: "withdraw-fee", text: "To get money you already have out, were you told to send more first, such as an unexpected “unlock” fee, a “tax” paid to them, or another deposit?",
    hint: "Normal withdrawal or network fees that are shown up front and taken from what you withdraw don’t count here.",
    warnWhen: "yes", severity: "stop", terms: [],
    warning: { title: "Asked to send more before your money is released", why: "Being told to send extra money, pay a surprise unlock fee, pay a “tax” to the person or platform, or make another deposit before you can withdraw is a common sign of a fake platform. Sending it usually leads to more requests, not your money. Taxes are normally paid to a government tax agency, not to whoever is holding your money.", next: "Don’t send more. Stop, keep records of what happened, and report it." },
  },
  {
    id: "guaranteed", text: "Were you promised guaranteed, fixed, or very high returns?",
    warnWhen: "yes", severity: "stop", terms: [],
    warning: { title: "Guaranteed or unusually high returns", why: "No one can guarantee returns on crypto. Prices can drop sharply, and promises like this are a common sign of a scam.", next: "Treat the promise itself as the warning. Don’t send money based on it." },
  },
  {
    id: "contacted-first", text: "Did someone you don’t know well contact you first about this?",
    hint: "For example a message, call, social media account, dating match, or new “friend” or mentor.",
    warnWhen: "yes", severity: "caution", terms: [],
    warning: { title: "Someone reached out to you first", why: "Many crypto scams start with a friendly message or a new online contact who later brings up an opportunity.", next: "Slow down. Check who they are through a source you find yourself, not through links or numbers they give you." },
  },
  {
    id: "pressure", text: "Are you being pushed to act quickly, such as “today only” or “the price is about to jump”?",
    warnWhen: "yes", severity: "caution", terms: [],
    warning: { title: "Pressure to act fast", why: "Urgency is used to stop people from checking details or asking someone else.", next: "Take a day. A real opportunity will still make sense tomorrow." },
  },
  {
    id: "official-link", text: "Did you reach the website or app yourself, by typing its address or using an official app store?",
    hint: "Answer No if you got there from a link in a message, email, ad, or search result you didn’t check.",
    warnWhen: "no", severity: "caution", terms: ["lookalike-site"],
    warning: { title: "You arrived through a link someone else provided", why: "Fake sites can look exactly like real ones, with an address that differs by one or two characters.", next: "Close it and go to the site by typing the address yourself or using the official app." },
  },
  {
    id: "approval", text: "Is a wallet request coming from a site you don’t know or trust, asking for unlimited spending you don’t understand, or pushing you to approve it quickly?",
    hint: "Connecting to and approving on sites you reached yourself and understand is normal. Answer Yes if any part of this question applies. See “wallet approval” below.",
    warnWhen: "yes", severity: "stop", terms: ["wallet", "wallet-approval"],
    warning: { title: "A risky wallet request", why: "An approval can let a program move tokens out of your wallet later, without asking again. Requests from unknown sites, unlimited spending approvals, and approvals you’re rushed into are a common way wallets get emptied.", next: "Don’t approve it. Close the site and go to the project yourself by typing its address. Don’t accept an unlimited approval unless you understand why it’s needed. Many wallets let you review and remove approvals you’ve already given." },
  },
  {
    id: "new-token", text: "Is this a new or little-known token that you haven’t confirmed you could sell later?",
    warnWhen: "yes", severity: "caution", terms: ["token", "liquidity", "rug-pull", "pump-and-dump"],
    warning: { title: "A token you may not be able to sell", why: "With new tokens there may be too few buyers to sell to, the price may be pushed up by a group before they sell, or the creators may pull the money out.", next: "Before buying, find out whether people can actually sell it, and who controls it. A token like this can lose most or all of its value." },
  },
  {
    id: "first-send", text: "Are you sending to an address for the first time without a small test transfer first?",
    warnWhen: "yes", severity: "caution", terms: ["wallet-address", "test-transfer"],
    warning: { title: "Sending to a new address without a test", why: "Crypto transfers usually can’t be reversed. A small test shows the address and network are right before you send the rest.", next: "Send a small amount first, confirm it arrived, then send the rest." },
  },
  {
    id: "network", text: "Are you sure the sending side and the receiving side use the same network?",
    hint: "The same coin can be sent on different networks. The receiver must accept the network you send on.",
    warnWhen: "no", severity: "caution", terms: ["network"],
    warning: { title: "The network might not match", why: "Sending on a network the receiver doesn’t support can make funds lost or very hard to recover.", next: "Check which network the receiver says to use, and pick exactly that one when sending." },
  },
  {
    id: "address-check", text: "After pasting the address, did you check that the first and last several characters match?",
    warnWhen: "no", severity: "caution", terms: ["wallet-address", "address-poisoning"],
    warning: { title: "The address wasn’t double-checked", why: "Some malware swaps a copied address for a different one, and scammers plant lookalike addresses in your history.", next: "Compare the start and end of the pasted address with the one you were given, before you send." },
  },
];

export const glossary: { id: string; term: string; meaning: string }[] = [
  { id: "wallet", term: "Wallet", meaning: "An app or device that holds the keys to your crypto and lets you send and receive it." },
  { id: "wallet-address", term: "Wallet address", meaning: "A long string of letters and numbers that crypto is sent to. It’s safe to share, like an account number." },
  { id: "seed-phrase", term: "Seed phrase (recovery words)", meaning: "A list of words, often 12 or 24, that can restore a wallet anywhere. Anyone who has it controls the wallet." },
  { id: "private-key", term: "Private key", meaning: "The secret code that proves you own a wallet. Like a seed phrase, it should never be shared." },
  { id: "network", term: "Network", meaning: "The blockchain a transfer travels on. The same coin can exist on more than one network, and both sides must use the same one." },
  { id: "test-transfer", term: "Test transfer", meaning: "Sending a small amount first to make sure it arrives before sending the full amount." },
  { id: "wallet-approval", term: "Wallet approval (signing)", meaning: "Giving a website or program permission through your wallet. Some approvals let it move your tokens later." },
  { id: "token", term: "Token", meaning: "A crypto asset created on an existing network. Anyone can create one, including scammers." },
  { id: "liquidity", term: "Liquidity", meaning: "How easily something can be bought or sold without the price moving a lot. Low liquidity can make selling hard or impossible." },
  { id: "rug-pull", term: "Rug pull", meaning: "When a project’s creators take the money that buyers put in and disappear, leaving the token nearly worthless." },
  { id: "pump-and-dump", term: "Pump-and-dump", meaning: "When a group hypes a token to push the price up, then sells, leaving later buyers with losses." },
  { id: "lookalike-site", term: "Lookalike site (phishing)", meaning: "A fake website or app made to look like a real one, to steal logins, seed phrases, or approvals." },
  { id: "address-poisoning", term: "Address poisoning", meaning: "A trick where scammers plant an address that looks like one you use, hoping you copy the wrong one later." },
];

export type Finding = { question: Question; kind: "warning" | "check" };

/** Warnings from the answers given so far. "Not sure" becomes a softer "check this first". Most serious first. */
export function findings(answers: Record<string, Answer | undefined>): Finding[] {
  const list: Finding[] = [];
  for (const question of questions) {
    const answer = answers[question.id];
    if (answer === question.warnWhen) list.push({ question, kind: "warning" });
    else if (answer === "unsure") list.push({ question, kind: "check" });
  }
  const rank = (f: Finding) => f.kind === "check" ? 2 : f.question.severity === "stop" ? 0 : 1;
  return list.sort((a, b) => rank(a) - rank(b));
}

export type Verdict = "not-started" | "in-progress" | "stop" | "caution" | "check" | "none-found";
export function verdict(answers: Record<string, Answer | undefined>): Verdict {
  const answered = questions.filter(q => answers[q.id]).length;
  const found = findings(answers);
  if (found.some(f => f.kind === "warning" && f.question.severity === "stop")) return "stop";
  if (found.some(f => f.kind === "warning")) return "caution";
  if (!answered) return "not-started";
  if (answered < questions.length) return found.length ? "check" : "in-progress";
  return found.length ? "check" : "none-found";
}

export const answeredCount = (answers: Record<string, Answer | undefined>) => questions.filter(q => answers[q.id]).length;
