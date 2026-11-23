// =============================================================================
// HomeScreen — Figma "Home Page" (450:696) plus the camera "Alert PopUp"
// (414:647) that opens after "BEGIN SIMULATION".
// =============================================================================

import { useState } from "react";
import { C } from "../theme.ts";
import { abs, text } from "../layout.ts";
import { useTypewriter } from "../hooks.ts";
import { AppHeader, Box, ConsoleButton, Cursor, Grid, Marker, Screen, SessionFooter } from "../ui.tsx";
import homeFace from "../assets/figma/home-face.png";
import popupWarning from "../assets/figma/popup-warning.png";
import popupBarLeft from "../assets/figma/popup-bar-left.svg";
import popupBarMiddle from "../assets/figma/popup-bar-middle.svg";
import popupBarRight from "../assets/figma/popup-bar-right.svg";

const INTRO_TEXT =
    "Practice responding to aggression with clarity and care. De-Escalate the Aggressive situation by following the following flow: \n\n" +
    "Listen, reflect and record your response in this test session.";

const STEPS = [
    { n: "01//", tag: "INPUT",   title: "WATCH THE SCENARIO",   body: "Listen to a short, acted encounter with a frustrated individual." },
    { n: "02//", tag: "PROCESS", title: "READ AND REFLECT",     body: "Review what was said and plan your Response." },
    { n: "03//", tag: "OUTPUT",  title: "RECORD YOUR RESPONSE", body: "Speak to the person, review your recording and submit." },
];

interface HomeScreenProps {
    /** Called when the user accepts camera access in the popup. */
    onAccept: () => void;
}

export function HomeScreen({ onAccept }: HomeScreenProps) {
    const [popupOpen, setPopupOpen] = useState(false);
    const intro = useTypewriter(INTRO_TEXT, 22);

    return (
        <Screen outer>
            <AppHeader status="INITIALIZING..." statusMarkerX={1080} statusTextX={1106} statusY={45} statusColor={C.white} />

            {/* Headline */}
            <Marker x={54} y={163} w={17} h={41} />
            <p style={{
                ...abs(87, 160.5, 659), ...text(46, C.cream), lineHeight: 1.1, letterSpacing: -0.92,
                textShadow: "2px 0px 0px rgba(229,229,204,0.25), -2px 0px 0px rgba(229,26,26,0.2)",
            }}>
                AGGRESSION TRAINING
            </p>
            <Marker x={77} y={211.5} w={632} h={3} />

            {/* Typewriter introduction */}
            <p style={{ ...abs(84, 250, 659, 184), ...text(18, C.white80), lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {intro}
                <Cursor w={9} h={22} />
            </p>

            {/* Encounter preview: pixel face under the grid */}
            <div style={{ ...abs(800, 143, 560, 410), overflow: "hidden" }}>
                <img src={homeFace} alt="" style={{ ...abs(137, -4, 277, 410), objectFit: "cover" }} />
            </div>
            <Grid x={800} y={143} w={560} h={410} cellW={28} cellH={29.228} line={1} color={C.grid} />
            <Box x={800} y={143} w={560} h={410} border={2} color={C.cream90} />

            {/* Process cards */}
            {STEPS.map((s, i) => (
                <div key={s.n} style={{
                    ...abs(80 + i * 432, 599, 416, i === 0 ? 198 : 200), background: C.bg,
                    border: `1px solid ${C.cream}`, boxShadow: "inset 0px 0px 12px 0px rgba(62,23,69,0.3)",
                }}>
                    <div style={{ ...abs(22, 22), display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={text(11, C.cream)}>{s.n}</span>
                        <span style={text(13, C.white27)}>{s.tag}</span>
                    </div>
                    <p style={{ ...abs(22, 51), right: 22, ...text(17, C.cream), lineHeight: 1.2 }}>
                        {s.title}
                        {i === 2 && <span style={{ ...text(18, C.white27), marginLeft: 6 }}>◉</span>}
                    </p>
                    <div style={{ ...abs(22, 85), right: 22, height: 2, background: C.maroon }} />
                    <p style={{ ...abs(22, 112), right: 22, ...text(16, C.cream60), lineHeight: 1.55, whiteSpace: "normal" }}>
                        {s.body}
                    </p>
                </div>
            ))}

            <ConsoleButton
                x={501} y={854} w={416} h={74} label="BEGIN SIMULATION" fontSize={36}
                marker={{ x: 32, w: 18, h: 37 }} labelX={69} onClick={() => setPopupOpen(true)}
            />

            <SessionFooter />

            {popupOpen && <CameraPopup onCancel={() => setPopupOpen(false)} onAccept={onAccept} />}
        </Screen>
    );
}

// ─── Camera permission popup (Figma "Alert PopUp") ────────────────────────────

function CameraPopup({ onCancel, onAccept }: { onCancel: () => void; onAccept: () => void }) {
    const X = (1440 - 1073) / 2;
    const Y = (1024 - 448) / 2;
    return (
        <div role="dialog" aria-modal="true" style={{ ...abs(X, Y, 1073, 448), background: C.bg, border: `3px solid ${C.cream80}` }}>
            {/* Children are positioned inside the 3 px border, so subtract it from the Figma offsets. */}
            <img src={popupBarLeft} alt="" width={44} height={35} style={abs(74, 26, 44, 34.833)} />
            <img src={popupBarMiddle} alt="" width={831} height={35} style={abs(118, 26, 831, 35)} />
            <img src={popupBarRight} alt="" width={44} height={35} style={abs(949, 26, 44, 35)} />
            <img src={popupWarning} alt="" style={{ ...abs(469, 61, 130, 114), objectFit: "cover", opacity: 0.8 }} />
            <p style={{ ...abs(536.5 - 3 - 459.5, 183, 919, 107), ...text(32, C.white), whiteSpace: "normal", textAlign: "center" }}>
                The following sequence requires access to your camera to record your response.
                <br />Do you accept?
            </p>
            <ConsoleButton
                x={210} y={318} w={259} h={66} label="Not yet." onClick={onCancel}
                border={2} bg={C.bg} labelColor={C.white} marker={{ x: 17, w: 15, h: 35 }}
            />
            <ConsoleButton
                x={599} y={318} w={259} h={66} label="Yes." onClick={onAccept}
                border={2} bg={C.bg} labelColor={C.white} marker={{ x: 17, w: 15, h: 35 }}
            />
        </div>
    );
}
