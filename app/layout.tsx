import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OrgToolTank | The Scattered Mind Experiment", template: "%s | OrgToolTank" },
  description: "Ideas built quickly and put into the world as-is. Browse experiments, play with them, and tell me what should happen next.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
