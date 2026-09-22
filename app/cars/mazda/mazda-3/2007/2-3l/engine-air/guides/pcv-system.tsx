import PcvLocationArt from "../art/PcvLocationArt";
import PartPhoto from "../PartPhoto";
import type { PartGuide } from "./types";

export const pcvSystemGuide: PartGuide = {
  partName: "PCV Valve / PCV System",
  system: "Engine & Air — crankcase ventilation",
  status: "Guide being built",
  // oemPartNumber: intentionally unset until the Mazda OEM number is verified.
  partFigure: {
    eyebrow: "Part illustration",
    title: "PCV Valve / PCV System Component",
    caption: "Representative PCV valve component image",
    note: "Match the part by its OEM part number and fit, not by appearance alone.",
    art: <PartPhoto src="/parts/pcv-valve-reference.png" alt="Representative PCV valve component with an off-white angled plastic body and an orange lower section." />,
  },
  locationFigure: {
    eyebrow: "PCV Location",
    title: "2007 Mazda 3 2.3L Engine Bay",
    caption: "Simplified layout, not to scale. The dashed area marks where to start looking; the exact position will be shown in the final diagram.",
    art: <PcvLocationArt />,
    key: [
      { marker: "P", label: "PCV area (approximate)", detail: "Around and under the intake area, near the valve cover." },
      { marker: "1", label: "Valve cover", detail: "Covers the top of the engine." },
      { marker: "2", label: "Intake manifold", detail: "Carries air to each cylinder." },
      { marker: "3", label: "Throttle body", detail: "Controls how much air gets in." },
      { marker: "4", label: "Air intake", detail: "Where air enters the system. Arrows show the general direction of airflow." },
    ],
  },
  notes: [
    { title: "Related gasket / seal", text: "Seals or gaskets near the PCV component may be disturbed during access. Which ones, and their part numbers, are still being verified for this engine." },
    { title: "Related hoses", text: "PCV hoses and connectors can harden, crack, or loosen with age. Inspect what connects to the valve before deciding what to replace." },
    { title: "Replacement access", text: "This part is not in an easy open spot. Plan on working around and under the intake area to reach it." },
  ],
  sections: [
    {
      heading: "What it does",
      body: "While the engine runs, small amounts of combustion gas slip past the pistons into the crankcase. The PCV (positive crankcase ventilation) system deals with those vapors so they don’t build up inside the engine.",
      items: ["Relieves crankcase pressure", "Moves vapors back into the intake so they are burned", "Helps with emissions and smooth engine operation"],
    },
    {
      heading: "Where it is",
      body: "On the 2007 Mazda 3 2.3L, the PCV component is not in an easy open spot. Reaching it usually means working around and under the intake area.",
      note: "A precise location diagram is coming next. Until then, treat the location diagram above as an approximate area.",
    },
    {
      heading: "Common symptoms",
      items: ["Rough idle", "Oil leaks from pressure buildup", "Poor crankcase ventilation", "Oil consumption concerns", "Vacuum-related drivability issues"],
      note: "These symptoms can have other causes. Inspect and test before replacing parts.",
    },
    {
      heading: "What is usually involved",
      body: "Detailed steps for this Mazda 3 are still being written. In general, the job comes down to:",
      items: ["Accessing the intake area", "Identifying hoses and connectors", "Inspecting related components before replacing parts"],
    },
  ],
  guideOutline: [
    { title: "Before you start", text: "Symptoms, safety notes, and how to confirm the PCV system is the problem." },
    { title: "Tools & parts", text: "The tool list and verified Mazda OEM part numbers." },
    { title: "Access", text: "Which intake components need to move, with part locations." },
    { title: "Inspect & test", text: "Hoses, connectors, and the valve itself." },
    { title: "Replace", text: "Step-by-step removal and installation." },
    { title: "Final checks", text: "Leak and connection checks, and what to watch for afterward." },
  ],
};
