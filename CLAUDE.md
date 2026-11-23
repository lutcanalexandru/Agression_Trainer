# Project rules (Aggression Trainer)

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

## After writing code
- List every feature the user asked for in the request, show where each one is implemented, and explain how that code works.
