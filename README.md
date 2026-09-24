This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## The Scattered Mind Experiment

The homepage is the experiment workbench. Add entries in `app/data/experiments.ts`
(including a category, collection date, status, and optional launch URL). Cards,
filters, category pages, and `/experiments/[slug]` use that registry. The Mazda
collection date is its addition to this experiment directory, not the original
publication date of the repair material.

The former homepage is preserved in `app/MazdaRepairHome.tsx`, served at
`/cars/mazda-3-repair`. All pre-existing Mazda guide URLs and assets remain intact.

`app/request-app/RequestForm.tsx` validates the request and prepares a reviewable
email to the existing contact address. The visitor must send it in their email
client. No server delivery is claimed. Replace the documented integration point
with a server action and verified mail provider when direct submission is ready.

Validation: `npx tsc --noEmit`; lint changed files with `npx eslint`.
If local Turbopack cannot spawn its CSS worker, `npx next build --webpack` provides
an alternative production build without changing project configuration.

### Adding the next browser experiment

The registry now includes all 16 projects. Descriptions for unconverted projects
are provisional catalog copy, not verified feature lists. Mazda is browser ready;
Duplicate Finder points to the existing desktop information page. Other desktop
availability is unconfirmed, so those entries are not offered as downloads here.

Each `Experiment` supplies `title`, `slug`, `description`, `category`, `dateAdded`,
`status`, `browserAvailable`, `desktopAvailable`, `browserRoute`, `image`, `tags`,
`featured`, `limitations`, and `desktopBenefits`. `image` is either null or
`{ src, alt }`. A `desktopRoute` is also required when desktop availability is true.
The TypeScript unions require a route for an available version and null otherwise.

To convert one project:
1. Inspect its actual app and decide which features can work in the browser.
2. Build and verify its browser route. Do not point the launch button at its own
   catalog page or at a placeholder.
3. Set `browserAvailable: true`, provide `browserRoute`, and update `status`.
4. Replace provisional copy with verified limitations, tags, and desktop benefits.
5. Set `featured: true` to include it in the homepage selection. The directory
   lists every entry, and the request form automatically includes every project.

Supported statuses are Browser Ready, Browser Version In Progress, Desktop Only
For Now, Untested Experiment, and Needs Browser Conversion. Browser Ready means
there is something to launch, not that the app has been comprehensively tested.
All detail pages retain the untested/as-is notice and browser-local feedback.
Availability controls launch buttons independently from editorial status. Never
mark a build as available before its destination is usable.

## Likes, unlikes, and comments

Feedback is shared through the site's own API (`app/api/feedback/`) and stored in Upstash Redis.
Votes and comments are validated on the server; the browser never sends counts. Comments are
held for review and only appear after approval at `/feedback-admin` (not linked, not indexed).

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | What it's for |
|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) | Upstash Redis. Added automatically when you connect Upstash from the Vercel Marketplace. |
| `FEEDBACK_SECRET` | 32+ random characters. Signs the anonymous browser cookie and hashes network addresses. Changing it resets everyone's "already voted" state. |
| `FEEDBACK_ADMIN_PASSWORD` | 12+ characters. Password for `/feedback-admin`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (public, used in the browser). |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key (server only, never sent to the browser). |

Generate a secret with `openssl rand -base64 48`. In production, feedback answers
"not available" (HTTP 503) until Redis and `FEEDBACK_SECRET` are set, and comments are refused
until `TURNSTILE_SECRET_KEY` is set, so nothing runs unprotected.

### How it's protected

- **One vote per item per browser.** A random, signed, HttpOnly cookie (`ott_sid`) identifies the
  browser anonymously; only a keyed hash of it is stored. Switching like ↔ unlike updates the
  existing vote in one atomic Redis operation, so repeated or simultaneous requests can't inflate
  counts. Voting the same way twice returns "You already voted on this." (HTTP 409).
- **Rate limits (HTTP 429, "Too many requests. Try again in a moment.")** per browser cookie *and*
  per hashed network address. New anonymous cookies are also limited per network address, so
  clearing cookies can't be used to vote repeatedly.
- **Comments:** empty and oversized comments are rejected, links are capped, control characters are
  removed, and comments are always displayed as plain text (never HTML), so markup can't run. A
  30-second cooldown, a hidden honeypot field, and Cloudflare Turnstile block automated posting.
- **Direct API calls:** every POST must come from this site (Origin check), be small JSON, and pass
  the same limits and checks as the page does.
- **Privacy:** no accounts and no fingerprinting. Raw IP addresses are never stored or logged, only
  a keyed hash used for rate limits. Blocked requests are logged (Vercel logs and the last 200 in
  Redis, visible at `/feedback-admin`) with the reason and shortened hashes, never comment text.

### Turnstile

Create a widget at Cloudflare → Turnstile (add your domain and `localhost`), then set the two keys
above. The page renders Turnstile in "interaction-only" mode, so most visitors see nothing; a
challenge only appears when Cloudflare decides one is needed. The token is checked on the server
with Cloudflare's siteverify API before a comment is saved.

### Changing the limits

All limits live in `app/lib/feedback/config.ts` (`LIMITS`, comment lengths, link cap, cooldown).
Edit the numbers and redeploy. Current defaults: votes 12/min per browser and 40/min per network;
comments 3 per 10 min per browser and 30 s apart (counting only submissions that pass the checks), 20 attempts/hour per network; reads 120/min per network;
new browser IDs 20/hour per network; wrong moderator passwords 5 per 15 min.

### Local testing

`FEEDBACK_STORE=memory npm run dev` uses an in-memory store (refused in production). Without
Turnstile keys, local development skips the Turnstile check and logs a warning. Cloudflare's test
keys (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`) always pass.
