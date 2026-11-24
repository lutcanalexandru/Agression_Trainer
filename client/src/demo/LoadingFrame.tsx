// =============================================================================
// LoadingFrame — the console "LOADING SYSTEM" frame (Figma "Loading Screen A").
// The progress bar is stepped by useProgress() in hooks.ts
// (Figma frames A1…A5 show 2, 5, 9, 13 and 17 blocks).
// =============================================================================

import type { CSSProperties, ReactNode } from "react";
import { C } from "./theme.ts";
import { abs, sxOff, text } from "./layout.ts";
import { Screen } from "./ui.tsx";
import cornerTl from "./assets/figma/corner-tl.svg";
import cornerTr from "./assets/figma/corner-tr.svg";
import cornerBl from "./assets/figma/corner-bl.svg";
import cornerBr from "./assets/figma/corner-br.svg";
import barLeft from "./assets/figma/bar-left.svg";
import barMiddle from "./assets/figma/bar-middle.svg";
import barRight from "./assets/figma/bar-right.svg";

const MAX_BLOCKS = 17;

const BLOCK_X = 549;
const BLOCK_STRIDE = 20.98;
/** Half the width of a full 17-block bar. */
const BAR_HALF = ((MAX_BLOCKS - 1) * BLOCK_STRIDE + 14.349) / 2;

const cornerBox = (left: string, top: number, w: number, h: number): CSSProperties => ({
    position: "absolute", left, top, width: w, height: h,
    display: "flex", alignItems: "center", justifyContent: "center",
});

interface LoadingFrameProps {
    /** Centre title, e.g. "LOADING SYSTEM". Omit to show only `children`. */
    label?: string;
    /** Number of progress blocks (0–17). */
    blocks?: number;
    /** Left edge of the progress bar (Results Loading A5 starts at 544). */
    blockX?: number;
    children?: ReactNode;
}

export function LoadingFrame({ label, blocks = 0, blockX = BLOCK_X, children }: LoadingFrameProps) {
    return (
        <Screen>
            {/* Outer 3 px frame and inner console box */}
            <div style={{ ...abs(0, 0, 1439, 1020), border: `3px solid ${C.cream80}` }} />
            <div style={{ ...abs(74, 113, 1290, 852), border: `2px solid ${C.cream80}` }} />

            {/* Corner brackets — exact size, anchored to the inner box (x 74 → 1364) */}
            <img src={cornerTl} alt="" width={116} height={115}
                 style={{ position: "absolute", left: sxOff(74, 45), top: 153, width: 116, height: 115 }} />
            <div style={{ ...cornerBox(sxOff(74, 45), 801.37, 116.279, 115.151) }}>
                <img src={cornerBl} alt="" width={115} height={116} style={{ width: 115.151, height: 116.279, transform: "rotate(-90deg)", flex: "none" }} />
            </div>
            <div style={{ ...cornerBox(sxOff(1364, -160.35), 153, 115.349, 115.367) }}>
                <img src={cornerTr} alt="" width={115} height={115} style={{ width: 115.367, height: 115.349, transform: "rotate(90deg)", flex: "none" }} />
            </div>
            <div style={{ ...cornerBox(sxOff(1364, -160.35), 801.37, 115.351, 115.151) }}>
                <img src={cornerBr} alt="" width={115} height={115} style={{ width: 115.351, height: 115.151, transform: "rotate(180deg)", flex: "none" }} />
            </div>

            {/* Red top bars — the end pieces keep their shape, the middle bar stretches */}
            <img src={barLeft} alt="" width={62} height={42} style={{ position: "absolute", left: sxOff(74, 0), top: 34, width: 62, height: 42 }} />
            <img src={barMiddle} alt="" width={1167} height={42}
                 style={{ position: "absolute", left: sxOff(74, 62), top: 34, width: `calc(1290px * var(--kx, 1) - 123px)`, height: 42 }} />
            <img src={barRight} alt="" width={61} height={42} style={{ position: "absolute", left: sxOff(1364, -61), top: 34, width: 61, height: 42 }} />

            {label && (
                <p style={{ ...abs(721 - 300, 519, 600, 40), ...text(36, C.white), textAlign: "center" }}>{label}</p>
            )}

            {/* Progress bar — blocks keep their size; the full bar is centred under the title */}
            {Array.from({ length: Math.min(blocks, MAX_BLOCKS) }, (_, i) => (
                <div key={i} style={{
                    position: "absolute", top: 586, width: 14.349, height: 31.919, background: C.cream80,
                    left: sxOff(blockX + BAR_HALF, -BAR_HALF + i * BLOCK_STRIDE),
                }} />
            ))}

            {children}
        </Screen>
    );
}

