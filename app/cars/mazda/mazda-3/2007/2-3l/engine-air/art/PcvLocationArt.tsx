import { GraphiteDefs, Leader, Marker } from "./graphite";

const ID = "pcv-loc";
const metal = `url(#${ID}-metal)`;
const dark = `url(#${ID}-dark)`;
const hatch = `url(#${ID}-hatch)`;

/**
 * Simplified top-view layout of the intake area. Not to scale and not a final
 * engine-bay drawing; the PCV highlight marks an approximate area only.
 */
export default function PcvLocationArt() {
  return (
    <svg viewBox="0 0 640 400" role="img" aria-label="Simplified graphite-style layout of the engine intake area, with a dashed highlight around the approximate PCV area near the valve cover and intake manifold." className="h-auto w-full">
      <GraphiteDefs id={ID} />
      <rect width="640" height="400" fill="#fff" />
      <rect x="16" y="16" width="608" height="368" rx="22" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeDasharray="6 6" />

      <g filter={`url(#${ID}-pencil)`} stroke="#262626" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        {/* engine block */}
        <rect x="150" y="110" width="360" height="210" rx="18" fill={metal} />
        <rect x="150" y="110" width="360" height="210" rx="18" fill={hatch} stroke="none" opacity="0.35" />

        {/* valve cover */}
        <rect x="176" y="132" width="308" height="78" rx="12" fill="#fafafa" />
        <rect x="188" y="144" width="284" height="54" rx="8" fill="none" stroke="#737373" strokeWidth="1" />
        {[204, 330, 456].flatMap(x => [156, 186].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="#a3a3a3" strokeWidth="1.5" />))}

        {/* intake runners and manifold */}
        {[205, 275, 345, 415].map(x => <rect key={x} x={x} y="210" width="26" height="20" fill={dark} />)}
        <rect x="176" y="228" width="308" height="64" rx="20" fill={dark} />
        <path d="M200 244H460" stroke="#e5e5e5" strokeWidth="1.5" />

        {/* throttle body and air intake duct */}
        <rect x="150" y="246" width="26" height="28" fill={dark} />
        <rect x="92" y="236" width="58" height="48" rx="8" fill={metal} />
        <circle cx="121" cy="260" r="16" fill="#fff" />
        <path d="M105 266 137 254" strokeWidth="3" />
        <rect x="32" y="242" width="60" height="36" rx="6" fill={metal} />
        <path d="M44 242V278M56 242V278M68 242V278M80 242V278" strokeWidth="1.2" />
      </g>

      {/* approximate PCV area */}
      <ellipse cx="392" cy="216" rx="74" ry="36" fill="#171717" fillOpacity="0.08" stroke="#171717" strokeWidth="2.5" strokeDasharray="7 5" />

      {/* general direction of intake air */}
      <path d="M40 224H88" stroke="#171717" strokeWidth="2.4" markerEnd={`url(#${ID}-arrow)`} />
      <path d="M200 308H460" stroke="#171717" strokeWidth="2.4" markerEnd={`url(#${ID}-arrow)`} />

      <Leader x1={250} y1={75} x2={250} y2={140} /><Marker x={250} y={60} label="1" />
      <Leader x1={545} y1={307} x2={486} y2={272} /><Marker x={556} y={316} label="2" />
      <Leader x1={121} y1={325} x2={121} y2={284} /><Marker x={121} y={340} label="3" />
      <Leader x1={54} y1={195} x2={54} y2={242} /><Marker x={54} y={180} label="4" />
      <Leader x1={541} y1={131} x2={440} y2={188} /><Marker x={556} y={120} label="P" r={21} />
    </svg>
  );
}
