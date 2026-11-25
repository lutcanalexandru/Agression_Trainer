// =============================================================================
// Loading-style screens built on LoadingFrame.
//
//   BootScreen           — "LOADING SYSTEM" A1→A5 at app start, waits for the
//                          face/hand models (capture.init) before finishing.
//   RewindLoadingScreen  — short sequence (≤ 1 s) shown when the Rewind button
//                          on a video page is pressed.
//   RoundLoadingScreen   — the same short sequence, looping while the backend
//                          evaluates a response / prepares the next clip.
//   ResultsLoadingScreen — "YOU HAVE SUCCESSFULLY COMPLETED THE TEST!" typed out,
//                          then "LOADING YOUR RESULTS" until feedback is ready.
//   StatusScreen         — console-style queue / error messages (no Figma frame;
//                          approved addition) with a RETRY / CANCEL button.
// =============================================================================

import { useState } from "react";
import { C } from "../theme.ts";
import { abs, text } from "../layout.ts";
import { useProgress, useTypewriter } from "../hooks.ts";
import { Anchor, ConsoleButton, Cursor } from "../ui.tsx";
import { LoadingFrame } from "../LoadingFrame.tsx";

/** Boot sequence step length: 5 steps ≈ 2.5 s. */
const BOOT_STEP_MS = 500;
/** Rewind / between-round step length: 5 steps ≈ 0.9 s (the rewind must be ≤ 1 s). */
const SHORT_STEP_MS = 180;
/** Results progress step length. */
const RESULTS_STEP_MS = 450;

export function BootScreen({ ready, onDone }: { ready: boolean; onDone: () => void }) {
    // Loops until the capture models are ready, then finishes the bar and continues.
    const blocks = useProgress(BOOT_STEP_MS, !ready, onDone);
    return <LoadingFrame label="LOADING SYSTEM" blocks={blocks} />;
}

export function RewindLoadingScreen({ onDone }: { onDone: () => void }) {
    const blocks = useProgress(SHORT_STEP_MS, false, onDone);
    return <LoadingFrame label="LOADING SYSTEM" blocks={blocks} />;
}

export function RoundLoadingScreen() {
    const blocks = useProgress(SHORT_STEP_MS, true);
    return <LoadingFrame label="LOADING SYSTEM" blocks={blocks} />;
}

// ─── Results loading ──────────────────────────────────────────────────────────

const COMPLETED_TEXT = "YOU HAVE SUCCESSFULLY COMPLETED THE TEST!\n\n\nPLEASE STAND BY...";

function ResultsProgress({ ready, onDone }: { ready: boolean; onDone: () => void }) {
    const blocks = useProgress(RESULTS_STEP_MS, !ready, onDone);
    return <LoadingFrame label="LOADING YOUR RESULTS" blocks={blocks} />;
}

export function ResultsLoadingScreen({ ready, onDone }: { ready: boolean; onDone: () => void }) {
    const [typed, setTyped] = useState(false);
    const shown = useTypewriter(COMPLETED_TEXT, 45, () => setTimeout(() => setTyped(true), 700));

    if (typed) return <ResultsProgress ready={ready} onDone={onDone} />;

    return (
        <LoadingFrame>
            <p style={{ ...abs(513, 433, 411, 212), ...text(36, C.white), whiteSpace: "pre-wrap", textAlign: "center" }}>
                {shown}
                <Cursor w={14} h={30} color={C.cream80} />
            </p>
        </LoadingFrame>
    );
}

// ─── Status (queue / errors) ──────────────────────────────────────────────────

interface StatusScreenProps {
    title: string;
    lines: string[];
    buttonLabel?: string;
    onButton?: () => void;
}

export function StatusScreen({ title, lines, buttonLabel, onButton }: StatusScreenProps) {
    return (
        <LoadingFrame label={title}>
            <div style={{ ...abs(170, 590, 1100, 120), display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                {lines.map((l, i) => (
                    <p key={i} style={{ ...text(24, C.cream80), whiteSpace: "pre-wrap", textAlign: "center" }}>
                        {`> ${l}`}{i === lines.length - 1 && <Cursor w={10} h={20} />}
                    </p>
                ))}
            </div>
            {buttonLabel && onButton && (
                <Anchor at={721}>
                    <ConsoleButton
                        x={721 - 129.5} y={730} w={259} h={66} label={buttonLabel} onClick={onButton}
                        border={2} bg={C.bg} fontSize={32} labelColor={C.white} marker={{ x: 17, w: 15, h: 35 }}
                    />
                </Anchor>
            )}
        </LoadingFrame>
    );
}
