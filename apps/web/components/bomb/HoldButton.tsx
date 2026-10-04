"use client";

import type { ButtonHTMLAttributes } from "react";
import { useRef } from "react";

/**
 * A button that reports press and release separately, for controls where how long
 * you hold matters. Works with pointer, touch, and the Space or Enter key.
 */
export function HoldButton({
  onPress,
  onRelease,
  ...rest
}: {
  onPress: () => void;
  onRelease: () => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onPointerDown" | "onPointerUp" | "onKeyDown" | "onKeyUp">) {
  const held = useRef(false);

  const press = () => {
    if (held.current) return;
    held.current = true;
    onPress();
  };
  const release = () => {
    if (!held.current) return;
    held.current = false;
    onRelease();
  };
  const isHoldKey = (key: string) => key === " " || key === "Enter";

  return (
    <button
      type="button"
      {...rest}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        press();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onBlur={release}
      onKeyDown={(e) => {
        if (isHoldKey(e.key) && !e.repeat) {
          e.preventDefault();
          press();
        }
      }}
      onKeyUp={(e) => {
        if (isHoldKey(e.key)) {
          e.preventDefault();
          release();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: "none", ...rest.style }}
    />
  );
}
