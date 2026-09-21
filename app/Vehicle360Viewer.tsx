"use client";

import Image from "next/image";
import { useId, useRef, useState, type PointerEvent } from "react";

export type VehicleFrame = { src: string; alt: string };
type ViewerProps = {
  frames: readonly VehicleFrame[];
  label: string;
  width?: number;
  height?: number;
};

/** Pass frames in circular order. Changing the sequence resets loading and rotation. */
export default function Vehicle360Viewer(props: ViewerProps) {
  return <FrameSequence key={JSON.stringify(props.frames)} {...props} />;
}

function FrameSequence({ frames, label, width = 1774, height = 887 }: ViewerProps) {
  const instructionId = useId();
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointer: number; x: number; index: number; width: number } | null>(null);
  const multiple = frames.length > 1;
  const ready = multiple && loaded.size === frames.length && failed.size === 0;
  const wrap = (value: number) => ((value % frames.length) + frames.length) % frames.length;

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  if (!frames.length) {
    return <p className="py-12 text-center text-neutral-600">Vehicle images are not available yet.</p>;
  }

  return (
    <div className="w-full">
      <div
        role="group"
        aria-label={`${label} exterior viewer`}
        aria-describedby={instructionId}
        aria-busy={multiple && !ready && !failed.size}
        tabIndex={ready ? 0 : undefined}
        className={`relative w-full select-none rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-800 ${ready ? dragging ? "cursor-grabbing" : "cursor-grab" : "cursor-default"}`}
        style={{ aspectRatio: `${width} / ${height}`, touchAction: "pan-y pinch-zoom" }}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (!ready || !event.isPrimary || event.button !== 0 || drag.current) return;
          event.currentTarget.focus({ preventScroll: true });
          drag.current = { pointer: event.pointerId, x: event.clientX, index, width: event.currentTarget.getBoundingClientRect().width };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!ready || !start || start.pointer !== event.pointerId) return;
          // One viewer-width of movement makes one revolution, regardless of frame count.
          const steps = Math.trunc(((start.x - event.clientX) / Math.max(start.width, 1)) * frames.length);
          setIndex(wrap(start.index + steps));
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={finishDrag}
        onKeyDown={(event) => {
          if (!ready || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
          event.preventDefault();
          setIndex((current) => wrap(current + (event.key === "ArrowRight" ? 1 : -1)));
        }}
      >
        {frames.map((frame, frameIndex) => (
          <Image
            key={`${frame.src}-${frameIndex}`}
            src={frame.src}
            alt={frameIndex === index ? frame.alt : ""}
            aria-hidden={frameIndex !== index}
            width={width}
            height={height}
            // Load and decode every exact frame URL before allowing rotation.
            // Keeping frames mounted avoids flicker and repeated image decoding.
            unoptimized
            loading="eager"
            draggable={false}
            className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${frameIndex === index ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded((current) => new Set(current).add(frameIndex))}
            onError={() => setFailed((current) => new Set(current).add(frameIndex))}
          />
        ))}
        {failed.has(index) && <p className="absolute inset-0 flex items-center justify-center bg-white p-6 text-center text-neutral-600">This vehicle image could not load. Please reload to try again.</p>}
      </div>
      <div id={instructionId} className="mt-5 text-center text-sm text-neutral-500">
        <p className="inline-flex items-center gap-2 font-medium">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 8a9 9 0 0 0-15-2L2 9m0-5v5h5m-3 7a9 9 0 0 0 15 2l3-3m0 5v-5h-5" /></svg>
          Drag to rotate
        </p>
        <p className="mt-1" role="status">
          {!multiple ? "360° rotation coming soon — additional exterior views are being prepared." : failed.size ? "Rotation unavailable: an image could not load. Please reload to try again." : !ready ? "Loading exterior views…" : "Swipe or use the left and right arrow keys."}
        </p>
      </div>
      {multiple && (
        <div className="mt-3 flex items-center justify-center gap-5 text-sm">
          <button type="button" disabled={!ready} onClick={() => setIndex((current) => wrap(current - 1))} aria-label="Rotate to previous angle" className="rounded border border-neutral-300 px-4 py-2 hover:bg-neutral-100 disabled:opacity-40">←</button>
          <span className="tabular-nums text-neutral-500">{index + 1} / {frames.length}</span>
          <button type="button" disabled={!ready} onClick={() => setIndex((current) => wrap(current + 1))} aria-label="Rotate to next angle" className="rounded border border-neutral-300 px-4 py-2 hover:bg-neutral-100 disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  );
}
