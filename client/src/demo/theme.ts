// =============================================================================
// Theme — colours, font and global CSS for the console-style demo UI.
//
// All values are taken from the Figma prototype (Aggression-Training-App,
// "Ver 2" screens). The whole UI is drawn on a fixed 1440×1024 stage (see
// Stage.tsx) so coordinates below are Figma pixels.
// =============================================================================

export const STAGE_W = 1440;
export const STAGE_H = 1024;

export const C = {
    bg:          "#0d0d0f",
    cream:       "#eeeecc",
    cream90:     "rgba(238,238,204,0.9)",
    cream80:     "rgba(238,238,204,0.8)",
    cream70:     "rgba(238,238,204,0.7)",
    cream60:     "rgba(238,238,204,0.6)",
    white:       "#ffffff",
    white80:     "rgba(238,238,238,0.8)",
    white60:     "rgba(238,238,238,0.6)",
    white40:     "rgba(238,238,238,0.4)",
    white27:     "rgba(238,238,238,0.27)",
    white20:     "rgba(238,238,238,0.2)",
    white13:     "rgba(238,238,238,0.13)",
    gridStrong:  "rgba(238,238,238,0.3)",
    grid:        "rgba(238,238,238,0.11)",
    gridFaint:   "rgba(238,238,238,0.08)",
    footerLine:  "rgba(238,238,236,0.8)",
    red:         "#7b191a",            // "Channel marker" accents
    redBrand:    "rgba(123,25,26,0.8)",
    maroon:      "#690f23",            // card accent line
    sysRed:      "rgba(230,103,96,0.9)",
    // Results chart segment colours, darkest (score 1) → lightest (score 10)
    seg1:        "#4e0005",
    seg2:        "#7b191a",
    seg3:        "#b43536",
    seg4:        "#c9ba89",
} as const;

export const FONT = "'Share Tech Mono', ui-monospace, monospace";

let injected = false;

/** Load the Share Tech Mono font and the shared keyframes once per page. */
export function injectGlobalStyles(): void {
    if (injected || typeof document === "undefined") return;
    injected = true;

    const pre1 = document.createElement("link");
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";
    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "";
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap";
    document.head.append(pre1, pre2, font);

    const style = document.createElement("style");
    style.textContent = `
        @keyframes at-blink { 50% { opacity: 0; } }
        .at-btn { cursor: pointer; transition: background-color 120ms, opacity 120ms; }
        .at-btn:hover:not(:disabled) { background-color: rgba(238,238,204,0.08) !important; }
        .at-btn:disabled { cursor: not-allowed; opacity: 0.35; }
        .at-scroll { scrollbar-width: thin; scrollbar-color: rgba(238,238,204,0.4) transparent; }
        .at-scroll::-webkit-scrollbar { width: 6px; }
        .at-scroll::-webkit-scrollbar-thumb { background: rgba(238,238,204,0.4); }
    `;
    document.head.appendChild(style);
}
