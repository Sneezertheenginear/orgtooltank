// Fictional example loads. Carriers and contacts are made up, and emails use the reserved example.com
// domain so a drafted email can't reach anyone. Dates are relative to today so overdue, due today,
// upcoming, review, and ready-to-bill loads always show.
import type { Load, Status } from "./engine";

export function exampleLoads(now = new Date()): Load[] {
  const day = (offset: number) => { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const at = (offset: number, hour: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, 15).toISOString();
  const load = (id: string, loadNumber: string, carrier: string, contactName: string, contactEmail: string, delivered: number, amountCents: number, status: Status, next: number | null, history: [number, number, string][]): Load =>
    ({ id, loadNumber, carrier, contactName, contactEmail, deliveredDate: day(delivered), amountCents, status, nextFollowUp: next === null ? "" : day(next), history: history.map(([d, h, text]) => ({ at: at(d, h), text })) });
  return [
    load("x1", "48217", "Northline Freight (example)", "Marcus Lee", "dispatch@northline.example.com", -6, 328000, "missing", -2, [[-3, 10, "Email logged."], [-5, 9, "Load created."]]),
    load("x2", "48204", "Mendoza Transport (example)", "Elena Mendoza", "elena@mendoza.example.com", -4, 194050, "missing", 0, [[-2, 14, "Call logged. Left a voicemail."], [-4, 16, "Load created."]]),
    load("x3", "48198", "Blue River Logistics (example)", "Sam Carter", "ops@blueriver.example.com", -3, 412575, "missing", 1, [[-1, 11, "Email logged."], [-3, 8, "Load created."]]),
    load("x4", "48186", "Red Oak Trucking (example)", "", "", -2, 165000, "missing", 2, [[-2, 13, "Load created."]]),
    load("x5", "48191", "HaulPro Carriers (example)", "Tina Brooks", "tina@haulpro.example.com", -8, 276000, "review", null, [[-1, 15, "POD received. Waiting for review."], [-3, 10, "Call logged."], [-8, 9, "Load created."]]),
    load("x6", "48172", "Interstate Express (example)", "Priya Shah", "docs@interstate.example.com", -11, 358099, "ready", null, [[-2, 16, "Marked ready to bill."], [-2, 12, "POD received. Waiting for review."], [-11, 9, "Load created."]]),
    load("x7", "48153", "Summit Roadways (example)", "Nora King", "billing@summit.example.com", -14, 489000, "ready", null, [[-3, 10, "Marked ready to bill."], [-4, 15, "POD received. Waiting for review."], [-14, 8, "Load created."]]),
  ];
}
