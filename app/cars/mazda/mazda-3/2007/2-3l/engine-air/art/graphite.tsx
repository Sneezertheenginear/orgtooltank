/** Shared pieces for the monochrome graphite-sketch SVG illustrations. */

export function GraphiteDefs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`${id}-pencil`} x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="wobble" />
        <feDisplacementMap in="SourceGraphic" in2="wobble" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id={`${id}-soft`} x="-20%" y="-200%" width="140%" height="500%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <pattern id={`${id}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="7" stroke="#404040" strokeWidth="1.1" />
      </pattern>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fafafa" />
        <stop offset="0.45" stopColor="#d4d4d4" />
        <stop offset="1" stopColor="#8a8a8a" />
      </linearGradient>
      <linearGradient id={`${id}-dark`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a3a3a3" />
        <stop offset="1" stopColor="#404040" />
      </linearGradient>
      <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0 0L10 5L0 10z" fill="#171717" />
      </marker>
    </defs>
  );
}

/** Numbered callout badge; the matching number appears in the HTML key beside the drawing. */
export function Marker({ x, y, label, r = 15 }: { x: number; y: number; label: string; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#171717" stroke="#fff" strokeWidth="2" />
      <text x={x} y={y} dy="0.35em" textAnchor="middle" fontSize={r * 1.2} fontWeight="700" fill="#fff" fontFamily="Arial, Helvetica, sans-serif">{label}</text>
    </g>
  );
}

export function Leader({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g stroke="#171717" strokeWidth="1.6" strokeLinecap="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <circle cx={x2} cy={y2} r="3.5" fill="#171717" />
    </g>
  );
}
