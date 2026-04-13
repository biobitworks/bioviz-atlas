# State: BioViz Atlas

**Updated:** 2026-04-13  
**Project Root:** `/Users/byron/projects/active/bioviz-atlas`  
**Current Branch:** `main`  
**Bootstrap Commit Base:** `9f8b21cc6b9fcd11530a21f6366aa81e36e5ba58`

## Current Position

BioViz Atlas is now set up as the active project root for the model-comparison experiment track. Brownfield codebase mapping, research synthesis, v1 requirements, and a phased roadmap are in place under `.planning/`.

The immediate next milestone is to convert the repo from a demo app with ad hoc model switching into a governed comparison harness:

1. capture replayable run artifacts behind the existing analysis flow
2. expose explicit provider and Ollama model selection
3. initialize `gsigmad` governance and register the first exploratory comparison study

## Completed Bootstrap Artifacts

- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/STACK.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/research/STACK.md`
- `.planning/research/METHODOLOGY.md`
- `.planning/research/DATA_CAPTURE.md`
- `.planning/research/UI_PATTERNS.md`
- `.planning/research/SUMMARY.md`
- `.planning/PROJECT.md`
- `.planning/PROJECT_BRIEF_MODEL_COMPARISON.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

## Governance Notes

- Scope remains public-safe, exploratory, and non-clinical.
- No proprietary Cellico-Bio theory names, unpublished mechanisms, internal scoring logic, or private sequences should enter prompts, artifacts, or demo datasets.
- Deterministic preprocessing, model output, and hydrated final report must remain separate artifact layers for valid comparison.

## Next Commands

From `/Users/byron/projects/active/bioviz-atlas`:

```bash
gsigmad init -y .
gsigmad register -t exploratory --title "BioViz Atlas public-safe model comparison baseline" --hypothesis "For frozen public-safe BioViz Atlas tasks, different language models will show measurable differences in structured biological interpretation quality, failure mode profile, and provenance completeness under the same preprocessing, prompt, and schema."
```

After registration, the next planning step is:

```bash
$gsd-plan-phase 1
```
