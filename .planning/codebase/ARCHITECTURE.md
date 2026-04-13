# Architecture

**Analysis Date:** 2026-04-13

## Pattern Overview

**Overall:** Single-package full-stack TypeScript prototype with an Express API, Vite React SPA, and shared local analysis modules.

**Key Characteristics:**
- Run the web client and API in one Node process from `server.ts`.
- Keep the browser entry in `index.html`, `src/main.tsx`, and `src/App.tsx`.
- Keep deterministic biological preprocessing, report contracts, and protein identity resolution in `src/lib/`.
- Use `/api/analyze` as the single analysis request boundary between the React UI and backend orchestration.
- Use external model providers opportunistically from `server.ts`, with deterministic fallback output when providers are unavailable or invalid.

## Layers

**Browser Shell:**
- Purpose: Mount the React application into the HTML root.
- Location: `index.html`, `src/main.tsx`
- Contains: Static HTML root, React root creation, global CSS import.
- Depends on: `react`, `react-dom`, `src/App.tsx`, `src/index.css`.
- Used by: Vite dev middleware and production static serving from `server.ts`.

**React Application UI:**
- Purpose: Collect sequence/PDF/question inputs and render the BioViz report.
- Location: `src/App.tsx`
- Contains: `App`, `handleSubmit`, local React state, form markup, loading/error states, report visualization, cross-reference display, paper mention display.
- Depends on: `BioVizReport` from `src/lib/schema.ts`, icon components from `lucide-react`, class utilities from `clsx` and `tailwind-merge`.
- Used by: `src/main.tsx`.

**HTTP Server And Request Orchestrator:**
- Purpose: Own process startup, environment loading, API routing, provider selection, PDF extraction, model calls, fallback construction, schema validation, report hydration, and development/production asset serving.
- Location: `server.ts`
- Contains: Express app setup, `multer` memory upload handling, `/api/analyze`, Vite middleware, static `dist` serving, OpenAI/Gemini/Ollama adapters, PDF text extraction, prompt construction, final provenance attachment.
- Depends on: `express`, `vite`, `multer`, `dotenv`, `@google/genai`, Node filesystem/process modules, `src/lib/analysis.ts`, `src/lib/protein-resolver.ts`, `src/lib/schema.ts`.
- Used by: `npm run dev`, `npm start`, and any deployment process that runs `tsx server.ts`.

**Analysis Core:**
- Purpose: Provide deterministic sequence normalization, local heuristic region scanning, artifact hashing, and in-memory provenance graph construction.
- Location: `src/lib/analysis.ts`
- Contains: `normalizeSequence`, `extractFastaHeader`, `runLocalHeuristics`, `generateHash`, `ProvenanceGraph`, `Artifact`.
- Depends on: Node `crypto`.
- Used by: `server.ts`.

**Protein Identity Resolution:**
- Purpose: Convert FASTA/header/sequence evidence into canonical protein identity fields and database links.
- Location: `src/lib/protein-resolver.ts`
- Contains: FASTA header parsing, alias normalization, a seeded GLP-1/pro-glucagon public protein fallback, UniProt enrichment through `https://rest.uniprot.org/uniprotkb/{accession}.json`, cross-reference extraction for HGNC/GeneID/Ensembl.
- Depends on: Runtime `fetch`.
- Used by: `server.ts`.

**Report Contract:**
- Purpose: Define the canonical BioViz report shape for runtime validation, client typing, and model structured-output requests.
- Location: `src/lib/schema.ts`
- Contains: `BioVizReportSchema`, `BioVizReport`, `bioVizJsonSchema`.
- Depends on: `zod`.
- Used by: `src/App.tsx` for TypeScript report shape and by `server.ts` for parsing provider responses and requesting JSON-schema formatted model output.

**Styling And Build Configuration:**
- Purpose: Configure React, Tailwind, path aliases, TypeScript, and Vite behavior.
- Location: `src/index.css`, `vite.config.ts`, `tsconfig.json`, `package.json`
- Contains: Tailwind import, Vite plugins, alias config, TypeScript compiler options, npm scripts.
- Depends on: `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite`, `typescript`.
- Used by: Vite builds, Vite middleware, TypeScript linting.

**Generated Demo Artifacts:**
- Purpose: Store generated screenshots, videos, presentation assets, and local browser verification output.
- Location: `output/`, `.playwright-cli/`, `playwright-cli.json`
- Contains: Demo media, generated slides/audio/video segments, Playwright CLI logs/screenshots/page snapshots.
- Depends on: External local generation scripts such as `output/presentation/make_presentation_video.py` and `output/playwright/glp1-demo/make_demo_recording.py`.
- Used by: Demo and presentation workflows, not by the runtime application.

## Data Flow

**Analysis Request Lifecycle:**

1. The browser loads `index.html`, which mounts `src/main.tsx`.
2. `src/main.tsx` renders `src/App.tsx` into `#root`.
3. The user submits the form in `src/App.tsx` with `sequence`, optional `file`, `question`, and `organism`.
4. `handleSubmit` in `src/App.tsx` builds `FormData` and sends `POST /api/analyze` with `fetch`.
5. `server.ts` receives the request through `app.post("/api/analyze", upload.single("file"), ...)`.
6. `multer` stores the optional PDF in memory through `multer.memoryStorage()`.
7. `server.ts` validates that `sequence` and `question` exist and returns `400` JSON when required input is missing.
8. `server.ts` creates a `ProvenanceGraph` from `src/lib/analysis.ts` and records the raw input artifact.
9. `server.ts` extracts a FASTA header with `extractFastaHeader` and normalizes the protein sequence with `normalizeSequence`.
10. `server.ts` runs deterministic local region analysis with `runLocalHeuristics`.
11. `server.ts` resolves protein identity with `resolveProtein` from `src/lib/protein-resolver.ts`.
12. `server.ts` builds an alias bundle from resolved identity fields, resolver aliases, and the FASTA header.
13. `server.ts` builds the model prompt using the sequence, local scan, canonical info, aliases, and current `paperMentions`.
14. If a PDF is uploaded, `server.ts` records a raw PDF artifact, extracts local text with `pdftotext` through `extractPdfText`, and collects alias-based snippets with `collectPaperMentions`.
15. `server.ts` builds a deterministic fallback report with `buildFallbackReport`.
16. `server.ts` tries OpenAI first when `OPENAI_API_KEY` exists by calling `runOpenAIModel`.
17. If OpenAI does not produce a valid report, `server.ts` tries Gemini when `GEMINI_API_KEY` exists; for uploaded PDFs it uploads the temp PDF through `genAI.files.upload`.
18. If Gemini does not produce a valid report and Ollama is reachable, `server.ts` tries the local Ollama model through `runLocalModel`.
19. Each provider candidate is validated with `BioVizReportSchema.parse` from `src/lib/schema.ts`.
20. Valid model output is merged with deterministic fallback fields by `hydrateReport`.
21. If no model path succeeds, the fallback report remains the response body.
22. `server.ts` attaches `provenance.rootHash` and `provenance.artifactCount` from `ProvenanceGraph`.
23. `server.ts` returns JSON to `src/App.tsx`.
24. `src/App.tsx` sets the report state and renders summary, regions, canonical identity, provenance root, database links, paper mentions, and next steps.

**State Management:**
- UI state is local React component state in `src/App.tsx` through `useState` for `loading`, `report`, and `error`.
- Backend request state is local to the `/api/analyze` handler in `server.ts`.
- Provenance is an in-memory `ProvenanceGraph` instance per request in `server.ts`.
- There is no persistent run store, database, session state, or server-side cache in the current architecture.

## Request Lifecycle Details

**Development Request Flow:**

1. `npm run dev` runs `tsx server.ts` from `package.json`.
2. `server.ts` loads `.env.local` and then default dotenv configuration.
3. `server.ts` creates an Express app and registers `express.json()`.
4. `server.ts` registers `/api/analyze` before Vite middleware.
5. When `NODE_ENV !== "production"`, `server.ts` creates Vite middleware with `createViteServer({ server: { middlewareMode: true }, appType: "spa" })`.
6. Express serves API requests directly and delegates SPA/HMR requests to `vite.middlewares`.
7. The server listens on `0.0.0.0:3000`.

**Production Request Flow:**

1. `npm run build` runs `vite build` and writes the SPA bundle to `dist/`.
2. Runtime execution still enters `server.ts`.
3. When `NODE_ENV === "production"`, `server.ts` serves static assets from `dist`.
4. `server.ts` uses `app.get("*")` to return `dist/index.html` for SPA fallback routes.
5. `/api/analyze` remains handled by Express before the static fallback.

**Provider Selection Flow:**

1. `server.ts` reads `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENAI_MODEL`, `OLLAMA_URL`, and `OLLAMA_MODEL` from process environment.
2. OpenAI is attempted first when `OPENAI_API_KEY` exists.
3. Gemini is attempted second when OpenAI fails or is unavailable and `GEMINI_API_KEY` exists.
4. Ollama is attempted third when earlier paths fail and `isOllamaReachable` succeeds at server startup.
5. Deterministic fallback output from `buildFallbackReport` is returned when no provider produces a valid schema-conforming report.

**PDF Handling Flow:**

1. `src/App.tsx` submits the optional PDF through a `file` field in `FormData`.
2. `server.ts` accepts a single upload named `file` through `upload.single("file")`.
3. The upload is kept in memory by `multer.memoryStorage()`.
4. `extractPdfText` writes the PDF to `os.tmpdir()`, runs `pdftotext`, reads the generated text file, and deletes both temp files.
5. `collectPaperMentions` scans normalized extracted text for aliases and returns up to eight snippets.
6. Gemini additionally receives an uploaded PDF reference when the Gemini provider path is used.
7. Local PDF mentions are included in the fallback report and hydration path. The prompt string is built before local PDF extraction in `server.ts`, so locally extracted `paperMentions` are not embedded in the current prompt string.

## Key Abstractions

**BioViz Report:**
- Purpose: Canonical response contract for UI rendering and model output validation.
- Examples: `src/lib/schema.ts`, `src/App.tsx`, `server.ts`
- Pattern: Zod runtime schema plus manually maintained JSON Schema object for provider structured output.

**Provenance Graph:**
- Purpose: Track per-request artifacts and compute a root hash over artifact hashes.
- Examples: `src/lib/analysis.ts`, `server.ts`
- Pattern: In-memory artifact list with SHA-256 hashes and parent hashes.

**Local Heuristic Scan:**
- Purpose: Produce deterministic candidate protein regions from sequence composition.
- Examples: `src/lib/analysis.ts`
- Pattern: Sliding-window scan for flexible/charged/hydrophobic regions with scored fallback windows.

**Protein Resolver:**
- Purpose: Convert sequence/header evidence into canonical protein metadata and database links.
- Examples: `src/lib/protein-resolver.ts`, `server.ts`
- Pattern: Header-derived fallback, seeded known public protein matching, then optional UniProt live enrichment.

**Fallback Report:**
- Purpose: Ensure `/api/analyze` can respond without a successful model provider.
- Examples: `server.ts`
- Pattern: Deterministic report assembly from normalized sequence, local scan, resolver output, question, organism, and paper mentions.

**Provider Adapter Functions:**
- Purpose: Isolate provider-specific request/response parsing inside `server.ts`.
- Examples: `runOpenAIModel`, `runLocalModel`, Gemini call block in `server.ts`
- Pattern: Build provider request, parse output into JSON, validate through `BioVizReportSchema`, then hydrate with fallback fields.

## Entry Points

**Server Runtime:**
- Location: `server.ts`
- Triggers: `npm run dev`, `npm start`, direct `tsx server.ts`.
- Responsibilities: Load environment, create Express server, register API route, attach Vite middleware or static assets, listen on port `3000`.

**Browser HTML:**
- Location: `index.html`
- Triggers: Vite dev server or production static serving.
- Responsibilities: Provide `#root` and load `/src/main.tsx`.

**React Root:**
- Location: `src/main.tsx`
- Triggers: Browser module load from `index.html`.
- Responsibilities: Render `App` inside React `StrictMode` and load global Tailwind CSS.

**Primary UI Component:**
- Location: `src/App.tsx`
- Triggers: React render from `src/main.tsx`.
- Responsibilities: Render the form, submit analysis requests, hold request state, render returned reports.

**Analysis API:**
- Location: `server.ts`
- Triggers: Browser `POST /api/analyze`.
- Responsibilities: Validate input, orchestrate deterministic analysis and model synthesis, return a `BioVizReport` JSON payload.

**Build Configuration:**
- Location: `vite.config.ts`
- Triggers: Vite dev/build execution from `package.json`.
- Responsibilities: Register React and Tailwind plugins, configure `@` alias, expose `process.env.GEMINI_API_KEY` define, configure HMR behavior.

## Error Handling

**Strategy:** Convert recoverable provider/PDF failures into logged fallbacks; return JSON errors for invalid user input or unexpected top-level failures.

**Patterns:**
- `server.ts` returns `400` JSON for missing `sequence` or `question`.
- `server.ts` catches local PDF extraction errors, logs them, and continues without paper snippets.
- `server.ts` catches OpenAI failures, logs them, and tries Gemini.
- `server.ts` catches Gemini failures, logs them, and tries Ollama or fallback.
- `server.ts` catches Ollama failures, logs them, and returns fallback.
- `server.ts` catches route-level errors, logs them, and returns `500` JSON with `error.message`.
- `src/App.tsx` catches failed `fetch` or non-OK responses, logs to console, and displays the error message in the UI.

## Cross-Cutting Concerns

**Logging:** Use `console.error` and `console.log` in `server.ts`; use `console.error` in `src/App.tsx` for client-side request failures.

**Validation:** Validate final model/provider output with `BioVizReportSchema` in `server.ts`; use browser `required` attributes in `src/App.tsx`; no separate request-body schema exists for `/api/analyze`.

**Authentication:** Not detected. `server.ts` exposes `/api/analyze` without user authentication, session identity, or authorization checks.

**Configuration:** Load environment from `.env.local` and process environment in `server.ts`; `.env.local` exists and is intentionally not read into these docs. Use `.env.example` only as a public template.

**Persistence:** Not detected for runtime analysis results. Generated demo artifacts are filesystem outputs under `output/`, but `/api/analyze` does not persist runs.

**External Services:** `server.ts` can call OpenAI Responses API, Gemini via `@google/genai`, local Ollama HTTP API, and UniProt from `src/lib/protein-resolver.ts`.

---

*Architecture analysis: 2026-04-13*
