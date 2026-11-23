// =============================================================================
// Results data helpers.
//
// ⚠ SAMPLE DATA: the backend does not send per-criterion scores or texts to
// normal (non-admin) sessions, so the four criteria below use the placeholder
// values and texts from the Figma prototype. They are shown with a
// "SAMPLE DATA" tag in the UI. Replace them here once the backend exposes
// real per-criterion results.
// =============================================================================

export type Grade = "GOOD" | "SATISFACTORY" | "UNSATISFACTORY";

export interface Criterion {
    /** Full name (Details pages). */
    label: string;
    /** Short name (Results "Raw Stats Performance" row). */
    short: string;
    /** Score out of 10 — SAMPLE DATA. */
    score: number;
    grade: Grade;
    /** "Detailed Stat Breakdown" text — SAMPLE DATA from the prototype. */
    detail: string[];
}

export const CRITERIA: Criterion[] = [
    {
        label: "Tone of Voice", short: "Tone of Voice", score: 8, grade: "GOOD",
        detail: [
            "During your submitted reaction, your Tone of Voice remained relatively Calm & Friendly. This allowed to de-escalate the hostile encounter with a greater effectiveness.",
            "The company commends your efforts.\nGOOD JOB!",
        ],
    },
    {
        label: "Facial Expression", short: "Facial Expr", score: 6, grade: "SATISFACTORY",
        detail: [
            "During your submitted reaction, your Facial Expressions remained Neutral. This prevented further escalation of the already hostile encounter.",
            "The company suggests a few key points to look out for:\nTry mixing in a smile or other positive facial expressions.\nTry to appear as non-confrontational as possible.",
            "GOOD LUCK NEXT TIME!",
        ],
    },
    {
        label: "Body Language & Gestures", short: "Body Language", score: 4, grade: "UNSATISFACTORY",
        detail: [
            "During your submitted reaction, your Body Language seemed agitated. It was due to either excessive hand gestures, fast or erratic movement.",
            "The company suggests that you study and apply the following advice during your next attempts:\nMaintain a neutral or friendly body posture.\nAvoid unnecessary or fast movement.\nAvoid hostile gestures or signs with your hands.\nRemain calm and try to de-escalate the situation as much as possible.",
            "GOOD LUCK NEXT TIME!",
        ],
    },
    {
        label: "Overall Effectiveness", short: "Effectiveness", score: 6, grade: "SATISFACTORY",
        detail: [
            "Your Overall Effectiveness during the test was Satisfactory.",
            "Therefore, you have SUCCESSFULLY de-escalated the hostile situation.",
            "The Company advises you to review your INDIVIDUAL SCORES in more detail and aim to improve during your next test.",
            "GOOD LUCK NEXT TIME!",
        ],
    },
];

/** Splits AI advice into paragraphs for the breakdown panels. */
export function adviceParagraphs(advice: string, highlights: string[]): string[] {
    const paras = advice
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
    return [...paras, ...highlights.map(h => h.trim()).filter(Boolean)];
}
