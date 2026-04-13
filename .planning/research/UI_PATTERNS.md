# UI Patterns for Model Comparison

## Current UI Baseline

BioViz Atlas currently supports a single-run interpretation flow:

1. enter sequence, question, organism, and optional PDF
2. submit one analysis request
3. inspect one structured report

The existing UI in `src/App.tsx` already provides a strong base:

- clear left-column input panel
- strong loading state
- readable result summary
- provenance visibility
- region-level visual emphasis

This should be evolved rather than replaced.

## Recommended Comparison Workflow

### 1. Keep the current single-run form as the top-level control surface

Do not replace the current form with a complex experiment dashboard immediately.

Instead:

- add **provider** and **model** selectors to the existing left column
- add a **comparison mode** toggle:
  - single run
  - compare selected models

This preserves the current learning curve while opening the comparison path.

### 2. Introduce a comparison tray rather than a new page first

For the next phase, the lowest-risk UI pattern is:

- keep the current report page layout
- add a comparison tray or segmented header above the results
- allow switching between:
  - individual run view
  - side-by-side comparison view
  - summary deltas view

This avoids a full IA rewrite while enabling comparison behavior.

## Recommended UI States

### Single Run

Use the existing layout:

- left: controls
- right: one report

### Multi-Run Compare

Add a run-set context above the report:

- comparison name / run set id
- models included
- input hash / sequence label
- run timestamps

Then use a two-tier result surface:

1. **Comparison summary row**
   - model names
   - status
   - provenance counts
   - quick score badges

2. **Detail switcher**
   - Summary
   - Canonical identity
   - Regions
   - Paper mentions
   - Next steps
   - Raw JSON

## Best Layout for This Codebase

### Preferred first implementation

For `src/App.tsx`, the safest next layout is:

- left column remains fixed-width input/control surface
- right column becomes tabbed or segmented:
  - `Report`
  - `Compare`
  - `History`

Within `Compare`, render:

- a compact top table of runs
- two or more vertically stacked comparison cards
- optional side-by-side subpanels for selected fields

This fits the current component structure better than trying to build a full grid-first analytics app immediately.

### Side-by-side comparison should be selective

Do not render every field side by side by default.

Best pattern:

- side-by-side for short structured fields:
  - title
  - canonical identity
  - model metadata
  - provenance
- stacked sections for longer fields:
  - summary text
  - regions
  - next steps
  - paper mentions

## Model Selection Patterns

### Provider first, then model

Recommended controls:

1. **Provider**
   - Ollama
   - OpenAI
   - Gemini

2. **Model**
   - dependent on provider

3. **Run mode**
   - single
   - compare selected

4. **Comparison set**
   - multi-select only when compare mode is active

For Ollama specifically:

- show locally available models
- show whether a model is currently reachable
- do not make the user type model names manually if they can be discovered

## Run History Pattern

Add a lightweight run history panel before adding a full experiment dashboard.

Recommended contents:

- run id
- model name
- provider
- timestamp
- input label or hash
- success / fallback status

This can live in the right-column `History` tab or as a collapsible panel under the input form.

## Comparison Cues That Matter

The UI should make these differences immediately obvious:

- different canonical identity outcomes
- different region counts and confidence patterns
- different paper mention counts
- different next-step recommendations
- different fallback/provider paths

Recommended cues:

- badge rows
- compact diff lists
- per-model cards with consistent field order
- field-level highlighting only where values differ

## Provenance Display

The current provenance panel is good and should remain.

For comparison mode, extend it with:

- run id
- provider
- model
- input hash
- root hash
- artifact count

This should be visible without scrolling deep into the page.

## Interaction Rules

### What should stay simple

- sequence input
- paper upload
- biological question
- basic report reading

### What should become interactive

- model choice
- repeated-run set creation
- run selection
- field-by-field comparison
- run history filtering

## Suggested Build Order

1. Add provider/model selectors to the existing form.
2. Add a small model metadata banner above the report.
3. Add run history capture and a simple history list.
4. Add compare mode for two selected runs first.
5. Expand to N-model comparison once the data model stabilizes.

## Specific Recommendations for This Repo

- Keep the current `src/App.tsx` shell and split it into smaller components rather than rewriting it.
- Introduce explicit front-end types for:
  - run metadata
  - comparison run set
  - diff summary
- Add a compare-focused response type rather than overloading `BioVizReport` indefinitely.
- Preserve the current BioViz Atlas visual tone: clean, high-contrast, provenance-forward, not dashboard-noisy.

## Avoid

- Full spreadsheet-style comparison as the first implementation
- Hidden model metadata
- Deep nested accordions for all report fields
- Replacing the current single-run UX before comparison storage exists
- Making experiment controls so complex that the original demo flow becomes slower
