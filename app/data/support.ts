// Where donations go. This is the only place the donation link is set.
//
// A Stripe Payment Link made for donations (separate from the paid-download checkout). It's a public page
// address, not a key. Every donation button and link opens it directly in a new tab: the Experiments and
// Support page Donate buttons (DonateButton), the header Support link, and the tools' "Support OrgToolTank"
// buttons (DonateLink). Set it to null to turn donations off: the Donate buttons then show disabled and the
// other links go to the /support page.
export const DONATION_URL: string | null = "https://donate.stripe.com/fZucN43ILdQu0Lu3Wr5AQ01";
