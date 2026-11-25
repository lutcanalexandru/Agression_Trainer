// =============================================================================
// VideoScreen — the aggressive-encounter video pages.
//
//   First video  → Figma "Page 1 - Ver 2" (402:1310): large video window.
//   Later videos → Figma "Page 2/3/4 - Ver 2" (391:1334 …): smaller window with
//                  the HUD panels (terrain, sphere, volume levels, stats).
//
// Behaviour
//   • The face GIF and voice clip are chosen by the clip's aggression level
//     (faceVideos.ts). The GIF loops while the voice clip plays, then freezes
//     on its current frame. No file → empty grid + "NO SIGNAL".
//   • The voice clip's text (Dutch + English, per aggression level) is typed
//     out in the VIDEO TRANSCRIPT panel.
//   • RECORD ANSWER is disabled until the voice clip has finished.
//   • Rewind (bottom-right of the video window) plays the ≤ 1 s loading
//     sequence, then restarts voice + face from the beginning (no page reload,
//     so the session and earlier recordings are kept).
// =============================================================================

import { useEffect, useRef, useState } from "react";
import type { ClipData } from "@ar-training/shared";
import { C } from "../theme.ts";
import { abs, fitImage, insetX, text } from "../layout.ts";
import { useTypewriter } from "../hooks.ts";
import { Anchor, AppHeader, Box, ConsoleButton, Cursor, Grid, Label, Marker, Screen, SessionFooter } from "../ui.tsx";
import { getFaceMedia } from "../faceVideos.ts";
import type { FaceMediaInfo } from "../faceVideos.ts";
import { getGifDurationMs } from "../gifDuration.ts";
import { GifPlayer } from "../GifPlayer.tsx";
import { RewindLoadingScreen } from "./LoadingScreens.tsx";
import rewindIcon from "../assets/figma/rewind-icon.png";
import hudTerrain from "../assets/figma/hud-terrain.png";
import hudSphere from "../assets/figma/hud-sphere.png";
import hudWaveform from "../assets/figma/hud-waveform.png";

interface VideoScreenProps {
    clip: ClipData;
    /** 1-based number of this video in the session. */
    videoNumber: number;
    onRecord: () => void;
}

export function VideoScreen({ clip, videoNumber, onRecord }: VideoScreenProps) {
    const face = getFaceMedia(clip);
    // Without a playable face there is nothing to wait for.
    const [ended, setEnded] = useState(face.visual === null);
    const [rewinding, setRewinding] = useState(false);
    const [playKey, setPlayKey] = useState(0);

    if (rewinding) {
        return <RewindLoadingScreen onDone={() => { setRewinding(false); setPlayKey(k => k + 1); }} />;
    }

    const large = videoNumber === 1;
    const L = large ? LARGE : STANDARD;

    return (
        <Screen>
            <AppHeader
                variant={large ? "large" : "small"} status={`VIDEO: ${videoNumber}`} statusSize={36}
                statusMarkerX={L.status.markerX} statusTextX={L.status.textX} statusY={L.status.y}
            />

            <Grid {...L.grid} />

            {/* Video window: takes the same share of the video area as in Figma (≈ 93 % of the width,
                ≈ 92 % of the height), so a gap stays around it and the grid shows through; on wide
                screens it becomes wider rather than square */}
            <Box {...L.window} border={4} color={C.cream60} style={{ overflow: "hidden" }}>
                <FaceMedia key={playKey} face={face} onEnded={() => setEnded(true)} />
            </Box>
            {/* Replay: on the window's bottom-right corner */}
            <Anchor at={L.window.x + L.window.w}>
                <button
                    type="button" className="at-btn" aria-label="Replay video" title="Replay video"
                    onClick={() => setRewinding(true)}
                    style={{ ...abs(L.rewind.x, L.rewind.y, 137, 83), background: C.bg, border: `2px solid ${C.cream80}`, padding: 0 }}
                >
                    <img src={rewindIcon} alt="" style={{
                        position: "absolute", left: 24, top: 3, width: 74, height: 74,
                        objectFit: "cover", opacity: 0.8, transform: "scaleX(-1)",
                    }} />
                </button>
            </Anchor>

            {/* Transcript */}
            {L.transcriptBars.map((b, i) => <Box key={i} {...b} border={1} color={C.cream60} />)}
            <Anchor at={L.leftCenter}>
                <Marker x={L.transcriptTitleX} y={735} w={15} h={27} />
                <Label x={L.transcriptTitleX + 19} y={735} size={24}>VIDEO TRANSCRIPT</Label>
            </Anchor>
            <Box {...L.transcriptBox} border={2} color={C.cream60} />
            <Marker x={20} y={L.transcriptTextY} w={13} h={32} color={C.cream80} />
            <Transcript key={playKey} text={face.transcript} x={L.transcriptTextX} y={L.transcriptTextY} w={L.transcriptTextW} size={L.transcriptSize} />

            {large ? <RequirementsPanel /> : <HudPanels />}

            <Anchor at={L.recordAnchor}>
                <ConsoleButton
                    {...L.record} w={354} h={87} label="RECORD ANSWER >"
                    marker={{ x: 25, w: 15, h: 35 }} labelX={64}
                    disabled={!ended} onClick={onRecord}
                    title={ended ? undefined : "Watch the video first"}
                />
            </Anchor>

            <SessionFooter />
        </Screen>
    );
}

// ─── Layout constants (Figma coordinates) ─────────────────────────────────────

const LARGE = {
    status: { markerX: 1132, textX: 1172, y: 24 },
    grid: { x: 0, y: 88, w: 1024, h: 633, cellW: 51.2, cellH: 45.125, line: 2, color: C.grid },
    window: { x: 42, y: 125, w: 939, h: 557 },
    rewind: { x: 870, y: 629 },
    transcriptBars: [{ x: 0, y: 721, w: 1024, h: 54 }],
    transcriptTitleX: 405,
    transcriptBox: { x: 0, y: 775, w: 1023, h: 199 },
    transcriptTextX: 45, transcriptTextY: 835, transcriptTextW: 959, transcriptSize: 32,
    record: { x: 1058, y: 850 },
    /** Centre of the left area (video window, transcript title) and of the right column (button). */
    leftCenter: 512, recordAnchor: 1232,
};

const STANDARD = {
    status: { markerX: 1140, textX: 1180, y: 26 },
    grid: { x: 0, y: 88, w: 730, h: 633, cellW: 36.5, cellH: 45.125, line: 2, color: C.gridFaint },
    window: { x: 27, y: 111, w: 676, h: 586 },
    rewind: { x: 575, y: 631 },
    transcriptBars: [{ x: 0, y: 721, w: 730, h: 54 }, { x: 730, y: 722, w: 277, h: 54 }],
    transcriptTitleX: 250,
    transcriptBox: { x: 0, y: 775, w: 730, h: 199 },
    // 24 px instead of Figma's 32 px so the longest (Livid) text fits the
    // narrower transcript box (approved).
    transcriptTextX: 41, transcriptTextY: 810, transcriptTextW: 683, transcriptSize: 24,
    record: { x: 1052, y: 850 },
    leftCenter: 365, recordAnchor: 1223.5,
};

// ─── Pieces ───────────────────────────────────────────────────────────────────

/**
 * The face in the video window.
 *   GIF  → the level's voice clip (MP3) plays; the GIF loops while it plays and
 *          freezes on its current frame when the clip ends → RECORD unlocks.
 *          No voice clip → the GIF plays one loop (length read from the file).
 *   MP4  → (per-clip override) plays with its own sound.
 */
function FaceMedia({ face, onEnded }: { face: FaceMediaInfo; onEnded: () => void }) {
    const videoEl = useRef<HTMLVideoElement | null>(null);
    const audioEl = useRef<HTMLAudioElement | null>(null);
    const endedRef = useRef(onEnded);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const doneRef = useRef(false);
    useEffect(() => { endedRef.current = onEnded; }, [onEnded]);
    const [failed, setFailed] = useState(false);
    const [talking, setTalking] = useState(true);

    const visual = face.visual;

    /** The person has finished: freeze the face and unlock RECORD ANSWER. */
    const finish = () => {
        if (doneRef.current) return;
        doneRef.current = true;
        setTalking(false);
        endedRef.current();
    };

    // Start video playback with sound; if the browser blocks it, fall back to muted.
    useEffect(() => {
        const el = videoEl.current;
        if (!el) return;
        el.currentTime = 0;
        el.play().catch(() => {
            el.muted = true;
            el.play().catch(() => endedRef.current());
        });
    }, []);

    // Stop the voice clip and timers when leaving the page / rewinding.
    useEffect(() => () => {
        clearTimeout(timerRef.current);
        audioEl.current?.pause();
    }, []);

    /** Called when the first GIF frame is on screen. */
    const startVoice = () => {
        const a = audioEl.current;
        if (face.audio && a) {
            a.currentTime = 0;
            a.play().catch(() => finish());
            return;
        }
        if (visual?.kind === "gif") {
            getGifDurationMs(visual.src)
                .then(ms => { timerRef.current = setTimeout(finish, ms); })
                .catch(() => finish());
        }
    };

    if (!visual || failed) {
        return (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={text(36, C.cream80)}>NO SIGNAL<Cursor w={14} h={30} /></span>
            </div>
        );
    }

    if (visual.kind === "gif") {
        return (
            <>
                <GifPlayer
                    src={visual.src}
                    playing={talking}
                    onStart={startVoice}
                    onError={() => { setFailed(true); finish(); }}
                    style={{
                        width: "100%", height: "100%", objectFit: "contain", display: "block",
                        // 8% bigger inside the window (the GIF has empty space around the face).
                        transform: "scale(1.08)", transformOrigin: "50% 60%",
                    }}
                />
                {face.audio && (
                    <audio ref={audioEl} src={face.audio} preload="auto" onEnded={finish} onError={finish} />
                )}
            </>
        );
    }

    return (
        <video
            ref={videoEl}
            src={visual.src}
            playsInline
            preload="auto"
            onEnded={() => endedRef.current()}
            onError={() => { setFailed(true); endedRef.current(); }}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
    );
}

function Transcript({ text: full, x, y, w, size }: { text: string; x: number; y: number; w: number; size: number }) {
    const shown = useTypewriter(full, 40);
    const boxRef = useRef<HTMLDivElement | null>(null);
    // Keep the line being typed in view when the text is taller than the panel.
    useEffect(() => {
        const el = boxRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [shown]);
    return (
        <div ref={boxRef} className="at-scroll" style={{ ...abs(x, y, w, 966 - y), overflowY: "auto" }}>
            <p style={{ ...text(size, C.cream), whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{shown}</p>
        </div>
    );
}

/** Page 1 right column. */
function RequirementsPanel() {
    const items = [
        "Watch the video.",
        "Proceed to record your response.",
        "Submit your recording.",
        "Repeat until the end of the Simulation.",
    ];
    return (
        <>
            <Box x={1024} y={88} w={416} h={80} border={1} color={C.cream80} />
            <Box x={1024} y={88} w={416} h={886} border={2} color={C.cream70} />
            {/* Heading keeps its size at the column's left; the list uses the column's width (Figma margins) */}
            <Anchor at={1024}>
                <Marker x={1045} y={111} w={15} h={35} />
                <Label x={1077} y={110} size={32}>{"REQUIREMENTS >"}</Label>
            </Anchor>
            <div style={{ position: "absolute", top: 192, ...insetX(1024, 1440, 21, 34), display: "flex", flexDirection: "column", gap: 29 }}>
                {items.map(t => (
                    <div key={t} style={{ position: "relative", paddingLeft: 19 }}>
                        <span style={{ position: "absolute", left: 0, top: 6, width: 7, height: 19, background: C.cream80 }} />
                        <p style={{ ...text(24, C.cream), whiteSpace: "normal" }}>{t}</p>
                    </div>
                ))}
            </div>
        </>
    );
}

/** Inner area of a HUD section (Figma x0 → x1, top y, height h) minus a 16 px margin. */
const HUD_PAD = 16;
function hudSlot(x0: number, x1: number, y: number, h: number): React.CSSProperties {
    return { position: "absolute", top: y + HUD_PAD, height: h - 2 * HUD_PAD, ...insetX(x0, x1, HUD_PAD, HUD_PAD) };
}

/** Pages 2–4 right column (decorative HUD panels from the prototype). */
function HudPanels() {
    const bar = (x: number, y: number, h = 26) => <Marker key={`${x}-${y}`} x={x} y={y} w={12} h={h} color={C.cream80} />;
    return (
        <>
            <Box x={730} y={88} w={395} h={343} border={2} color={C.cream80} />
            <Box x={730} y={494} w={710} h={227} border={2} color={C.cream80} />
            <Box x={730} y={775} w={277} h={199} border={2} color={C.cream80} />
            <Box x={1125} y={88} w={315} h={343} border={2} color={C.cream80} />
            <Box x={730} y={88} w={710} h={886} border={2} color={C.cream70} />

            {/* Decorative pictures: no frame; each fills its section as far as it can
                without overflowing (16 px margin), keeping its own proportions */}
            <div style={hudSlot(730, 1125, 88, 343)}>
                <img src={hudTerrain} alt="" style={{ ...fitImage("contain"), opacity: 0.92 }} />
            </div>
            <div style={hudSlot(1125, 1440, 88, 343)}>
                <img src={hudSphere} alt="" style={fitImage("contain")} />
            </div>

            <Anchor at={730}>
                <Marker x={771} y={449} w={15} h={27} />
                <Label x={800} y={449} size={24}>VOLUME LEVELS</Label>
            </Anchor>
            <div style={hudSlot(730, 1440, 494, 227)}>
                <img src={hudWaveform} alt="" style={{ ...fitImage("contain"), opacity: 0.74 }} />
            </div>

            <Anchor at={730}>
                <Marker x={751} y={734} w={15} h={30} />
                <Label x={773} y={735} size={24}>CURRENT STATS:</Label>
                {[bar(750, 796), bar(767, 796), bar(750, 840, 25), bar(767, 840, 25), bar(784, 840, 25), bar(750, 885), bar(750, 930)]}
            </Anchor>
        </>
    );
}
