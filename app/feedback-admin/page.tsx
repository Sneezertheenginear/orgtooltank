import Shell from "../experiment-components/Shell";
import AdminClient from "./AdminClient";

// Private moderation page for the site owner. Not linked anywhere and not indexed.
export const metadata = { title: "Feedback review", robots: { index: false, follow: false } };

export default function FeedbackAdminPage() {
  return <Shell><div className="wrap page-space narrow-page">
    <p className="eyebrow">Private</p>
    <h1 className="page-title">Feedback review</h1>
    <p className="page-intro">Approve or delete comments before they appear publicly.</p>
    <AdminClient />
  </div></Shell>;
}
