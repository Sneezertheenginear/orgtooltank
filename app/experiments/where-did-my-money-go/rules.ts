// Keyword categories adapted from the desktop app's built-in rules. Patterns match whole words
// (so "notion" doesn't match "promotion"), lower priority numbers win, and "Money In" rules only
// apply to money coming in.
export type Rule = { pattern: string; category: string; merchant?: string; priority: number };

const r = (category: string, priority: number, entries: (string | [string, string])[]): Rule[] =>
  entries.map(entry => typeof entry === "string" ? { pattern: entry, category, priority } : { pattern: entry[0], merchant: entry[1], category, priority });

export const RULES: Rule[] = [
  ...r("Software", 10, [["adobe", "Adobe"], ["microsoft", "Microsoft"], ["msft", "Microsoft"], ["google workspace", "Google Workspace"], ["dropbox", "Dropbox"], ["slack", "Slack"], ["zoom.us", "Zoom"], ["zoom video", "Zoom"], ["notion", "Notion"], ["github", "GitHub"], ["atlassian", "Atlassian"], ["quickbooks", "QuickBooks"], ["aws", "Amazon Web Services"], ["amazon web services", "Amazon Web Services"], ["digitalocean", "DigitalOcean"], ["mailchimp", "Mailchimp"], ["hubspot", "HubSpot"], ["squarespace", "Squarespace"], ["godaddy", "GoDaddy"], ["1password", "1Password"], ["figma", "Figma"], ["linear.app", "Linear"], ["apple.com/bill", "Apple"]]),
  ...r("Software", 15, [["intuit", "Intuit"]]),
  ...r("Vehicle", 10, [["shell", "Shell"], ["chevron", "Chevron"], ["exxon", "Exxon"], ["arco", "ARCO"], ["valero", "Valero"], ["jiffy lube", "Jiffy Lube"]]),
  ...r("Vehicle", 25, ["fuel", "gas station"]),
  ...r("Travel", 12, [["uber", "Uber"], ["lyft", "Lyft"]]),
  ...r("Travel", 10, [["delta air", "Delta Air Lines"], ["united air", "United Airlines"], ["southwest air", "Southwest Airlines"], ["marriott", "Marriott"], ["hilton", "Hilton"], ["airbnb", "Airbnb"], ["enterprise rent", "Enterprise Rent-A-Car"]]),
  ...r("Supplies", 10, [["home depot", "The Home Depot"], ["lowe's", "Lowe's"], ["lowes", "Lowe's"], ["staples", "Staples"], ["office depot", "Office Depot"], ["uline", "Uline"]]),
  ...r("Supplies", 15, [["costco", "Costco"]]),
  ...r("Equipment", 10, [["grainger", "Grainger"], ["best buy", "Best Buy"], ["apple store", "Apple"], ["b&h photo", "B&H Photo"]]),
  ...r("Equipment", 12, [["dell", "Dell"]]),
  ...r("Advertising", 10, [["facebook ads", "Meta"], ["meta platforms", "Meta"], ["google ads", "Google Ads"], ["yelp", "Yelp"], ["indeed", "Indeed"]]),
  ...r("Advertising", 12, [["facebk", "Meta"]]),
  ...r("Advertising", 15, [["linkedin", "LinkedIn"]]),
  ...r("Utilities", 10, [["pg&e", "PG&E"], ["comcast", "Comcast"], ["xfinity", "Comcast"], ["at&t", "AT&T"], ["verizon", "Verizon"], ["t-mobile", "T-Mobile"], ["waste management", "Waste Management"]]),
  ...r("Utilities", 20, ["water district"]),
  ...r("Payroll", 10, [["gusto", "Gusto"], ["adp", "ADP"], ["paychex", "Paychex"]]),
  ...r("Payroll", 25, ["payroll"]),
  ...r("Insurance", 10, [["geico", "GEICO"], ["state farm", "State Farm"], ["the hartford", "The Hartford"], ["hiscox", "Hiscox"], ["next insurance", "NEXT Insurance"]]),
  ...r("Insurance", 30, ["insurance"]),
  ...r("Taxes", 8, [["irs usataxpymt", "IRS"]]),
  ...r("Taxes", 10, [["irs", "IRS"]]),
  ...r("Taxes", 12, ["franchise tax", "dept of revenue", "edd"]),
  ...r("Taxes", 35, ["tax"]),
  ...r("Fees", 10, ["bank fee", "service charge", "overdraft", "wire fee", "monthly maintenance fee", "monthly service fee"]),
  ...r("Fees", 15, ["atm"]),
  ...r("Fees", 22, [["stripe", "Stripe"], ["square inc", "Square"]]),
  ...r("Fees", 25, [["paypal", "PayPal"]]),
  ...r("Meals", 10, [["starbucks", "Starbucks"], ["chipotle", "Chipotle"], ["doordash", "DoorDash"], ["grubhub", "Grubhub"]]),
  ...r("Meals", 30, ["restaurant"]),
  ...r("Meals", 32, ["coffee", "cafe"]),
  ...r("Rent", 10, [["wework", "WeWork"], ["we work", "WeWork"]]),
  ...r("Rent", 20, ["property management"]),
  ...r("Rent", 22, ["properties llc"]),
  ...r("Rent", 30, ["rent"]),
  ...r("Rent", 35, ["lease"]),
  ...r("Money In", 8, [["stripe payout", "Stripe payout"]]),
  ...r("Money In", 20, ["payment received"]),
  ...r("Money In", 25, ["invoice"]),
  ...r("Money In", 40, ["deposit"]),
  // Money moved between the user's own accounts, including credit card payments.
  ...r("Transfer", 5, ["payment thank you", "online payment thank you", "autopay payment", "autopay pymt", "credit card payment", "card services autopay", "crd autopay", "card autopay"]),
  ...r("Transfer", 50, ["transfer to", "transfer from", "online transfer"]),
];
