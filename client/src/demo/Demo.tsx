// =============================================================================
// Demo — Aggression Trainer flow (Figma prototype "Ver 2").
//
// Screen order:
//   BootScreen            — "LOADING SYSTEM" (waits for capture.init → ready)
//   HomeScreen            — intro + BEGIN SIMULATION → camera popup
//     └ "Yes."            — capture.start() (camera prompt) → connect()
//   RoundLoadingScreen    — connecting / evaluating between rounds (short loop)
//   VideoScreen           — state "active", step "watch"   (pixel-face video)
//   RecordScreen          — state "active", step "record"  (Submit → clip_ended)
//   ResultsLoadingScreen  — state "completed" until session_complete / feedback_unavailable
//   ResultsScreen / DetailsScreen — results review; TRY AGAIN restarts everything
//   StatusScreen          — queue position and errors
//
// Backend contract (unchanged): connect() → scenarios_list → the FIRST scenario
// is selected automatically (no scenario-select page) → for every clip the
// client sends clip_ended when the user submits → clip_selected / next clip →
// … → completed → feedback_token* → session_complete.
//
// Capture: the hidden <video> bound by capture.start() stays mounted for the
// whole session so the frame loop never loses its source. The Record page
// shows its own preview of the same MediaStream.
//
// Timeouts: only on pure network round-trips (scenario list, clip data). AI
// evaluation and feedback are never timed out client-side.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import type { ServerMessage, SessionComplete } from "@ar-training/shared";
import { useCapture } from "../hooks/useCapture.ts";
import { useSession } from "../hooks/useSession.ts";
import { Stage } from "./Stage.tsx";
import { useStuckTimeout } from "./hooks.ts";
import { adviceParagraphs } from "./resultsData.ts";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import { VideoScreen } from "./screens/VideoScreen.tsx";
import { RecordScreen } from "./screens/RecordScreen.tsx";
import { ResultsScreen } from "./screens/ResultsScreen.tsx";
import { DetailsScreen } from "./screens/DetailsScreen.tsx";
import {
    BootScreen, ResultsLoadingScreen, RoundLoadingScreen, StatusScreen,
} from "./screens/LoadingScreens.tsx";

/** Timeout for pure network round-trips only (scenarios list, clip data). */
const NETWORK_TIMEOUT_MS = 60_000;
/** How long the boot screen waits for the face/hand models before reporting an error. */
const CAPTURE_INIT_TIMEOUT_MS = 60_000;

type UiPhase = "boot" | "home" | "session";
type ReviewView = { page: "results" } | { page: "details"; index: number };

// ─── Demo ─────────────────────────────────────────────────────────────────────

export function Demo() {
    const { capture, ready, videoRef } = useCapture();

    const [uiPhase, setUiPhase] = useState<UiPhase>("boot");
    const [streamedAdvice, setStreamedAdvice] = useState("");
    const [finalMessage, setFinalMessage] = useState<SessionComplete | null>(null);
    const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    // Which step of which round is showing; the round number is sessionHistory.length.
    const [clipStep, setClipStep] = useState<{ round: number; step: "watch" | "record" }>({ round: 0, step: "watch" });
    const [resultsShown, setResultsShown] = useState(false);
    const [review, setReview] = useState<ReviewView>({ page: "results" });
    const [viewedDetails, setViewedDetails] = useState<boolean[]>([false, false, false, false]);

    const autoSelected = useRef(false);
    const finalMessageRef = useRef<SessionComplete | null>(null);

    const handleMessage = (msg: ServerMessage) => {
        if (msg.type === "feedback_token") {
            setStreamedAdvice(prev => prev + msg.token);
        }
        if (msg.type === "session_complete" && finalMessageRef.current === null) {
            finalMessageRef.current = msg;
            setFinalMessage(msg);
        }
    };

    const {
        state, queuePos, scenarios, currentClipData, feedbackUnavailable, sessionHistory,
        connect, disconnect, selectScenario, sendClipEnded,
    } = useSession(capture, { onMessage: handleMessage });

    // ── Auto-select the first scenario (no scenario-select page) ──────────────
    useEffect(() => {
        if (uiPhase !== "session" || state !== "selecting" || scenarios.length === 0 || autoSelected.current) return;
        autoSelected.current = true;
        const first = scenarios[0];
        selectScenario(first.scenario_id, first.entry_clip_id);
    }, [uiPhase, state, scenarios, selectScenario]);

    // ── Release the camera when the session is over ───────────────────────────
    useEffect(() => {
        if (state === "idle" || state === "completed") {
            capture.stop();
            setLiveStream(null);
        }
    }, [state, capture]);

    // ── Timeouts (network round-trips only) ───────────────────────────────────
    const inSession = uiPhase === "session";
    const waitingForScenarios = inSession && (state === "connecting" || state === "selecting") && scenarios.length === 0;
    const waitingForClipData = inSession && state === "active" && currentClipData === null;
    const scenariosTimedOut = useStuckTimeout(waitingForScenarios, NETWORK_TIMEOUT_MS);
    const clipDataTimedOut = useStuckTimeout(waitingForClipData, NETWORK_TIMEOUT_MS);
    const captureInitTimedOut = useStuckTimeout(uiPhase === "boot" && !ready, CAPTURE_INIT_TIMEOUT_MS);

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleAccept = async () => {
        setCameraError(null);
        autoSelected.current = false;
        setUiPhase("session");
        try {
            if (!videoRef.current) throw new Error("capture video element missing");
            await capture.start(videoRef.current);
            setLiveStream(capture.getStream());
        } catch (e) {
            console.error("[Demo] camera/microphone unavailable:", e);
            capture.stop();
            setCameraError(e instanceof Error ? e.message : String(e));
            return;
        }
        await connect();
    };

    /** TRY AGAIN / RETRY: drop the session and start again from the loading screen. */
    const handleRestart = () => {
        disconnect();
        capture.stop();
        setLiveStream(null);
        setStreamedAdvice("");
        setFinalMessage(null);
        finalMessageRef.current = null;
        setCameraError(null);
        setClipStep({ round: 0, step: "watch" });
        setResultsShown(false);
        setReview({ page: "results" });
        setViewedDetails([false, false, false, false]);
        autoSelected.current = false;
        setUiPhase("boot");
    };

    const openDetails = (index: number) => {
        setReview({ page: "details", index });
        setViewedDetails(v => v.map((seen, i) => seen || i === index));
    };

    // ── Screen selection ──────────────────────────────────────────────────────
    const round = sessionHistory.length;
    const step = clipStep.round === round ? clipStep.step : "watch";

    const renderScreen = () => {
        if (uiPhase === "boot") {
            if (captureInitTimedOut) {
                return <StatusScreen title="SYSTEM ERROR" lines={["CAMERA / FACE TRACKING MODULE FAILED TO LOAD.", "RELOAD THE PAGE TO TRY AGAIN."]} />;
            }
            return <BootScreen ready={ready} onDone={() => setUiPhase("home")} />;
        }

        if (uiPhase === "home") {
            return <HomeScreen onAccept={() => void handleAccept()} />;
        }

        // ── uiPhase === "session" ──
        if (cameraError) {
            return <StatusScreen
                title="CAMERA ACCESS DENIED"
                lines={["THIS SIMULATION NEEDS YOUR CAMERA AND MICROPHONE.", "ALLOW ACCESS IN YOUR BROWSER AND TRY AGAIN."]}
                buttonLabel="RETRY" onButton={handleRestart}
            />;
        }

        const sessionFinished = state === "completed" || finalMessage !== null;
        if (sessionFinished) {
            const feedbackReady = finalMessage !== null || feedbackUnavailable;
            if (!resultsShown) {
                return <ResultsLoadingScreen ready={feedbackReady} onDone={() => setResultsShown(true)} />;
            }
            const advice = finalMessage?.advice ?? streamedAdvice;
            const debrief = advice || finalMessage
                ? adviceParagraphs(advice, finalMessage?.highlights ?? [])
                : ["AI FEEDBACK UNAVAILABLE."];

            if (review.page === "details") {
                const allViewed = viewedDetails.every(Boolean);
                return <DetailsScreen
                    index={review.index}
                    onSelect={openDetails}
                    onBack={() => setReview({ page: "results" })}
                    showTryAgain={review.index === 3 || allViewed}
                    onTryAgain={handleRestart}
                    debrief={debrief}
                />;
            }
            return <ResultsScreen breakdown={debrief} onDetails={() => openDetails(0)} />;
        }

        if (state === "error" || state === "dropped") {
            return <StatusScreen
                title={state === "dropped" ? "CONNECTION LOST" : "CONNECTION FAILED"}
                lines={["THE TRAINING SERVER COULD NOT BE REACHED.", "CHECK THE CONNECTION AND TRY AGAIN."]}
                buttonLabel="RETRY" onButton={handleRestart}
            />;
        }

        if (state === "queued") {
            return <StatusScreen
                title="IN QUEUE"
                lines={[`QUEUE POSITION: ${queuePos ?? "..."}`, "ALL TRAINING SLOTS ARE IN USE. PLEASE STAND BY..."]}
                buttonLabel="CANCEL" onButton={handleRestart}
            />;
        }

        if (scenariosTimedOut || clipDataTimedOut) {
            return <StatusScreen
                title="SERVER TIMEOUT"
                lines={[scenariosTimedOut
                    ? "THE SERVER DID NOT RESPOND IN TIME."
                    : "THE SCENARIO DATA DID NOT ARRIVE. CHECK THE SCENARIO CONFIGURATION."]}
                buttonLabel="RETRY" onButton={handleRestart}
            />;
        }

        if (state === "selecting" && scenarios.length === 0) {
            return <StatusScreen title="NO SCENARIOS" lines={["NO TRAINING SCENARIOS ARE AVAILABLE ON THE SERVER."]}
                                 buttonLabel="RETRY" onButton={handleRestart} />;
        }

        if (state === "active" && currentClipData !== null) {
            if (step === "record") {
                return <RecordScreen
                    key={`record-${round}`}
                    stream={liveStream}
                    responseNumber={round + 1}
                    onSubmit={() => sendClipEnded(currentClipData.clip_id)}
                />;
            }
            return <VideoScreen
                key={`video-${round}`}
                clip={currentClipData}
                videoNumber={round + 1}
                onRecord={() => setClipStep({ round, step: "record" })}
            />;
        }

        // connecting / selecting / paused (evaluating) / waiting for clip data
        return <RoundLoadingScreen />;
    };

    return (
        <>
            {/* Capture source for the frame loop — always mounted, never visible. */}
            <video ref={videoRef} muted playsInline
                   style={{ position: "fixed", opacity: 0, pointerEvents: "none", width: 1, height: 1, top: 0, left: 0 }} />
            <Stage>{renderScreen()}</Stage>
        </>
    );
}
