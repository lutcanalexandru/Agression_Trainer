// =============================================================================
// ResultsScreen — Figma "Page Results - Ver 2" (414:657).
//
//   Your Results Chart     — one column per criterion (Tone of Voice, Facial
//                            Expression, Body Language, Effectiveness), same
//                            order and scores as the Raw Stats row (SAMPLE DATA).
//   Final Result Breakdown — the AI debrief (advice + highlights), typed out.
//   Raw Stats Performance  — the four criteria (SAMPLE DATA, see resultsData.ts).
//   GET DETAILS >          — opens the Details pages.
//
// No "<BACK" here: the user cannot return to earlier videos (approved).
// =============================================================================

import { C } from "../theme.ts";
import { abs, insetX, sxOff, text } from "../layout.ts";
import {
    Anchor, AppHeader, Box, ConsoleButton, FingerprintPanel, Grid, Label, Marker, Screen, SessionFooter, TypedParagraphs,
} from "../ui.tsx";
import { CRITERIA } from "../resultsData.ts";

interface ResultsScreenProps {
    /** AI debrief split into paragraphs. */
    breakdown: string[];
    onDetails: () => void;
}

/** Chart columns from the prototype — one per criterion, in CRITERIA order. */
const COLUMNS = [
    { x: 54, w: 92 },
    { x: 232, w: 89 },
    { x: 410, w: 88 },
    { x: 588, w: 88 },
];
const COL_Y = 188;
const COL_H = 492;
const CELL_H = (COL_H - 4) / 10;
const SEG_W = 67.609;
const SEG_H = 32.125;

function segmentColor(level: number): string {
    if (level <= 2) return C.seg1;
    if (level <= 4) return C.seg2;
    if (level <= 6) return C.seg3;
    return C.seg4;
}

export function ResultsScreen({ breakdown, onDetails }: ResultsScreenProps) {
    return (
        <Screen>
            <AppHeader status="REVIEW YOUR RESULTS" statusMarkerX={1052} statusTextX={1088} statusY={27} />

            {/* ── Chart ──────────────────────────────────────────────────── */}
            <Box x={0} y={88} w={732} h={54} border={2} color={C.cream60} />
            {/* Section titles stay centred in their bar; the tag stays at the bar's right end */}
            <Anchor at={366}>
                <Marker x={238} y={102} w={15} h={27} />
                <Label x={267} y={101} size={24}>Your Results Chart:</Label>
            </Anchor>
            <Anchor at={732}>
                <Label x={588} y={108} size={16} color={C.sysRed}>[SAMPLE DATA]</Label>
            </Anchor>

            <Grid x={0} y={166} w={730} h={555} cellW={36.5} cellH={39.564} line={2} color={C.gridFaint} />
            <Box x={13} y={158} w={698} h={536} border={4} color={C.cream60} />
            {[183, 365, 548].map(x => <div key={x} style={{ ...abs(x - 1, 161, 2, 533), background: C.cream60 }} />)}

            {/* Columns take the same share of their slot as in Figma; their bars widen with them */}
            {COLUMNS.map((col, i) => (
                <ChartColumn key={i} x={col.x} w={col.w} level={CRITERIA[i]?.score ?? 0} />
            ))}

            {/* ── Raw stats (SAMPLE DATA) ────────────────────────────────── */}
            <Box x={0} y={721} w={730} h={57} border={2} color={C.cream80} />
            <Anchor at={365}>
                <Marker x={201} y={735} w={15} h={27} />
                <Label x={230} y={734} size={24}>Raw Stats Performance:</Label>
            </Anchor>
            <Anchor at={730}>
                <Label x={588} y={741} size={16} color={C.sysRed}>[SAMPLE DATA]</Label>
            </Anchor>
            {CRITERIA.map((c, i) => {
                const x = [0, 183, 365, 548][i];
                return (
                    <div key={c.short}>
                        <Box x={x} y={775} w={i === 1 ? 182 : 183} h={199} border={1} color={C.cream60} />
                        {/* Name at the cell's left edge, score centred in the cell */}
                        <Anchor at={x}>
                            <Marker x={x + 7} y={796} w={11} h={22} />
                            <Label x={[25, 206, 392, 572][i]} y={795} size={20}>{c.short}:</Label>
                        </Anchor>
                        <Anchor at={x + 91.5}>
                            <Label x={[48, 230, 413, 596][i]} y={863} size={40}>{`${c.score}/10`}</Label>
                        </Anchor>
                    </div>
                );
            })}

            {/* ── Final result breakdown (AI debrief) ────────────────────── */}
            <Box x={730} y={88} w={710} h={54} border={2} color={C.cream60} />
            <Anchor at={1085}>
                <Marker x={926} y={102} w={15} h={27} />
                <Label x={955} y={101} size={24}>Final Result Breakdown:</Label>
            </Anchor>
            <Box x={730} y={88} w={710} h={886} border={2} color={C.cream70} />
            <div className="at-scroll" style={{ position: "absolute", top: 192, height: 515, ...insetX(730, 1440, 35, 15), overflowY: "auto", paddingLeft: 21, boxSizing: "border-box" }}>
                <TypedParagraphs paragraphs={breakdown} size={24} markerW={11} markerH={29} gap={30} />
            </div>

            {/* ── Details call-to-action ─────────────────────────────────── */}
            <Box x={731} y={721} w={709} h={57} border={2} color={C.cream80} />
            <Anchor at={731}>
                <Marker x={750} y={735} w={15} h={27} />
                <p style={{ ...abs(779, 734, 641), ...text(26, C.cream) }}>Review the details about your performance.</p>
            </Anchor>
            <FingerprintPanel />
            <Anchor at={1440}>
                <ConsoleButton
                    x={1055} y={840} w={300} h={74} label="GET DETAILS >"
                    marker={{ x: 18, w: 15, h: 35 }} labelX={52} onClick={onDetails}
                />
            </Anchor>

            <SessionFooter />
        </Screen>
    );
}

function ChartColumn({ x, w, level }: { x: number; w: number; level: number }) {
    const cells = Array.from({ length: 10 }, (_, i) => 10 - i); // 10 at the top … 1 at the bottom
    return (
        <>
            <Box x={x} y={COL_Y} w={w} h={COL_H} border={2} color={C.cream60} bg={C.bg} />
            {cells.map((lvl, row) => {
                const cellTop = COL_Y + 2 + row * CELL_H;
                return (
                    <div key={lvl}>
                        {row > 0 && <div style={{ ...abs(x + 1, cellTop - 1, w - 2, 2), background: C.cream60 }} />}
                        {lvl <= level && (
                            <div style={{ ...abs(x + 13, cellTop + (CELL_H - SEG_H) / 2, SEG_W, SEG_H), background: segmentColor(lvl) }} />
                        )}
                        {/* Scale label: exact gap to the column's left edge */}
                        <span style={{ position: "absolute", left: sxOff(x, lvl === 10 ? -33 : -30), top: cellTop + (CELL_H - 27) / 2, ...text(20, "rgba(238,238,204,0.88)") }}>
                            {`${lvl}-`}
                        </span>
                    </div>
                );
            })}
        </>
    );
}
