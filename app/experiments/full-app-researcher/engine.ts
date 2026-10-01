// The app-idea focus check: five idea fields, a five-question focus test, a plain result, and a
// one-page plain-text brief. The result is guidance about scope, never a judgment of the idea itself.

export type Answer = "yes" | "no" | "unsure";

export type FieldId = "problem" | "who" | "job" | "firstVersion" | "leaveOut";
export type Idea = Record<FieldId, string>;

export const fields: { id: FieldId; label: string; heading: string; hint: string; placeholder: string; rows: number }[] = [
  { id: "problem", label: "The problem", heading: "THE PROBLEM", hint: "What goes wrong, or what takes too long, today? Describe it without mentioning the app.", placeholder: "e.g. Dog walkers forget who has paid because it’s all in text messages.", rows: 3 },
  { id: "who", label: "Who has the problem", heading: "WHO HAS THE PROBLEM", hint: "One kind of person, as specific as you can. “Everyone” is too wide to start with.", placeholder: "e.g. Solo dog walkers with 5 to 15 regular clients.", rows: 2 },
  { id: "job", label: "The job in one sentence", heading: "THE JOB IN ONE SENTENCE", hint: "The one thing the app helps them do. If you need “and”, it may be two jobs.", placeholder: "e.g. See which clients still owe for this week’s walks.", rows: 2 },
  { id: "firstVersion", label: "The smallest first version", heading: "THE SMALLEST FIRST VERSION", hint: "The least you could build that still does the job once, start to finish.", placeholder: "e.g. One weekly list: client name, walks done, and a Paid checkbox.", rows: 3 },
  { id: "leaveOut", label: "What to leave out for now", heading: "LEFT OUT FOR NOW", hint: "Good ideas that can wait until the first version has been tried.", placeholder: "e.g. Online payments, scheduling, client logins, reminders.", rows: 3 },
];

export const emptyIdea = (): Idea => ({ problem: "", who: "", job: "", firstVersion: "", leaveOut: "" });

export const questions: { id: string; text: string; hint: string }[] = [
  { id: "one-group", text: "Is the problem mainly for one specific kind of person?", hint: "Yes if you could picture one real person who has it. No if it’s for “anyone” or several very different groups." },
  { id: "one-job", text: "Does the job fit in one sentence without “and”?", hint: "Two jobs joined by “and” usually means two first versions. Pick one." },
  { id: "short-build", text: "Could the smallest first version be ready to try in a few weeks or less?", hint: "A rough guess is fine. If it needs months, it’s probably not the smallest version yet." },
  { id: "can-tell", text: "After someone uses it once, could you tell whether it helped?", hint: "For example, they finished the job faster, or didn’t need their old workaround." },
  { id: "cut-list", text: "Have you left out at least one thing you’d like to build?", hint: "A real leave-out list means you’ve chosen what matters first." },
];

export const answerLabels: Record<Answer, string> = { yes: "Yes", no: "No", unsure: "Not sure" };

export type Result = "focused" | "narrow" | "broad";
export const results: Record<Result, { title: string; text: string }> = {
  focused: { title: "Focused enough to try", text: "The first version sounds small and clear enough to build and put in front of someone. Try it, then decide what comes next." },
  narrow: { title: "Needs narrowing", text: "Part of the idea is still wide or unclear. Look at the questions you answered No or Not sure, tighten that part, and run the test again." },
  broad: { title: "Too broad for a first version", text: "It reads more like a full product than a first version. Pick one person and one job, move the rest to the leave-out list, and try again." },
};
export const GUIDANCE_NOTE = "This is guidance about scope, not a score of whether the idea is good or bad.";

export const answeredCount = (answers: Record<string, Answer | undefined>) => questions.filter(q => answers[q.id]).length;

/** The result once every question has an answer; null until then. */
export function focusResult(answers: Record<string, Answer | undefined>): Result | null {
  if (answeredCount(answers) < questions.length) return null;
  const no = questions.filter(q => answers[q.id] === "no").length, unsure = questions.filter(q => answers[q.id] === "unsure").length;
  if (no >= 3 || no + unsure >= 4) return "broad";
  if (no === 0 && unsure <= 1) return "focused";
  return "narrow";
}

export const hasContent = (idea: Idea) => fields.some(f => idea[f.id].trim());

/** The one-page plain-text brief. `date` is YYYY-MM-DD. */
export function briefText(idea: Idea, answers: Record<string, Answer | undefined>, date: string): string {
  const result = focusResult(answers);
  const lines = ["APP IDEA BRIEF", `Written ${date} with Full App Researcher (OrgToolTank)`, ""];
  for (const f of fields) lines.push(f.heading, idea[f.id].trim() || "(not written yet)", "");
  lines.push("FOCUS TEST");
  questions.forEach((q, i) => lines.push(`${i + 1}. ${q.text} ${answers[q.id] ? answerLabels[answers[q.id]!] : "(not answered)"}`));
  lines.push("", `RESULT: ${result ? results[result].title : "Not finished (answer all 5 questions)"}`);
  if (result) lines.push(results[result].text);
  lines.push("", GUIDANCE_NOTE, "");
  return lines.join("\n");
}

export function briefFileName(idea: Idea, date: string): string {
  const words = idea.job.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean).slice(0, 6).join("-");
  return `app-brief-${words ? `${words}-` : ""}${date}.txt`;
}

export const exampleIdea = (): Idea => ({
  problem: "Dog walkers forget who has paid because payments and walk times are scattered across text messages.",
  who: "Solo dog walkers with 5 to 15 regular clients.",
  job: "See which clients still owe for this week’s walks.",
  firstVersion: "One weekly list: client name, number of walks done, amount owed, and a Paid checkbox.",
  leaveOut: "Online payments, scheduling, client logins, route maps, and reminders.",
});
export const exampleAnswers = (): Record<string, Answer> => Object.fromEntries(questions.map(q => [q.id, "yes"]));
