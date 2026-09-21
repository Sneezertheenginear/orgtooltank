import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OrgToolTank | Understand Your Car", template: "%s | OrgToolTank" },
  description: "Practical automotive knowledge for everyday car owners. Explore cars, learn how their systems work, and understand tools and testing.",
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
