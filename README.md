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
All detail pages retain the untested/as-is notice and the "Email feedback to the maker" link.
Availability controls launch buttons independently from editorial status. Never
mark a build as available before its destination is usable.
