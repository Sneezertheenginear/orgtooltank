// Fictional demo data for "Juniper & Pine Design Co." — two bank-style CSV exports built in the
// page. No real people, customers, or accounts. The credit card is paid from checking each month,
// which shows how transfers between your own accounts are left out.

const months = [3, 4, 5, 6, 7, 8];
const cents = (value: number) => Math.round(value * 100);
const money = (value: number) => (value / 100).toFixed(2);
const pad = (n: number) => String(n).padStart(2, "0");

export function demoFiles(): { name: string; text: string }[] {
  // Credit card: Capital One style, ISO dates, separate Debit / Credit columns.
  const card: [string, string, number, number][] = [];
  const buy = (m: number, d: number, description: string, amount: number) => card.push([`2026-${pad(m)}-${pad(d)}`, description, cents(amount), 0]);
  const cardTotals = new Map<number, number>();
  for (const m of months) {
    buy(m, 2, "ADOBE *CREATIVE CLOUD", m === 8 ? 69.99 : 59.99);
    buy(m, 6, "DROPBOX*BUSINESS", 19.99);
    buy(m, 9, "GOOGLE WORKSPACE", 14.4);
    buy(m, 11, "FACEBK ADS 8841", 275 + (m % 2) * 15);
    buy(m, 14, "SHELL OIL 57442", 41.18 + m * 1.7);
    buy(m, 27, "SHELL OIL 57442", 52.6 - m * 0.9);
    buy(m, 16, "STAPLES #1187", 58 + ((m * 37) % 90));
    buy(m, 19, "BLUE DOOR CAFE", 14.75 + (m % 3) * 4.1);
    buy(m, 24, "BLUE DOOR CAFE", 21.4 - (m % 2) * 6.3);
  }
  buy(5, 13, "HOLLOWAY PRINT SHOP", 180);
  buy(6, 21, "BEST BUY #512", 2899.99);
  buy(7, 9, "B&H PHOTO VIDEO", 412.5);
  buy(7, 10, "B&H PHOTO VIDEO", 412.5);
  for (const [date, , debit] of card) { const m = +date.slice(5, 7); cardTotals.set(m, (cardTotals.get(m) ?? 0) + debit); }
  for (const m of months.slice(1)) card.push([`2026-${pad(m)}-23`, "AUTOPAY PAYMENT - THANK YOU", 0, cardTotals.get(m - 1)!]);
  card.sort((a, b) => a[0].localeCompare(b[0]));
  const cardCsv = ["Transaction Date,Posted Date,Card No.,Description,Debit,Credit",
    ...card.map(([date, description, debit, credit]) => `${date},${date},4821,${description},${debit ? money(debit) : ""},${credit ? money(credit) : ""}`)].join("\n");

  // Checking: one signed Amount column, US dates.
  const checking: [string, string, number][] = [];
  const add = (m: number, d: number, description: string, amount: number) => checking.push([`${pad(m)}/${pad(d)}/2026`, description, cents(amount)]);
  for (const m of months) {
    add(m, 1, "PINEWOOD PROPERTIES LLC RENT", -1850);
    add(m, 3, "STRIPE PAYOUT", 3120.45 + m * 37);
    add(m, 5, `PAYMENT RECEIVED - HARBOR DENTAL INV 10${m}4`, 3600);
    add(m, 8, "STATE FARM INSURANCE", -189);
    add(m, 12, "VERIZON WIRELESS", -94.2);
    add(m, 15, "GUSTO PAYROLL", -3200);
    add(m, 18, "PG&E WEB ONLINE", -(131.4 + ((m * 23) % 17)));
    add(m, 20, "PAYMENT RECEIVED - MAPLE ST BAKERY", 1150 + m * 40);
    add(m, 25, "ONLINE TRANSFER TO SAVINGS", -500);
    add(m, 28, "MONTHLY SERVICE FEE", -15);
    if (m > 3) add(m, 22, "CARD SERVICES AUTOPAY", -cardTotals.get(m - 1)! / 100);
  }
  add(4, 15, "IRS USATAXPYMT", -2400);
  add(6, 15, "IRS USATAXPYMT", -2400);
  add(7, 17, "STRIPE PAYOUT", 1875.2);
  checking.sort((a, b) => a[0].localeCompare(b[0]));
  const checkingCsv = ["Date,Description,Amount", ...checking.map(([date, description, amount]) => `${date},"${description}",${money(amount)}`)].join("\n");

  return [{ name: "Demo checking.csv", text: checkingCsv }, { name: "Demo credit card.csv", text: cardCsv }];
}
