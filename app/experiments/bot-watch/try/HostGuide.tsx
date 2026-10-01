import type { ReactNode } from "react";

// Where to get a traffic file, by host. Steps only describe screens and options each host documents;
// server file paths appear only inside the host that needs them.
export type Host = "vercel" | "cpanel" | "nginx" | "other";
export const hosts: { id: Host; name: string; hint: string }[] = [
  { id: "vercel", name: "Vercel", hint: "Sites deployed with Vercel" },
  { id: "cpanel", name: "cPanel / Apache", hint: "Most shared web hosting" },
  { id: "nginx", name: "Nginx", hint: "Your own server or VPS" },
  { id: "other", name: "Other / Not sure", hint: "Anything else" },
];

type Guide = { title: string; intro?: ReactNode; steps: ReactNode[]; notes: ReactNode[]; more?: { summary: string; body: ReactNode } };

export const guides: Record<Host, Guide> = {
  vercel: {
    title: "Get your traffic file from Vercel",
    steps: [
      <>Go to your <strong>Vercel Dashboard</strong>.</>,
      <>Open the website or project you want to check.</>,
      <>Click <strong>Logs</strong>.</>,
      <>Choose the time period or requests you want to inspect.</>,
      <>Use Vercel’s export option to download the runtime logs.</>,
      <>Return to Bot Watch and choose that exported file.</>,
    ],
    notes: [
      <>Vercel keeps logs for a limited time: 1 hour on the Hobby plan and 1 day on Pro (longer with Observability Plus). Export soon after you notice something odd.</>,
      <>Each export holds up to 10,000 requests on most plans.</>,
      <>If the export doesn’t include visitor IP addresses, Bot Watch groups visitors by the browser or tool they report instead, and blocking won’t be available.</>,
    ],
  },
  cpanel: {
    title: "Get your traffic file from cPanel",
    steps: [
      <>Log in to your hosting account and open <strong>cPanel</strong>.</>,
      <>In the <strong>Metrics</strong> section, click <strong>Raw Access</strong>.</>,
      <>Under the list of raw access logs, click your website’s domain name. A file ending in <strong>.gz</strong> downloads.</>,
      <>Return to Bot Watch and choose that file. You don’t need to unzip it first.</>,
    ],
    notes: [
      <>If you don’t see Raw Access, your host may call it Access Logs or Raw Logs, or may have turned it off. Ask them for your website’s access log.</>,
      <>Raw Access usually covers only recent traffic. cPanel can keep older days if you turn on log archiving on the same page.</>,
    ],
    more: {
      summary: "Running Apache on your own server instead?",
      body: <p>The access log is usually in <code>/var/log/apache2/</code> (Ubuntu and Debian) or <code>/var/log/httpd/</code> (Red Hat, CentOS, Rocky, and similar). Download <code>access.log</code> or <code>access_log</code> with your file transfer tool and choose it here.</p>,
    },
  },
  nginx: {
    title: "Get your traffic file from Nginx",
    intro: <>Nginx runs on a server that you or your developer manage, so the traffic file lives on that server.</>,
    steps: [
      <>Connect to the server with the tool you normally use (SSH, SFTP, or your hosting provider’s file manager).</>,
      <>Open Nginx’s log folder. It’s usually <code>/var/log/nginx/</code>.</>,
      <>Download <strong>access.log</strong>. Older days are saved as files like <code>access.log.1</code> and <code>access.log.2.gz</code>.</>,
      <>Return to Bot Watch and choose that file. Compressed <strong>.gz</strong> files are fine.</>,
    ],
    notes: [
      <>If your site has its own log file (look for <code>access_log</code> in its Nginx configuration), download that one instead.</>,
      <>Not comfortable working on the server? Ask your developer or host for “the Nginx access log for my site.”</>,
    ],
  },
  other: {
    title: "Find your traffic file",
    intro: <>Most hosting dashboards have a way to download traffic records. Look for words like <strong>Logs</strong>, <strong>Access Logs</strong>, <strong>Raw Access</strong>, or <strong>Raw Logs</strong>.</>,
    steps: [
      <>Log in to the company you pay for your website hosting.</>,
      <>Look for a Logs, Access Logs, or Raw Access page, and download the file.</>,
      <>Return to Bot Watch and choose that file.</>,
    ],
    notes: [
      <>Website builders like Wix, Squarespace, and Shopify usually don’t provide these files. Their analytics show visits, but not the individual requests Bot Watch needs.</>,
      <>Still stuck? Ask your host or developer for “my website’s access log.”</>,
    ],
  },
};

export function HostHelp() {
  return <div className="bw-host-help">
    <h3>Finding out where your site is hosted</h3>
    <ul>
      <li>Check your email for receipts or welcome messages from the company you pay for your website.</li>
      <li>Ask the person or agency who built your site.</li>
      <li>Look up your domain with a free “who is hosting this website” lookup. It shows the company that runs the server.</li>
      <li>If your site was made with a website builder (Wix, Squarespace, Shopify), that company is your host.</li>
    </ul>
    <p>Once you know, choose it above. If it isn’t listed, choose <strong>Other / Not sure</strong>.</p>
  </div>;
}

export function HostSteps({ host }: { host: Host }) {
  const g = guides[host];
  return <div className="bw-guide">
    <h3>{g.title}</h3>
    {g.intro && <p className="bw-guide-intro">{g.intro}</p>}
    <ol className="bw-steps">{g.steps.map((s, i) => <li key={i}><span className="bw-step-n" aria-hidden="true">{i + 1}</span><span>{s}</span></li>)}</ol>
    <ul className="bw-guide-notes">{g.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
    {g.more && <details className="bw-guide-more"><summary>{g.more.summary}</summary>{g.more.body}</details>}
  </div>;
}
