import type { ReactNode } from "react";
import Header from "../Header";
import Footer from "../Footer";
export default function Shell({ children }: { children: ReactNode }) {
  return <div className="workshop"><a href="#main-content" className="skip-link">Skip to content</a><Header /><main id="main-content">{children}</main><Footer /></div>;
}
