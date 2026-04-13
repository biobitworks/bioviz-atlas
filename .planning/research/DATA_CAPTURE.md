# Data Capture Schema: BioViz Atlas Model Comparisons

**Project:** BioViz Atlas  
**Researched:** 2026-04-13  
**Mode:** Ecosystem / implementation research  
**Overall confidence:** HIGH for repo-fit schema; MEDIUM for future experiment metrics until `gsigmad` integration is designed

## Recommendation

Use a file-first, append-friendly capture system under a gitignored `.bioviz-runs/` directory. Store every model run as a self-contained folder with a `manifest.json`, exact prompt, raw model response, validated report JSON, provenance graph, environment metadata, and content hashes for every replay-relevant input and derived artifact. Store comparison views as JSONL rows plus optional CSV exports derived from run manifests, not as the source of truth.

Do not introduce a database in the first implementation. The current repo is a compact Vite + React + Express + TypeScript app with no persistence layer. JSON files and JSONL indexes are enough for repeatable hackathon and internal research comparison, easier to audit, and easy to migrate later to SQLite if filtering/query volume grows.

## Run Manifest Fields

Each run should write `.bioviz-runs/runs/YYYY/MM/DD/{run_id}/manifest.json`.

### Required Top-Level Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `schemaVersion` | string | yes | Version the capture contract, starting at `bioviz-run-manifest/v1`. |
| `runId` | string | yes | Stable run identifier: `run_{utcTimestamp}_{shortInputHash}_{provider}_{modelSlug}`. |
| `runGroupId` | string | yes | Groups repeated runs over the same exact input set. |
| `comparisonId` | string/null | no | Present when launched as part of a named model comparison. |
| `createdAt` | ISO string | yes | UTC run start time. |
| `completedAt` | ISO string/null | yes | UTC run completion time or null on failed/incomplete runs. |
| `status` | enum | yes | `succeeded`, `failed`, `partial`, `fallback_only`, `schema_invalid`. |
| `operator` | string/null | no | Local operator label; avoid storing private contact details. |
| `repo` | object | yes | Git and app provenance. |
| `runtime` | object | yes | Node/npm/app environment and external tool versions. |
| `inputs` | object | yes | Raw and normalized task inputs. |
| `model` | object | yes | Provider, model, parameters, endpoint class, and local model digest where available. |
| `prompt` | object | yes | Exact prompt and prompt-template identity. |
| `deterministicPipeline` | object | yes | Local preprocessing, resolver, PDF extraction, and heuristic artifact references. |
| `outputs` | object | yes | Report, raw response, fallback report, errors, and validation results. |
| `provenance` | object | yes | Artifact graph summary and root hash. |
| `hashes` | object | yes | Canonical identity hashes and replay hashes. |
| `audit` | object | yes | Public-safety, replay, and redaction flags. |

### `repo`

```json
{
  "projectRoot": "active/bioviz-atlas",
  "gitCommit": "HEAD sha or null",
  "gitBranch": "branch name or null",
  "gitDirty": true,
  "gitDirtyDiffSha256": "sha256 of git diff --binary, or null",
  "packageLockSha256": "sha256(package-lock.json)",
  "appEntrypoint": "server.ts",
  "reportSchemaPath": "src/lib/schema.ts"
}
```

Store `gitDirtyDiffSha256` rather than the full diff by default. For replay-grade local experiments, optionally store `git-diff.patch` in the run folder when the operator opts in.

### `runtime`

```json
{
  "nodeVersion": "v25.8.1",
  "npmVersion": "11.11.0",
  "platform": "darwin",
  "arch": "arm64",
  "pdftotext": {
    "available": true,
    "version": "captured command output or null"
  },
  "ollama": {
    "url": "http://127.0.0.1:11434",
    "available": true,
    "serverVersion": "if exposed by local API",
    "modelsHash": "sha256 of /api/tags response"
  },
  "environment": {
    "openaiConfigured": true,
    "geminiConfigured": false,
    "ollamaConfigured": true
  }
}
```

Never store API keys, `.env.local`, bearer tokens, or raw request headers.

### `inputs`

```json
{
  "inputSetId": "input_{shortCanonicalInputHash}",
  "organism": "Homo sapiens",
  "question": {
    "text": "plain-English question exactly as submitted",
    "sha256": "sha256 exact UTF-8 question",
    "normalizedSha256": "sha256 trimmed whitespace-normalized question"
  },
  "fasta": {
    "originalName": "optional user filename",
    "header": "FASTA header or null",
    "rawPath": "inputs/raw.fasta",
    "rawSha256": "sha256 exact submitted FASTA text",
    "normalizedPath": "inputs/normalized.fasta",
    "normalizedSequenceSha256": "sha256 normalized protein sequence",
    "length": 180,
    "alphabetPolicy": "normalizeSequence from src/lib/analysis.ts"
  },
  "pdf": {
    "present": true,
    "originalName": "paper.pdf",
    "mimeType": "application/pdf",
    "rawPath": "inputs/paper.pdf",
    "rawSha256": "sha256 PDF bytes",
    "byteLength": 1234567,
    "extractedTextPath": "inputs/paper.txt",
    "extractedTextSha256": "sha256 pdftotext output or null"
  }
}
```

### `model`

```json
{
  "provider": "ollama",
  "model": "gemma3:4b",
  "modelSlug": "gemma3-4b",
  "endpointClass": "local_ollama",
  "modelDigest": "Ollama digest from /api/show or /api/tags when available",
  "parameters": {
    "temperature": 0.2,
    "topP": null,
    "topK": null,
    "seed": null,
    "maxTokens": null,
    "stream": false,
    "format": "bioVizJsonSchema"
  },
  "providerRequestId": null,
  "latencyMs": 4250,
  "attemptOrder": 1,
  "fallbackUsed": false
}
```

For OpenAI/Gemini, capture provider, model name, endpoint family, request id if returned, and the structured-output mode. For Ollama, capture the local model digest when available because `model:tag` can be overwritten locally.

### `prompt`

```json
{
  "templateVersion": "bioviz-analysis-prompt/v1",
  "templatePath": "server.ts inline prompt block",
  "templateSha256": "sha256 of exact template string if extracted",
  "renderedPromptPath": "prompt.txt",
  "renderedPromptSha256": "sha256 exact rendered prompt",
  "jsonSchemaPath": "src/lib/schema.ts",
  "jsonSchemaSha256": "sha256 canonical bioVizJsonSchema",
  "includedPdfMentionsInPrompt": false
}
```

The current `server.ts` constructs the prompt before local PDF extraction, so `paperMentions` are empty in the rendered prompt even when extracted mentions later hydrate the fallback/report path. Capture `includedPdfMentionsInPrompt` explicitly because it affects fair comparison.

### `deterministicPipeline`

```json
{
  "artifacts": [
    {
      "id": "art_x",
      "type": "raw_sequence_input",
      "sha256": "hash",
      "parents": [],
      "path": "inputs/raw.fasta",
      "createdAt": "ISO string",
      "metadata": {}
    }
  ],
  "localScan": {
    "path": "artifacts/local_region_scan.json",
    "sha256": "sha256 canonical JSON"
  },
  "proteinResolution": {
    "path": "artifacts/protein_resolution.json",
    "sha256": "sha256 canonical JSON",
    "resolver": "src/lib/protein-resolver.ts",
    "externalSources": ["UniProt when called"]
  },
  "paperMentions": {
    "path": "artifacts/paper_mentions.json",
    "sha256": "sha256 canonical JSON",
    "method": "alias scan over pdftotext output"
  }
}
```

Map the local `ProvenanceGraph` to a stable persisted artifact list. The in-memory implementation currently uses random artifact ids and millisecond timestamps, so the persisted graph should treat `sha256`, `type`, `parents`, and canonical metadata as the stable audit fields.

### `outputs`

```json
{
  "rawModelResponsePath": "response.raw.txt",
  "rawModelResponseSha256": "sha256 raw response text",
  "parsedModelJsonPath": "response.parsed.json",
  "parsedModelJsonSha256": "sha256 canonical parsed JSON or null",
  "fallbackReportPath": "fallback.report.json",
  "fallbackReportSha256": "sha256 canonical fallback report",
  "finalReportPath": "report.json",
  "finalReportSha256": "sha256 canonical final BioVizReport",
  "validation": {
    "schema": "BioVizReportSchema",
    "passed": true,
    "errorsPath": null
  },
  "errors": []
}
```

Store raw response even when schema validation fails. Failed model outputs are essential for comparison because schema invalidity is itself a model behavior.

### `provenance`

```json
{
  "rootHash": "current BioViz report provenance root",
  "artifactCount": 8,
  "graphPath": "provenance.json",
  "graphSha256": "sha256 canonical persisted provenance graph",
  "provModel": "PROV-inspired Entity/Activity/Agent subset",
  "entities": ["raw FASTA", "normalized sequence", "PDF", "extracted text", "report"],
  "activities": ["normalize", "scan regions", "resolve protein", "extract PDF", "generate model report"],
  "agents": ["BioViz Atlas server", "provider/model"]
}
```

Use W3C PROV concepts as vocabulary inspiration: inputs and outputs are entities, preprocessing/model calls are activities, and software/model/provider are agents. Do not overbuild RDF/OWL export in v1.

### `hashes`

```json
{
  "canonicalInputHash": "sha256 canonical JSON of normalized sequence + exact question + organism + pdf raw hash/null",
  "inputSetHash": "same as canonicalInputHash unless future dataset fields are added",
  "replayHash": "sha256 canonical JSON of canonicalInputHash + prompt hash + model identity + parameters + code/dependency identity",
  "outputHash": "sha256 canonical final report JSON",
  "comparisonRowHash": "sha256 canonical comparison row JSON",
  "manifestHash": "sha256 canonical manifest with manifestHash omitted"
}
```

Use a JSON canonicalization routine before hashing structured objects. RFC 8785 is the right reference model: deterministic property ordering and stable JSON representation are required if hashes are used as identities rather than incidental checksums.

### `audit`

```json
{
  "clinicalUse": false,
  "publicSafe": true,
  "privateDataExpected": false,
  "redactionsApplied": [],
  "replayReady": true,
  "replayBlockers": [],
  "notes": []
}
```

Set `replayReady` to false when the run depends on an unavailable hosted model response, an unknown local model digest, missing raw PDF, missing prompt text, or a dirty code state without a diff hash.

## Artifact Storage Layout

Recommended v1 layout:

```text
.bioviz-runs/
  README.md
  index.jsonl
  input-sets/
    input_{shortCanonicalInputHash}/
      input-manifest.json
      raw.fasta
      normalized.fasta
      question.txt
      paper.pdf
      paper.txt
  runs/
    2026/
      04/
        13/
          run_20260413T153012Z_ab12cd34_ollama_gemma3-4b/
            manifest.json
            request.json
            prompt.txt
            response.raw.txt
            response.parsed.json
            fallback.report.json
            report.json
            provenance.json
            artifacts.jsonl
            environment.json
            validation.json
            errors.jsonl
  comparisons/
    cmp_20260413T154000Z_ab12cd34/
      comparison-manifest.json
      runs.jsonl
      comparison-table.jsonl
      comparison-table.csv
      deltas.json
      notes.md
```

Add `.bioviz-runs/` to `.gitignore` before implementation. The planning docs remain in git; run artifacts remain local unless a specific sanitized comparison is intentionally exported.

### `index.jsonl`

Append one small summary row per run:

```json
{
  "runId": "run_20260413T153012Z_ab12cd34_ollama_gemma3-4b",
  "runGroupId": "group_ab12cd34",
  "createdAt": "2026-04-13T15:30:12.000Z",
  "status": "succeeded",
  "provider": "ollama",
  "model": "gemma3:4b",
  "canonicalInputHash": "ab12cd34...",
  "replayHash": "ef56...",
  "outputHash": "9012...",
  "manifestPath": "runs/2026/04/13/run_.../manifest.json"
}
```

Append-only JSONL gives simple recovery if one run fails midway and avoids rewriting global JSON.

## Comparison Table Schema

Comparison tables should be derived from manifests and reports. Source of truth remains per-run artifacts.

Each row in `comparison-table.jsonl` should represent one run for one shared input set.

| Field | Type | Purpose |
|-------|------|---------|
| `comparisonId` | string | Named comparison batch. |
| `runGroupId` | string | Shared exact input group. |
| `runId` | string | Run folder identity. |
| `canonicalInputHash` | string | Verifies all rows use the same input. |
| `provider` | string | `openai`, `gemini`, `ollama`, or `fallback`. |
| `model` | string | Exact model name/tag. |
| `modelDigest` | string/null | Local model content identity when available. |
| `temperature` | number/null | Decoding parameter used. |
| `seed` | number/null | Seed if supported. |
| `status` | string | Run status. |
| `latencyMs` | number/null | End-to-end provider latency or route latency. |
| `schemaValid` | boolean | Whether model output passed `BioVizReportSchema`. |
| `fallbackUsed` | boolean | Whether deterministic fallback fields drove final output. |
| `summaryLength` | number | Character count of final report summary. |
| `regionCount` | number | Number of final report regions. |
| `paperMentionCount` | number | Number of final paper mentions. |
| `nextStepCount` | number | Number of next steps. |
| `canonicalProteinAccession` | string/null | UniProt accession from final report. |
| `canonicalProteinSymbol` | string/null | Approved symbol from final report. |
| `regionSpans` | array | Stable list of `{start,end,label,confidence}`. |
| `regionSpanHash` | string | Hash of canonical region spans. |
| `paperMentionHash` | string | Hash of canonical mention snippets/aliases. |
| `reportHash` | string | Final report canonical JSON hash. |
| `rawResponseHash` | string/null | Raw response hash. |
| `errorClass` | string/null | Failure category if any. |
| `replayReady` | boolean | From manifest audit. |
| `notes` | array | Manual notes or judge tags. |

Example row:

```json
{
  "comparisonId": "cmp_20260413T154000Z_ab12cd34",
  "runGroupId": "group_ab12cd34",
  "runId": "run_20260413T153012Z_ab12cd34_ollama_gemma3-4b",
  "canonicalInputHash": "ab12cd34...",
  "provider": "ollama",
  "model": "gemma3:4b",
  "modelDigest": "sha256:...",
  "temperature": 0.2,
  "seed": null,
  "status": "succeeded",
  "latencyMs": 4250,
  "schemaValid": true,
  "fallbackUsed": false,
  "summaryLength": 642,
  "regionCount": 5,
  "paperMentionCount": 3,
  "nextStepCount": 3,
  "canonicalProteinAccession": "P01275",
  "canonicalProteinSymbol": "GCG",
  "regionSpans": [
    { "start": 1, "end": 20, "label": "Candidate Region of Interest", "confidence": 0.62 }
  ],
  "regionSpanHash": "region_hash...",
  "paperMentionHash": "mention_hash...",
  "reportHash": "report_hash...",
  "rawResponseHash": "raw_hash...",
  "errorClass": null,
  "replayReady": true,
  "notes": []
}
```

## What To Hash

Hash exact bytes for raw files and canonical JSON for structured artifacts.

### Raw Byte Hashes

| Artifact | Hash |
|----------|------|
| Submitted FASTA text | `sha256(Buffer.from(rawSeq, "utf8"))` |
| Uploaded PDF | `sha256(file.buffer)` |
| Extracted PDF text | `sha256(Buffer.from(extractedText, "utf8"))` |
| Rendered prompt | `sha256(Buffer.from(prompt, "utf8"))` |
| Raw model response | `sha256(Buffer.from(responseText, "utf8"))` |
| `package-lock.json` | `sha256(file bytes)` |
| Optional git diff patch | `sha256(file bytes)` |

### Canonical JSON Hashes

| Artifact | Hash |
|----------|------|
| Normalized input identity | Canonical JSON of normalized sequence hash, exact question hash, organism, PDF raw hash/null. |
| Local scan output | Canonical JSON from `runLocalHeuristics`. |
| Protein resolution | Canonical JSON from `resolveProtein`. |
| Paper mentions | Canonical JSON from `collectPaperMentions`. |
| Fallback report | Canonical JSON before model hydration. |
| Parsed model JSON | Canonical JSON before hydration. |
| Final report | Canonical JSON after hydration and provenance attachment. |
| Persisted provenance graph | Canonical JSON of artifact graph. |
| Manifest | Canonical JSON with `manifestHash` omitted. |
| Comparison row | Canonical JSON row. |

### Do Not Hash Or Store

- API keys, bearer tokens, `.env.local`, full request headers, local user contact info.
- Private sequence corpora unless explicitly approved.
- Proprietary Cellico methods, private repo content, or unpublished scoring logic.
- Hosted provider internal metadata beyond request ids and public model names.

## What To Store For Replay

Minimum replay-ready run:

- Exact raw FASTA text.
- Normalized sequence generated by `normalizeSequence`.
- Exact question text.
- Organism string.
- Raw PDF bytes if a PDF was provided.
- Extracted PDF text and extraction tool version/status.
- Exact rendered prompt.
- Prompt template version or extracted prompt template hash.
- Exact `bioVizJsonSchema` hash.
- Model provider, model name, model digest if local, endpoint class, and decoding parameters.
- Raw model response, including invalid JSON.
- Parsed model JSON if parsing succeeded.
- Final hydrated `BioVizReport`.
- Deterministic fallback report.
- Local region scan JSON.
- Protein resolver output JSON and whether UniProt/live enrichment was used.
- Paper mentions JSON.
- Provenance graph and root hash.
- App code identity: git commit, dirty flag, dirty diff hash, package-lock hash.
- Runtime identity: Node version, npm version, platform, relevant external tool versions.
- Failure and validation errors.

Replay should be considered blocked if any of these are missing: raw FASTA, question, prompt, model identity, parameters, final report, raw response for model-generated runs, schema hash, and code/dependency identity.

## What To Store For Audit

Audit storage overlaps with replay but emphasizes interpretation:

- Clear status: `succeeded`, `failed`, `partial`, `fallback_only`, or `schema_invalid`.
- Whether final content came from model output, deterministic fallback, or hydration mix.
- Whether PDF mentions were included in the prompt or only in fallback hydration.
- Schema validation errors with exact paths.
- Any provider failure sequence when fallback path was used.
- Public-safety flag confirming non-clinical exploratory framing.
- Redaction list if inputs or exported artifacts were sanitized.
- Comparison notes and human judge tags as append-only records, not edits to raw reports.
- Manifest hash and comparison row hash so later edits are detectable.

## Minimal Implementation Path In This Repo

### Phase 1: Capture One Run

1. Add `.bioviz-runs/` to `.gitignore`.
2. Add `src/lib/capture.ts` with:
   - `sha256(content: string | Buffer)`.
   - `canonicalJson(value: unknown)`.
   - `canonicalJsonSha256(value: unknown)`.
   - `slugifyModelName(model: string)`.
   - `createRunPaths(runId: string)`.
   - `writeJsonAtomic(path, value)`.
   - `appendJsonl(path, row)`.
3. Refactor `server.ts` just enough to preserve:
   - rendered prompt text,
   - raw provider response text,
   - parsed provider JSON,
   - fallback report before hydration,
   - final report after hydration,
   - provider status and errors.
4. After `parsed.provenance` is assigned, call `captureRun({ ... })`.
5. Return the existing `BioVizReport` unchanged so the UI does not need to change in the first capture phase.

### Phase 2: Operator Model Selection

1. Extend the form request with `provider` and `model`.
2. Replace fixed fallback order with explicit model selection for comparison runs.
3. Keep a separate `auto` mode for the current OpenAI -> Gemini -> Ollama -> fallback behavior.
4. Store `attemptOrder` and `fallbackUsed` in the run manifest.

### Phase 3: Comparison Batch

1. Add `POST /api/compare` accepting one input set plus a list of provider/model configs.
2. Execute runs sequentially first; parallelism can come later.
3. Write a `comparison-manifest.json` before execution starts.
4. Append one `runs.jsonl` row as each run completes.
5. Derive `comparison-table.jsonl` from run manifests and final reports.
6. Add a minimal UI view that lists comparison rows and links each run report.

### Phase 4: Optional SQLite Migration

Move to SQLite only when the operator needs filtering across many comparisons. Keep JSON artifacts as source of truth and index them into SQLite tables:

- `runs`
- `inputs`
- `models`
- `artifacts`
- `comparison_rows`
- `judgements`

SQLite JSON functions can help query JSON manifests later, but they are not needed for v1.

## Implementation Contract

### Capture Function Shape

```typescript
export interface CaptureRunInput {
  rawSeq: string;
  normalizedSequence: string;
  question: string;
  organism: string;
  fastaHeader: string | null;
  file?: {
    originalName: string;
    mimetype: string;
    buffer: Buffer;
    extractedText?: string;
  };
  model: {
    provider: "openai" | "gemini" | "ollama" | "fallback";
    model: string;
    parameters: Record<string, unknown>;
    digest?: string | null;
    latencyMs?: number | null;
  };
  prompt: string;
  localScan: unknown;
  proteinResolution: unknown;
  paperMentions: unknown[];
  fallbackReport: unknown;
  rawModelResponse?: string | null;
  parsedModelJson?: unknown | null;
  finalReport: unknown;
  provenance: {
    rootHash: string;
    artifactCount: number;
    artifacts: unknown[];
  };
  status: "succeeded" | "failed" | "partial" | "fallback_only" | "schema_invalid";
  errors: Array<{ stage: string; message: string; stack?: string }>;
}
```

### Canonical JSON Utility

Implement deterministic JSON by recursively sorting object keys and preserving array order:

```typescript
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, canonicalize(nested)])
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}
```

This is sufficient for BioViz v1 because current report values are strings, numbers, booleans, nulls, arrays, and objects. If exact RFC 8785 behavior is later required for cross-language verification, replace this helper with a compliant canonicalization package.

## Design Decisions

| Decision | Recommendation | Why |
|----------|----------------|-----|
| Persistence backend | File-first JSON/JSONL | Matches current repo, low complexity, audit-friendly. |
| Run identity | Timestamp + input hash + model slug | Human-readable and collision-resistant enough with full hashes in manifest. |
| Source of truth | Per-run manifest and artifacts | Comparison tables are derived views and can be regenerated. |
| Hashing | SHA-256 raw bytes and canonical JSON | Already used in `src/lib/analysis.ts`; adequate for local artifact identity. |
| Model comparison | Same `canonicalInputHash`, explicit model params | Prevents comparing outputs from subtly different tasks. |
| Dirty repo handling | Store dirty flag and diff hash | Avoids false replay confidence when code changed locally. |
| PDF capture | Store raw PDF and extracted text | Raw PDF supports re-extraction; text supports audit of local mention finding. |
| Prompt capture | Store exact rendered prompt | Required because prompt construction order materially affects output. |
| Database | Defer | SQLite is useful later, but a premature DB adds schema migration work before capture semantics are proven. |

## Pitfalls To Avoid

### Comparing Different Inputs As If They Were The Same

Use `canonicalInputHash` as the gate for comparison rows. If normalized sequence, exact question, organism, or PDF raw hash differs, it is a different input set.

### Losing Invalid Model Responses

Do not discard outputs that fail `BioVizReportSchema`. Store raw response, parse error, and schema errors. Invalid structured output is a first-class comparison outcome.

### Treating Hydrated Reports As Pure Model Output

The current server merges model output with deterministic fallback fields. Store `parsedModelJson`, `fallback.report.json`, and final `report.json` separately so later reviewers can see what came from the model versus local deterministic logic.

### Hashing Pretty-Printed JSON

Pretty formatting changes incidental bytes. Hash canonical JSON for identity and optionally store pretty JSON for readability.

### Storing Secrets In Environment Snapshots

Store boolean flags like `openaiConfigured`, never key names plus values. Do not copy `.env.local`.

### Assuming Ollama Tags Are Immutable

Capture model digest where possible. A local tag such as `gemma3:4b` can point to different content on different machines or dates.

## Roadmap Implications

Suggested phase order:

1. **Run Capture Foundation** - Add manifest writer and artifact layout without changing UI behavior.
2. **Explicit Model Selection** - Add operator provider/model choice and capture selected model metadata.
3. **Comparison Batch Runner** - Run one input set across multiple models and derive comparison rows.
4. **Comparison Review UI** - Render side-by-side reports, schema validity, region deltas, and paper mention deltas.
5. **Governed Evaluation Layer** - Add `gsigmad` experiment framing and optional human judgement records.

The capture foundation must come first because model selection without durable artifacts would preserve the current anecdotal comparison problem.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Manifest fields | HIGH | Derived from current `server.ts`, `schema.ts`, and existing provenance graph. |
| Storage layout | HIGH | File-first layout fits current no-database architecture. |
| Comparison table | MEDIUM | Good v1 deterministic fields; scoring/judgement fields need `gsigmad` design. |
| Hash plan | HIGH | SHA-256 already exists locally; canonical JSON approach is standard for stable identity. |
| Replay completeness | MEDIUM | Hosted provider replay can never be perfect without provider-side determinism guarantees. |

## Sources

- Local repo context: `active/bioviz-atlas/.planning/PROJECT.md`, `.planning/PROJECT_BRIEF_MODEL_COMPARISON.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md`, `server.ts`, `src/lib/analysis.ts`, `src/lib/schema.ts`.
- W3C PROV-O Recommendation, provenance concepts for Entity/Activity/Agent modeling: https://www.w3.org/TR/prov-o/
- RFC 8785, JSON Canonicalization Scheme, reference model for stable JSON identity: https://www.rfc-editor.org/rfc/rfc8785
- SQLite JSON functions documentation, useful only for later optional indexing/migration: https://www.sqlite.org/json1.html
