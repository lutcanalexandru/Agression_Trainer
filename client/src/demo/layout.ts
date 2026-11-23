// =============================================================================
// Layout helpers — every screen is drawn on the fixed 1440×1024 Figma stage,
// so elements are placed with Figma coordinates.
// =============================================================================

import type { CSSProperties } from "react";
import { C, FONT } from "./theme.ts";

/** Absolute position (and optional size) in Figma pixels. */
export function abs(x: number, y: number, w?: number, h?: number): CSSProperties {
    return {
        position: "absolute",
        left: x,
        top: y,
        ...(w !== undefined ? { width: w } : {}),
        ...(h !== undefined ? { height: h } : {}),
        boxSizing: "border-box",
    };
}

/** Share Tech Mono text style. */
export const text = (size: number, color: string = C.cream, extra: CSSProperties = {}): CSSProperties => ({
    fontFamily: FONT,
    fontSize: size,
    lineHeight: "normal",
    color,
    margin: 0,
    whiteSpace: "nowrap",
    ...extra,
});
