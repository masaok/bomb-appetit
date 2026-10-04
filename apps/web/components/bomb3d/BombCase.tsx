"use client";

import { Outlines, RoundedBox } from "@react-three/drei";
import { memo } from "react";
import { DEPTH } from "./layout";

const BODY = "#3a2f5c";
const PANEL = "#2b2247";
const OUTLINE = "#15101f";
const TOMATO = "#f04a3a";
const SUN = "#ffc94a";

const SIGNS = [-1, 1] as const;
const BUMPER = 0.38;
const BUMPER_INSET = 0.1;
/** The handle sits towards the back so the serial plate on top stays clear of it. */
export const HANDLE_Z = -0.32;

/** The casing: body, face panels, corner bumpers with bolts, and the carry handle. No textures. */
export const BombCase = memo(function BombCase({ width, height }: { width: number; height: number }) {
  const handleSpan = Math.min(width * 0.5, 2);
  const handleRise = 0.5;
  return (
    <group>
      <RoundedBox args={[width, height, DEPTH]} radius={0.16} smoothness={2}>
        <meshStandardMaterial color={BODY} roughness={0.75} flatShading />
        <Outlines thickness={3} color={OUTLINE} />
      </RoundedBox>

      {SIGNS.map((z) => (
        <mesh key={z} position={[0, 0, z * (DEPTH / 2 + 0.005)]}>
          <boxGeometry args={[width - 0.34, height - 0.34, 0.03]} />
          <meshStandardMaterial color={PANEL} roughness={0.9} />
        </mesh>
      ))}

      {/* A tomato belt round the middle breaks up the sides. */}
      <mesh>
        <boxGeometry args={[width + 0.04, height + 0.04, 0.16]} />
        <meshStandardMaterial color={TOMATO} roughness={0.6} flatShading />
      </mesh>

      {SIGNS.flatMap((x) =>
        SIGNS.flatMap((y) =>
          SIGNS.map((z) => (
            <group
              key={`${x}${y}${z}`}
              position={[
                x * (width / 2 - BUMPER_INSET),
                y * (height / 2 - BUMPER_INSET),
                z * (DEPTH / 2 - BUMPER_INSET),
              ]}
            >
              <RoundedBox args={[BUMPER, BUMPER, BUMPER]} radius={0.08} smoothness={1}>
                <meshStandardMaterial color={TOMATO} roughness={0.55} flatShading />
                <Outlines thickness={3} color={OUTLINE} />
              </RoundedBox>
              <mesh position={[0, 0, z * (BUMPER / 2 + 0.015)]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.085, 0.085, 0.05, 6]} />
                <meshStandardMaterial color={SUN} roughness={0.4} flatShading />
              </mesh>
            </group>
          )),
        ),
      )}

      <group position={[0, height / 2, HANDLE_Z]}>
        {SIGNS.map((x) => (
          <group key={x} position={[x * (handleSpan / 2), 0, 0]}>
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[0.34, 0.12, 0.34]} />
              <meshStandardMaterial color={TOMATO} roughness={0.55} flatShading />
            </mesh>
            <mesh position={[0, handleRise / 2 + 0.05, 0]}>
              <cylinderGeometry args={[0.07, 0.07, handleRise, 8]} />
              <meshStandardMaterial color={SUN} roughness={0.4} flatShading />
            </mesh>
          </group>
        ))}
        <mesh position={[0, handleRise + 0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, handleSpan + 0.3, 8]} />
          <meshStandardMaterial color={SUN} roughness={0.4} flatShading />
          <Outlines thickness={3} color={OUTLINE} />
        </mesh>
      </group>
    </group>
  );
});
