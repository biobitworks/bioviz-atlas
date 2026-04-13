# Technology Stack

**Analysis Date:** 2026-04-13

## Languages

**Primary:**
- TypeScript 5.8.x - Application source, Express server, React UI, schemas, and local biological heuristics in `server.ts`, `src/App.tsx`, `src/main.tsx`, `src/lib/analysis.ts`, `src/lib/protein-resolver.ts`, and `src/lib/schema.ts`.
- TSX / React JSX - Browser UI rendered from `src/App.tsx` and bootstrapped in `src/main.tsx`.

**Secondary:**
- CSS - Tailwind CSS entrypoint in `src/index.css`.
- HTML - Vite document shell in `index.html`.
- JSON - Project metadata and npm manifests in `metadata.json`, `package.json`, and `package-lock.json`.

## Runtime

**Environment:**
- Node.js - Local environment observed with `node --version` as `v25.8.1`.
- Node package scripts execute TypeScript directly through `tsx` from `package.json`.
- Browser runtime is a Vite single-page React app mounted through `index.html` and `src/main.tsx`.
- Server runtime is an Express process started from `server.ts` and bound to `0.0.0.0:3000`.

**Package Manager:**
- npm - Local environment observed with `npm --version` as `11.11.0`.
- Lockfile: present at `package-lock.json` using lockfileVersion 3.
- No `engines` field is declared in `package.json`; use the checked-in `package-lock.json` to preserve install resolution.

## Frameworks

**Core:**
- React 19.2.x - Main UI framework used by `src/App.tsx` and `src/main.tsx`.
- Vite 6.4.x - Build tool and development middleware used by `vite.config.ts` and `server.ts`.
- Express 4.22.x - HTTP server and API route host in `server.ts`.
- Tailwind CSS 4.2.x - Styling system imported from `src/index.css` and wired into Vite through `vite.config.ts`.

**Testing:**
- Not detected - `package.json` has no `test` script and no test runner dependency.
- Playwright CLI artifacts are present under `.playwright-cli/`, but no Playwright dependency or test config is declared in `package.json`.

**Build/Dev:**
- `tsx` 4.21.x - Runs `server.ts` directly for `npm run dev` and `npm start`.
- `@vitejs/plugin-react` 5.2.x - React transform plugin in `vite.config.ts`.
- `@tailwindcss/vite` 4.2.x - Tailwind Vite plugin in `vite.config.ts`.
- TypeScript 5.8.x - Type checking through `npm run lint`, which runs `tsc --noEmit` from `package.json`.

## Key Dependencies

**Critical:**
- `@google/genai` - Active Gemini SDK used by `server.ts` for `GoogleGenAI`, file upload, and `gemini-2.5-flash` generation.
- `@google/generative-ai` - Declared in `package.json` and installed, but active source imports use `@google/genai` instead.
- `express` - Hosts `/api/analyze`, Vite dev middleware, and production static files in `server.ts`.
- `multer` - Parses multipart uploads with `multer.memoryStorage()` in `server.ts`.
- `react` and `react-dom` - Render the BioViz Atlas UI from `src/main.tsx` and `src/App.tsx`.
- `zod` - Runtime validation and inferred TypeScript report type in `src/lib/schema.ts`.
- `zod-to-json-schema` - Declared in `package.json`; the current JSON schema is hand-authored in `src/lib/schema.ts`.
- `vite` - Produces production assets through `npm run build` and creates development middleware in `server.ts`.

**Infrastructure:**
- `dotenv` - Loads `.env.local` and default dotenv files in `server.ts`; do not read or commit secret values.
- Node built-ins - `fs/promises`, `os`, `child_process`, `util`, `path`, `url`, and `crypto` are used by `server.ts` and `src/lib/analysis.ts`.
- Global `fetch` - Used server-side for UniProt, Ollama, and OpenAI calls in `src/lib/protein-resolver.ts` and `server.ts`.
- `lucide-react` - Icon components in `src/App.tsx`.
- `clsx` and `tailwind-merge` - Class composition helper `cn()` in `src/App.tsx`.
- `motion` - Declared in `package.json`; no active imports detected in `src/` or `server.ts`.
- `react-dropzone` - Declared in `package.json`; current upload UI uses a native `<input type="file">` in `src/App.tsx`.

## Configuration

**Environment:**
- `.env.local` is present for local environment configuration; contents were not read.
- `.env.example` is present as a committed example file; contents were not read because `.env.*` files are treated as secret-bearing by the mapper rules.
- `server.ts` loads `.env.local` first through `dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })`, then loads default dotenv files with `dotenv.config()`.
- `README.md` instructs local setup to set `GEMINI_API_KEY` in `.env.local`.
- `vite.config.ts` exposes `GEMINI_API_KEY` into the client bundle as `process.env.GEMINI_API_KEY`, but the active UI does not reference that value.
- `server.ts` reads `OPENAI_API_KEY`, `OPENAI_MODEL`, `GEMINI_API_KEY`, `OLLAMA_URL`, `OLLAMA_MODEL`, and `NODE_ENV`.
- `vite.config.ts` reads `DISABLE_HMR` to control Vite HMR.

**Build:**
- `package.json` scripts:
  - `npm run dev` runs `tsx server.ts`.
  - `npm start` runs `tsx server.ts`.
  - `npm run build` runs `vite build`.
  - `npm run preview` runs `vite preview`.
  - `npm run clean` removes `dist`.
  - `npm run lint` runs `tsc --noEmit`.
- `vite.config.ts` configures React, Tailwind, alias `@` to the repo root, and conditional HMR.
- `tsconfig.json` targets ES2022, uses `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `allowJs: true`, `allowImportingTsExtensions: true`, and `noEmit: true`.
- `index.html` loads `/src/main.tsx` as the Vite module entry.
- `server.ts` serves Vite middleware in non-production and serves `dist/` when `NODE_ENV=production`.

## Local Services

**Application server:**
- Express listens on port `3000` in `server.ts`.
- The UI submits multipart form data to `/api/analyze` from `src/App.tsx`.
- The API route is implemented as `app.post("/api/analyze", upload.single("file"), ...)` in `server.ts`.

**Development server:**
- Vite is embedded as middleware in `server.ts` when `NODE_ENV !== "production"`.
- HMR is controlled by `DISABLE_HMR` in `vite.config.ts`.

**Local model server:**
- Ollama is an optional local model provider in `server.ts`.
- Default local service URL is `http://127.0.0.1:11434` from `OLLAMA_URL`.
- Default local model is `gemma3:4b` from `OLLAMA_MODEL`.
- Reachability is checked through `${OLLAMA_URL}/api/tags`, and generation uses `${OLLAMA_URL}/api/generate`.

**Local parsing tools:**
- `pdftotext` is called via `execFileAsync("pdftotext", ...)` in `server.ts`.
- Local system has `pdftotext` available at `/opt/homebrew/bin/pdftotext`.
- Uploaded PDFs are temporarily written to `os.tmpdir()` and deleted after parsing in `server.ts`.

## Model Providers

**OpenAI:**
- `server.ts` calls the OpenAI Responses API at `https://api.openai.com/v1/responses`.
- `OPENAI_API_KEY` enables the OpenAI path.
- `OPENAI_MODEL` defaults to `gpt-4.1-mini`.
- Strict JSON output is requested using the `bioVizJsonSchema` from `src/lib/schema.ts`.

**Google Gemini:**
- `server.ts` uses `@google/genai` and `GoogleGenAI` when `GEMINI_API_KEY` is present.
- Text generation uses model `gemini-2.5-flash`.
- Optional PDFs are uploaded to Gemini Files through `genAI.files.upload()` in `server.ts`.

**Ollama:**
- `server.ts` uses Ollama as a fallback model provider when reachable.
- The request uses non-streaming generation with `format: bioVizJsonSchema` and `temperature: 0.2`.

**Deterministic fallback:**
- `server.ts` always builds a local fallback report using `runLocalHeuristics()` from `src/lib/analysis.ts` and protein resolution data from `src/lib/protein-resolver.ts`.

## Upload & Parsing Dependencies

**Browser upload:**
- `src/App.tsx` submits a `FormData` payload with `sequence`, optional `file`, `question`, and `organism`.
- The file input in `src/App.tsx` accepts `application/pdf`.

**Server upload handling:**
- `server.ts` uses `multer.memoryStorage()` and expects the uploaded field name `file`.
- No database-backed file storage is used.
- No explicit upload size limit is configured in `server.ts`.

**PDF parsing:**
- Local PDF text extraction depends on the external `pdftotext` executable.
- Gemini PDF context depends on `@google/genai` Files upload when `GEMINI_API_KEY` is configured.
- Extracted PDF text is scanned for aliases by `collectPaperMentions()` in `server.ts`.

## Platform Requirements

**Development:**
- Node.js with npm.
- `npm install` using `package-lock.json`.
- `.env.local` containing at least `GEMINI_API_KEY` for the README-documented Gemini workflow, or `OPENAI_API_KEY` / Ollama configuration for alternate synthesis paths.
- `pdftotext` installed for local PDF text extraction.
- Optional Ollama service on `127.0.0.1:11434` for local model fallback.

**Production:**
- Deployment platform not detected.
- `server.ts` supports production mode by serving `dist/` when `NODE_ENV=production`.
- No `Dockerfile`, `vercel.json`, `wrangler.*`, or CI deployment workflow was detected in the scanned root.

---

*Stack analysis: 2026-04-13*
