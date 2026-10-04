import type { BombState } from "@bombappetit/engine";

/** True while any needy module is awake and wants attention. Experts see only this flag. */
export function needyActive(bomb: BombState): boolean {
  return bomb.modules.some((m) => {
    switch (m.id) {
      case "pressure-vent":
      case "dial-alignment":
        return m.state.kind === "active";
      case "discharge-lever":
        return m.state.kind === "running";
      default:
        return false;
    }
  });
}
