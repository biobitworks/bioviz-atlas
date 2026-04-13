# Technology Stack: Model Comparison

**Project:** BioViz Atlas
**Research mode:** Ecosystem
**Researched:** 2026-04-13
**Overall confidence:** HIGH for Ollama/API shape and local persistence, MEDIUM for package version choices because npm versions change.

## Recommendation

Keep the brownfield stack: **Vite + React + Express + TypeScript**. Add model comparison as a server-owned experiment harness, not as a new framework.

The next phase should use:

- direct Ollama HTTP calls through a typed `ModelProvider` interface
- `zod` as the canonical output validator, preserving `BioVizReportSchema`
- SQLite on local disk for experiment runs, using `better-sqlite3` only if queryable persistence is needed in the first implementation
- no LangChain, no external queue, no remote database, and no provider gateway for the local-model comparison phase

This fits the current code because `server.ts` already calls Ollama at `OLLAMA_URL`, requests non-streaming JSON with `format: bioVizJsonSchema`, validates with Zod, and has a deterministic fallback report path. The cleanest next step is to factor that behavior into adapters and add run storage around it.

## Recommended Stack Decisions

### Core Framework

| Technology | Version / Source | Purpose | Decision |
|------------|------------------|---------|----------|
| Vite | Existing dependency | Browser build and dev middleware | Keep. No model-comparison reason to change the frontend build stack. |
| React | Existing dependency | Operator UI | Keep. Add model selector, comparison run form, and comparison result panels. |
| Express | Existing dependency | Local API server | Keep. Put provider orchestration and run persistence behind server routes. |
| TypeScript | Existing dependency | Shared contracts | Keep. Define provider/run/result interfaces in TS and validate model output at runtime with Zod. |
| Zod | Existing dependency | Runtime report validation | Keep as the schema source of truth for normalized model outputs. |

### Model Integration

| Technology | Version / Source | Purpose | Decision |
|------------|------------------|---------|----------|
| Ollama REST API | Official API docs | Local model discovery and generation | Use directly via `fetch`. It is already simple enough: list models with `/api/tags`, inspect metadata with `/api/show`, generate with `/api/generate`, and disable streaming for run capture. |
| `ollama` npm package | `0.6.3` from npm on 2026-04-13 | Official JS client | Defer. It is reasonable, but direct REST avoids a new dependency and matches current code. Add it later only if streaming/cancellation ergonomics become painful. |
| OpenAI Responses API path | Existing custom code | Optional cloud baseline | Preserve behind the same provider interface, but do not make it part of the local Ollama MVP. |
| Gemini `@google/genai` path | Existing dependency | Optional cloud/PDF path | Preserve behind the same provider interface, but avoid coupling Ollama comparison to Gemini file upload behavior. |

### Persistence

| Technology | Version / Source | Purpose | Decision |
|------------|------------------|---------|----------|
| SQLite file | SQLite official docs | Local run database | Recommended for the next phase if results need to be browsed, filtered, grouped, or audited in-app. |
| `better-sqlite3` | `12.9.0` from npm/GitHub on 2026-04-13 | Synchronous SQLite access from Express | Recommended if adding SQLite now. The app is a local operator tool, writes are small, and the synchronous API keeps implementation simple. Enable WAL mode. |
| `@types/better-sqlite3` | `7.6.13` from npm on 2026-04-13 | TypeScript types | Add only with `better-sqlite3`. |
| JSONL files | Node `fs/promises` | Append-only raw experiment log | Acceptable as a phase-0 fallback, but not the main recommendation because comparison views will immediately want indexing by input hash, model, experiment batch, timestamp, and schema validity. |
| PostgreSQL / hosted DB | External service | Durable multi-user storage | Do not add. The requirement is local repeated-run comparison, not collaborative production storage. |

## Minimal Package Changes

Recommended first implementation if using SQLite:

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

No additional model SDK is required for Ollama.

If the first phase wants zero new dependencies, start with append-only JSONL plus a small in-memory index rebuilt at server start. Treat that as temporary: it keeps run capture simple, but it will become awkward once the UI needs filtering and comparison history.

## Provider Abstraction Pattern

Use a narrow server-side provider contract. Do not expose provider-specific request formats to React.

```typescript
type ModelProviderId = "ollama" | "openai" | "gemini" | "heuristic";

type ModelRunOptions = {
  temperature: number;
  seed?: number;
  numPredict?: number;
  timeoutMs?: number;
};

type ModelDescriptor = {
  provider: ModelProviderId;
  model: string;
  displayName: string;
  digest?: string;
  parameterSize?: string;
  quantization?: string;
  contextLength?: number;
  capabilities?: string[];
};

type ModelInvocation = {
  provider: ModelProviderId;
  model: string;
  prompt: string;
  schemaName: "BioVizReport";
  schema: unknown;
  options: ModelRunOptions;
};

type ModelResult = {
  provider: ModelProviderId;
  model: string;
  rawText: string;
  parsed: unknown;
  usage?: {
    promptEvalCount?: number;
    evalCount?: number;
    totalDurationNs?: number;
  };
  metadata: Record<string, unknown>;
};

interface ModelProvider {
  id: ModelProviderId;
  listModels(): Promise<ModelDescriptor[]>;
  generate(invocation: ModelInvocation): Promise<ModelResult>;
}
```

### Why This Pattern

- Ollama, OpenAI, Gemini, and deterministic fallback all become interchangeable execution engines.
- The API can run one input across `N models x R repeats` without duplicating analysis setup.
- Result capture can store both normalized `BioVizReport` JSON and provider-specific raw metadata.
- React only needs to know model descriptors and comparison run IDs, not API-specific payloads.

### Route Shape

Recommended server routes:

| Route | Purpose |
|-------|---------|
| `GET /api/models` | Return available model descriptors grouped by provider. For Ollama, call `/api/tags` and optionally enrich selected models with `/api/show`. |
| `POST /api/analyze` | Preserve current single-run behavior for compatibility. Accept optional `{ provider, model, options }`. |
| `POST /api/experiments` | Create a comparison batch from one input, selected models, repeat count, and fixed model options. |
| `GET /api/experiments/:id` | Return batch metadata and run summaries. |
| `GET /api/runs/:id` | Return raw and parsed output for a single run. |

Keep execution sequential for the MVP. Local Ollama comparisons are resource-bound; parallel model loading will distort latency and may fail on smaller machines. Add bounded concurrency later only after run capture is stable.

## Ollama Integration Details

Use the Ollama API directly:

- `GET /api/tags` for local model discovery
- `POST /api/show` for metadata such as template, parameters, details, model info, and capabilities
- `POST /api/generate` for report generation
- `stream: false` so every run is stored as a single complete result
- `format: bioVizJsonSchema` to request structured JSON
- `options.temperature` fixed by experiment settings; default to `0` or `0.1` for comparability
- include model options in the run record, even when they use defaults

Do not auto-pull models in the comparison MVP. Pulling can take minutes, changes local disk state, and makes experiment setup less explicit. Show missing models as unavailable and let the operator pull them outside the comparison flow.

### Seed Handling

Ollama supports model options through the `options` object. If the installed model/runtime honors `seed`, store it and pass it for repeatability. Still treat repeats as empirical observations, not guaranteed identical runs, because determinism can vary by backend, quantization, model, runtime version, and hardware.

## Persistence Design

Use a local SQLite database under a gitignored runtime path, for example:

```text
.bioviz-runs/bioviz-atlas.sqlite
```

Do not store experiment databases under `.planning/` because planning artifacts are for roadmap context, not mutable runtime state.

### Minimum Tables

```sql
create table experiments (
  id text primary key,
  created_at text not null,
  input_hash text not null,
  prompt_hash text not null,
  sequence_hash text not null,
  question text not null,
  organism text not null,
  repeat_count integer not null,
  status text not null,
  notes text
);

create table model_runs (
  id text primary key,
  experiment_id text not null references experiments(id),
  provider text not null,
  model text not null,
  model_digest text,
  run_index integer not null,
  started_at text not null,
  completed_at text,
  status text not null,
  options_json text not null,
  prompt_hash text not null,
  provenance_root_hash text,
  latency_ms integer,
  raw_response_json text,
  parsed_report_json text,
  validation_error text,
  usage_json text
);

create index model_runs_experiment_idx on model_runs(experiment_id);
create index model_runs_model_idx on model_runs(provider, model);
create index experiments_input_idx on experiments(input_hash);
```

Store full JSON as text for now. Avoid ORM overhead; hand-written SQL is enough for this local app and makes the experiment artifact easy to inspect.

### File Artifacts

If PDFs are included, keep storing extracted text as a provenance artifact rather than database BLOBs. Store hashes and paths in the run metadata. This keeps SQLite focused on queryable metadata and model outputs.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Ollama integration | Direct REST through provider adapter | `ollama` npm package | Good package, but not needed yet; current code already uses the REST API cleanly. |
| Provider orchestration | Small local `ModelProvider` interface | LangChain | Too much abstraction for a fixed report schema and repeated local runs. Adds dependency weight without solving the core experiment storage problem. |
| Provider abstraction | Local adapters | Vercel AI SDK / Gateway | Useful for multi-cloud routing, but local Ollama comparison should not depend on a gateway or framework-level AI runtime. |
| Persistence | SQLite + `better-sqlite3` | JSONL only | JSONL is easy to append but weak for UI history, filtering, and grouped comparison summaries. |
| Persistence | SQLite local file | Postgres/Neon/Supabase | Unnecessary service and credential overhead for local operator experiments. |
| Execution | Sequential runs | Parallel runs | Parallel local inference changes resource contention and makes model latency comparisons less interpretable. |

## Next Phase Implementation Order

1. Factor current prompt construction and synthesis calls out of `server.ts`.
   - Create `src/lib/model-providers/types.ts`.
   - Create `src/lib/model-providers/ollama.ts`.
   - Wrap existing OpenAI/Gemini paths later, after Ollama comparison works.

2. Add model discovery.
   - Implement `GET /api/models`.
   - For Ollama, return `/api/tags` models and enough metadata for operator choice.
   - Keep `OLLAMA_URL` as the server-side config variable.

3. Add single-run provider selection.
   - Extend `/api/analyze` to accept `provider`, `model`, and `options`.
   - Preserve existing default behavior so the UI does not break.

4. Add experiment persistence.
   - Add SQLite database module.
   - Record experiments and model runs before/after each invocation.
   - Store raw response, parsed report, validation status, provenance root, latency, options, and model metadata.

5. Add repeated-run batch endpoint.
   - Implement `POST /api/experiments`.
   - Run selected models sequentially with fixed prompt, fixed input hashes, fixed options, and configured repeat count.

6. Add comparison UI.
   - Start with table summaries: status, model, repeat, latency, schema validity, region count, title, and summary excerpt.
   - Add side-by-side report detail after storage is working.

## Pitfalls To Avoid

- Do not let the frontend call Ollama directly. Keep CORS, host config, provider errors, and model metadata on the Express side.
- Do not compare models using different prompts. Hash and store the exact prompt used for every run.
- Do not silently fall back from one provider to another inside comparison runs. Fallback is useful for single analysis, but invalidates model comparison unless the run is marked failed and the fallback is recorded as a separate run.
- Do not overwrite the current report with only the latest run. Store every repeat as its own run row.
- Do not treat structured output validity as model quality. It is one metric. Keep validity, biological field agreement, provenance completeness, and operator judgment separate.
- Do not use high temperature by default. For repeated comparison, default to low temperature and make variance a deliberate setting.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Ollama REST integration | HIGH | Official API documents the exact endpoints needed for model listing, metadata, generation, non-streaming responses, and structured formats. |
| Provider abstraction | HIGH | Current code already has multiple providers and one schema; a small adapter boundary follows the existing architecture. |
| SQLite persistence | HIGH | Experiment runs are local, structured, append-heavy, and queryable; SQLite is the right scope without adding a service. |
| `better-sqlite3` package choice | MEDIUM | Current npm metadata supports Node 20-25 and latest observed version is 12.9.0, but native package installs can still be environment-sensitive. |
| Avoiding LangChain / gateway packages | MEDIUM | This is an architectural judgment based on the narrow task; revisit only if future phases need tool orchestration, retrieval chains, or many hosted providers. |

## Sources

- Ollama API docs, accessed 2026-04-13: https://github.com/ollama/ollama/blob/main/docs/api.md
- Ollama JS package metadata, accessed 2026-04-13: https://www.npmjs.com/package/ollama
- `better-sqlite3` GitHub README and release metadata, accessed 2026-04-13: https://github.com/WiseLibs/better-sqlite3
- `better-sqlite3` npm metadata checked with `npm view better-sqlite3`, accessed 2026-04-13: https://www.npmjs.com/package/better-sqlite3
- SQLite WAL documentation, accessed 2026-04-13: https://www.sqlite.org/wal.html
- BioViz Atlas codebase files reviewed 2026-04-13: `server.ts`, `package.json`, `.planning/PROJECT_BRIEF_MODEL_COMPARISON.md`, `.planning/codebase/STACK.md`
