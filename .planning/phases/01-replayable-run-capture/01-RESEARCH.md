# Phase 1: Replayable Run Capture - Research

**Researched:** 2026-04-13
**Domain:** Local-first run artifact capture for the existing Express and React analysis flow
**Confidence:** HIGH

<user_constraints>
## User Constraints

No `CONTEXT.md` exists for this phase, so there are no locked user decisions yet.

### Locked Decisions
- None

### the agent's Discretion
- Choose the internal artifact shape and helper boundaries as long as the current `/api/analyze` response contract stays intact.
- Choose a file-first implementation that fits the existing TypeScript stack without introducing a database in Phase 1.

### Deferred Ideas (OUT OF SCOPE)
- SQLite or any other query database
- Multi-run comparison execution
- UI changes beyond keeping the existing single-run experience stable
- `gsigmad` experiment registration work
</user_constraints>

<research_summary>
## Summary

Phase 1 should wrap the current `/api/analyze` path with replay-safe capture, not redesign the product. The repo already has deterministic preprocessing in `src/lib/analysis.ts`, a single orchestration boundary in `server.ts`, and a stable response contract in `src/lib/schema.ts`. That makes a file-first capture layer the right fit: introduce one helper module for canonical hashing and atomic writes, refactor the route only enough to preserve each stage of the current analysis flow, and write immutable run artifacts under a gitignored `.bioviz-runs/` tree.

The key design rule is separation of layers. Deterministic preprocessing outputs, provider raw output, parsed structured output, fallback report, and final hydrated report need to be stored as distinct artifacts so later comparison work can tell what came from the model and what came from the app. The current handler already computes most of that data; Phase 1 mainly needs to stop discarding it.

**Primary recommendation:** keep Phase 1 file-first and server-owned: add `src/lib/capture.ts`, introduce an explicit run-manifest validator, and persist one immutable run bundle without changing the browser contract.
</research_summary>

<repo_fit>
## Repo-Fit Recommendations

### Runtime layout

- Use `.bioviz-runs/` as the root runtime store and add it to `.gitignore`.
- Write run folders under `.bioviz-runs/runs/YYYY/MM/DD/{runId}/`.
- Write append-only indexes under `.bioviz-runs/index/`, starting with `runs.jsonl`.

### Helper boundaries

- Put stable hashing, canonical JSON, path creation, atomic JSON writes, and JSONL append helpers in `src/lib/capture.ts`.
- Put manifest schema and replay-critical validation in `src/lib/run-manifest.ts` so `server.ts` stays focused on orchestration.
- Keep provider calls in `server.ts` for now; only refactor enough to preserve prompt text, raw response text, parsed JSON, fallback output, final output, and errors as named values.

### Manifest expectations

The first manifest should store:

- input hashes for raw FASTA, normalized sequence, question, organism, and optional PDF
- prompt identity and rendered prompt text path
- provider, model, parameters, completion status, and fallback use
- raw model response path
- parsed model JSON path when available
- fallback report path
- final report path
- validation pass/fail state and error messages
- provenance root hash and artifact count

### Keep scope tight

- Do not add a DB, ORM, queue, or background worker.
- Do not change the React form or response shape in this phase.
- Do not auto-pull Ollama models or normalize multi-provider settings yet.
</repo_fit>

<architecture_patterns>
## Architecture Patterns

### Pattern 1: File-first immutable run bundle

Store each run as a directory containing `manifest.json` plus the exact payload files it references. The manifest should point to sibling files like `prompt.txt`, `response.raw.txt`, `response.parsed.json`, `fallback.report.json`, and `report.json`.

Why this fits here:
- the repo currently has no persistence layer
- artifacts need to be inspectable outside the app
- later comparison work can derive tables from immutable manifests instead of treating tables as source of truth

### Pattern 2: Explicit route-stage capture

Refactor `server.ts` so the route keeps explicit variables for:

- rendered prompt text
- provider attempt records
- raw provider response text
- parsed provider JSON
- fallback report
- final hydrated report
- validation errors

This is enough structure for capture without prematurely extracting a full provider abstraction.

### Pattern 3: Validate replay data before writing the index row

Write artifact files first, validate the manifest object against a local schema, then write `manifest.json`, and only append the summary row to `runs.jsonl` after manifest validation passes. This prevents partially described runs from becoming the canonical index.
</architecture_patterns>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Mixing deterministic fields with model output

**What goes wrong:** Later comparison work cannot tell whether identity, paper mentions, or provenance came from the model or app hydration.

**How to avoid:** Persist parsed model JSON, fallback report, and final hydrated report as separate files with separate hashes.

### Pitfall 2: Writing non-atomic JSON files

**What goes wrong:** Interrupted writes leave truncated manifests or report files that look real but cannot replay.

**How to avoid:** Write JSON to a temporary sibling file and rename it into place.

### Pitfall 3: Preserving only successful model output

**What goes wrong:** Schema-invalid or failed runs disappear, which hides important failure modes.

**How to avoid:** Record raw response text, validation errors, provider attempt order, and final status even for fallback-only or failed runs.

### Pitfall 4: Letting Phase 1 expand into comparison infrastructure

**What goes wrong:** Planning drifts into model selection, batch execution, or UI work and Phase 1 stops being a contained foundation.

**How to avoid:** Keep this phase focused on one-run capture behind the existing UX.
</common_pitfalls>

## Validation Architecture

Phase 1 can use the existing TypeScript compiler gate plus small command-line smoke checks.

- Quick feedback loop: `npm run lint`
- Phase-level gate: `npm run lint`
- Targeted smoke checks during execution:
  - import `src/lib/capture.ts` and verify helper exports
  - import `src/lib/run-manifest.ts` and validate a fixture manifest
  - run one local `/api/analyze` request and confirm the JSON response still matches `BioVizReportSchema` while a manifest lands under `.bioviz-runs/`

The validation burden is mostly integration, not UI rendering. The important property is that replay-critical fields are written and validated without changing the existing browser contract.

<open_questions>
## Open Questions

1. **How much provider metadata is available for each backend today?**
   - What we know: `server.ts` already knows provider order and model names.
   - What is unclear: exact hosted-provider request IDs and Ollama digest capture boundaries.
   - Planning recommendation: require provider name, model name, and explicit parameters in Phase 1; store richer metadata opportunistically when returned.

2. **Should manifest validation live beside the BioViz report schema or in its own file?**
   - What we know: `src/lib/schema.ts` already owns the user-facing report contract.
   - What is unclear: whether adding run-manifest schemas there would create noise.
   - Planning recommendation: use a dedicated `src/lib/run-manifest.ts` to keep runtime capture separate from report typing.
</open_questions>

<sources>
## Sources

### Primary
- `.planning/research/SUMMARY.md`
- `.planning/research/DATA_CAPTURE.md`
- `.planning/research/METHODOLOGY.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `server.ts`
- `src/lib/analysis.ts`
- `src/lib/schema.ts`

### Secondary
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
</sources>
