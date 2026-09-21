import type { VehicleFrame } from "./Vehicle360Viewer";

// Only real, existing assets belong here. Add matching views in circular order.
// The viewer derives its frame count from this list (8, 12, 16, 24, or more).
export const mazda3Frames: readonly VehicleFrame[] = [
  {
    src: "/illustrations/mazda-3-graphite.webp",
    alt: "Graphite drawing of a 2007 Mazda 3 sedan, front three-quarter view, with no logos or emblems.",
  },
];
