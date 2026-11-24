import { StrictMode } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Demo } from "./Demo.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("No #root element found");

const render = (app: ReactNode) => createRoot(root).render(<StrictMode>{app}</StrictMode>);

// Page preview (mock data, no backend) — only on the dev server (`npm run dev`),
// opened with demo.html?preview. import.meta.env.DEV is false in production
// builds, so this branch and the preview code are left out of the Docker build.
if (import.meta.env.DEV && new URLSearchParams(location.search).has("preview")) {
    import("./preview/Preview.tsx").then(({ Preview }) => render(<Preview />));
} else {
    render(<Demo />);
}
