# Requirements: BioViz Atlas

**Defined:** 2026-04-13
**Core Value:** Make model behavior in biological interpretation legible, comparable, and provenance-backed instead of opaque and anecdotal

## v1 Requirements

### Model Selection

- [ ] **MODEL-01**: Operator can choose the active provider for an analysis run
- [ ] **MODEL-02**: Operator can choose among locally available Ollama models without manually typing model names
- [ ] **MODEL-03**: UI shows the exact provider and model used for each completed run
- [ ] **MODEL-04**: Analysis request records the effective model settings used for the run

### Experiment Execution

- [ ] **EXEC-01**: Operator can create a comparison run set from one FASTA input, one question, and an optional PDF
- [ ] **EXEC-02**: Operator can select multiple models for a comparison run set
- [ ] **EXEC-03**: System can execute repeated runs for the same task under a controlled configuration
- [ ] **EXEC-04**: Deterministic preprocessing is frozen and reused consistently across compared runs
- [ ] **EXEC-05**: The system distinguishes single-run analysis from governed comparison execution

### Run Capture

- [ ] **DATA-01**: Every run stores input hashes for sequence, question, and optional paper
- [ ] **DATA-02**: Every run stores raw model output and validated structured output
- [ ] **DATA-03**: Every run stores canonical identity, regions, paper mentions, and provenance metadata
- [ ] **DATA-04**: Every run stores provider, model, runtime options, and completion status
- [ ] **DATA-05**: Run artifacts are persisted in a replayable local format suitable for audit
- [ ] **DATA-06**: Comparison-level records can group runs by task and model set

### Comparison Analysis

- [ ] **COMP-01**: UI can display multiple model runs for the same task in one comparison view
- [ ] **COMP-02**: UI highlights key differences in summary, identity, regions, paper mentions, and next steps
- [ ] **COMP-03**: UI exposes provenance and run metadata for each compared run
- [ ] **COMP-04**: UI provides a run history or comparison history surface for previously executed runs
- [ ] **COMP-05**: System supports deterministic comparison metrics and rubric-ready fields for human review

### Governance

- [ ] **GOV-01**: BioViz Atlas is initialized as a `gsigmad`-governed project
- [ ] **GOV-02**: The first model-comparison study is registered as an experiment
- [ ] **GOV-03**: Comparison methodology explicitly separates deterministic preprocessing from model-generated interpretation
- [ ] **GOV-04**: Experimental outputs are labeled exploratory and non-clinical
- [ ] **GOV-05**: The workflow supports parity-style comparison checks across selected models

## v2 Requirements

### Collaboration and Review

- **REV-01**: Operator can attach review notes and adjudication scores to comparison runs
- **REV-02**: System can support blinded pairwise comparison review workflows
- **REV-03**: Comparison runs can be exported as shareable evaluation bundles

### Advanced Experimentation

- **EXP-01**: System supports benchmark task sets with versioned task cards
- **EXP-02**: System supports richer aggregate metrics, confidence intervals, and variance summaries
- **EXP-03**: System supports bounded concurrency and queueing for larger comparison matrices

## Out of Scope

| Feature | Reason |
|---------|--------|
| Clinical recommendation engine | Must remain exploratory and non-clinical |
| Private Cellico or unpublished internal framework exposure | Public-safe boundary must be maintained |
| Full user authentication and team collaboration stack | Not required for the current local experiment harness |
| Hosted production-scale experiment infrastructure | Local-first comparison is the current target |
| General-purpose laboratory information management features | Too broad relative to the core model-comparison value |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| MODEL-01 | Phase 2 | Pending |
| MODEL-02 | Phase 2 | Pending |
| MODEL-03 | Phase 2 | Pending |
| MODEL-04 | Phase 2 | Pending |
| GOV-01 | Phase 3 | Pending |
| GOV-02 | Phase 3 | Pending |
| GOV-03 | Phase 3 | Pending |
| GOV-04 | Phase 3 | Pending |
| GOV-05 | Phase 3 | Pending |
| EXEC-01 | Phase 4 | Pending |
| EXEC-02 | Phase 4 | Pending |
| EXEC-03 | Phase 4 | Pending |
| EXEC-04 | Phase 4 | Pending |
| EXEC-05 | Phase 4 | Pending |
| DATA-06 | Phase 4 | Pending |
| COMP-01 | Phase 5 | Pending |
| COMP-02 | Phase 5 | Pending |
| COMP-03 | Phase 5 | Pending |
| COMP-04 | Phase 5 | Pending |
| COMP-05 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-13*
*Last updated: 2026-04-13 after brownfield research synthesis for model comparison and experiment governance*
