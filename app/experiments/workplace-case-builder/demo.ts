// Fictional example case. The people, company, and events are made up. A few gaps are left on
// purpose so "Things You May Want to Add" has something to show.
import type { CaseFile } from "./engine";

export function exampleCase(): CaseFile {
  return {
    basics: {
      personName: "Jordan Example", employer: "Northfield Supply Co. (fictional)", jobTitle: "Warehouse lead", location: "Distribution center, Riverside site", state: "Ohio", federal: "No",
      description: "After I asked to change my shift for medical appointments, my supervisor started cutting my hours and gave me a written warning I don’t think was fair. I reported it to HR by email and am waiting to hear back.",
    },
    events: [
      { id: "ev-1", date: "2026-03-04", title: "Asked for a shift change", people: "Dana Rivers", description: "I asked Dana in person if I could move to the early shift on Tuesdays for medical appointments. She said she would think about it." },
      { id: "ev-2", date: "2026-03-18", title: "Hours cut on the schedule", people: "Dana Rivers, Sam Ortiz", description: "The new schedule dropped me from 40 to 28 hours. Sam, a coworker, saw the schedule posted and said nobody else lost hours." },
      { id: "ev-3", date: "2026-04-02", title: "Written warning", people: "Dana Rivers and Lee Park", description: "Dana gave me a written warning for being late twice. Lee from HR was in the meeting. Both times were approved appointment days." },
      { id: "ev-4", date: "", title: "Comment in the break room", people: "Sam Ortiz", description: "Sam told me Dana said I was “more trouble than I’m worth.” I think this was in early April." },
    ],
    people: [
      { id: "p-1", name: "Dana Rivers", role: "Supervisor or manager", relationship: "My direct supervisor. Made the schedule and gave the warning." },
      { id: "p-2", name: "Sam Ortiz", role: "Coworker", relationship: "Saw the schedule change and heard the break room comment." },
      { id: "p-3", name: "Lee Park", role: "", relationship: "" },
    ],
    evidence: [
      { id: "e-1", type: "Text message", title: "Text to Dana confirming the shift request", date: "2026-03-04", eventId: "ev-1", why: "Shows the date I asked and that I mentioned medical appointments." },
      { id: "e-2", type: "Photo or screenshot", title: "Photo of the posted schedule", date: "2026-03-18", eventId: "ev-2", why: "Shows my hours went from 40 to 28." },
      { id: "e-3", type: "Work document", title: "Copy of the written warning", date: "2026-04-02", eventId: "ev-3", why: "The dates listed match my appointment days." },
      { id: "e-4", type: "Other record", title: "Appointment reminder cards", date: "", eventId: "", why: "" },
    ],
    actions: [
      { id: "a-1", date: "2026-03-20", action: "Spoke with supervisor", contacted: "Dana Rivers", response: "Said the schedule was based on business needs.", notes: "Talked at the end of my shift. No one else there." },
      { id: "a-2", date: "2026-04-05", action: "Reported to HR", contacted: "Lee Park", response: "", notes: "Sent by email with the schedule photo attached." },
    ],
  };
}
