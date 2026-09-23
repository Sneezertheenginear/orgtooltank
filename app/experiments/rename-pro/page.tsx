import Link from "next/link";
import Shell from "../../experiment-components/Shell";
import RenameProIdentity from "../../experiment-components/RenameProIdentity";
import RenameWorkbench from "./RenameWorkbench";
import "./rename-pro.css";

export const metadata = { title: "Rename Pro", description: "Rename files locally in your browser. Preview changes and download renamed copies without uploading your files." };

export default function RenameProPage() {
  return <Shell><div className="wrap page-space rename-pro">
    <Link href="/experiments" className="text-link">← All experiments</Link>
    <div className="experiment-heading">
      <p className="eyebrow">Tools / <span className="status-tag">Browser Experiment</span></p>
      <div className="rename-title-row"><RenameProIdentity compact /><h1 className="page-title">Rename Pro</h1></div>
      <p className="page-intro">A fresh name. The same file.<br />Batch rename, preview every change, and download your copies.</p>
      <p className="rename-privacy">Your files stay on your device. Rename Pro processes them locally in your browser.</p>
    </div>
    <RenameWorkbench />
    <section className="browser-desktop prose-copy">
      <h2>Browser vs Desktop</h2>
      <div className="form-pair"><div><h3>Browser</h3><ul><li>Quick renaming without installing anything</li><li>Choose or drop files</li><li>Preview changes</li><li>Download renamed copies</li></ul></div>
      <div><h3>Desktop</h3><ul><li>Work directly with folders</li><li>Rename files in place</li><li>Larger workflows</li><li>History and Undo</li><li>Deeper filesystem access</li></ul></div></div>
      <p className="small-note">This first browser experiment keeps originals untouched. ZIP downloads are prepared in memory; use smaller batches for large files. Presets and history are not included.</p>
    </section>
  </div></Shell>;
}
