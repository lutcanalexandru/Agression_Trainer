# Project rules (Aggression Trainer)

## Project context
- The app uses the existing backend AI (facial emotion recognition plus voice and speech analysis) to train people to react to aggressive encounters more effectively.
- The trainee watches a series of videos in which a person behaves aggressively towards them, and records a spoken response to each one on camera.
- The backend analyses each response against the established criteria. At the end it gives a general performance score, plus a more detailed breakdown that helps the trainee improve that score on their next attempt.
- The user's task is ONLY the UI/UX of the frontend. The backend already works and stays as it is.
- The Figma prototype defines a dystopian, console-like, old-school interface. It contains all the settled design decisions and has been validated.
- The face "videos" are pixel-face .gif files plus matching voice clips (.mp3). They live in `client/src/demo/assets/faces/`.

## Branch
- All changes are made on the `Alexandru` branch. Never commit to `main` or any other branch.

## Scope of changes
- ONLY modify files inside `client/src/demo/` (the frontend demo pages).
- You may read and analyze the entire repository (server, other client code, configs) to understand how things work.
- Never modify backend code, shared config, or anything outside `client/src/demo/`.

## Tech
- React + TypeScript.
- Changes must not break the existing backend: keep the existing API calls, request/response shapes, endpoints and WebSocket usage the demo depends on.

## Design source of truth
- Follow the Figma prototype: https://www.figma.com/proto/0Y8wq83SYLtC70VnKYxTMv/Aggression-Training-App?node-id=450-696&starting-point-node-id=451%3A1340&page-id=0%3A1
- ANY change from the prototype's design or idea (layout, flow, copy, new behavior) needs the user's permission first. Ask before implementing it.

## Figma sizing rule (how to apply the prototype)
Figma's exact pixel sizes are NOT a hard rule. The Figma frames are 1440×1024, but the pages must fit a Full HD (16:9) browser window, edge to edge, without scrolling. What must be kept from Figma:
- **Proportions of occupied space and empty space.** A panel, window or picture box takes the same share of its section as it does in Figma. For example, the video window is about 93% of its area's width and 92% of its height, so its margins grow with the screen.
- **Relative positions.** Elements stay in the same place relative to each other and to their section: left, centre or right of a panel, a title centred in its bar, a button under its column.

How this is applied in the code (`client/src/demo/layout.ts`, `ui.tsx`):
- **Frames, panels, grids, picture boxes and lines** scale with the screen width (`abs()`, `insetX()`).
- **Text, buttons, red/cream markers and icons** keep their exact size and are anchored at a proportional position (`<Anchor at={x}>` = left edge, centre or right edge of their panel). They are never stretched.
- **Images and text are never distorted.** Pictures keep their aspect ratio (`objectFit: contain` or `cover`) and are centred in their boxes. Decorative HUD pictures have no extra frame and fill their section as far as they can without overflowing.
- **The video player window never fills its whole segment.** It always leaves a slight gap, so the grid behind it stays visible.
- Check layouts at the user's real browser size (about 1919×919) and at a laptop size (1366×768). The dev-only page preview (`demo.html?preview`) opens any page with mock data.

## After writing code
- List every feature the user asked for in the request, show where each one is implemented, and explain how that code works.
