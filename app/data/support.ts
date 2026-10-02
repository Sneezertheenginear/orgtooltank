// Where donations go. This is the only place the donation link is set.
//
// TODO: paste the real donation payment link here (for example a Stripe Payment Link created for donations,
// not the paid-download checkout), e.g. export const DONATION_URL: string | null = "https://donate.stripe.com/...";
//
// While it's null: the Experiments page Donate button is shown disabled, and the header Support link and the
// tools' "Support OrgToolTank" buttons go to the /support page. Once it's set, all of them open this link directly.
export const DONATION_URL: string | null = null;
