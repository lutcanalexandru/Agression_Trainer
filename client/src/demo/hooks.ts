// =============================================================================
// Demo UI hooks: typewriter text, loading-bar progress and network timeouts.
// =============================================================================

import { useEffect, useRef, useState } from "react";

/**
 * Reveals `full` one character at a time. If `full` grows while typing (for
 * example streamed AI feedback) typing simply continues; if it is replaced,
 * typing restarts. `onDone` fires once the whole text is shown.
 */
export function useTypewriter(full: string, msPerChar = 28, onDone?: () => void): string {
    const [typing, setTyping] = useState({ source: full, count: 0 });
    const doneRef = useRef(onDone);
    useEffect(() => { doneRef.current = onDone; }, [onDone]);

    // React's "adjust state while rendering" pattern.
    if (typing.source !== full) {
        setTyping({ source: full, count: full.startsWith(typing.source) ? typing.count : 0 });
    }

    const count = typing.source === full ? typing.count : 0;

    useEffect(() => {
        if (count >= full.length) {
            if (full.length > 0) doneRef.current?.();
            return;
        }
        const id = setTimeout(() => setTyping(t => ({ ...t, count: Math.min(t.count + 1, t.source.length) })), msPerChar);
        return () => clearTimeout(id);
    }, [count, full, msPerChar]);

    return full.slice(0, count);
}

/** Progress-block counts of Figma "Loading Screen A1" → "A5". */
export const PROGRESS_STEPS = [2, 5, 9, 13, 17] as const;

/**
 * Steps through PROGRESS_STEPS every `stepMs`. With `loop` the bar restarts
 * after the last step; without it the bar stays full and `onDone` fires.
 * Returns the number of blocks to draw.
 */
export function useProgress(stepMs: number, loop: boolean, onDone?: () => void): number {
    const [step, setStep] = useState(0);
    const doneRef = useRef(onDone);
    useEffect(() => { doneRef.current = onDone; }, [onDone]);

    useEffect(() => {
        const last = PROGRESS_STEPS.length - 1;
        if (step >= last && !loop) {
            const id = setTimeout(() => doneRef.current?.(), stepMs);
            return () => clearTimeout(id);
        }
        const id = setTimeout(() => setStep(s => (s >= last ? 0 : s + 1)), stepMs);
        return () => clearTimeout(id);
    }, [step, stepMs, loop]);

    return PROGRESS_STEPS[step];
}

/** True once `condition` has held continuously for `ms`. */
export function useStuckTimeout(condition: boolean, ms: number): boolean {
    const [stuck, setStuck] = useState(false);
    useEffect(() => {
        if (!condition) return;
        const id = setTimeout(() => setStuck(true), ms);
        return () => { clearTimeout(id); setStuck(false); };
    }, [condition, ms]);
    return condition && stuck;
}
