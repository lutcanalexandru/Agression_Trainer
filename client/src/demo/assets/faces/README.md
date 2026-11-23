# Pixel faces and voice clips

Each video page picks a face GIF and a voice clip from the clip's
**aggression level** (computed from the clip's `notable_features`, see
`../../faceVideos.ts`). The GIF loops while the voice clip plays, then freezes.

| Level | Voice clip    | Face GIF                |
|-------|---------------|-------------------------|
| 5 (highest) | `Livid.mp3`   | `Animation4-dither.gif` |
| 4     | `Furious.mp3` | `Animation1-dither.gif` |
| 3     | `Angry.mp3`   | `Animation3-dither.gif` |
| 2     | `Anoyed.mp3`  | `Animation2-dither.gif` |
| 1 (lowest)  | `Neutral.mp3` | `Animation2-dither.gif` |

To force a specific face for one clip, add a file named after its `clip_id`
(e.g. `clip_01_intro.gif`) or map it in `FACE_VIDEO_FILES` in `faceVideos.ts`.
