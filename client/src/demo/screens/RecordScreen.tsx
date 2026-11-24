// =============================================================================
// RecordScreen — Figma "Camera Record 1–4" (415:2367, 621:625, 621:1013, 621:1401).
//
//   START RECORDING  — records the live camera + microphone locally
//                      (MediaRecorder) so the user can watch it back.
//   REVIEW RESPONSE  — plays the local recording in the camera window
//                      (optional — the user may submit without reviewing).
//   DELETE RESPONSE  — hidden for now (approved).
//   Submit >         — ends this round: calls onSubmit → sendClipEnded().
//
// Note: the backend receives camera/mic frames for the whole round (video page
// + this page) through the existing capture pipeline, exactly as before. The
// local recording only powers "Review Response"; it is never uploaded.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import { C } from "../theme.ts";
import { abs, sxOff, text } from "../layout.ts";
import { AppHeader, Box, ConsoleButton, Grid, Label, Marker, Screen, SessionFooter } from "../ui.tsx";
import recPlay from "../assets/figma/rec-play.svg";
import recBracket from "../assets/figma/rec-bracket.png";
import recCamera from "../assets/figma/rec-camera.svg";
import recStatusDot from "../assets/figma/rec-status-dot.svg";

interface RecordScreenProps {
    stream: MediaStream | null;
    /** 1-based number of this response in the session. */
    responseNumber: number;
    onSubmit: () => void;
}

type Mode = "idle" | "recording" | "reviewing";

const GUIDANCE = [
    "Take your time to record an answer.",
    "Stop the recording once you have finished.",
    "Review your answer and submit.",
];

const TIPS = [
    "Maintain a calm and friendly demeanor & facial expression.",
    "Avoid quick/unnecessary movements.",
    "Keep a friendly tone of voice.",
    "Listen to the complaint and try to suggest a compromise.",
];

/** Decorative mic-level bars in the "Device checks" strip (x 962 → 1013, as in Figma). */
const AUDIO_BARS = [6, 10, 14, 18, 12, 20, 14, 8, 10, 6, 6];

function formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RecordScreen({ stream, responseNumber, onSubmit }: RecordScreenProps) {
    const [mode, setMode] = useState<Mode>("idle");
    const [seconds, setSeconds] = useState(0);
    const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
    const [recorderUnavailable, setRecorderUnavailable] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const liveEl = useRef<HTMLVideoElement | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // ── Live preview ──────────────────────────────────────────────────────────
    useEffect(() => {
        const el = liveEl.current;
        if (!el || !stream || mode === "reviewing") return;
        if (el.srcObject !== stream) el.srcObject = stream;
        el.play().catch(() => undefined);
    }, [stream, mode]);

    // ── Recording timer ───────────────────────────────────────────────────────
    useEffect(() => {
        if (mode !== "recording") return;
        const id = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, [mode]);

    // ── Cleanup: stop the recorder and free the blob URL ──────────────────────
    useEffect(() => () => {
        if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    }, []);
    useEffect(() => () => { if (recordingUrl) URL.revokeObjectURL(recordingUrl); }, [recordingUrl]);

    const startRecording = () => {
        if (!stream) { setRecorderUnavailable(true); return; }
        try {
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
                setRecordingUrl(URL.createObjectURL(blob));
            };
            recorder.start();
            recorderRef.current = recorder;
            setSeconds(0);
            setMode("recording");
        } catch (e) {
            console.error("[RecordScreen] MediaRecorder unavailable:", e);
            setRecorderUnavailable(true);
        }
    };

    const stopRecording = () => {
        recorderRef.current?.stop();
        recorderRef.current = null;
        setMode("idle");
    };

    const handleSubmit = () => {
        if (submitted) return;
        setSubmitted(true);
        onSubmit();
    };

    const recording = mode === "recording";
    const reviewing = mode === "reviewing";
    const hasRecording = recordingUrl !== null;
    // Submit needs a finished recording — or a browser that cannot record locally.
    const canSubmit = !submitted && !recording && (hasRecording || recorderUnavailable);

    return (
        <Screen outer>
            <AppHeader
                variant="large" status={`RESPONSE: ${responseNumber}`} statusSize={36}
                statusMarkerX={1100} statusTextX={1140} statusY={22}
            />

            {/* ── Camera preview ─────────────────────────────────────────── */}
            <Box x={33} y={144} w={994} h={649} border={2} color={C.cream80} bg={C.bg} style={{ borderRadius: 2 }} />
            <div style={{ ...abs(33, 144, 994, 24), background: C.bg, border: `2px solid ${C.cream80}`, borderBottomWidth: 1 }}>
                <span style={{ ...abs(10, 4), ...text(11, C.cream80) }}>CAM FEED · LEARNER · LIVE</span>
                <span style={{ ...abs(947, 4), ...text(11, C.white27) }}>▪▪▪</span>
            </div>
            <Box x={33} y={166} w={994} h={625} border={1} color={C.cream80} style={{ overflow: "hidden" }} />
            <Grid x={34} y={167} w={992} h={623} cellW={49.7} cellH={44.555} line={1} color={C.gridStrong} />

            <Box x={107} y={225} w={837} h={503} border={4} color={C.cream60} bg={C.bg} style={{ overflow: "hidden" }}>
                {reviewing && recordingUrl ? (
                    <video
                        key={recordingUrl}
                        src={recordingUrl}
                        autoPlay
                        playsInline
                        onEnded={() => setMode("idle")}
                        style={mediaStyle}
                    />
                ) : stream ? (
                    <video ref={liveEl} muted playsInline autoPlay style={mediaStyle} />
                ) : (
                    <img src={recCamera} alt="" width={124} height={124}
                         style={{ position: "absolute", left: "calc(50% - 62px)", top: 168, width: 124, height: 124 }} />
                )}
            </Box>

            {/* Corner brackets */}
            {/* Corner brackets — exact size, anchored to the inner camera frame (x 107 → 944) */}
            <img src={recBracket} alt="" style={{ ...bracket(sxOff(107, 23.4), 257), opacity: 0.7 }} />
            <img src={recBracket} alt="" style={{ ...bracket(sxOff(944, -64.6), 257), opacity: 0.7, transform: "rotate(90deg)" }} />
            <img src={recBracket} alt="" style={{ ...bracket(sxOff(107, 23.4), 658), opacity: 0.7, transform: "rotate(-90deg)" }} />
            <img src={recBracket} alt="" style={{ ...bracket(sxOff(944, -64.6), 658), opacity: 0.7, transform: "rotate(180deg)" }} />

            {/* Camera status (anchored to the inner frame's left edge) */}
            <img src={recStatusDot} alt="" width={23} height={23}
                 style={{
                     position: "absolute", left: sxOff(107, 40), top: 272, width: 23, height: 23,
                     animation: recording ? "at-blink 1s step-end infinite" : undefined, opacity: recording ? 1 : 0.45,
                 }} />
            <p style={{ position: "absolute", left: sxOff(107, 75), top: 272, ...text(20, C.cream80) }}>
                {recorderUnavailable ? "REC · UNAVAILABLE" : `REC · ${formatTime(seconds)}`}
            </p>

            {/* Device checks */}
            <Box x={33} y={811} w={994} h={65} border={2} color={C.cream80} bg={C.bg} />
            <Label x={49} y={823} size={13} color={C.red}>◎</Label>
            <Label x={63} y={819} size={20} color={C.cream80}>CAM ON</Label>
            <div style={{ ...abs(143, 823, 1, 14), background: C.white20 }} />
            <Label x={152} y={823} size={13} color={C.red}>♦</Label>
            <Label x={165} y={820} size={20} color={C.cream80}>MIC ON</Label>
            <div style={{ ...abs(962, 823, 52, 30), display: "flex", gap: 0.7, alignItems: "center" }}>
                {AUDIO_BARS.map((h, i) => (
                    <span key={i} style={{
                        width: 4, height: h, borderRadius: 2, flex: "none",
                        background: i > 8 ? "rgba(238,238,204,0.4)" : i > 6 ? C.cream60 : C.cream80,
                    }} />
                ))}
            </div>

            {/* ── Guidance column ────────────────────────────────────────── */}
            <Box x={1059} y={120} w={378} h={733} border={2} color={C.cream80} bg={C.bg} />
            <Box x={1059} y={120} w={378} h={50} border={2} color={C.cream80} />
            <Marker x={1089} y={135} w={9} h={21} />
            <Label x={1131} y={131} size={24} color={C.cream80}>RECORD YOUR RESPONSE</Label>
            <div style={{ ...abs(1074, 191, 357), display: "flex", flexDirection: "column", gap: 0 }}>
                {GUIDANCE.map(g => (
                    <div key={g} style={{ position: "relative", paddingLeft: 15 }}>
                        <span style={{ position: "absolute", left: 0, top: 5, width: 7, height: 19, background: C.cream80 }} />
                        <p style={{ ...text(20, C.cream80), lineHeight: 1.55, whiteSpace: "normal" }}>{g}</p>
                    </div>
                ))}
            </div>

            <Box x={1059} y={355} w={378} h={50} border={2} color={C.cream80} />
            <Marker x={1131} y={369} w={9} h={21} />
            <Label x={1183} y={367} size={24} color={C.cream80}>TIPS LIST</Label>
            <div style={{ ...abs(1081, 448, 334, 1), background: "rgba(105,15,35,0.27)" }} />
            <div style={{ ...abs(1072, 441, 359), display: "flex", flexDirection: "column", gap: 34 }}>
                {TIPS.map(t => (
                    <div key={t} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                        <span style={{ ...text(32, C.cream90), lineHeight: "30px", width: 16, flex: "none" }}>♦</span>
                        <p style={{ ...text(20, C.cream80), lineHeight: 1.74, whiteSpace: "normal" }}>{t}</p>
                    </div>
                ))}
            </div>

            {/* ── Controls ───────────────────────────────────────────────── */}
            <button
                type="button" className="at-btn"
                disabled={submitted || reviewing}
                onClick={recording ? stopRecording : startRecording}
                style={{
                    ...abs(31, 872, 232, 59), background: "rgba(13,13,15,0.8)", border: `3px solid ${C.cream80}`,
                    display: "flex", gap: 10, alignItems: "center", justifyContent: "center", padding: "0 20px",
                }}
            >
                {recording
                    ? <span style={{ ...text(16, C.sysRed) }}>■</span>
                    : <img src={recPlay} alt="" width={18} height={18} />}
                <span style={text(16, C.cream80)}>{recording ? "STOP RECORDING" : "START RECORDING"}</span>
            </button>

            <button
                type="button" className="at-btn"
                disabled={!hasRecording || recording || submitted}
                onClick={() => setMode(reviewing ? "idle" : "reviewing")}
                style={{
                    ...abs(283, 873, 243, 59), background: C.bg, border: `3px solid ${C.cream80}`,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px",
                }}
            >
                <span style={text(16, C.cream80)}>{reviewing ? "STOP REVIEW" : "REVIEW RESPONSE"}</span>
            </button>

            <ConsoleButton
                x={1113} y={872} w={236} h={60} label="Submit >" bg={C.bg}
                marker={{ x: 15.5, w: 13.68, h: 31.919 }}
                disabled={!canSubmit} onClick={handleSubmit}
                title={canSubmit ? undefined : "Record your response first"}
            />

            <SessionFooter />
        </Screen>
    );
}

const bracket = (left: string, top: number): React.CSSProperties => ({
    position: "absolute", left, top, width: 50.2, height: 50.2,
});

const mediaStyle: React.CSSProperties = {
    width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)",
};
