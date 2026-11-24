// =============================================================================
// Shared UI primitives for the console-style demo.
//
// Every screen is laid out on the fixed 1440×1024 Figma stage, so the
// primitives take Figma coordinates (x, y, w, h) and position absolutely.
// =============================================================================

import type { CSSProperties, ReactNode } from "react";
import { C, FONT } from "./theme.ts";
import { abs, absFixed, fitImage, sxOff, text } from "./layout.ts";
import { useTypewriter } from "./hooks.ts";
import logoAudioLines from "./assets/figma/logo-audio-lines.svg";
import fingerprintImg from "./assets/figma/fingerprint.png";
import fpCornerTl from "./assets/figma/fp-corner-tl.svg";
import fpCornerTr from "./assets/figma/fp-corner-tr.svg";
import fpCornerBl from "./assets/figma/fp-corner-bl.svg";
import fpCornerBr from "./assets/figma/fp-corner-br.svg";

// ─── Screen ───────────────────────────────────────────────────────────────────

/** Full 1440×1024 screen background. `outer` draws the 3 px frame some screens use. */
export function Screen({ children, outer = false }: { children: ReactNode; outer?: boolean }) {
    return (
        <div style={{ position: "absolute", inset: 0, background: C.bg, overflow: "hidden", fontFamily: FONT }}>
            {outer && <div style={{ ...abs(0, 0, 1440, 1024), border: `3px solid ${C.cream80}`, pointerEvents: "none" }} />}
            {children}
        </div>
    );
}

// ─── Basic shapes ─────────────────────────────────────────────────────────────

interface BoxProps {
    x: number; y: number; w: number; h: number;
    border?: number;
    color?: string;
    bg?: string;
    style?: CSSProperties;
    children?: ReactNode;
}

/** Outlined rectangle. */
export function Box({ x, y, w, h, border = 1, color = C.cream60, bg = "transparent", style, children }: BoxProps) {
    return (
        <div style={{ ...abs(x, y, w, h), border: border ? `${border}px solid ${color}` : "none", background: bg, ...style }}>
            {children}
        </div>
    );
}

/** Solid "Channel marker" block (the red / cream accent bars). Keeps its exact size. */
export function Marker({ x, y, w, h, color = C.red, style }: { x: number; y: number; w: number; h: number; color?: string; style?: CSSProperties }) {
    return <div style={{ ...absFixed(x, y, w, h), background: color, ...style }} />;
}

/** Text placed at a Figma coordinate. */
export function Label({ x, y, size, color = C.cream, children, style }: {
    x: number; y: number; size: number; color?: string; children: ReactNode; style?: CSSProperties;
}) {
    return <p style={{ ...abs(x, y), ...text(size, color), ...style }}>{children}</p>;
}

/**
 * Background grid made of cells that each carry their own border, exactly like
 * the Figma frames (adjacent cell borders double up into thicker lines).
 */
export function Grid({ x, y, w, h, cellW, cellH, line = 2, color = C.grid }: {
    x: number; y: number; w: number; h: number; cellW: number; cellH: number; line?: number; color?: string;
}) {
    const l = `${line}px`;
    const horiz = `linear-gradient(to right, ${color} 0 ${l}, transparent ${l} calc(100% - ${l}), ${color} calc(100% - ${l}))`;
    const vert  = `linear-gradient(to bottom, ${color} 0 ${l}, transparent ${l} calc(100% - ${l}), ${color} calc(100% - ${l}))`;
    return (
        <div style={{
            ...abs(x, y, w, h),
            backgroundImage: `${horiz}, ${vert}`,
            backgroundSize: `${cellW}px ${cellH}px`,
            pointerEvents: "none",
        }} />
    );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

interface ConsoleButtonProps {
    x: number; y: number; w: number; h: number;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    fontSize?: number;
    border?: number;
    borderColor?: string;
    /** Red marker, relative to the button's top-left corner. */
    marker?: { x: number; w: number; h: number };
    /** Label x offset inside the button. When omitted the label is centred in the space right of the marker. */
    labelX?: number;
    labelColor?: string;
    bg?: string;
    title?: string;
}

/** Outlined console button with the red channel marker, as used throughout the prototype. */
export function ConsoleButton({
    x, y, w, h, label, onClick, disabled = false, fontSize = 32, border = 3,
    borderColor = C.cream80, marker, labelX, labelColor = C.cream, bg = "transparent", title,
}: ConsoleButtonProps) {
    const markerEnd = marker ? marker.x + marker.w : 0;
    return (
        <button
            type="button"
            className="at-btn"
            title={title}
            disabled={disabled}
            onClick={onClick}
            style={{ ...abs(x, y, w, h), border: `${border}px solid ${borderColor}`, background: bg, padding: 0 }}
        >
            {marker && (
                <span style={{
                    position: "absolute", left: marker.x - border, top: (h - marker.h) / 2 - border,
                    width: marker.w, height: marker.h, background: C.red,
                }} />
            )}
            <span style={{
                position: "absolute",
                top: 0, bottom: 0,
                left: (labelX ?? markerEnd) - border,
                right: labelX !== undefined ? undefined : 0,
                display: "flex", alignItems: "center",
                justifyContent: labelX !== undefined ? "flex-start" : "center",
                ...text(fontSize, labelColor),
            }}>
                {label}
            </span>
        </button>
    );
}

/** "<BACK" button (Figma "Back Button"). Only used on the Details pages. */
export function BackButton({ onClick }: { onClick: () => void }) {
    return (
        <ConsoleButton
            x={0} y={88} w={146} h={52} label="<BACK" onClick={onClick}
            border={2} bg={C.bg} marker={{ x: 11, w: 13, h: 21 }} labelX={35}
        />
    );
}

// ─── Header / footer ──────────────────────────────────────────────────────────

/** Absolute position from a precomputed CSS left value. */
const at = (left: string, top: number): CSSProperties => ({ position: "absolute", left, top });

interface HeaderProps {
    /** "large" = Page 1 / Camera Record header (32 px title), "small" = all other screens. */
    variant?: "large" | "small";
    /** Right-hand status text, e.g. "VIDEO: 1". */
    status: string;
    statusSize?: number;
    statusMarkerX: number;
    statusTextX: number;
    statusY: number;
    statusColor?: string;
}

export function AppHeader({
    variant = "small", status, statusSize = 32, statusMarkerX, statusTextX, statusY, statusColor = C.cream,
}: HeaderProps) {
    const large = variant === "large";
    return (
        <>
            <div style={{ ...abs(0, 0, 1440, 88), background: C.bg, borderBottom: `1px solid ${C.white20}` }}>
                {/* Brand mark */}
                <div style={{ ...absFixed(30, 26, 36, 36), background: C.redBrand, border: `1px solid ${C.cream}` }}>
                    <img src={logoAudioLines} alt="" width={23} height={23} style={{ position: "absolute", left: 5, top: 5, width: 23, height: 23 }} />
                </div>
                {/* Identity group keeps its exact internal spacing (anchored at x 30) */}
                {large ? (
                    <>
                        <p style={{ ...at(sxOff(30, 49), 25), ...text(32) }}>AGGRESSION TRAINER</p>
                        <div style={{ ...at(sxOff(30, 298), 33), width: 1, height: 22, background: C.white20 }} />
                        <div style={{ ...at(sxOff(30, 373), 29), width: 5, height: 28, background: "rgba(238,238,204,0.81)" }} />
                        <p style={{ ...at(sxOff(30, 391), 33), ...text(20, C.white60) }}>DE-ESCALATION PROTOCOL</p>
                    </>
                ) : (
                    <>
                        <p style={{ ...at(sxOff(30, 50), 30.5), ...text(24) }}>AGGRESSION TRAINER</p>
                        <div style={{ ...at(sxOff(30, 298), 30), width: 5, height: 28, background: "rgba(238,238,204,0.81)" }} />
                        <p style={{ ...at(sxOff(30, 315), 32), ...text(20, C.white60) }}>DE-ESCALATION PROTOCOL</p>
                    </>
                )}
                {/* Status: marker + text keep their exact gap */}
                <Marker x={statusMarkerX} y={statusY} w={15} h={39} />
                <p style={{ ...at(sxOff(statusMarkerX, statusTextX - statusMarkerX), statusY), ...text(statusSize, statusColor) }}>{status}</p>
            </div>
            <div style={{ ...abs(0, 0, 1440, 88), border: `2px solid ${C.cream80}`, pointerEvents: "none" }} />
        </>
    );
}

export function SessionFooter() {
    return (
        <div style={{ ...abs(0, 974, 1440, 50), background: C.bg, border: `1px solid ${C.footerLine}` }}>
            <Label x={79} y={15} size={16} color={C.white60}>▸ PRACTICE AT YOUR OWN PACE. YOU CANNOT PAUSE NOR LEAVE.</Label>
            <div style={{ ...abs(947, 15), display: "flex", gap: 16, alignItems: "center" }}>
                <span style={text(16, C.sysRed)}>SYS:OK</span>
                <span style={{ width: 1, height: 12, background: C.white13 }} />
                <span style={text(16, C.white40)}>ILLUSTRATIVE TRAINING EXPERIENCE v2.0</span>
            </div>
        </div>
    );
}

// ─── Fingerprint panel (Results / Details, bottom right) ──────────────────────

export function FingerprintPanel() {
    // Corners hug the (stretched) box edges: box spans x 769 → 958 in Figma.
    const corner = (src: string, side: "left" | "right", y: number, rotate: number) => (
        <img src={src} alt="" width={15} height={15}
             style={{
                 position: "absolute", top: y, width: 15, height: 15,
                 left: side === "left" ? sxOff(769, 9) : sxOff(958, -23),
                 transform: rotate ? `rotate(${rotate}deg)` : undefined,
             }} />
    );
    return (
        <>
            <Box x={769} y={795} w={189} h={160} color={C.cream} />
            <div style={{ ...abs(769, 809, 189, 134), opacity: 0.8 }}>
                <img src={fingerprintImg} alt="" style={fitImage("contain")} />
            </div>
            {corner(fpCornerTr, "right", 804, 0)}
            {corner(fpCornerBr, "right", 932, 90)}
            {corner(fpCornerTl, "left", 804, -90)}
            {corner(fpCornerBl, "left", 932, 180)}
        </>
    );
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

/** Blinking block cursor used after typewriter text. */
export function Cursor({ w = 9, h = 22, color = C.cream80, style }: { w?: number; h?: number; color?: string; style?: CSSProperties }) {
    return (
        <span style={{
            display: "inline-block", width: w, height: h, background: color,
            verticalAlign: "text-bottom", marginLeft: 4, animation: "at-blink 1s step-end infinite", ...style,
        }} />
    );
}

/**
 * Typewriter text split into paragraphs; each paragraph gets the cream
 * channel marker on its left, as in the Results / Details breakdown panels.
 */
export function TypedParagraphs({ paragraphs, size, msPerChar = 18, markerW = 11, markerH = 29, gap = 28, color = C.cream }: {
    paragraphs: string[]; size: number; msPerChar?: number; markerW?: number; markerH?: number; gap?: number; color?: string;
}) {
    const SEP = "\u0000";
    const typed = useTypewriter(paragraphs.join(SEP), msPerChar);
    const shown = typed.split(SEP);
    const typing = typed.length < paragraphs.join(SEP).length;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap }}>
            {shown.map((p, i) => (
                <div key={i} style={{ position: "relative", paddingLeft: 0 }}>
                    <span style={{ position: "absolute", left: -(markerW + 11), top: 3, width: markerW, height: markerH, background: C.cream80 }} />
                    <p style={{ ...text(size, color), whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {p}
                        {typing && i === shown.length - 1 && <Cursor w={10} h={size * 0.9} />}
                    </p>
                </div>
            ))}
        </div>
    );
}
