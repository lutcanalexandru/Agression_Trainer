// =============================================================================
// GifPlayer — plays an animated GIF on a <canvas> so it can be FROZEN on the
// current frame (an <img> GIF cannot be paused).
//
//   playing = true  → frames are decoded and drawn in a loop
//   playing = false → drawing stops; the last drawn frame stays on screen
//
// Uses the browser's ImageDecoder (WebCodecs; Chrome / Edge / recent Firefox).
// Browsers without it fall back to a normal looping <img>.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

// Minimal WebCodecs ImageDecoder typings (not in every TS DOM lib version).
interface DecodedFrame { displayWidth: number; displayHeight: number; duration: number | null; close(): void }
interface GifDecoder {
    tracks: { ready: Promise<void>; selectedTrack: { frameCount: number } | null };
    decode(opts: { frameIndex: number }): Promise<{ image: DecodedFrame }>;
    close(): void;
}
type GifDecoderCtor = new (init: { data: ArrayBuffer; type: string }) => GifDecoder;

/** Browsers render GIF frame delays below 20 ms as 100 ms. */
const DEFAULT_FRAME_MS = 100;

interface GifPlayerProps {
    src: string;
    playing: boolean;
    style?: CSSProperties;
    /** Fires once the first frame is on screen. */
    onStart?: () => void;
    onError?: () => void;
}

export function GifPlayer({ src, playing, style, onStart, onError }: GifPlayerProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const playingRef = useRef(playing);
    const startRef = useRef(onStart);
    const errorRef = useRef(onError);
    const [fallback] = useState(() => !(globalThis as { ImageDecoder?: unknown }).ImageDecoder);

    useEffect(() => { startRef.current = onStart; errorRef.current = onError; }, [onStart, onError]);
    // Once frozen the player stays frozen; Rewind remounts it to play again.
    useEffect(() => { playingRef.current = playing; }, [playing]);

    useEffect(() => {
        if (fallback) return;
        const Ctor = (globalThis as unknown as { ImageDecoder: GifDecoderCtor }).ImageDecoder;
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let decoder: GifDecoder | null = null;
        let started = false;

        (async () => {
            try {
                const buf = await (await fetch(src)).arrayBuffer();
                if (cancelled) return;
                decoder = new Ctor({ data: buf, type: "image/gif" });
                await decoder.tracks.ready;
                const count = decoder.tracks.selectedTrack?.frameCount ?? 1;
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext("2d");
                if (!canvas || !ctx || cancelled) return;

                let index = 0;
                const step = async () => {
                    // Frozen: stop drawing so the current frame stays on screen.
                    if (cancelled || !decoder || (started && !playingRef.current)) return;
                    const { image } = await decoder.decode({ frameIndex: index });
                    if (cancelled) { image.close(); return; }
                    if (canvas.width !== image.displayWidth) canvas.width = image.displayWidth;
                    if (canvas.height !== image.displayHeight) canvas.height = image.displayHeight;
                    ctx.drawImage(image as unknown as CanvasImageSource, 0, 0);
                    const ms = (image.duration ?? 0) / 1000;
                    image.close();
                    if (!started) { started = true; startRef.current?.(); }
                    index = (index + 1) % count;
                    if (playingRef.current) timer = setTimeout(() => void step(), ms >= 20 ? ms : DEFAULT_FRAME_MS);
                };
                await step();
            } catch (e) {
                console.error("[GifPlayer] decode failed:", e);
                if (!cancelled) errorRef.current?.();
            }
        })();

        return () => {
            cancelled = true;
            clearTimeout(timer);
            decoder?.close();
        };
    }, [src, fallback]);

    if (fallback) {
        return <img src={src} alt="" style={style} onLoad={() => startRef.current?.()} onError={() => errorRef.current?.()} />;
    }
    return <canvas ref={canvasRef} style={style} />;
}
