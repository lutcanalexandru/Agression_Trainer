// =============================================================================
// gifDuration — reads the length of one loop of an animated GIF by summing the
// frame delays stored in its Graphic Control Extension blocks. Used to unlock
// "RECORD ANSWER" once the face GIF has played through once (a GIF has no
// "ended" event).
// =============================================================================

const cache = new Map<string, Promise<number>>();

/** Browsers render frame delays of 0–1 centiseconds as 100 ms. */
const MIN_DELAY_MS = 100;

function parseGifDurationMs(buf: ArrayBuffer): number {
    const b = new Uint8Array(buf);
    if (b.length < 13 || String.fromCharCode(b[0], b[1], b[2]) !== "GIF") throw new Error("not a GIF");

    let p = 13;
    const flags = b[10];
    if (flags & 0x80) p += 3 * (1 << ((flags & 0x07) + 1)); // global colour table

    const skipSubBlocks = () => { while (p < b.length && b[p] !== 0) p += b[p] + 1; p += 1; };

    let total = 0;
    let pendingDelay = 0;
    while (p < b.length) {
        const block = b[p];
        if (block === 0x3b) break;                       // trailer
        if (block === 0x21) {                            // extension
            const label = b[p + 1];
            if (label === 0xf9 && b[p + 2] === 4) {      // graphic control extension
                const cs = b[p + 4] | (b[p + 5] << 8);
                pendingDelay = cs <= 1 ? MIN_DELAY_MS : cs * 10;
            }
            p += 2;
            skipSubBlocks();
        } else if (block === 0x2c) {                     // image descriptor = one frame
            const lflags = b[p + 9];
            p += 10;
            if (lflags & 0x80) p += 3 * (1 << ((lflags & 0x07) + 1)); // local colour table
            p += 1;                                      // LZW minimum code size
            skipSubBlocks();
            total += pendingDelay || MIN_DELAY_MS;
            pendingDelay = 0;
        } else {
            break;                                       // unknown block — stop
        }
    }
    return total;
}

/** Duration of one loop of the GIF at `url`, in ms (cached per URL). */
export function getGifDurationMs(url: string): Promise<number> {
    let p = cache.get(url);
    if (!p) {
        p = fetch(url).then(r => r.arrayBuffer()).then(parseGifDurationMs);
        cache.set(url, p);
    }
    return p;
}
