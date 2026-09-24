// Fictional demo calls. Fund and entity names are made up. Dates are set relative to today so every
// state (overdue, due soon, later, paid) always shows.
import { isoDate, type Call } from "./engine";

export function demoCalls(today = new Date()): Call[] {
  const day = (offset: number) => isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));
  return [
    { id: "demo-1", fund: "Example: Northgate Growth Fund III (fictional)", entity: "Example: Rivera Family Trust", amount: 125000, due: day(-3), notice: "Call notice #7", notes: "Demo call. Wire instructions confirmed by phone.", status: "Outstanding" },
    { id: "demo-2", fund: "Example: Harbor Real Estate Partners II (fictional)", entity: "Example: Rivera Holdings LLC", amount: 48500.5, due: day(6), notice: "Notice dated this month", notes: "Demo call.", status: "Outstanding" },
    { id: "demo-3", fund: "Example: Summit Co-Invest (fictional)", entity: "Example: Rivera Family Trust", amount: 20000, due: day(24), notice: "", notes: "Demo call with no notice reference.", status: "Outstanding" },
    { id: "demo-4", fund: "Example: Northgate Growth Fund III (fictional)", entity: "Example: Rivera Family Trust", amount: 90000, due: day(58), notice: "Call notice #8", notes: "Demo call due later.", status: "Outstanding" },
    { id: "demo-5", fund: "Example: Harbor Real Estate Partners II (fictional)", entity: "Example: Rivera Holdings LLC", amount: 62000, due: day(-40), notice: "Call notice #3", notes: "Demo call already paid.", status: "Paid", paidOn: day(-42) },
  ];
}
