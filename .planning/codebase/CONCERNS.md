# Concerns

## Highest-Risk Areas

### 1. Model comparison is not yet a first-class workflow

- The current runtime chooses among OpenAI, Gemini, and Ollama inside `server.ts`.
- Provider selection is implicit and environment-driven rather than operator-driven.
- `OLLAMA_MODEL` is read from process env in `server.ts`, but there is no UI control, run registry, or structured comparison harness.
- This means the app can produce different outputs without a durable record of which model was used for a specific analysis.

Relevant files:
- `server.ts`
- `.env.example`

### 2. Experiment validity is not encoded in the app

- The app returns structured outputs and provenance hashes, but it does not yet support controlled repeated runs, cross-model parity checks, or a governed experiment log.
- There is no run table, experiment manifest, or evaluation artifact schema in the repo today.
- This is the biggest gap between "demoable app" and "valid comparison platform."

Relevant files:
- `server.ts`
- `src/lib/schema.ts`
- `src/lib/analysis.ts`

### 3. Browser verification and demo generation remain fragile

- Demo artifacts exist in `output/`, but those files are generated rather than integrated into the runtime.
- `playwright-cli.json` exists, but automated browser replay is not currently part of the application or CI flow.
- This creates a gap between backend correctness and repeatable front-end proof.

Relevant files:
- `playwright-cli.json`
- `output/presentation/`
- `output/playwright/glp1-demo/`

### 4. Canonical resolution is partly deterministic and partly heuristic

- `src/lib/protein-resolver.ts` now contains a public-safe seeded fallback for specific demo inputs like GLP-1.
- That improves reliability, but it also means canonical identity behavior depends on a mix of header parsing, known-sequence matching, and live UniProt resolution.
- For future experiments, this needs explicit documentation so model comparisons do not conflate resolver effects with model effects.

Relevant files:
- `src/lib/protein-resolver.ts`
- `src/lib/analysis.ts`

### 5. Documentation drift

- `README.md` still describes the app as an AI Studio / Gemini app and does not reflect the new OpenAI-first fast path, Ollama fallback, or local PDF extraction behavior.
- This increases onboarding confusion and makes experimental interpretation less trustworthy.

Relevant files:
- `README.md`
- `server.ts`

## Technical Debt

### Monolithic server orchestration

- `server.ts` now owns:
  - provider selection
  - PDF extraction
  - local heuristics
  - prompt construction
  - report hydration
  - provenance finalization
- This is manageable for the hackathon prototype, but it will become a maintenance problem once model comparison, experiment storage, and evaluation metrics are added.

### Weak persistence layer

- There is no persistent storage for analysis runs.
- The app responds with JSON but does not store:
  - input hashes
  - selected model
  - output variants
  - comparison scores
  - reviewer annotations

This is the main blocker for governed comparison work.

### Validation only at report boundary

- `BioVizReportSchema` validates the report payload, but there is no intermediate validation for:
  - model-selection requests
  - experiment-run metadata
  - repeated-run grouping
  - comparison result schemas

Relevant files:
- `src/lib/schema.ts`
- `server.ts`

## Reliability Concerns

### External runtime dependencies

- `pdftotext` is assumed to be available.
- OpenAI, Gemini, and Ollama availability differ by environment.
- The code handles fallback at runtime, but the exact path used on any given run is not clearly surfaced to the operator in the UI.

### Hidden variability

- Different models can vary due to provider defaults, temperature, or structured output behavior.
- The current code sets a temperature for Ollama but not an equivalent normalized runtime contract across providers.
- That makes fair comparison harder until a comparison harness defines the rules explicitly.

### Live-network dependence in identity resolution

- UniProt requests improve report quality, but network behavior can affect canonical enrichment.
- Model comparisons should separate:
  - deterministic local preprocessing
  - external enrichment
  - model synthesis

Otherwise differences may be misattributed.

## Security / Safety Concerns

- No obvious secrets are hard-coded in source files reviewed here.
- `.env*` is ignored, which is correct.
- However, generated outputs in `output/` may contain sensitive run artifacts if future experiments use private content.
- Keeping `output/` out of git is the right default and should remain in place.

## Experiment-Readiness Gaps

To support valid compare-and-contrast analysis across Ollama models, the repo still needs:

1. explicit model selector input in the UI and API
2. a run manifest or experiment record per analysis
3. repeated-run support
4. comparison storage and retrieval
5. stable scoring criteria
6. `gsigmad` project initialization and experiment registration
7. a documented separation between exploratory product output and governed experiment output

## Suggested Near-Term Priorities

1. Add model/provider selection to the analysis form in `src/App.tsx`.
2. Add structured run metadata and persistence in the server path.
3. Introduce a comparison endpoint or experiment route rather than overloading the current one-shot `/api/analyze`.
4. Initialize `gsigmad` in the repo and register the first comparison experiment.
5. Update `README.md` so the current architecture matches reality.
