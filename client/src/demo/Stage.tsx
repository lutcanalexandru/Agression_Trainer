// =============================================================================
// Stage — renders the Figma canvas (1024 px high) scaled to the browser window.
//
// Fit (approved "stretch layout"): the canvas is scaled so its height fills the
// window. When the window is wider than Figma's 1440×1024 shape (e.g. Full HD
// 16:9), the canvas gets wider instead of leaving black bars: the extra width
// is passed to every screen as the CSS variable --kx (see layout.ts), which
// stretches panels, borders and grids horizontally while text and images keep
// their proportions. Narrower windows fall back to a uniform fit (--kx = 1).
// =============================================================================

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { C, STAGE_H, STAGE_W, injectGlobalStyles } from "./theme.ts";

injectGlobalStyles();

interface Fit { scale: number; width: number; kx: number }

function computeFit(): Fit {
    if (typeof window === "undefined") return { scale: 1, width: STAGE_W, kx: 1 };
    const scale = Math.min(window.innerHeight / STAGE_H, window.innerWidth / STAGE_W);
    const width = Math.max(STAGE_W, window.innerWidth / scale);
    return { scale, width, kx: width / STAGE_W };
}

export function Stage({ children }: { children: ReactNode }) {
    const [fit, setFit] = useState<Fit>(computeFit);

    useEffect(() => {
        const onResize = () => setFit(computeFit());
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <div style={{
            position: "fixed", inset: 0, background: C.bg, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{ width: fit.width * fit.scale, height: STAGE_H * fit.scale, position: "relative", flexShrink: 0 }}>
                <div style={{
                    position: "absolute", left: 0, top: 0, width: fit.width, height: STAGE_H,
                    transform: `scale(${fit.scale})`, transformOrigin: "top left",
                    "--kx": String(fit.kx),
                } as CSSProperties}>
                    {children}
                </div>
            </div>
        </div>
    );
}
