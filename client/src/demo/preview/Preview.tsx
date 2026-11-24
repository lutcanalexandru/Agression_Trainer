// =============================================================================
// Page preview — DEV SERVER ONLY (approved). Opens every demo page on its own,
// with mock data and NO backend, so the design can be checked and clicked
// through like the Figma prototype.
//
//   http://localhost:5173/demo.html?preview            → page index
//   http://localhost:5173/demo.html?preview=<page>     → one page, e.g. ?preview=results
//
// The buttons on each page move through the flow (Home → popup → video →
// record → … → results → details → Try Again). Press Esc to go back to the
// index. Nothing here talks to the server; the real training flow (Demo.tsx)
// is untouched. main.tsx only loads this file when running `npm run dev`, so
// it is never part of the production / Docker build.
// =============================================================================

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ClipData } from "@ar-training/shared";
import { C, FONT, injectGlobalStyles } from "../theme.ts";
import { Stage } from "../Stage.tsx";
import { HomeScreen } from "../screens/HomeScreen.tsx";
import { VideoScreen } from "../screens/VideoScreen.tsx";
import { RecordScreen } from "../screens/RecordScreen.tsx";
import { ResultsScreen } from "../screens/ResultsScreen.tsx";
import { DetailsScreen } from "../screens/DetailsScreen.tsx";
import {
    BootScreen, ResultsLoadingScreen, RewindLoadingScreen, RoundLoadingScreen, StatusScreen,
} from "../screens/LoadingScreens.tsx";
import { CRITERIA } from "../resultsData.ts";

injectGlobalStyles();

// ─── Mock data ────────────────────────────────────────────────────────────────

/** Actor features that produce each aggression level (see faceVideos.ts). */
const LEVEL_FEATURES: Record<number, string[]> = {
    5: ["raised_voice", "aggressive_posture", "pointing_gesture"],   // Livid
    4: ["raised_voice", "aggressive_posture", "direct_eye_contact"], // Furious
    3: ["raised_voice", "aggressive_posture", "backing_away"],       // Angry
    2: ["crossed_arms", "direct_eye_contact"],                       // Annoyed
    1: ["calm_voice", "open_posture"],                               // Neutral
};
const LEVEL_NAMES: Record<number, string> = { 5: "Livid", 4: "Furious", 3: "Angry", 2: "Annoyed", 1: "Neutral" };

/** Aggression level used for video 1, 2, 3, 4 when clicking through the flow. */
const FLOW_LEVELS = [4, 5, 3, 1];
const FLOW_VIDEOS = FLOW_LEVELS.length;

function mockClip(level: number, n: number): ClipData {
    return {
        type: "clip_data", session_id: "preview", scenario_id: "preview",
        clip_id: `preview_${n}_${level}`, video_url: "", transcript: "",
        notable_features: LEVEL_FEATURES[level] ?? LEVEL_FEATURES[5], branch_conditions: [],
    } as unknown as ClipData;
}

/** Stand-in for the AI debrief the backend would send (MOCK). */
const MOCK_DEBRIEF = [
    "[MOCK FEEDBACK] You stayed calm during most of the encounter and acknowledged the customer's frustration.",
    "Try to offer a concrete next step sooner — e.g. checking the order status together.",
    "Turn 2: voice tension spiked",
];

// ─── URL-based navigation (keeps the page alive so audio can autoplay) ───────

interface Route { page: string; params: URLSearchParams }

function readRoute(): Route {
    const params = new URLSearchParams(location.search);
    return { page: params.get("preview") ?? "", params };
}

function go(page: string, extra: Record<string, string | number> = {}) {
    const p = new URLSearchParams({ preview: page });
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    history.pushState(null, "", `${location.pathname}?${p.toString()}`);
    dispatchEvent(new PopStateEvent("popstate"));
}

// ─── Record page with a real camera preview (no backend) ─────────────────────

function RecordPreview({ n }: { n: number }) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    useEffect(() => {
        let s: MediaStream | null = null;
        let cancelled = false;
        navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
            .then(ms => { if (cancelled) ms.getTracks().forEach(t => t.stop()); else { s = ms; setStream(ms); } })
            .catch(e => console.warn("[preview] camera unavailable:", e));
        return () => { cancelled = true; s?.getTracks().forEach(t => t.stop()); };
    }, []);
    return (
        <RecordScreen
            stream={stream}
            responseNumber={n}
            onSubmit={() => go("round", { n })}
        />
    );
}

/** Between-round loading: waits 2 s, then the next video or the results. */
function RoundPreview({ n }: { n: number }) {
    useEffect(() => {
        const id = setTimeout(() => {
            if (n >= FLOW_VIDEOS) go("results-loading");
            else go("video", { n: n + 1, level: FLOW_LEVELS[n] });
        }, 2000);
        return () => clearTimeout(id);
    }, [n]);
    return <RoundLoadingScreen />;
}

// ─── Preview app ──────────────────────────────────────────────────────────────

export function Preview() {
    const [route, setRoute] = useState<Route>(readRoute);
    const [viewed, setViewed] = useState<boolean[]>([false, false, false, false]);

    useEffect(() => {
        const onPop = () => setRoute(readRoute());
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") go(""); };
        addEventListener("popstate", onPop);
        addEventListener("keydown", onKey);
        return () => { removeEventListener("popstate", onPop); removeEventListener("keydown", onKey); };
    }, []);

    const num = (key: string, fallback: number) => {
        const v = Number(route.params.get(key));
        return Number.isFinite(v) && v > 0 ? v : fallback;
    };

    const openDetails = (index: number) => {
        setViewed(v => v.map((seen, i) => seen || i === index));
        go("details", { i: index + 1 });
    };

    let screen: ReactNode;
    switch (route.page) {
        case "":
            return <PreviewIndex />;
        case "boot":
            screen = <BootScreen ready onDone={() => go("home")} />;
            break;
        case "home":
            screen = <HomeScreen key="home" onAccept={() => go("video", { n: 1, level: FLOW_LEVELS[0] })} />;
            break;
        case "popup":
            screen = <HomeScreen key="popup" initialPopupOpen onAccept={() => go("video", { n: 1, level: FLOW_LEVELS[0] })} />;
            break;
        case "video": {
            const n = num("n", 1);
            const level = num("level", FLOW_LEVELS[(n - 1) % FLOW_VIDEOS]);
            screen = <VideoScreen key={`${n}-${level}`} clip={mockClip(level, n)} videoNumber={n} onRecord={() => go("record", { n })} />;
            break;
        }
        case "rewind":
            screen = <RewindLoadingScreen onDone={() => go("video", { n: 1, level: FLOW_LEVELS[0] })} />;
            break;
        case "record": {
            const n = num("n", 1);
            screen = <RecordPreview key={n} n={n} />;
            break;
        }
        case "round":
            screen = <RoundPreview key={num("n", 1)} n={num("n", 1)} />;
            break;
        case "results-loading":
            screen = <ResultsLoadingScreen ready onDone={() => go("results")} />;
            break;
        case "results":
            screen = <ResultsScreen breakdown={MOCK_DEBRIEF} onDetails={() => openDetails(0)} />;
            break;
        case "details": {
            const index = Math.min(num("i", 1), 4) - 1;
            screen = <DetailsScreen
                index={index}
                onSelect={openDetails}
                onBack={() => go("results")}
                showTryAgain={index === 3 || viewed.every(Boolean)}
                onTryAgain={() => { setViewed([false, false, false, false]); go("boot"); }}
                debrief={MOCK_DEBRIEF}
            />;
            break;
        }
        case "queue":
            screen = <StatusScreen title="IN QUEUE" lines={["QUEUE POSITION: 2", "ALL TRAINING SLOTS ARE IN USE. PLEASE STAND BY..."]}
                                   buttonLabel="CANCEL" onButton={() => go("home")} />;
            break;
        case "error":
            screen = <StatusScreen title="CONNECTION FAILED" lines={["THE TRAINING SERVER COULD NOT BE REACHED.", "CHECK THE CONNECTION AND TRY AGAIN."]}
                                   buttonLabel="RETRY" onButton={() => go("boot")} />;
            break;
        case "camera-denied":
            screen = <StatusScreen title="CAMERA ACCESS DENIED" lines={["THIS SIMULATION NEEDS YOUR CAMERA AND MICROPHONE.", "ALLOW ACCESS IN YOUR BROWSER AND TRY AGAIN."]}
                                   buttonLabel="RETRY" onButton={() => go("boot")} />;
            break;
        default:
            return <PreviewIndex unknown={route.page} />;
    }

    // Activate the "viewed" bookkeeping when a details page is opened directly by URL.
    if (route.page === "details") {
        const index = Math.min(num("i", 1), 4) - 1;
        if (!viewed[index]) setViewed(v => v.map((seen, i) => seen || i === index));
    }

    return <Stage>{screen}</Stage>;
}

// ─── Index page ───────────────────────────────────────────────────────────────

interface Entry { label: string; page: string; params?: Record<string, string | number>; note?: string }

const GROUPS: { title: string; entries: Entry[] }[] = [
    {
        title: "START",
        entries: [
            { label: "Loading sequence", page: "boot", note: "→ Home" },
            { label: "Home", page: "home" },
            { label: "Home + camera popup", page: "popup" },
        ],
    },
    {
        title: "VIDEO PAGES (face + voice + transcript per aggression level)",
        entries: [
            ...[5, 4, 3, 2, 1].map(level => ({
                label: `Video 1 (large) — ${LEVEL_NAMES[level]}`, page: "video", params: { n: 1, level },
            })),
            ...[5, 4, 3, 2, 1].map(level => ({
                label: `Video 2 (HUD layout) — ${LEVEL_NAMES[level]}`, page: "video", params: { n: 2, level },
            })),
            { label: "Rewind loading (≤ 1 s)", page: "rewind" },
        ],
    },
    {
        title: "RECORDING",
        entries: [
            { label: "Camera Record", page: "record", params: { n: 1 }, note: "asks for camera access" },
            { label: "Between-round loading", page: "round", params: { n: 1 }, note: "→ next video after 2 s" },
        ],
    },
    {
        title: "RESULTS",
        entries: [
            { label: "Results loading", page: "results-loading" },
            { label: "Results", page: "results" },
            ...CRITERIA.map((c, i) => ({ label: `Details ${i + 1} — ${c.label}`, page: "details", params: { i: i + 1 } })),
        ],
    },
    {
        title: "STATUS SCREENS",
        entries: [
            { label: "In queue", page: "queue" },
            { label: "Connection failed", page: "error" },
            { label: "Camera access denied", page: "camera-denied" },
        ],
    },
];

function PreviewIndex({ unknown }: { unknown?: string }) {
    const link = (e: Entry) => {
        const p = new URLSearchParams({ preview: e.page });
        for (const [k, v] of Object.entries(e.params ?? {})) p.set(k, String(v));
        return `?${p.toString()}`;
    };
    return (
        <div className="at-scroll" style={{
            position: "fixed", inset: 0, overflowY: "auto", background: C.bg, color: C.cream,
            fontFamily: FONT, padding: "48px 64px",
        }}>
            <h1 style={{ fontSize: 40, fontWeight: 400, margin: 0, borderLeft: `14px solid ${C.red}`, paddingLeft: 16 }}>
                PAGE PREVIEW
            </h1>
            <p style={{ color: C.white60, fontSize: 18, margin: "16px 0 8px" }}>
                Every page with mock data and no backend (dev server only). Buttons click through the flow. Press Esc on any page to return here.
            </p>
            <p style={{ color: C.white60, fontSize: 18, margin: "0 0 32px" }}>
                The real training environment is the same URL without <span style={{ color: C.cream }}>?preview</span>.
            </p>
            {unknown && <p style={{ color: C.sysRed, fontSize: 18 }}>Unknown page "{unknown}".</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 32 }}>
                {GROUPS.map(g => (
                    <section key={g.title} style={{ border: `1px solid ${C.cream60}`, padding: 20 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 400, color: C.white60, margin: "0 0 14px" }}>{g.title}</h2>
                        {g.entries.map(e => (
                            <a key={link(e)} href={link(e)}
                               onClick={ev => { ev.preventDefault(); go(e.page, e.params); }}
                               style={{ display: "block", color: C.cream, fontSize: 20, textDecoration: "none", padding: "6px 0" }}>
                                ▸ {e.label}{e.note && <span style={{ color: C.white40, fontSize: 15 }}>  ({e.note})</span>}
                            </a>
                        ))}
                    </section>
                ))}
            </div>
        </div>
    );
}
