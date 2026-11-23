// =============================================================================
// Stage — renders the fixed 1440×1024 Figma canvas and scales it to fit the
// browser window (up-scaled on Full HD, down-scaled on smaller windows), keeping
// the prototype's exact proportions. The area around the canvas stays black.
// =============================================================================

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { C, STAGE_H, STAGE_W, injectGlobalStyles } from "./theme.ts";

injectGlobalStyles();

function computeScale(): number {
    if (typeof window === "undefined") return 1;
    return Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
}

export function Stage({ children }: { children: ReactNode }) {
    const [scale, setScale] = useState(computeScale);

    useEffect(() => {
        const onResize = () => setScale(computeScale());
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <div style={{
            position: "fixed", inset: 0, background: C.bg, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{ width: STAGE_W * scale, height: STAGE_H * scale, position: "relative", flexShrink: 0 }}>
                <div style={{
                    position: "absolute", left: 0, top: 0, width: STAGE_W, height: STAGE_H,
                    transform: `scale(${scale})`, transformOrigin: "top left",
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
