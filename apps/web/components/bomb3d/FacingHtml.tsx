"use client";

import { Html } from "@react-three/drei";
import { invalidate, useFrame } from "@react-three/fiber";
import { useCallback, useRef, type ReactNode } from "react";
import { Vector3, type Group } from "three";
import { HTML_SCALE } from "./layout";

const normal = new Vector3();
const toCamera = new Vector3();
const origin = new Vector3();

/**
 * A DOM plane glued to one side of the case. DOM always paints over the canvas, so the
 * plane is hidden (and unclickable) whenever its side faces away from the camera.
 */
export function FacingHtml({
  position,
  rotation,
  interactive = false,
  children,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  interactive?: boolean;
  children: ReactNode;
}) {
  const anchor = useRef<Group>(null);
  const content = useRef<HTMLDivElement | null>(null);

  // Html mounts its children in a root of its own, after the frame that would have placed them.
  const attach = useCallback((el: HTMLDivElement | null) => {
    content.current = el;
    if (el) invalidate();
  }, []);

  useFrame(({ camera }) => {
    const group = anchor.current;
    const el = content.current;
    if (!group || !el) return;
    group.updateWorldMatrix(true, false);
    normal.setFromMatrixColumn(group.matrixWorld, 2).normalize();
    toCamera.copy(camera.position).sub(origin.setFromMatrixPosition(group.matrixWorld)).normalize();
    el.style.visibility = normal.dot(toCamera) > 0.06 ? "visible" : "hidden";
  });

  return (
    <group ref={anchor} position={position} rotation={rotation}>
      {/* Html's own wrapper stays click-through: only this div is hidden, and a hidden div must not leave a hit area behind. */}
      <Html transform scale={HTML_SCALE} zIndexRange={[10, 0]} pointerEvents="none">
        <div ref={attach} style={{ visibility: "hidden", pointerEvents: interactive ? "auto" : "none" }}>
          {children}
        </div>
      </Html>
    </group>
  );
}
