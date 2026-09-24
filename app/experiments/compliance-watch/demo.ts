// Fictional demo tracker. Titles are made-up examples of things a business might choose to track;
// they are not a list of legal requirements for any industry or place. Dates are set relative to
// today so every state (overdue, due soon, upcoming, no date) always shows.
import { addMonths, isoDate, type Tracker } from "./engine";

export function demoTracker(today = new Date()): Tracker {
  const day = (offset: number) => isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));
  const t = isoDate(today);
  return {
    organization: "Example: Harbor Street Bakery (fictional)",
    dueSoonDays: 14,
    items: [
      { id: "demo-1", title: "Example: renew the shop’s annual permit", category: "License / Permit", due: day(-4), status: "In progress", owner: "Sam (example)", notes: "Demo item. Paperwork started; waiting on a signature.", repeatMonths: 12 },
      { id: "demo-2", title: "Example: renew the business insurance policy", category: "Insurance", due: day(9), status: "Current", owner: "Alex (example)", notes: "Demo item. Broker said a quote is coming.", repeatMonths: 12 },
      { id: "demo-3", title: "Example: monthly equipment safety check", category: "Inspection", due: day(20), status: "Current", owner: "Jordan (example)", notes: "Demo item. A repeating check; use Mark Renewed after each one.", repeatMonths: 1, renewed: { on: t, previousDue: addMonths(day(20), -1), previousStatus: "Current" } },
      { id: "demo-4", title: "Example: staff refresher training", category: "Training", due: day(75), status: "Not started", owner: "", notes: "Demo item.", repeatMonths: 6 },
      { id: "demo-5", title: "Example: review the delivery van contract", category: "Contract", due: day(140), status: "Current", owner: "Alex (example)", notes: "Demo item.", repeatMonths: 0 },
      { id: "demo-6", title: "Example: write down where the lease is kept", category: "Other", due: "", status: "Not started", owner: "", notes: "Demo item with no date.", repeatMonths: 0 },
      { id: "demo-7", title: "Example: catering certificate (not needed this year)", category: "Certification", due: day(30), status: "Not applicable", owner: "", notes: "Demo item marked not applicable, so it’s never flagged.", repeatMonths: 0 },
    ],
  };
}
