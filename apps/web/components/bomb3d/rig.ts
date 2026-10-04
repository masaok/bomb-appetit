import { focusDistance, overviewDistance, slotPlace, type CaseLayout } from "./layout";

const TURN = Math.PI * 2;
const DRAG_SPEED = 0.008;
const MAX_PITCH = Math.PI / 2;
const DAMPING = 9;
const SETTLED = 1e-3;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Pose of the view: the bomb turns (yaw, then pitch) while the camera only slides and dollies.
 * Kept outside React because pointer handlers write it and the render loop reads it every frame.
 */
export class ViewRig {
  yaw = 0;
  pitch = 0;
  x = 0;
  y = 0;
  distance = Number.NaN;
  focus: number | null = null;

  private targetYaw = 0;
  private targetPitch = 0;
  private zoom = 1;

  constructor(readonly layout: CaseLayout) {}

  focusSlot(slotIndex: number) {
    const base = slotPlace(this.layout, slotIndex).face === "back" ? Math.PI : 0;
    this.focus = slotIndex;
    this.zoom = 1;
    this.targetPitch = 0;
    // The equivalent angle closest to where the bomb is now, so it never spins the long way round.
    this.targetYaw = base + TURN * Math.round((this.targetYaw - base) / TURN);
  }

  clearFocus() {
    this.focus = null;
    this.zoom = 1;
  }

  flip() {
    this.clearFocus();
    this.targetPitch = 0;
    this.targetYaw = (Math.round(this.targetYaw / Math.PI) + 1) * Math.PI;
  }

  drag(dx: number, dy: number) {
    this.targetYaw += dx * DRAG_SPEED;
    this.targetPitch = clamp(this.targetPitch + dy * DRAG_SPEED, -MAX_PITCH, MAX_PITCH);
    // A drag is followed exactly; easing it would feel like lag.
    this.yaw = this.targetYaw;
    this.pitch = this.targetPitch;
  }

  zoomBy(factor: number) {
    const [min, max] = this.focus === null ? [0.45, 1.4] : [0.7, 2.6];
    this.zoom = clamp(this.zoom * factor, min, max);
  }

  /** Moves the pose towards its target. Returns true while it is still moving. */
  step(deltaSeconds: number, aspect: number, jump: boolean): boolean {
    let x = 0;
    let y = 0;
    let distance = overviewDistance(this.layout, aspect) * this.zoom;
    if (this.focus !== null) {
      const place = slotPlace(this.layout, this.focus);
      x = place.x;
      y = place.y;
      distance = focusDistance(aspect) * this.zoom;
    }

    const first = Number.isNaN(this.distance);
    const k = jump || first ? 1 : 1 - Math.exp(-DAMPING * deltaSeconds);
    const gaps = [
      this.targetYaw - this.yaw,
      this.targetPitch - this.pitch,
      x - this.x,
      y - this.y,
      distance - (first ? distance : this.distance),
    ];
    const moving = k < 1 && gaps.some((gap) => Math.abs(gap) > SETTLED);
    const t = moving ? k : 1;
    this.yaw += gaps[0]! * t;
    this.pitch += gaps[1]! * t;
    this.x += gaps[2]! * t;
    this.y += gaps[3]! * t;
    this.distance = first ? distance : this.distance + gaps[4]! * t;
    return moving;
  }
}

let remembered: { key: string; rig: ViewRig } | null = null;

/**
 * BombScreen remounts its content on every strike to replay the shake animation.
 * Handing back the same rig keeps the player's rotation, zoom and focus through that.
 */
export function rigFor(key: string, layout: CaseLayout): ViewRig {
  if (remembered?.key !== key) remembered = { key, rig: new ViewRig(layout) };
  return remembered.rig;
}
