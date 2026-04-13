# Project Research Summary

**Project:** BioViz Atlas  
**Domain:** Local biological interpretation and model-comparison tool  
**Researched:** 2026-04-13  
**Confidence:** HIGH for brownfield stack and capture design; MEDIUM-HIGH for evaluation methodology until `gsigmad` routing is implemented.

## Executive Summary

BioViz Atlas is a local operator tool for running biological sequence and paper-grounded interpretation through structured model outputs, then comparing model behavior across repeated, public-safe tasks. Experts build this kind of system as an evaluation harness first and a comparison UI second: freeze the task input, prompt, schema, preprocessing output, model settings, raw response, parsed response, final hydrated report, and provenance hashes before drawing conclusions from model differences.

The recommended approach is to keep the existing Vite + React + Express + TypeScript app and evolve it incrementally. Add a narrow server-side model provider interface, direct Ollama REST integration, explicit provider/model selection, and file-first run capture under `.bioviz-runs/`. Every run should produce immutable artifacts and JSONL indexes; comparison tables and UI summaries should be derived views, not the source of truth. SQLite can be added later as an index once artifact semantics are stable.

The main risks are anecdotal comparisons, hidden deterministic hydration, prompt drift, lost invalid responses, and public-safety failures. Mitigate them by comparing paired task cards only, hashing exact inputs/prompts/schemas/settings, storing raw invalid outputs, separating pre-hydration model output from final app reports, defaulting to low-temperature repeated runs, and adding `gsigmad` governance before making stronger model-selection claims.

## Key Findings

### Recommended Stack

Keep the brownfield stack and avoid framework churn. The app already has the right shape for local comparison: React for the operator surface, Express for model/provider orchestration, TypeScript for shared contracts, and Zod for runtime report validation. Add model comparison as a server-owned experiment harness rather than introducing LangChain, external queues, provider gateways, remote databases, or a new frontend framework.

**Core technologies:**
- Vite + React: current UI shell and dev workflow; extend with model selectors, compare tabs, and run history.
- Express + TypeScript: local API layer; keep provider orchestration and persistence server-side.
- Zod / `BioVizReportSchema`: canonical runtime validator for normalized model outputs.
- Direct Ollama REST API: use `/api/tags`, `/api/show`, and `/api/generate` with `stream: false` and structured JSON format.
- File-first JSON/JSONL artifacts: v1 source of truth for replay, audit, and comparison; optional SQLite later for indexing.
- `gsigmad`: required governance layer for credible experiment claims, but BioViz Atlas is not yet routed as a `gsigmad` project.

### Comparison Methodology

Model comparison should be paired, governed, and task-level. Each task card must freeze the same FASTA input, optional public paper text, question, deterministic preprocessing snapshot, prompt version, schema version, generation settings, and scoring rubric across all models. The statistical unit is the task, not an isolated generation.

**Must have for credible comparison:**
- Frozen public-safe task cards with stable IDs, versions, and hashes.
- Same normalized context and prompt/schema for every model in the headline benchmark.
- Separate storage for deterministic preprocessing, raw model output, parsed model JSON, fallback report, and final hydrated report.
- Deterministic metrics for schema validity, hallucinated identifier rate, evidence-reference validity, safety, latency, token/eval counts, and run variance.
- Blinded rubric-driven review for biological plausibility, evidence use, interpretive usefulness, specificity, uncertainty calibration, and clarity.

**Defer until harness validity is proven:**
- Published model rankings.
- Confirmatory statistical claims.
- Provider-optimized prompt tracks.
- LLM-as-judge as a primary evaluation signal.

### Data Capture Approach

Use `.bioviz-runs/` as a gitignored runtime artifact root. Each run should write a self-contained folder with `manifest.json`, `prompt.txt`, raw response, parsed JSON, fallback report, final report, provenance graph, validation errors, environment metadata, and hashes. Append small rows to `index.jsonl` and derive comparison tables from manifests.

**Major artifacts:**
1. Run manifest: schema version, run ID, group/comparison IDs, timestamps, status, repo/runtime identity, inputs, model settings, outputs, hashes, and audit flags.
2. Input set: raw FASTA, normalized FASTA, question, organism, optional raw PDF, extracted text, and SHA-256 hashes.
3. Deterministic pipeline snapshot: local scan, protein resolution, paper mentions, provenance artifacts, and root hash.
4. Output bundle: raw model response even when invalid, parsed model JSON, fallback report, final report, validation result, and errors.
5. Comparison rows: derived JSONL/CSV containing model, status, schema validity, fallback use, latency, region counts, paper mention counts, accession/symbol, report hash, and replay readiness.

### UI Patterns

Preserve the current single-run experience and evolve it. The safest UI path is to keep the left-column form and turn the right-column result area into a segmented surface for `Report`, `Compare`, and `History`. Add provider/model controls to the existing form before introducing a full experiment dashboard.

**UI capabilities to build:**
- Provider-first model selection with discovered Ollama models.
- Single-run mode and compare-selected-models mode.
- Model metadata banner on each report.
- Lightweight run history with run ID, provider, model, timestamp, input hash, and status.
- Comparison summary rows with status, provenance counts, schema validity, fallback use, and quick deltas.
- Selective side-by-side comparison for short fields; stacked sections for longer summaries, regions, next steps, and paper mentions.

### Critical Pitfalls

1. **Anecdotal comparison** - avoid by freezing paired task cards and comparing every model on the same input, prompt, schema, context, and settings.
2. **Crediting models for deterministic hydration** - avoid by storing and scoring pre-hydration model JSON separately from fallback and final app reports.
3. **Prompt or context drift** - avoid by hashing exact rendered prompts, schemas, preprocessing outputs, and canonical inputs for every run.
4. **Discarding invalid outputs** - avoid by storing raw responses, parse errors, schema failures, and fallback status as first-class outcomes.
5. **Premature dashboard/database work** - avoid by implementing artifact capture and run history before N-model comparison UI or SQLite indexing.
6. **Ungoverned claims** - avoid by adding `gsigmad` routing, preregistration, red-team, audit, FAIR export, and public-safety gates before strong model-selection claims.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Run Capture Foundation
**Rationale:** Durable artifacts are the prerequisite for credible comparison; model selection without capture preserves the current anecdotal problem.  
**Delivers:** `.bioviz-runs/` layout, `.gitignore` entry, capture utilities, canonical JSON hashing, manifest writer, JSONL index, and unchanged existing UI behavior.  
**Uses:** Existing Express route, Zod schema, current provenance graph, SHA-256 hashing, file system persistence.  
**Avoids:** Lost invalid outputs, hidden fallback behavior, missing replay metadata.

### Phase 2: Provider Abstraction and Model Discovery
**Rationale:** Comparison needs explicit model identity and identical execution contracts before batch runs.  
**Delivers:** Server-side `ModelProvider` interface, direct Ollama adapter, `GET /api/models`, optional enrichment with Ollama model digest/details, and explicit provider/model/options fields on single-run analysis.  
**Uses:** Direct Ollama REST API, current OpenAI/Gemini paths preserved behind the future adapter boundary.  
**Avoids:** Frontend-to-Ollama coupling, hidden fallback inside comparison runs, mutable model tags without digest capture.

### Phase 3: Single-Run Model Selection and History
**Rationale:** Operators need to verify selected model behavior and captured metadata before N-model batches.  
**Delivers:** Provider/model selectors in the existing form, model metadata banner, captured selected-model runs, run history list, and compatibility with current auto/fallback mode.  
**Addresses:** Usable transition from current single-run report to comparison-ready runs.  
**Avoids:** Replacing the demo flow too early.

### Phase 4: Comparison Batch Runner
**Rationale:** Once capture and explicit model selection are stable, run one exact input set across multiple models and repeats.  
**Delivers:** `POST /api/compare` or `POST /api/experiments`, comparison manifest, sequential execution, per-run artifact folders, `runs.jsonl`, derived comparison table, and deterministic summary deltas.  
**Uses:** Paired task methodology, fixed generation settings, canonical input hash gates.  
**Avoids:** Parallel local inference distortion, comparing subtly different inputs, silent fallback substitution.

### Phase 5: Comparison Review UI
**Rationale:** UI should visualize stored comparison rows after the source-of-truth artifacts exist.  
**Delivers:** `Compare` tab, compact run table, selected run detail, side-by-side short fields, stacked long fields, provenance comparison, schema/fallback/status badges, and field-level delta cues.  
**Addresses:** Operator review of identity, regions, paper mentions, next steps, provenance, and raw JSON.  
**Avoids:** Spreadsheet-style overload and hidden model metadata.

### Phase 6: Governed Evaluation Layer
**Rationale:** Stronger claims require experiment governance, public-safety gates, scoring plans, and review artifacts.  
**Delivers:** `gsigmad` routing or adapter, exploratory experiment registration, 5-8 public-safe task cards for harness validity, deterministic score tables, small blinded review, red-team/audit/FAIR gates, and export bundle.  
**Uses:** Methodology task manifest, run manifests, score tables, public-safety rules.  
**Avoids:** Ungoverned rankings, private data leakage, clinical overreach, judge bias.

### Phase 7: Pilot and Optional Indexing
**Rationale:** After harness validity, scale to 15-25 tasks and decide whether history/filtering needs SQLite.  
**Delivers:** Repeated runs across local and hosted models, robustness sampling, paired descriptive statistics, failure taxonomy, optional SQLite index derived from JSON artifacts.  
**Uses:** JSON artifacts as immutable source of truth; SQLite only as a query layer.  
**Avoids:** Premature database migration and overclaiming from small samples.

### Phase Ordering Rationale

- Capture precedes comparison because all later UI and scoring depends on immutable, replayable run records.
- Provider abstraction precedes batch execution because fair comparison requires explicit model identity, settings, and raw output boundaries.
- UI comparison follows artifact generation because the UI should present derived views, not define the experiment record.
- `gsigmad` governance follows basic harness proof but precedes any strong external claim.
- SQLite, if needed, should index artifacts after run volume and query needs are real.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Confirm exact Ollama metadata fields available across installed versions and how model digests should be captured.
- **Phase 4:** Decide endpoint naming and batch cancellation/error behavior for sequential local inference.
- **Phase 6:** Research `gsigmad` native init versus runtime adapter and define exact preregistration/gate artifacts.
- **Phase 7:** Define statistical power, primary endpoint, reviewer rubric, and whether SQLite indexing is justified.

Phases with standard patterns that likely do not need separate research:
- **Phase 1:** File-first artifact capture, SHA-256 hashing, atomic JSON writes, and JSONL append indexes are well-scoped.
- **Phase 3:** Form selectors, model metadata banner, and run history are standard React patterns.
- **Phase 5:** Tabs, summary tables, badges, and selective side-by-side comparison are conventional UI patterns for this codebase.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Current Vite/React/Express/TypeScript/Zod stack already supports the proposed server-owned harness. Ollama REST endpoints are documented and match current code direction. |
| Methodology | MEDIUM-HIGH | Paired task design, deterministic metrics, blinded review, and repeated-run rules are strong; exact statistical strength depends on task count and rubric calibration. |
| Data Capture | HIGH | Manifest fields and artifact layout map directly to current server behavior, schema, provenance graph, and comparison needs. |
| UI Patterns | HIGH | Recommendations extend the existing `src/App.tsx` flow rather than replacing it; low-risk incremental build path. |
| Governance | MEDIUM | `gsigmad 1.1.0` is installed locally, but BioViz Atlas is not yet configured as a governed project. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- `gsigmad` routing is unresolved: choose native `gsigmad init` or a runtime adapter before registering comparison experiments.
- Database choice has a staged decision: use file-first artifacts for v1; revisit SQLite only when filtering and many-run history become real requirements.
- Prompt extraction is not yet formalized: current prompt construction should be factored so exact templates and rendered prompts can be hashed and persisted.
- Deterministic versus model-generated scoring needs implementation discipline: report and UI types should keep parsed model JSON, fallback, and final hydrated reports separate.
- Human review protocol is not yet operational: define reviewer count, rubric fields, anonymization, disagreement handling, and whether any LLM judge is secondary-only.
- Public-safe task set is not yet created: use public sequences and papers only; avoid proprietary, unpublished, private, or clinical/patient-like inputs.

## Sources

### Primary
- `STACK.md` - brownfield stack, provider abstraction, Ollama REST integration, persistence tradeoffs.
- `METHODOLOGY.md` - paired task design, metrics, repeated runs, prompt stability, statistical reporting, `gsigmad` workflow.
- `DATA_CAPTURE.md` - run manifest schema, artifact layout, hashing, replay/audit requirements, comparison table schema.
- `UI_PATTERNS.md` - model selection, run history, compare tray, right-column tabs, selective side-by-side comparison.

### External References Cited By Research
- Ollama API docs - model discovery, metadata, generation, non-streaming structured outputs.
- OpenAI evaluation and structured-output guidance - task-specific evaluation, pairwise/pass-fail review, structured contracts.
- OpenAI seed/reproducibility cookbook - seed and backend fingerprint caveats.
- W3C PROV-O - provenance vocabulary for entities, activities, and agents.
- RFC 8785 JSON Canonicalization Scheme - reference model for stable JSON identity.
- SQLite WAL and JSON documentation - optional future persistence/indexing reference.

---
*Research completed: 2026-04-13*  
*Ready for roadmap: yes*
