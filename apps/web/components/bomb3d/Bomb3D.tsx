"use client";

import type { BombState } from "@bombappetit/engine";
import { Canvas, invalidate, useFrame } from "@react-three/fiber";
import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import type { Group } from "three";
import { BombNet } from "@/components/bomb/BombNet";
import { EdgeworkStrip } from "@/components/bomb/Edgework";
import { BombCase } from "./BombCase";
import { EdgePlates } from "./EdgePlates";
import { Faces } from "./Faces";
import { caseLayout, DEPTH, FOV, slotPlace } from "./layout";
import { rigFor, type ViewRig } from "./rig";

type Dispatch = (moduleIndex: number, action: unknown) => void;

const DRAG_THRESHOLD_PX = 4;
const NO_DRAG = "[data-bomb-slot], [data-bomb-ui]";

let webglSupport: boolean | null = null;

function hasWebGL(): boolean {
  if (webglSupport === null) {
    try {
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
      webglSupport = gl !== null;
      // Browsers cap live contexts; hand this one back straight away.
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

class CanvasBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Runs the rig every rendered frame and keeps frames coming only while something is still moving. */
function RigDriver({
  rig,
  bombRef,
  jump,
}: {
  rig: ViewRig;
  bombRef: RefObject<Group | null>;
  jump: boolean;
}) {
  useFrame((state, delta) => {
    // With on-demand frames the first delta after a pause covers the whole pause.
    const moving = rig.step(Math.min(delta, 1 / 30), state.size.width / state.size.height, jump);
    state.camera.position.set(rig.x, rig.y, rig.distance);
    bombRef.current?.rotation.set(rig.pitch, rig.yaw, 0);
    if (moving) state.invalidate();
  });
  return null;
}

/**
 * drei's Html owns a react-dom root per plane. Mounted during the Canvas's first commit, React's
 * dev-mode effect replay tears that root down mid-commit and the plane can end up empty. Mounting
 * a frame later, from an update inside the canvas, keeps react-dom out of its own commit.
 */
function AfterFirstFrame({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useFrame(() => {
    if (!ready) setReady(true);
  });
  return ready ? children : null;
}

function Scene({
  bomb,
  dispatch,
  rig,
  focus,
  onFocus,
  jump,
}: {
  bomb: BombState;
  dispatch: Dispatch;
  rig: ViewRig;
  focus: number | null;
  onFocus: (slotIndex: number) => void;
  jump: boolean;
}) {
  const bombRef = useRef<Group>(null);
  const { layout } = rig;
  const timerIndex = bomb.slots.findIndex((slot) => slot.kind === "timer");
  const timer = slotPlace(layout, Math.max(0, timerIndex));
  const timerSide = timer.face === "front" ? 1 : -1;

  return (
    <>
      <color attach="background" args={["#191329"]} />
      <ambientLight intensity={1.5} color="#d9d0ff" />
      <directionalLight position={[3, 5, 8]} intensity={2.4} />
      {/* Declared before the bomb so the pose is current when the Html planes read it in the same frame. */}
      <RigDriver rig={rig} bombRef={bombRef} jump={jump} />
      <group ref={bombRef}>
        <BombCase width={layout.width} height={layout.height} />
        <pointLight
          position={[timer.x * timerSide, timer.y, timerSide * (DEPTH / 2 + 0.35)]}
          color="#f04a3a"
          intensity={2.5}
          distance={2.6}
        />
        <AfterFirstFrame>
          <Faces bomb={bomb} dispatch={dispatch} layout={layout} focus={focus} onFocus={onFocus} />
          <EdgePlates edgework={bomb.edgework} layout={layout} />
        </AfterFirstFrame>
      </group>
    </>
  );
}

const BUTTON =
  "rounded-full border-2 border-[#15101f] bg-[#3a2f5c] px-4 py-1.5 text-sm font-bold text-[#fff6e9] shadow-[0_3px_0_#15101f] hover:bg-[#4a3d73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun active:translate-y-0.5 active:shadow-none";

function Bomb3DView({ bomb, dispatch }: { bomb: BombState; dispatch: Dispatch }) {
  const layout = caseLayout(bomb.spec.caseSize);
  const [rig] = useState(() =>
    rigFor(`${bomb.spec.bombSeed}:${bomb.spec.ruleSeed}:${bomb.spec.caseSize}`, layout),
  );
  const [focus, setFocus] = useState(rig.focus);
  const reducedMotion = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);

  const focusSlot = (slotIndex: number) => {
    rig.focusSlot(slotIndex);
    setFocus(slotIndex);
    invalidate();
  };
  const overview = () => {
    rig.clearFocus();
    setFocus(null);
    invalidate();
  };
  const flip = () => {
    rig.flip();
    setFocus(null);
    invalidate();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      )
        return;
      if (event.key === "Escape") {
        rig.clearFocus();
      } else if (event.key === "f" || event.key === "F") {
        rig.flip();
      } else {
        return;
      }
      setFocus(null);
      invalidate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rig]);

  // Native listeners: module DOM lives in drei's own React roots, and wheel must be non-passive to stop page scroll.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let travelled = 0;
    let pinch = 0;

    const spread = () => {
      const [a, b] = [...pointers.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      // Modules need their own pointer events (press and hold), so a drag never starts on one.
      if (event.target instanceof Element && event.target.closest(NO_DRAG)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      el.setPointerCapture(event.pointerId);
      travelled = 0;
      pinch = spread();
    };
    const move = (event: PointerEvent) => {
      const last = pointers.get(event.pointerId);
      if (!last) return;
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const now = spread();
        if (pinch > 0 && now > 0) rig.zoomBy(pinch / now);
        pinch = now;
      } else if (pointers.size === 1) {
        travelled += Math.abs(dx) + Math.abs(dy);
        if (travelled < DRAG_THRESHOLD_PX) return;
        if (rig.focus !== null) {
          rig.clearFocus();
          setFocus(null);
        }
        rig.drag(dx, dy);
        el.dataset.dragging = "";
      }
      invalidate();
    };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      pinch = spread();
      if (pointers.size === 0) delete el.dataset.dragging;
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      rig.zoomBy(Math.exp(event.deltaY * 0.0012));
      invalidate();
    };
    const menu = (event: MouseEvent) => {
      event.preventDefault();
      rig.clearFocus();
      setFocus(null);
      invalidate();
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("contextmenu", menu);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("contextmenu", menu);
    };
  }, [rig]);

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={stage}
        className="relative isolate h-[70vh] min-h-[420px] w-full cursor-grab touch-none overflow-hidden rounded-3xl border-2 border-[#15101f] bg-[#191329] select-none data-dragging:cursor-grabbing"
      >
        <Canvas
          frameloop="demand"
          dpr={[1, 1.75]}
          camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 0, 8] }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          aria-label="3D view of the bomb"
        >
          <Scene
            bomb={bomb}
            dispatch={dispatch}
            rig={rig}
            focus={focus}
            onFocus={focusSlot}
            jump={reducedMotion}
          />
        </Canvas>
        <div data-bomb-ui className="absolute top-3 left-3 z-20 flex gap-2">
          {focus !== null && (
            <button type="button" onClick={overview} className={BUTTON}>
              Back
            </button>
          )}
          <button type="button" onClick={flip} className={BUTTON} aria-keyshortcuts="F">
            Flip
          </button>
        </div>
        <p className="pointer-events-none absolute right-4 bottom-3 z-20 text-xs text-[#b9b0d0]">
          Drag to turn · scroll to zoom · click a module to focus · F flips · Esc goes back
        </p>
      </div>
      <EdgeworkStrip edgework={bomb.edgework} />
    </div>
  );
}

/** The bomb as a 3D case with live DOM modules on its faces. Falls back to the flat net without WebGL. */
export function Bomb3D({ bomb, dispatch }: { bomb: BombState; dispatch: Dispatch }) {
  const [supported] = useState(hasWebGL);
  const flat = <BombNet bomb={bomb} dispatch={dispatch} />;
  if (!supported) return flat;
  return (
    <CanvasBoundary fallback={flat}>
      <Bomb3DView bomb={bomb} dispatch={dispatch} />
    </CanvasBoundary>
  );
}
