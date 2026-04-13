# BioViz Atlas

## What This Is

BioViz Atlas is a local-first biological interpretation app that takes a sequence, an optional paper, and a plain-English question, then returns a structured exploratory report with canonical identity, region-level suggestions, paper mentions, and provenance. The next phase of the project is to turn it into a governed comparison harness so operators can run the same task across multiple Ollama and hosted models, inspect output differences, and retain valid experimental records about those differences.

## Core Value

Make model behavior in biological interpretation legible, comparable, and provenance-backed instead of opaque and anecdotal.

## Requirements

### Validated

- ✓ BioViz Atlas can accept FASTA input, a biological question, and an optional PDF paper through a local web UI — existing
- ✓ BioViz Atlas can return a structured exploratory report with canonical protein identity, suggested regions, paper mentions, and provenance metadata — existing
- ✓ The current runtime can call OpenAI, Gemini, and Ollama-backed paths with deterministic local fallback behavior — existing

### Active

- [ ] The operator can choose which model or provider runs the analysis, especially among local Ollama models
- [ ] The same input set can be run repeatedly across multiple models with durable run metadata
- [ ] The app stores enough information to compare outputs across models instead of only showing one-off results
- [ ] Model comparisons use a governed experimental workflow with `gsigmad`
- [ ] The comparison workflow distinguishes deterministic preprocessing from model-generated interpretation
- [ ] The UI presents comparison outcomes clearly enough for rapid product and research review

### Out of Scope

- Clinical decision support — the app must remain exploratory and non-clinical
- Proprietary Cellico mechanisms, unpublished internal scoring logic, and private-repo content — must not enter the product or experiment corpus
- Full production authentication, multi-user collaboration, or deployment-hardening — not the current priority
- General-purpose biotech knowledge management platform scope — stay focused on model comparison around the existing BioViz Atlas flow

## Context

BioViz Atlas currently lives in a compact TypeScript stack built from Vite, React, Express, and local helper modules under `src/lib/`. The request path starts in `src/App.tsx`, posts to `/api/analyze` in `server.ts`, runs local sequence heuristics in `src/lib/analysis.ts`, resolves public identity in `src/lib/protein-resolver.ts`, validates report structure in `src/lib/schema.ts`, and returns a structured report to the browser.

The app already supports multiple synthesis backends, but provider choice is currently runtime-driven rather than operator-driven. This makes it a good candidate for an experiment harness: the biological interpretation surface already exists, but experiment control, run capture, and comparison logic do not.

The repo is now the canonical active copy at `active/bioviz-atlas`, with a brownfield codebase map under `.planning/codebase/`. Generated demo artifacts remain local and out of git.

## Constraints

- **Tech stack**: Keep the existing Vite + React + Express + TypeScript stack unless there is a strong reason to change it — it already supports the demo flow
- **Experiment validity**: Model comparisons must be structured as governed experiments, not ad hoc screenshots — this is the reason to add `gsigmad`
- **Public-safe language**: All UI, docs, and outputs must remain public-safe and non-clinical — required for hackathon and portfolio use
- **Local-model support**: Ollama model selection is a primary requirement, not a stretch goal — the comparison harness is centered on local models
- **Provenance separation**: Deterministic preprocessing and external enrichment should be separable from model output — needed for fair interpretation of comparison results

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use the active repo at `active/bioviz-atlas` as the canonical project root | The root-level copy was archived; only the active repo should continue | ✓ Good |
| Treat BioViz Atlas as a brownfield project and map the codebase first | Existing code already defines the current product surface and constraints | ✓ Good |
| Use `gsigmad` for the model-comparison workflow | The requested work is experiment-like and needs governed capture, auditability, and structured comparison discipline | — Pending |
| Keep generated demo media out of git | Output artifacts are useful locally but should not dominate source control history | ✓ Good |
| Prefer operator-visible model selection over env-only switching | The experiment requires repeatable, intentional model choice at run time | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-13 after brownfield initialization and model-comparison experiment framing*
