"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import LiveView from "./LiveView";
import PastTraffic from "./PastTraffic";

// Two modes. Live View comes first and is the default. Analyze Past Traffic stays mounted while hidden
// so a loaded traffic file survives switching tabs; Live View only runs while it's showing.
type Mode = "live" | "past";
const modes: { id: Mode; name: string }[] = [{ id: "live", name: "Live View" }, { id: "past", name: "Analyze Past Traffic" }];

export default function BotWatch() {
  const [mode, setMode] = useState<Mode>("live");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKey(e: KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + modes.length) % modes.length;
    setMode(modes[next].id);
    tabs.current[next]?.focus();
  }
  return <div className="bw-modes">
    <div className="bw-mode-tabs" role="tablist" aria-label="Bot Watch mode">
      {modes.map((m, i) => <button key={m.id} ref={el => { tabs.current[i] = el; }} type="button" role="tab" id={`bw-tab-${m.id}`} aria-controls={`bw-panel-${m.id}`} aria-selected={mode === m.id} tabIndex={mode === m.id ? 0 : -1} onClick={() => setMode(m.id)} onKeyDown={e => onKey(e, i)}>{m.name}</button>)}
    </div>
    <div role="tabpanel" id="bw-panel-live" aria-labelledby="bw-tab-live" hidden={mode !== "live"}><LiveView active={mode === "live"} /></div>
    <div role="tabpanel" id="bw-panel-past" aria-labelledby="bw-tab-past" hidden={mode !== "past"}><PastTraffic /></div>
  </div>;
}
