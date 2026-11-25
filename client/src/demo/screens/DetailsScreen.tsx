// =============================================================================
// DetailsScreen — Figma "Details Page - Ver 2" (1st–4th: 450:735, 490:1454,
// 450:1246, 497:635). One page per criterion.
//
//   • The selected criterion's row is highlighted and "opens" into the
//     Detailed Stat Breakdown panel on the right.
//   • MORE on any other row switches to that criterion's page.
//   • <BACK returns to the Results page.
//   • TRY AGAIN > is on the last (Overall Effectiveness) page only, until the
//     user has viewed all four pages — then it appears on every page.
//
// Scores, grades and the criterion texts are SAMPLE DATA (resultsData.ts); the
// AI debrief from the backend is appended below the criterion text.
// =============================================================================

import { C } from "../theme.ts";
import { abs, insetX, text } from "../layout.ts";
import {
    Anchor, AppHeader, BackButton, Box, ConsoleButton, FingerprintPanel, Label, Marker, Screen, SessionFooter, TypedParagraphs,
} from "../ui.tsx";
import { CRITERIA } from "../resultsData.ts";
import detailsConsole from "../assets/figma/details-console.png";
import detailsSignal from "../assets/figma/details-signal.png";

interface DetailsScreenProps {
    /** 0–3, index into CRITERIA. */
    index: number;
    onSelect: (index: number) => void;
    onBack: () => void;
    showTryAgain: boolean;
    onTryAgain: () => void;
    /** AI debrief paragraphs (from the backend). */
    debrief: string[];
}

const HEADER_Y = [142, 303, 460, 621];
const ROW_Y = [198, 357, 516, 678];
const ROW_H = [105, 105, 105, 98];

export function DetailsScreen({ index, onSelect, onBack, showTryAgain, onTryAgain, debrief }: DetailsScreenProps) {
    const criterion = CRITERIA[index];
    const paragraphs = [...criterion.detail, ...debrief];

    return (
        <Screen>
            <AppHeader status="REVIEW YOUR RESULTS" statusMarkerX={1052} statusTextX={1088} statusY={27} />

            {/* Column headers */}
            <Box x={0} y={88} w={730} h={54} border={1} color={C.cream60} />
            <Box x={731} y={88} w={709} h={54} border={1} color={C.cream60} />
            {/* Section titles stay centred in their bars; the tag stays at the bar's right end */}
            <Anchor at={365}>
                <Marker x={186} y={102} w={15} h={27} />
                <Label x={215} y={101} size={24}>Individual Stats Breakdown:</Label>
            </Anchor>
            <Anchor at={730}>
                <Label x={588} y={108} size={16} color={C.sysRed}>[SAMPLE DATA]</Label>
            </Anchor>
            <Anchor at={1085}>
                <Marker x={926} y={102} w={15} h={27} />
                <Label x={955} y={101} size={24}>Detailed Stat Breakdown:</Label>
            </Anchor>

            {/* Right panel, with an opening where the active row connects to it */}
            <Box x={730} y={88} w={710} h={886} border={2} color={C.cream70} />
            <div style={{ ...abs(729, ROW_Y[index] + 2, 4, ROW_H[index] - 4), background: C.bg }} />

            {/* Criteria rows */}
            {CRITERIA.map((c, i) => {
                const active = i === index;
                const rowY = ROW_Y[i];
                const rowH = ROW_H[i];
                return (
                    <div key={c.label}>
                        <Box x={0} y={HEADER_Y[i]} w={732} h={57} border={1} color={C.cream60} />
                        <Anchor at={0}>
                            <Marker x={31} y={HEADER_Y[i] + 15} w={13} h={25} />
                            <Label x={51} y={HEADER_Y[i] + 15} size={24}>{`${c.label}:`}</Label>
                        </Anchor>

                        <div style={{
                            ...abs(0, rowY, active ? 733 : 732, rowH),
                            border: `3px solid ${C.cream60}`, borderRight: active ? "none" : `3px solid ${C.cream60}`,
                        }} />
                        <Anchor at={0}>
                            <Label x={active ? 48 : 31} y={rowY + 30} size={40}>{`${c.score}/10`}</Label>
                        </Anchor>

                        {/* Grade (and MORE) keep their Figma size at the row's right end */}
                        <Anchor at={732}>
                        {active ? (
                            <div style={{ ...abs(400, rowY + 27, 312, 52), display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 20 }}>
                                <span style={{ width: 26, height: 52, background: C.cream80, flex: "none" }} />
                                <span style={text(40, C.cream)}>{c.grade}</span>
                            </div>
                        ) : (
                            <>
                                <div style={{ ...abs(130, rowY + 27, 455, 52), display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                                    <span style={text(40, C.cream)}>{c.grade}</span>
                                </div>
                                <ConsoleButton
                                    x={601} y={rowY + (rowH - 53) / 2} w={113} h={53} label="MORE" fontSize={28}
                                    border={2} borderColor={C.cream60} marker={{ x: 12, w: 12, h: 26 }} labelX={35}
                                    onClick={() => onSelect(i)}
                                />
                            </>
                        )}
                        </Anchor>
                    </div>
                );
            })}

            {/* Detailed stat breakdown */}
            <div key={index} className="at-scroll" style={{ position: "absolute", top: 166, height: 600, ...insetX(730, 1440, 34, 10), overflowY: "auto", paddingLeft: 23, boxSizing: "border-box" }}>
                <TypedParagraphs paragraphs={paragraphs} size={28} markerW={11} markerH={29} gap={34} />
            </div>

            {/* Decorative bottom panels */}
            <Box x={0} y={773} w={732} h={201} border={2} color={C.cream60} />
            <Box x={730} y={773} w={710} h={201} border={2} color={C.cream60} />
            {/* Decorative images at their Figma size, kept together as a pair centred in the panel */}
            <Anchor at={366}>
                <Box x={18} y={786} w={363} h={179} border={2} color={C.cream60} />
                <div style={{ ...abs(24, 797, 352, 163), overflow: "hidden" }}>
                    <img src={detailsConsole} alt="" style={{ position: "absolute", left: 0, top: -101.27, width: 581.82, height: 320.21 }} />
                </div>
                <Box x={389} y={786} w={324} h={179} border={2} color={C.cream60} style={{ overflow: "hidden" }}>
                    <img src={detailsSignal} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </Box>
            </Anchor>
            <FingerprintPanel />

            {showTryAgain && (
                <Anchor at={1440}>
                    <ConsoleButton
                        x={1044} y={840} w={300} h={74} label="TRY AGAIN >"
                        marker={{ x: 21, w: 15, h: 35 }} labelX={64} onClick={onTryAgain}
                    />
                </Anchor>
            )}

            <BackButton onClick={onBack} />
            <SessionFooter />
        </Screen>
    );
}
