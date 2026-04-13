# External Integrations

**Analysis Date:** 2026-04-13

## APIs & External Services

**Model Providers:**
- OpenAI Responses API - Optional first-choice synthesis path for BioViz reports.
  - Endpoint: `https://api.openai.com/v1/responses`
  - Implementation: `runOpenAIModel()` in `server.ts`
  - SDK/Client: built-in `fetch`
  - Auth: `OPENAI_API_KEY`
  - Model config: `OPENAI_MODEL`, defaulting to `gpt-4.1-mini` in `server.ts`
  - Output contract: strict `BioVizReport` JSON schema from `src/lib/schema.ts`
- Google Gemini - Optional synthesis provider and optional PDF file-context provider.
  - Endpoint/client: `GoogleGenAI` from `@google/genai`
  - Implementation: Gemini generation and file upload in `server.ts`
  - SDK/Client: `@google/genai`
  - Auth: `GEMINI_API_KEY`
  - Model: `gemini-2.5-flash` in `server.ts`
  - PDF upload: `genAI.files.upload()` in `server.ts`
- Ollama - Optional local model fallback.
  - Endpoint: `${OLLAMA_URL}/api/tags` for reachability and `${OLLAMA_URL}/api/generate` for generation
  - Implementation: `isOllamaReachable()` and `runLocalModel()` in `server.ts`
  - SDK/Client: built-in `fetch`
  - Auth: none detected
  - URL config: `OLLAMA_URL`, defaulting to `http://127.0.0.1:11434`
  - Model config: `OLLAMA_MODEL`, defaulting to `gemma3:4b`

**Biological Databases:**
- UniProt REST API - Resolves canonical protein identity and cross-references from parsed FASTA headers or known public protein matches.
  - Endpoint: `https://rest.uniprot.org/uniprotkb/${accession}.json`
  - Implementation: `fetchUniProtEntry()` in `src/lib/protein-resolver.ts`
  - SDK/Client: built-in `fetch`
  - Auth: none detected
  - Returned data used for: UniProt accession, approved symbol, protein name, organism, taxonomy ID, HGNC ID, NCBI Gene ID, Ensembl Gene ID, aliases, and links in `src/lib/protein-resolver.ts`

**Application API:**
- BioViz Atlas local API - Browser-to-server analysis endpoint.
  - Endpoint: `/api/analyze`
  - Implementation: `app.post("/api/analyze", upload.single("file"), ...)` in `server.ts`
  - Client: `fetch("/api/analyze", { method: "POST", body: formData })` in `src/App.tsx`
  - Payload: multipart form data with `sequence`, `question`, `organism`, and optional PDF field `file`
  - Response schema: `BioVizReportSchema` from `src/lib/schema.ts`

**Development/Hosting Surfaces:**
- Google AI Studio - README references an AI Studio app URL for viewing the app.
  - Reference: `README.md`
  - Runtime integration: not used directly by source code.
- Vite development middleware - Express embeds Vite in development mode.
  - Implementation: `createViteServer({ server: { middlewareMode: true }, appType: "spa" })` in `server.ts`
  - Client entry: `index.html` and `src/main.tsx`

## Data Storage

**Databases:**
- Not detected.
  - No Prisma, Drizzle, SQLite, Postgres, Supabase, Firebase, MongoDB, or database client imports were detected in `server.ts` or `src/`.
  - `server.ts` keeps analysis provenance in memory through `ProvenanceGraph` from `src/lib/analysis.ts`.

**File Storage:**
- Local temporary filesystem only.
  - Uploaded PDFs are held in memory by `multer.memoryStorage()` in `server.ts`.
  - Local PDF extraction writes temporary input and output files under `os.tmpdir()` in `extractPdfText()` in `server.ts`.
  - Temporary PDF files for Gemini upload are also written under `os.tmpdir()` in `server.ts`.
  - Temporary files are removed with `fs.unlink(...).catch(() => {})` in `server.ts`.
- Build artifacts are emitted to `dist/` by Vite and served by `server.ts` when `NODE_ENV=production`.
- Generated/local artifacts exist under `.playwright-cli/` and `output/`; both are ignored by `.gitignore`.

**Caching:**
- None detected.
  - No Redis, KV, browser storage, or persistent server cache is used by `server.ts` or `src/`.
  - The React UI keeps current report state in memory with `useState()` in `src/App.tsx`.

## Authentication & Identity

**Auth Provider:**
- No user authentication provider detected.
  - `src/App.tsx` exposes a local single-page form without login.
  - `server.ts` does not implement session, cookie, token, OAuth, or role-based middleware.

**Service Authentication:**
- OpenAI uses bearer-token API authentication from `OPENAI_API_KEY` in `server.ts`.
- Gemini uses API-key authentication from `GEMINI_API_KEY` in `server.ts`.
- UniProt uses unauthenticated public REST requests from `src/lib/protein-resolver.ts`.
- Ollama uses unauthenticated local HTTP requests from `server.ts`.

## Upload, Parsing, and Data Ingestion

**Browser Upload:**
- `src/App.tsx` uses a native file input with `accept="application/pdf"` and submits the form through `FormData`.
- Current UI does not use `react-dropzone`, although `react-dropzone` is declared in `package.json`.

**Server Upload Parser:**
- `server.ts` uses `multer` with in-memory storage.
- The expected multipart field name is `file`, matching `name="file"` in `src/App.tsx`.
- The request handler reads `sequence`, `question`, and optional `organism` from `req.body` in `server.ts`.
- No explicit file size, page count, MIME enforcement, or upload rate limit is configured in `server.ts`.

**Local PDF Parsing:**
- `server.ts` invokes external executable `pdftotext` through Node `execFile`.
- Local system path for the executable is `/opt/homebrew/bin/pdftotext`.
- Extracted text is passed to `collectPaperMentions()` in `server.ts`, which scans snippets for known aliases.

**Protein Sequence Parsing:**
- FASTA headers are extracted by `extractFastaHeader()` in `src/lib/analysis.ts`.
- Sequences are normalized by `normalizeSequence()` in `src/lib/analysis.ts`.
- Local region heuristics are generated by `runLocalHeuristics()` in `src/lib/analysis.ts`.
- Protein identity resolution is handled by `resolveProtein()` in `src/lib/protein-resolver.ts`.

## Monitoring & Observability

**Error Tracking:**
- None detected.
  - No Sentry, OpenTelemetry, Datadog, Logtail, Vercel Observability, or similar dependency appears in `package.json`.

**Logs:**
- Server errors are written with `console.error()` in `server.ts`.
- Server startup logs are written with `console.log()` in `server.ts`.
- Client-side request errors are written with `console.error()` and displayed in component state in `src/App.tsx`.
- Playwright CLI console artifacts exist under `.playwright-cli/`, but the app has no runtime observability integration.

## CI/CD & Deployment

**Hosting:**
- Not detected.
  - No `vercel.json`, `Dockerfile`, `wrangler.*`, GitHub Actions workflow, or platform-specific deployment config was detected in the scanned root.
  - `server.ts` supports production static serving from `dist/`.
  - `README.md` references Google AI Studio for viewing the app, but no deploy automation is configured in the repo.

**CI Pipeline:**
- None detected.
  - No `.github/workflows/` directory was detected in the scanned root.
  - Validation command available locally: `npm run lint` from `package.json`.
  - Build command available locally: `npm run build` from `package.json`.

## Environment Configuration

**Required env vars:**
- `GEMINI_API_KEY` - README-documented key for Gemini operation; read by `server.ts` and exposed by `vite.config.ts`.

**Optional env vars:**
- `OPENAI_API_KEY` - Enables OpenAI Responses API synthesis path in `server.ts`.
- `OPENAI_MODEL` - Selects OpenAI model; defaults to `gpt-4.1-mini` in `server.ts`.
- `OLLAMA_URL` - Selects local Ollama base URL; defaults to `http://127.0.0.1:11434` in `server.ts`.
- `OLLAMA_MODEL` - Selects local Ollama model; defaults to `gemma3:4b` in `server.ts`.
- `NODE_ENV` - Selects development Vite middleware or production `dist/` static serving in `server.ts`.
- `DISABLE_HMR` - Disables Vite HMR when set to `true` in `vite.config.ts`.

**Secrets location:**
- `.env.local` is present and loaded by `server.ts`; contents were not read.
- `.env.example` is present as an example file; contents were not read.
- `.gitignore` ignores `.env*` and re-includes `.env.example`.

## Webhooks & Callbacks

**Incoming:**
- None detected.
  - The only server API route detected is `/api/analyze` in `server.ts`.
  - No webhook-specific routes, signature verification, or callback handlers were detected.

**Outgoing:**
- OpenAI request from `server.ts` to `https://api.openai.com/v1/responses`.
- Gemini model and file-upload requests through `@google/genai` in `server.ts`.
- UniProt request from `src/lib/protein-resolver.ts` to `https://rest.uniprot.org/uniprotkb/...`.
- Ollama local requests from `server.ts` to `${OLLAMA_URL}/api/tags` and `${OLLAMA_URL}/api/generate`.

---

*Integration audit: 2026-04-13*
