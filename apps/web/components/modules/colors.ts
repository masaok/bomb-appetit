/**
 * Colors used on module faces. Every color also carries a letter, so a face never
 * relies on color alone (color-blind players, black-and-white manual printouts).
 */
export const GAME_COLORS = {
  red: { hex: "#f04a3a", name: "Red", letter: "R", ink: "#ffffff" },
  blue: { hex: "#3b82f6", name: "Blue", letter: "B", ink: "#ffffff" },
  yellow: { hex: "#ffc94a", name: "Yellow", letter: "Y", ink: "#221a38" },
  green: { hex: "#35b37e", name: "Green", letter: "G", ink: "#221a38" },
  white: { hex: "#fff6e9", name: "White", letter: "W", ink: "#221a38" },
  black: { hex: "#15101f", name: "Black", letter: "K", ink: "#ffffff" },
} as const;

export type GameColor = keyof typeof GAME_COLORS;
