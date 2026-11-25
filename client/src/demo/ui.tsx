// =============================================================================
// Shared UI primitives for the console-style demo.
//
// Every screen is laid out on the fixed 1440×1024 Figma stage, so the
// primitives take Figma coordinates (x, y, w, h) and position absolutely.
// =============================================================================

import type { CSSProperties, ReactNode } from "react";
import { C, FONT } from "./theme.ts";
import { abs, absFixed, fitImage, text } from "./layout.ts";
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

// ─── Anchored groups ──────────────────────────────────────────────────────────

/**
 * Keeps its children at their exact Figma size and spacing (no horizontal
 * stretch) and moves the whole group with the stretched layout so that the
 * Figma x-coordinate `at` stays aligned. Use the left edge, centre or right
 * edge of the panel a group belongs to:
 *   <Anchor at={0}>    → stays at the left edge
 *   <Anchor at={720}>  → stays centred on the page
 *   <Anchor at={1440}> → stays at the right edge
 * Children use normal Figma coordinates.
 */
export function Anchor({ at: a, children }: { at: number; children: ReactNode }) {
    return (
        <div style={{ position: "absolute", left: `calc(${a}px * var(--kx, 1) - ${a}px)`, top: 0, width: 0, height: 0 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, "--kx": "1" } as CSSProperties}>
                {children}
            </div>
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
        <Anchor at={0}>
            <ConsoleButton
                x={0} y={88} w={146} h={52} label="<BACK" onClick={onClick}
                border={2} bg={C.bg} marker={{ x: 11, w: 13, h: 21 }} labelX={35}
            />
        </Anchor>
    );
}

// ─── Header / footer ──────────────────────────────────────────────────────────

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
                {/* Identity group: exact Figma size and spacing, kept at the left edge */}
                <Anchor at={0}>
                    <div style={{ ...abs(30, 26, 36, 36), background: C.redBrand, border: `1px solid ${C.cream}` }}>
                        <img src={logoAudioLines} alt="" width={23} height={23} style={{ position: "absolute", left: 5, top: 5, width: 23, height: 23 }} />
                    </div>
                    {large ? (
                        <>
                            <Label x={79} y={25} size={32}>AGGRESSION TRAINER</Label>
                            <div style={{ ...abs(328, 33, 1, 22), background: C.white20 }} />
                            <Marker x={403} y={29} w={5} h={28} color="rgba(238,238,204,0.81)" />
                            <Label x={421} y={33} size={20} color={C.white60}>DE-ESCALATION PROTOCOL</Label>
                        </>
                    ) : (
                        <>
                            <Label x={80} y={30.5} size={24}>AGGRESSION TRAINER</Label>
                            <Marker x={328} y={30} w={5} h={28} color="rgba(238,238,204,0.81)" />
                            <Label x={345} y={32} size={20} color={C.white60}>DE-ESCALATION PROTOCOL</Label>
                        </>
                    )}
                </Anchor>
                {/* Status (e.g. "VIDEO: 1"): exact size, kept at the right edge as in Figma */}
                <Anchor at={1440}>
                    <Marker x={statusMarkerX} y={statusY} w={15} h={39} />
                    <Label x={statusTextX} y={statusY} size={statusSize} color={statusColor}>{status}</Label>
                </Anchor>
            </div>
            <div style={{ ...abs(0, 0, 1440, 88), border: `2px solid ${C.cream80}`, pointerEvents: "none" }} />
        </>
    );
}

export function SessionFooter() {
    return (
        <div style={{ ...abs(0, 974, 1440, 50), background: C.bg, border: `1px solid ${C.footerLine}` }}>
            <Anchor at={0}>
                <Label x={79} y={15} size={16} color={C.white60}>▸ PRACTICE AT YOUR OWN PACE. YOU CANNOT PAUSE NOR LEAVE.</Label>
            </Anchor>
            <Anchor at={1440}>
                <div style={{ ...abs(947, 15), display: "flex", gap: 16, alignItems: "center", whiteSpace: "nowrap" }}>
                    <span style={text(16, C.sysRed)}>SYS:OK</span>
                    <span style={{ width: 1, height: 12, background: C.white13 }} />
                    <span style={text(16, C.white40)}>ILLUSTRATIVE TRAINING EXPERIENCE v2.0</span>
                </div>
            </Anchor>
        </div>
    );
}

// ─── Fingerprint panel (Results / Details, bottom right) ──────────────────────

/** Fingerprint box at the exact Figma size, kept at the left of the bottom-right panel (x 730). */
export function FingerprintPanel() {
    const corner = (src: string, x: number, y: number, rotate: number) => (
        <img src={src} alt="" width={15} height={15}
             style={{ ...abs(x, y, 15, 15), transform: rotate ? `rotate(${rotate}deg)` : undefined }} />
    );
    return (
        <Anchor at={730}>
            <Box x={769} y={795} w={189} h={160} color={C.cream} />
            <div style={{ ...abs(818, 809, 92, 134), opacity: 0.8 }}>
                <img src={fingerprintImg} alt="" style={fitImage("contain")} />
            </div>
            {corner(fpCornerTr, 935, 804, 0)}
            {corner(fpCornerBr, 935, 932, 90)}
            {corner(fpCornerTl, 778, 804, -90)}
            {corner(fpCornerBl, 778, 932, 180)}
        </Anchor>
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
