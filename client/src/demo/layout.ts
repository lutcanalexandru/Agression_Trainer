// =============================================================================
// Layout helpers — every screen is drawn with Figma coordinates (1440×1024).
//
// Horizontal stretch (approved): Stage.tsx widens the canvas to the browser
// window's shape and sets the CSS variable --kx (≥ 1). All horizontal
// positions and panel widths are multiplied by --kx so panels, borders, grids
// and buttons reach both screen edges. Vertical values are never stretched,
// and text sizes are untouched.
//
//   abs()      — position AND width stretch (panels, boxes, text areas, lines)
//   absFixed() — position stretches, size stays exact (icons, markers, images)
// =============================================================================

import type { CSSProperties } from "react";
import { C, FONT } from "./theme.ts";

/** A horizontal Figma length, stretched by the current --kx factor. */
export function sx(v: number): string {
    return `calc(${v}px * var(--kx, 1))`;
}

/** A stretched Figma x plus an exact pixel offset, e.g. to hug a stretched box's edge. */
export function sxOff(v: number, offsetPx: number): string {
    return `calc(${v}px * var(--kx, 1) + ${offsetPx}px)`;
}

/**
 * A text area that fills a stretched panel (Figma x0 → x1) with exact pixel
 * insets on both sides, so the text keeps the Figma margin to the panel edge.
 */
export function insetX(x0: number, x1: number, padLeft: number, padRight: number): CSSProperties {
    return {
        left: sxOff(x0, padLeft),
        width: `calc(${x1 - x0}px * var(--kx, 1) - ${padLeft + padRight}px)`,
    };
}

/** Absolute position and optional size; x and width stretch horizontally. */
export function abs(x: number, y: number, w?: number, h?: number): CSSProperties {
    return {
        position: "absolute",
        left: sx(x),
        top: y,
        ...(w !== undefined ? { width: sx(w) } : {}),
        ...(h !== undefined ? { height: h } : {}),
        boxSizing: "border-box",
    };
}

/** Absolute position whose x stretches but whose size stays exactly w × h. */
export function absFixed(x: number, y: number, w?: number, h?: number): CSSProperties {
    return {
        position: "absolute",
        left: sx(x),
        top: y,
        ...(w !== undefined ? { width: w } : {}),
        ...(h !== undefined ? { height: h } : {}),
        boxSizing: "border-box",
    };
}

/** Image that keeps its proportions inside a (possibly stretched) box. */
export const fitImage = (fit: "contain" | "cover" = "contain"): CSSProperties => ({
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, display: "block",
});

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
