// The builder's environment: the background color behind the mannequin (Outfit), or the wall and floor
// of the room (Scene and Full Look). One shared setting, so a color picked in one mode carries to the
// others. Add a preset here to offer it.

export type WallId = "white" | "cream" | "gray" | "red" | "black" | "navy" | "olive";
export const WALLS: { id: WallId; name: string; hex: string }[] = [
  { id: "white", name: "White", hex: "#f6f6f4" },
  { id: "cream", name: "Cream", hex: "#eee5d1" },
  { id: "gray", name: "Gray", hex: "#8f8f8a" },
  { id: "red", name: "Red", hex: "#9e2f28" },
  { id: "black", name: "Black", hex: "#1c1c1c" },
  { id: "navy", name: "Navy", hex: "#26324a" },
  { id: "olive", name: "Olive", hex: "#5f6344" },
];
export type FloorId = "oak" | "walnut" | "concrete" | "white";
export const FLOORS: { id: FloorId; name: string; hex: string; boards: boolean }[] = [
  { id: "oak", name: "Oak", hex: "#c9a878", boards: true },
  { id: "walnut", name: "Walnut", hex: "#6b4f37", boards: true },
  { id: "concrete", name: "Concrete", hex: "#a6a5a0", boards: false },
  { id: "white", name: "White", hex: "#e6e5e1", boards: false },
];
export type Environment = { wall: WallId; floor: FloorId };
export const DEFAULT_ENVIRONMENT: Environment = { wall: "white", floor: "oak" };
export const wallOf = (id: WallId) => WALLS.find(w => w.id === id) ?? WALLS[0];
export const floorOf = (id: FloorId) => FLOORS.find(f => f.id === id) ?? FLOORS[0];

/** Whether a color is dark enough that outlines and labels on it should turn light. */
export function isDark(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.45;
}
