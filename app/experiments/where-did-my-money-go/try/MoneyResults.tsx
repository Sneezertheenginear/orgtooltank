"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { formatDate, formatMoney, inPeriod, monthsOf, periodLabel, spendingByCategory, summarize, topMerchants, type Choices, type Period, type Txn } from "../engine";
import { averageMonthlyLeft, detectDuplicates, detectRecurring, dollarsToCents, estimateGoal, monthsCovered, summaryCsv } from "../insights";
import { RULES } from "../rules";
import { NextStep } from "../../../experiment-components/Guidance";

type Props = { txns: Txn[]; files: string[]; demo: boolean; setChoices: Dispatch<SetStateAction<Choices>>; onEditColumns?: () => void; onStartOver: () => void };
const SHOWN = 40;
const baseCategories = [...new Set(RULES.map(rule => rule.category).filter(category => category !== "Money In" && category !== "Transfer"))].sort();

export default function MoneyResults({ txns, files, demo, setChoices, onEditColumns, onStartOver }: Props) {
  const [period, setPeriod] = useState<Period>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState(SHOWN);
  const [goalName, setGoalName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [monthly, setMonthly] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState("");

  const months = useMemo(() => monthsOf(txns), [txns]);
  const inRange = useMemo(() => inPeriod(txns, period), [txns, period]);
  const totals = useMemo(() => summarize(inRange), [inRange]);
  const categories = useMemo(() => spendingByCategory(inRange), [inRange]);
  const merchants = useMemo(() => topMerchants(inRange), [inRange]);
  const recurring = useMemo(() => detectRecurring(txns), [txns]);
  const duplicates = useMemo(() => detectDuplicates(txns), [txns]);
  const average = useMemo(() => averageMonthlyLeft(txns), [txns]);
  const covered = useMemo(() => monthsCovered(txns), [txns]);
  const transfers = inRange.filter(txn => txn.transfer);
  const categoryOptions = [...new Set([...baseCategories, ...txns.map(txn => txn.category)])].filter(category => category !== "Transfer").sort();
  const largest = categories[0]?.cents ?? 0;
  const suggested = average.cents > 0 ? (average.cents / 100).toFixed(2) : "";
  const monthlyText = monthly ?? suggested;
  const goalTarget = dollarsToCents(target), goalSaved = dollarsToCents(saved || "0"), goalMonthly = dollarsToCents(monthlyText || "0");
  const estimate = goalTarget && goalSaved !== null && goalMonthly !== null ? estimateGoal(goalTarget, goalSaved, goalMonthly, new Date()) : null;

  const setCategory = (txn: Txn, category: string) => setChoices(current => ({ ...current, merchantCategories: { ...current.merchantCategories, [txn.merchantKey]: category } }));
  const setTransfer = (txn: Txn, transfer: boolean) => setChoices(current => ({ ...current, transferOverrides: { ...current.transferOverrides, [txn.id]: transfer } }));
  const categoryIsTransfer = (category: string) => setChoices(current => ({ ...current, transferCategories: [...new Set([...current.transferCategories, category])] }));
  const toggle = (key: string) => { setOpen(current => current === key ? null : key); setShown(SHOWN); };

  function download() {
    const goal = estimate && goalTarget ? { name: goalName, targetCents: goalTarget, savedCents: goalSaved ?? 0, monthlyCents: goalMonthly ?? 0, estimate } : undefined;
    const blob = new Blob([summaryCsv({ period, files, totals, categories, recurring, duplicates, goal })], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = `where-did-my-money-go-${period}.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setDownloaded(`Summary downloaded as ${anchor.download}. It was created on your device.`);
  }

  const list = (rows: Txn[], allowCategory: boolean) => <>
    <div className="money-table-scroll"><table className="money-table money-txns"><thead><tr><th scope="col">Date</th><th scope="col">Description</th><th scope="col" className="num">Amount</th>{allowCategory && <th scope="col">Category</th>}<th scope="col">Transfer?</th></tr></thead>
      <tbody>{rows.slice(0, shown).map(txn => <tr key={txn.id}>
        <td>{formatDate(txn.date)}</td>
        <td><span className="money-desc">{txn.description}</span><span className="money-account">{txn.account}</span></td>
        <td className="num">{formatMoney(txn.amountCents, { sign: true })}</td>
        {allowCategory && <td><label><span className="sr-only">Category for {txn.merchant}</span><select value={txn.category} onChange={event => setCategory(txn, event.target.value)}>{categoryOptions.map(option => <option key={option}>{option}</option>)}</select></label></td>}
        <td><label className="money-check"><input type="checkbox" checked={txn.transfer} onChange={event => setTransfer(txn, event.target.checked)} /><span className="sr-only">Transfer between my accounts:</span> {txn.transfer ? "Yes" : "No"}</label></td>
      </tr>)}</tbody></table></div>
    {rows.length > shown && <button type="button" className="text-link money-more" onClick={() => setShown(count => count + SHOWN)}>Show {Math.min(SHOWN, rows.length - shown)} more of {rows.length.toLocaleString()}</button>}
  </>;

  return <div className="money-results">
    <section className="money-panel" aria-labelledby="money-totals-heading">
      <div className="money-panel-head">
        <div><p className="eyebrow">03 / Money in, money out</p><h2 id="money-totals-heading">{demo ? "Demo: Juniper & Pine Design Co." : `From ${files.length} ${files.length === 1 ? "file" : "files"}`}</h2></div>
        <label className="money-period">Period<select value={period} onChange={event => { setPeriod(event.target.value as Period); setOpen(null); }}>
          <option value="all">All months</option>{months.length > 3 && <option value="last3">Last 3 months</option>}
          {months.map(month => <option key={month} value={month}>{periodLabel(month as Period)}</option>)}
        </select></label>
      </div>
      {demo && <p className="small-note">Fictional demo data. Every number below comes from two sample CSV files built into this page.</p>}
      <dl className="money-tiles">
        <div><dt>Money In</dt><dd>{formatMoney(totals.moneyIn)}</dd><span>{totals.inCount.toLocaleString()} deposits and payments</span></div>
        <div><dt>Money Out</dt><dd>{formatMoney(totals.moneyOut)}</dd><span>{totals.outCount.toLocaleString()} charges and payments</span></div>
        <div className={totals.left < 0 ? "is-negative" : ""}><dt>Actually Left</dt><dd>{formatMoney(totals.left)}</dd><span>{totals.left < 0 ? "More went out than came in" : "Money In minus Money Out"}</span></div>
      </dl>
      <p className="small-note">{periodLabel(period)}. {totals.transfers ? `${totals.transfers.toLocaleString()} transfers between your own accounts (like card payments and savings transfers) aren’t counted as money in or out.` : "No transfers between your own accounts were found."}{onEditColumns && <> <button type="button" className="text-link" onClick={onEditColumns}>Check the columns again</button></>}</p>
      <NextStep>Scroll down to see where the money went, regular charges, and anything worth a second look.</NextStep>
    </section>

    <section className="money-panel" aria-labelledby="money-where-heading">
      <p className="eyebrow">04 / Where it went</p>
      <h2 id="money-where-heading">{categories.length ? `${categories[0].category} took the most: ${formatMoney(categories[0].cents)}` : "No spending in this period"}</h2>
      <p className="money-lede">Select a category to see what’s inside and fix anything that landed in the wrong place. Changes last only until you leave this page.</p>
      <ul className="money-bars">{categories.map(row => {
        const rows = inRange.filter(txn => !txn.transfer && txn.amountCents < 0 && txn.category === row.category).sort((a, b) => a.amountCents - b.amountCents);
        return <li key={row.category}>
          <button type="button" className="money-bar" aria-expanded={open === row.category} onClick={() => toggle(row.category)}>
            <span className="money-bar-label"><strong>{row.category}</strong><span>{formatMoney(row.cents)} · {Math.round(row.share * 100)}%</span></span>
            <span className="money-bar-track" aria-hidden="true"><span style={{ width: `${Math.max(1, (row.cents / largest) * 100)}%` }} /></span>
          </button>
          {open === row.category && <div className="money-drill">
            {list(rows, true)}
            <button type="button" className="text-link" onClick={() => { categoryIsTransfer(row.category); setOpen(null); }}>Treat all of “{row.category}” as transfers between my accounts</button>
          </div>}
        </li>;
      })}</ul>
      <div className="money-transfers">
        <button type="button" className="money-bar is-muted" aria-expanded={open === "__transfers"} onClick={() => toggle("__transfers")}>
          <span className="money-bar-label"><strong>Not counted: transfers</strong><span>{transfers.length.toLocaleString()} {transfers.length === 1 ? "transaction" : "transactions"}</span></span>
        </button>
        {open === "__transfers" && <div className="money-drill">{transfers.length ? list(transfers, false) : <p className="small-note">No transfers in this period. Mark any transaction as a transfer from its category above.</p>}</div>}
      </div>
      {merchants.length > 0 && <div className="money-merchants"><h3>Top places your money went</h3>
        <ol>{merchants.map(merchant => <li key={merchant.merchant}><span>{merchant.merchant}</span><span>{formatMoney(merchant.cents)} <small>· {merchant.count}×</small></span></li>)}</ol></div>}
    </section>

    <section className="money-panel" aria-labelledby="money-recurring-heading">
      <p className="eyebrow">05 / Regular charges</p>
      <h2 id="money-recurring-heading">{recurring.length ? `About ${formatMoney(recurring.reduce((sum, r) => sum + r.yearlyCents, 0))} a year in regular charges` : "No regular charges found yet"}</h2>
      <p className="money-lede">Charges that repeat on a steady schedule for a similar amount. Some are subscriptions; others are bills or regular purchases. Based on all imported months.</p>
      {covered < 2.5 && <p className="money-callout">Finding regular charges usually needs about three months of transactions. These files cover about {Math.max(1, Math.round(covered))} {Math.round(covered) === 1 ? "month" : "months"}.</p>}
      {recurring.length > 0 && <div className="money-table-scroll"><table className="money-table"><thead><tr><th scope="col">Merchant</th><th scope="col" className="num">About</th><th scope="col">How often</th><th scope="col" className="num">Per year</th></tr></thead>
        <tbody>{recurring.map(r => <tr key={r.merchant + r.cadence}><td><strong>{r.merchant}</strong>{r.priceIncrease && <span className="money-flag">Went up from {formatMoney(r.priceIncrease.fromCents)} to {formatMoney(r.priceIncrease.toCents)} on {formatDate(r.priceIncrease.since)}</span>}</td><td className="num">{formatMoney(r.amountCents)}</td><td>{r.cadence} · {r.count} charges</td><td className="num">{formatMoney(r.yearlyCents)}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="money-panel" aria-labelledby="money-dupes-heading">
      <p className="eyebrow">06 / Worth a second look</p>
      <h2 id="money-dupes-heading">{duplicates.length ? `${duplicates.length} possible duplicate ${duplicates.length === 1 ? "charge" : "charges"}` : "No possible duplicate charges"}</h2>
      <p className="money-lede">Same merchant, same or nearly the same amount, within three days. Many are legitimate, like two real purchases. Nothing is removed; check your statement if something looks off.</p>
      {duplicates.length > 0 && <ul className="money-dupes">{duplicates.map(d => <li key={d.ids.join()}><span className="money-flag">Possible duplicate</span><strong>{d.merchant} · {formatMoney(d.amountCents)}</strong><span>{d.reason}: {d.dates.map(formatDate).join(", ")}</span></li>)}</ul>}
    </section>

    <section className="money-panel" aria-labelledby="money-goal-heading">
      <p className="eyebrow">07 / One savings goal (optional)</p>
      <h2 id="money-goal-heading">How long would it take?</h2>
      <div className="money-goal">
        <label>Goal name<input value={goalName} onChange={event => setGoalName(event.target.value)} placeholder="New equipment" maxLength={60} /></label>
        <label>Target amount<input inputMode="decimal" value={target} onChange={event => setTarget(event.target.value)} placeholder="$5,000" /></label>
        <label>Already saved<input inputMode="decimal" value={saved} onChange={event => setSaved(event.target.value)} placeholder="$0" /></label>
        <label>Monthly amount<input inputMode="decimal" value={monthlyText} onChange={event => setMonthly(event.target.value)} placeholder="$500" /></label>
      </div>
      <p className="small-note">{average.cents > 0 ? `Suggested monthly amount: your average Actually Left, ${formatMoney(average.cents)} a month over ${average.months} ${average.months === 1 ? "month" : "months"}.` : `On average more went out than came in (${formatMoney(average.cents)} a month), so there’s no suggestion. Enter what you could set aside.`}</p>
      {target && goalTarget === null || saved && goalSaved === null || monthlyText && goalMonthly === null ? <p className="money-error">Enter amounts as numbers, like 5000 or $5,000.</p>
        : estimate && <p className="money-goal-result" role="status">{estimate.done ? `${goalName || "This goal"} is already covered by what you’ve saved.` : estimate.months ? <>About <strong>{estimate.months} {estimate.months === 1 ? "month" : "months"}</strong> to save the remaining {formatMoney(estimate.remainingCents)}, around <strong>{formatDate(estimate.date!)}</strong>.</> : "With no monthly amount set aside, there’s no finish date. Try a monthly amount above zero."}</p>}
      <p className="small-note">An estimate at a steady monthly amount. No interest, raises, or surprises included.</p>
    </section>

    <section className="money-panel" aria-labelledby="money-download-heading">
      <p className="eyebrow">08 / Take your summary</p>
      <h2 id="money-download-heading">Download a summary</h2>
      <p className="money-lede">A CSV with the {periodLabel(period).toLowerCase()} totals, categories, regular charges, possible duplicates{estimate ? ", and your goal" : ""}. It’s created on your device and isn’t sent anywhere.</p>
      <div className="detail-links"><button type="button" className="ink-button" onClick={download}>Download summary CSV ↓</button><button type="button" className="text-link" onClick={onStartOver}>Start Over</button></div>
      {downloaded && <p className="small-note" role="status">{downloaded}</p>}
    </section>
  </div>;
}
