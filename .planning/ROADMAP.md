# Roadmap: BioViz Atlas

## Overview

BioViz Atlas v1 turns the existing single-run biological interpretation app into a local-first, governed model-comparison harness. The work starts by capturing replayable run artifacts around the current flow, then exposes operator-selectable Ollama models, adds `gsigmad` governance, executes controlled comparison batches, and finishes with comparison review surfaces and deterministic metrics that make model behavior legible without making clinical or proprietary claims.

## Scope Notes

- Keep the existing Vite + React + Express + TypeScript stack.
- Keep `.bioviz-runs/` as the first runtime artifact store; defer SQLite until filtering volume requires it.
- Keep the existing `/api/analyze` flow usable while comparison capability is added beside it.
- Keep all experiment inputs public-safe, exploratory, and non-clinical.
- Treat deterministic preprocessing, model output, final hydrated report, and comparison metrics as separate artifact layers.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Replayable Run Capture** - Persist one analysis run as an audit-ready artifact bundle without changing the current demo behavior.
- [ ] **Phase 2: Operator Model Selection** - Let the operator choose provider and locally available Ollama model for single-run analysis.
- [ ] **Phase 3: gsigmad Governance Foundation** - Initialize governed experiment routing and register the first exploratory comparison study.
- [ ] **Phase 4: Controlled Comparison Execution** - Run one frozen input set across selected models and repeats under a controlled configuration.
- [ ] **Phase 5: Comparison Review UI** - Present comparison runs, metadata, deltas, provenance, and history in the app.
- [ ] **Phase 6: Metrics and Replay Review** - Add deterministic comparison rows and rubric-ready fields for governed review.

## Phase Details

### Phase 1: Replayable Run Capture
**Goal**: Operator can run the existing analysis flow and receive the same report while BioViz Atlas writes replayable, public-safe run artifacts behind the scenes.
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05
**Success Criteria** (what must be TRUE):
  1. Operator can complete the existing single-run analysis flow with no visible regression in the returned BioViz report.
  2. Each completed or failed run has a local manifest with input hashes for sequence, question, organism, and optional paper.
  3. Each run stores raw model response, parsed structured output when available, fallback report, final report, validation status, provider/model metadata, and completion status.
  4. Run artifacts are written under a gitignored `.bioviz-runs/` layout with stable JSON/JSONL files that can be inspected outside the app.
  5. The artifact bundle separates deterministic preprocessing outputs from model-generated output and final hydrated app output.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Add capture helpers, stable hashing, artifact paths, atomic JSON writes, and JSONL indexing.
- [ ] 01-02: Refactor server orchestration enough to preserve prompt, raw response, parsed output, fallback output, final output, and errors.
- [ ] 01-03: Capture one-run manifests and validate replay-critical fields without changing the existing UI contract.

### Phase 2: Operator Model Selection
**Goal**: Operator can intentionally choose the provider and Ollama model used for analysis, and every selected setting is visible and recorded.
**Depends on**: Phase 1
**Requirements**: MODEL-01, MODEL-02, MODEL-03, MODEL-04
**Success Criteria** (what must be TRUE):
  1. Operator can choose the active provider for a single analysis run instead of relying only on environment-driven fallback order.
  2. Operator can choose from discovered local Ollama models without manually typing model names.
  3. Completed reports show the exact provider, model, and effective runtime settings used for that run.
  4. Analysis requests and run manifests record provider, model, endpoint class, model digest when available, generation parameters, and fallback behavior.
  5. The previous automatic provider path remains available as an explicit compatibility mode.
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [ ] 02-01: Add server-side model provider descriptors and `GET /api/models` with Ollama discovery.
- [ ] 02-02: Extend `/api/analyze` to accept explicit provider/model/options while preserving auto mode.
- [ ] 02-03: Add provider/model controls and model metadata display to the existing React form and report surface.

### Phase 3: gsigmad Governance Foundation
**Goal**: BioViz Atlas can route model-comparison work through `gsigmad` as a governed exploratory experiment before comparison claims are made.
**Depends on**: Phase 2
**Requirements**: GOV-01, GOV-02, GOV-03, GOV-04, GOV-05
**Success Criteria** (what must be TRUE):
  1. `gsigmad inspect .` resolves BioViz Atlas as a governed project through native initialization or an explicit runtime adapter.
  2. The first model-comparison study is registered as an exploratory experiment with frozen scope, model list, prompt/schema identity, and primary comparison intent.
  3. The methodology records deterministic preprocessing, model-generated interpretation, and final hydrated report as separate comparison layers.
  4. Experiment artifacts and app outputs are labeled exploratory and non-clinical.
  5. Parity checks exist for same input, same prompt/schema, same retry policy, same model settings, and no deterministic-field credit to models.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Initialize or adapt `gsigmad` routing for the active BioViz Atlas repo.
- [ ] 03-02: Register the first exploratory model-comparison experiment and public-safe task boundaries.
- [ ] 03-03: Define governance gates for preprocessing separation, non-clinical labeling, fairness, replay, audit, and export readiness.

### Phase 4: Controlled Comparison Execution
**Goal**: Operator can create a governed comparison run set that executes the same frozen task across multiple selected models and repeats.
**Depends on**: Phase 3
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. Operator can create a comparison run set from one FASTA input, one question, one organism, and an optional PDF.
  2. Operator can select multiple provider/model configurations for the same comparison run set.
  3. The system executes repeated runs under controlled settings and records each repeat as a distinct run artifact.
  4. Deterministic preprocessing is frozen once per input set and reused consistently across compared runs.
  5. Comparison-level records group runs by task, input hash, selected model set, repeat count, prompt/schema hash, and governance experiment id.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Add comparison manifest and run-group records that bind input hash, prompt/schema hash, model set, repeats, and governance id.
- [ ] 04-02: Add a comparison execution endpoint that runs selected models sequentially with fixed preprocessing and settings.
- [ ] 04-03: Record run status, failure classes, retry/fallback behavior, and per-run links into comparison JSONL artifacts.

### Phase 5: Comparison Review UI
**Goal**: Operator can inspect model outputs for the same task in one comparison surface with provenance and history visible.
**Depends on**: Phase 4
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. Operator can view multiple model runs for the same task in one comparison view.
  2. Operator can see highlighted differences across summary, canonical identity, regions, paper mentions, and next steps.
  3. Operator can inspect provenance, provider, model, input hash, root hash, status, and run metadata for each compared run.
  4. Operator can open a run history or comparison history surface for previously executed local runs.
  5. Operator can switch between the existing single-report view and comparison review without losing the original demo workflow.
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [ ] 05-01: Add comparison/history response types and retrieval routes derived from run and comparison manifests.
- [ ] 05-02: Add right-column `Report`, `Compare`, and `History` surfaces around the existing UI shell.
- [ ] 05-03: Add comparison summaries, field-level deltas, run metadata badges, and provenance details for selected runs.

### Phase 6: Metrics and Replay Review
**Goal**: Operator can review deterministic comparison metrics and rubric-ready fields that support governed experiment interpretation.
**Depends on**: Phase 5
**Requirements**: COMP-05
**Success Criteria** (what must be TRUE):
  1. Each comparison has a deterministic comparison table with schema validity, fallback use, latency, summary length, region count, paper mention count, next-step count, identity fields, artifact hashes, and replay readiness.
  2. Operator can distinguish automatic metrics from human review fields and subjective rubric placeholders.
  3. Operator can identify replay blockers such as missing raw output, missing model digest, missing prompt/schema hash, dirty code without diff hash, or unavailable hosted-provider identity.
  4. `gsigmad` review artifacts can reference comparison rows, run manifests, raw outputs, parsed outputs, final reports, and score fields without relying on transient UI state.
  5. The system can regenerate comparison rows from source manifests so derived metrics are auditable rather than hand-edited.
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [ ] 06-01: Derive deterministic comparison rows and replay-readiness summaries from captured run artifacts.
- [ ] 06-02: Add review-ready metric display and `gsigmad` artifact links for audit, red-team, FAIR, and export workflows.

## Requirement Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODEL-01 | Phase 2 | Pending |
| MODEL-02 | Phase 2 | Pending |
| MODEL-03 | Phase 2 | Pending |
| MODEL-04 | Phase 2 | Pending |
| EXEC-01 | Phase 4 | Pending |
| EXEC-02 | Phase 4 | Pending |
| EXEC-03 | Phase 4 | Pending |
| EXEC-04 | Phase 4 | Pending |
| EXEC-05 | Phase 4 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| DATA-06 | Phase 4 | Pending |
| COMP-01 | Phase 5 | Pending |
| COMP-02 | Phase 5 | Pending |
| COMP-03 | Phase 5 | Pending |
| COMP-04 | Phase 5 | Pending |
| COMP-05 | Phase 6 | Pending |
| GOV-01 | Phase 3 | Pending |
| GOV-02 | Phase 3 | Pending |
| GOV-03 | Phase 3 | Pending |
| GOV-04 | Phase 3 | Pending |
| GOV-05 | Phase 3 | Pending |

**Coverage:** 24/24 v1 requirements mapped. No orphaned requirements. No duplicate requirement mappings.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Replayable Run Capture | 0/3 | Not started | - |
| 2. Operator Model Selection | 0/3 | Not started | - |
| 3. gsigmad Governance Foundation | 0/3 | Not started | - |
| 4. Controlled Comparison Execution | 0/3 | Not started | - |
| 5. Comparison Review UI | 0/3 | Not started | - |
| 6. Metrics and Replay Review | 0/2 | Not started | - |

---
*Roadmap created: 2026-04-13*
