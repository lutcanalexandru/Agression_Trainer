// =============================================================================
// Pixel faces — picks the face GIF and the voice clip (MP3) for a video page
// from the clip's AGGRESSION LEVEL, instead of a fixed sequence.
//
// Aggression level (approved): every clip from the backend carries
// `notable_features` describing the actor's behaviour. Each feature adds or
// subtracts one point:
//   +1  raised_voice, aggressive_posture, pointing_gesture, crying
//   −1  calm_voice, open_posture, backing_away
//    0  anything else (direct_eye_contact, crossed_arms, silence, …)
//
// Score → level → voice clip → face GIF  (GIF ranking: 4 > 1 > 3 > 2;
// the two calmest levels share Animation2 — approved)
//   ≥ 3  → 5 Livid    → Livid.mp3    → Animation4-dither.gif   (most aggressive)
//     2  → 4 Furious  → Furious.mp3  → Animation1-dither.gif
//     1  → 3 Angry    → Angry.mp3    → Animation3-dither.gif
//     0  → 2 Annoyed  → Anoyed.mp3   → Animation2-dither.gif
//  ≤ −1  → 1 Neutral  → Neutral.mp3  → Animation2-dither.gif   (least aggressive)
//
// The GIF loops for as long as the voice clip plays, then freezes. The VIDEO
// TRANSCRIPT panel shows the level's text (Dutch line + English translation),
// matching the voice clip.
//
// Overrides: a file in assets/faces/ named after a clip_id (e.g.
// clip_01_intro.gif / .mp4), or an entry in FACE_VIDEO_FILES, replaces the
// face for that clip. An .mp4/.webm override plays with its own sound.
// =============================================================================

import type { ClipData } from "@ar-training/shared";

export type AggressionLevel = 1 | 2 | 3 | 4 | 5;

interface LevelAssets {
    name: string;
    gif: string;
    audio: string;
    /** What the voice clip says — shown in the VIDEO TRANSCRIPT panel. */
    transcript: { nl: string; en: string };
}

const LEVELS: Record<AggressionLevel, LevelAssets> = {
    5: {
        name: "Livid", gif: "Animation4-dither.gif", audio: "Livid.mp3",
        transcript: {
            nl: "Geef mij nu per direct mijn geld terug, of ik sleep jullie voor de geschillencommissie. Stelletje prutsers!",
            en: "Give me my money back right now, or I’m taking you to the consumer disputes board. You bunch of amateurs!",
        },
    },
    4: {
        name: "Furious", gif: "Animation1-dither.gif", audio: "Furious.mp3",
        transcript: {
            nl: "Het is echt schandalig hoe jullie met betalende klanten omgaan!",
            en: "It’s absolutely disgraceful how you treat paying customers!",
        },
    },
    3: {
        name: "Angry", gif: "Animation3-dither.gif", audio: "Angry.mp3",
        transcript: {
            nl: "Ik… ik… ik wacht al een hele tijd op een reactie van jullie.",
            en: "I… I… I’ve been waiting quite a while for a response from you.",
        },
    },
    2: {
        name: "Annoyed", gif: "Animation2-dither.gif", audio: "Anoyed.mp3",
        transcript: {
            nl: "Dit duurt allemaal veel te lang en ik word hier inmiddels behoorlijk moe van.",
            en: "This is all taking far too long, and I’m getting pretty fed up with it by now.",
        },
    },
    1: {
        name: "Neutral", gif: "Animation2-dither.gif", audio: "Neutral.mp3",
        transcript: {
            nl: "Hallo! Ik zou graag willen weten wat de status van mijn bestelling is?",
            en: "Hi! I’d like to know what the status of my order is.",
        },
    },
};

/** Optional manual clip_id → face file name overrides. */
const FACE_VIDEO_FILES: Record<string, string> = {
    // "clip_01_intro": "Animation4-dither.gif",
};

const AGGRESSIVE_FEATURES = new Set(["raised_voice", "aggressive_posture", "pointing_gesture", "crying"]);
const CALMING_FEATURES = new Set(["calm_voice", "open_posture", "backing_away"]);

/** Aggression level of a clip, from the actor's notable_features. */
export function aggressionLevel(features: readonly string[]): AggressionLevel {
    let score = 0;
    for (const f of features) {
        if (AGGRESSIVE_FEATURES.has(f)) score += 1;
        else if (CALMING_FEATURES.has(f)) score -= 1;
    }
    if (score >= 3) return 5;
    if (score === 2) return 4;
    if (score === 1) return 3;
    if (score === 0) return 2;
    return 1;
}

// Every media file in assets/faces/, resolved to its bundled URL at build time.
const FILES = import.meta.glob("./assets/faces/*.{gif,mp4,webm,mp3,GIF,MP4,WEBM,MP3}", {
    eager: true,
    query: "?url",
    import: "default",
}) as Record<string, string>;

const byFileName: Record<string, string> = {};
for (const [path, url] of Object.entries(FILES)) {
    byFileName[path.slice(path.lastIndexOf("/") + 1)] = url;
}

const VISUAL_EXT = /\.(gif|mp4|webm)$/i;

export interface FaceMediaInfo {
    /** What plays in the video window, or null → "NO SIGNAL". */
    visual: { src: string; kind: "gif" | "video" } | null;
    /** Voice clip for the aggression level (ignored when visual is a video). */
    audio: string | null;
    level: AggressionLevel;
    levelName: string;
    /** Transcript of the voice clip: Dutch line, then the English translation. */
    transcript: string;
}

function visualFor(fileName: string | undefined): FaceMediaInfo["visual"] {
    if (!fileName || !byFileName[fileName]) return null;
    return { src: byFileName[fileName], kind: fileName.toLowerCase().endsWith(".gif") ? "gif" : "video" };
}

export function getFaceMedia(clip: Pick<ClipData, "clip_id" | "notable_features">): FaceMediaInfo {
    const level = aggressionLevel(clip.notable_features ?? []);
    const assets = LEVELS[level];

    const named = Object.keys(byFileName).find(
        f => VISUAL_EXT.test(f) && f.slice(0, f.lastIndexOf(".")) === clip.clip_id,
    );
    const visual = visualFor(FACE_VIDEO_FILES[clip.clip_id]) ?? visualFor(named) ?? visualFor(assets.gif);

    return {
        visual,
        audio: byFileName[assets.audio] ?? null,
        level,
        levelName: assets.name,
        transcript: `${assets.transcript.nl}\n${assets.transcript.en}`,
    };
}
