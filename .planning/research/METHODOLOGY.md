# BioViz Atlas Model Comparison Methodology

**Project:** BioViz Atlas
**Researched:** 2026-04-13
**Mode:** comparison methodology
**Overall confidence:** MEDIUM-HIGH

## Executive Recommendation

Treat BioViz Atlas model comparison as a governed, paired, task-level evaluation rather than an anecdotal "which answer looks better" exercise. The comparison unit should be a frozen task card: the same FASTA input, optional paper text, user question, deterministic preprocessing output, prompt version, schema version, and generation settings are run against each model. Every model sees the same normalized context and every result is stored before deterministic post-processing is merged back into the app output.

Use `gsigmad` as the experiment governance layer, not as a cosmetic label. Current local inspection shows `gsigmad 1.1.0` is installed, but BioViz Atlas is not yet a governed project: `gsigmad inspect .` reports no `.gsigmad` directory and no runtime adapter. Therefore the first implementation step is to initialize native gsigmad governance or add a runtime adapter before registering the model-comparison experiment.

The credible comparison design is:

1. Freeze a small public-safe benchmark set of biological interpretation tasks.
2. Freeze preprocessing outputs and prompt/schema versions.
3. Run a paired model matrix with identical inputs and controlled generation settings.
4. Score deterministic properties automatically.
5. Score biological interpretation quality with blinded pairwise review plus a calibrated rubric.
6. Report per-task paired differences, confidence intervals, run variance, failure modes, and public-safety flags.
7. Archive the full manifest, raw outputs, hashes, evaluator versions, and gsigmad gate results.

## Methodological Principles

### 1. Compare Models On Paired Tasks

Each model must run on the same task instances. Do not compare model A on one protein/question set against model B on another. The right statistical unit is the task, not the raw generation.

For each task, retain:

| Field | Requirement |
|-------|-------------|
| `task_id` | Stable identifier, for example `BVZ-TASK-001` |
| `task_version` | Increment when FASTA, paper, question, prompt, rubric, or preprocessing changes |
| `input_hash` | SHA256 over canonical FASTA, paper text hash, and question |
| `preprocess_hash` | SHA256 over deterministic resolver and paper-extraction output |
| `prompt_hash` | SHA256 over system prompt, developer prompt, output contract, and user question template |
| `schema_hash` | SHA256 over expected structured output schema |
| `run_id` | Unique immutable run identifier |
| `model_id` | Provider and exact model name |
| `model_digest` | Required for local Ollama models when available |
| `generation_settings` | Temperature, seed if supported, top_p, top_k, max tokens, stop sequences, reasoning settings |
| `provider_fingerprint` | Record OpenAI `system_fingerprint` or analogous backend/version fields when exposed |
| `raw_output_hash` | Hash of unmodified model response |
| `postprocess_hash` | Hash after deterministic hydration/normalization |

Interpretation: if preprocessing, paper extraction, prompt text, output schema, or model settings change, it is a new task version or experiment condition.

### 2. Separate Deterministic Pipeline Quality From Model Output Quality

BioViz Atlas already has deterministic logic for sequence heuristics, canonical identity fallback, public identifiers, paper mentions, schema validation, and provenance hydration. Those stages must be frozen and logged before model execution.

Use two output layers:

| Layer | Meaning | Compare Across Models? |
|-------|---------|------------------------|
| `preprocess_snapshot` | FASTA normalization, sequence statistics, resolver results, extracted paper snippets, provenance candidates | No, except as a pipeline regression check |
| `model_raw_structured` | Fields produced directly by the model before deterministic merge | Yes, primary model comparison target |
| `final_app_report` | User-visible report after deterministic fields are restored or normalized | Yes, but label as system-level comparison, not pure model comparison |

Do not award a model credit for deterministic fields that were injected after generation. Example: if canonical UniProt identity is merged back after synthesis, the model did not "find" the identity. Score it under system reliability, not model factuality.

### 3. Use Structured Outputs For Automatic Scoring

Require every model to return a common JSON-compatible structure, even if some providers need prompt-only enforcement rather than native schema enforcement. Structured outputs make deterministic evaluation possible: parse success, required fields, enum validity, array lengths, citation/provenance references, and public-safety flags can be scored without subjective review.

Recommended minimal output contract:

```json
{
  "canonical_identity": {
    "protein_name": "string|null",
    "gene_symbol": "string|null",
    "organism": "string|null",
    "public_accession": "string|null",
    "model_claimed": "boolean"
  },
  "interpretation_summary": "string",
  "regions": [
    {
      "label": "string",
      "start": "integer|null",
      "end": "integer|null",
      "rationale": "string",
      "evidence_refs": ["string"]
    }
  ],
  "paper_mentions": [
    {
      "claim": "string",
      "evidence_ref": "string"
    }
  ],
  "next_steps": ["string"],
  "limits_and_cautions": ["string"],
  "public_safety_flags": ["non_clinical" ]
}
```

If a provider cannot enforce schema natively, still score schema adherence as a model/system behavior. OpenAI's structured output guidance supports JSON Schema adherence as an explicit contract; this is a useful reference pattern even when comparing external or local models.

## Metrics

### Deterministic Metrics

Use deterministic metrics wherever the answer can be checked mechanically.

| Metric | What It Measures | Recommended Scoring |
|--------|------------------|---------------------|
| Schema validity | Whether output parses and satisfies required fields | Pass/fail plus repair count |
| Required-field completeness | Whether expected report fields are present | Percent complete |
| Public identifier agreement | Whether model-provided accession/gene/protein matches deterministic resolver or known gold | Exact match, alias-normalized match, mismatch |
| Hallucinated identifier rate | Claims of accessions, genes, papers, pathways, or residue ranges absent from supplied evidence | Count per 1,000 tokens and per report |
| Region overlap | Agreement with expected annotated or deterministic regions | Jaccard overlap or boundary-distance bins |
| Evidence-reference validity | Whether every scientific claim points to an input paper snippet, resolver source, or explicit "inference" label | Percent supported |
| Non-clinical safety | Whether output avoids diagnosis, treatment, patient-specific advice, or clinical claims | Pass/fail |
| Refusal/abstention quality | Whether model says "unknown" when evidence is absent | Pass/fail or calibrated labels |
| Latency | Time to first token and total completion time | Median/IQR per model |
| Token and cost profile | Prompt tokens, output tokens, local eval counts, provider cost estimate | Median/IQR per model |
| Reproducibility variance | How much a model changes across repeated runs on the same task | Pairwise similarity, field-level entropy, pass-rate variance |

For BioViz Atlas, the most important deterministic metrics are schema validity, hallucinated identifier rate, evidence-reference validity, non-clinical safety, and distinction between deterministic identity fields and model-generated claims.

### Subjective Metrics

Use subjective metrics only where biological interpretation quality cannot be reduced to exact matching. Keep them blinded, rubric-driven, and separable from deterministic scores.

| Metric | Rubric Anchor |
|--------|---------------|
| Biological plausibility | Does the explanation follow from known protein biology and provided evidence without overclaiming? |
| Evidence use | Does the answer use supplied paper/provenance snippets accurately? |
| Interpretive usefulness | Would this help an exploratory researcher decide the next public-safe step? |
| Specificity | Does it provide concrete regions, hypotheses, and caveats rather than generic biology? |
| Uncertainty calibration | Does it distinguish known facts, inferred relationships, and speculation? |
| Communication clarity | Is the answer readable without hiding uncertainty? |

Recommended subjective protocol:

1. Blind reviewers to model identity.
2. Randomize response order for side-by-side comparisons.
3. Use pairwise preference plus per-response pass/fail gates.
4. Use at least two reviewers for pilot tasks when feasible.
5. Record disagreements and consensus decisions.
6. Keep LLM-as-judge as a secondary, calibrated signal unless human agreement has already been measured.

OpenAI's current evaluation guidance explicitly warns against vibe-based evaluation, recommends task-specific evals, combining metrics with human judgment, and using pairwise/pass-fail judging for reliability. It also flags position and verbosity bias in LLM-as-judge workflows; BioViz Atlas should therefore randomize answer order and control response length before using judge models.

## Repeated Runs And Generation Control

### Required Run Modes

Use two run modes because they answer different questions.

| Mode | Settings | Purpose | Minimum Runs |
|------|----------|---------|--------------|
| Deterministic smoke | Lowest randomness available: `temperature: 0`, fixed seed when supported, fixed prompt, fixed context | Regression checks and replay sanity | 1 to 3 per model/task |
| Robustness sampling | Public demo setting, usually low temperature such as 0.1 to 0.3; fixed prompt/context; seed sweep when supported | Estimate model variability under realistic use | 5 per model/task for pilot, 10+ for claims |

Do not claim true determinism from temperature alone. Hosted providers can change backend weights or infrastructure, and local runtimes can vary by model build, quantization, hardware, sampler implementation, and prompt template. For OpenAI-style APIs, record seed and backend fingerprint when available; OpenAI's cookbook notes that matching seed, parameters, and `system_fingerprint` makes outputs mostly identical but not guaranteed. For Ollama, record the API usage fields and model details available through local endpoints, including timing and token counts.

### Prompt Stability Rules

Prompts are experimental materials. Treat them like protocols.

| Rule | Requirement |
|------|-------------|
| Prompt freeze | Do not edit prompts mid-experiment. Any change creates a new prompt version. |
| Hash prompts | Hash the exact system/developer/user templates and the rendered prompt. |
| Include schema | Hash the JSON schema or parser contract with the prompt. |
| Pin context | Same normalized FASTA, paper text excerpts, resolver fields, and provenance snippets for every model. |
| Control length | Same max-token budget where APIs permit. Score truncation separately. |
| Avoid provider-specific help | Do not add model-specific hints unless the experiment condition is explicitly "provider-optimized prompt." |
| Preserve raw output | Store raw response before parser repair, retries, or deterministic hydration. |

### Temperature And Seed Policy

Recommended default for comparison experiments:

```json
{
  "temperature": 0,
  "top_p": 1,
  "max_output_tokens": 1200,
  "seed": 104729,
  "repeat_runs": 3,
  "mode": "deterministic_smoke"
}
```

Recommended robustness setting:

```json
{
  "temperature": 0.2,
  "top_p": 0.9,
  "max_output_tokens": 1200,
  "seed_schedule": [101, 103, 107, 109, 113],
  "repeat_runs": 5,
  "mode": "robustness_sampling"
}
```

If a model or provider does not support seed control, record `seed_supported: false` and rely on repeated runs rather than pretending the comparison is deterministic.

## Fair Comparison Boundaries

### Fair Conditions

Use these boundaries for the main benchmark:

| Boundary | Fair Rule |
|----------|-----------|
| Input | Same canonical FASTA, optional paper text, and question |
| Retrieval/enrichment | Same deterministic resolver and extracted snippets for all models |
| Prompt | Same task prompt and schema unless testing prompt adaptation as a separate condition |
| Context budget | Same context subset and max output budget |
| Post-processing | Same parser, repair policy, deterministic hydration, and validation logic |
| Retry policy | Same number of retries and same retry prompt; log repairs as failures or partial failures |
| Run order | Interleave models by task to reduce temporal backend drift |
| Output visibility | Reviewers see anonymized model outputs, not provider/model names |

### Unfair Conditions To Avoid

Do not mix these into the same headline comparison:

| Problem | Why It Invalidates The Comparison | Correct Handling |
|---------|-----------------------------------|------------------|
| Model-specific prompts | Measures prompt tuning, not model behavior | Separate "optimized prompt" track |
| Different retrieved context | Measures retrieval/preprocessing differences | Freeze context or run a separate system-level comparison |
| Deterministic identity hydration counted as model success | Credits models for app code | Score pre-hydration model output separately |
| Different max tokens | Longer answers can look better and bias judges | Equalize budget or normalize by length |
| Different retry/repair policies | Gives some models more chances | Use common retry policy and record repair count |
| Mixing local and hosted version drift silently | Backend changes can masquerade as model differences | Log model digests, provider fingerprints, dates, and versions |
| Using private or proprietary biology inputs | Not public-safe and not replayable by reviewers | Use public protein sequences, public papers, and redacted/hashes-only internals |

## Statistical Reporting

Because BioViz Atlas tasks are paired, prefer paired analysis.

For pilot experiments, report descriptive statistics:

- Per-model pass rates for deterministic gates.
- Per-task paired deltas between models.
- Median and interquartile range for latency, output length, and score distributions.
- Bootstrap confidence intervals for aggregate scores where sample size permits.
- Run-to-run variance for repeated generations.
- Failure taxonomy counts: schema failure, unsupported claim, hallucinated identifier, missing caveat, clinical overreach, irrelevant answer, truncation.

For stronger claims, use:

| Outcome Type | Recommended Test |
|--------------|------------------|
| Binary paired outcome, such as safety pass/fail | McNemar test |
| Ordinal rubric scores | Wilcoxon signed-rank or paired permutation test |
| Pairwise preference counts | Binomial/sign test with confidence intervals |
| Continuous metrics, such as latency | Paired bootstrap CI plus median delta |
| Multiple metrics or many model pairs | Predefine primary endpoint; apply FDR control for secondary exploratory metrics |

Avoid ranking models from tiny sample sizes. With fewer than about 20 task cards, state findings as exploratory and emphasize observed failure modes rather than league-table conclusions.

## gsigmad Workflow

### Current Local State

Observed on 2026-04-13 from `/Users/byron/projects/active/bioviz-atlas`:

```text
gsigmad 1.1.0
coordinate: unavailable (not in gsigmad project)
```

`gsigmad inspect .` reports:

```text
Project root: /Users/byron/projects/active/bioviz-atlas
Resolution: unsupported via unresolved
Issues:
- No .gsigmad directory and no runtime manifest matched this path.
- Create adapters/runtime/<project>.yaml to route a legacy or hybrid project.
```

Implication: BioViz Atlas can require gsigmad, but the repository is not yet configured for gsigmad-governed execution. The roadmap should include an enabling step before experiment registration.

### Required gsigmad Setup

Choose one:

1. Native route: run `gsigmad init` in the BioViz Atlas repo and store experiment artifacts under the gsigmad project structure.
2. Adapter route: add `adapters/runtime/bioviz-atlas.yaml` if this repo must coexist with a parent governance workspace.

After setup, the model-comparison work should use gsigmad gates:

```bash
gsigmad inspect .
gsigmad register --type exploratory \
  --title "BioViz Atlas model comparison on public biological interpretation tasks" \
  --hypothesis "H0: Compared models do not differ in public-safe biological interpretation quality on the frozen task set."
gsigmad run EXP-<id> --dry-run
gsigmad redteam EXP-<id>
gsigmad run EXP-<id>
gsigmad audit EXP-<id>
gsigmad fair EXP-<id>
gsigmad export EXP-<id>
```

Use `exploratory` initially. Promote to confirmatory only after the task set, prompt, schema, primary metric, evaluator rubric, and statistical plan are frozen before seeing new results.

### gsigmad Artifacts To Require

| Artifact | Purpose |
|----------|---------|
| Experiment preregistration | Hypothesis, scope, inclusion/exclusion criteria, model list, primary endpoint |
| Task manifest | Public-safe task cards with hashes and expected scoring fields |
| Run manifest | Exact model, settings, seeds, prompt hash, schema hash, environment, git commit |
| Raw-output archive | Unmodified provider/local outputs before parser repair |
| Parsed-output archive | Structured model outputs after common parser |
| Final-report archive | User-visible BioViz Atlas reports after deterministic hydration |
| Score table | Deterministic metrics, subjective rubric scores, judge metadata |
| Red-team report | Public-safety, leakage, clinical-overreach, and unfair-comparison checks |
| Audit report | Claim classification, evidence mapping, citation/provenance checks |
| FAIR report | Findability, accessibility, interoperability, and reusability checks |
| Export bundle | Replayable public-safe package with hashes and README |

### gsigmad Gate Criteria

Use these gates before a result is allowed into a comparison claim:

| Gate | Pass Criteria |
|------|---------------|
| Governance routing | `gsigmad inspect .` resolves supported commands |
| Preregistration | Experiment has frozen task set, primary metric, model list, prompt/schema hashes |
| Public-safety screen | No proprietary Cellico mechanisms, private repo content, patient data, or clinical advice |
| Deterministic replay | At least one smoke run can replay from manifest and reproduce parse/schema status |
| Evidence audit | Scientific claims are labeled as measured, inferred, or hypothesis and linked to allowed evidence |
| Fairness audit | No model receives extra context, retries, prompt help, or deterministic-field credit |
| Red-team | Review covers hallucinated biology, clinical overreach, private leakage, and judge bias |
| FAIR export | Public bundle contains enough metadata to understand and rerun without secrets |

## Public-Safe Biological Task Set

Use public examples only. Good initial task categories:

| Category | Example Task Shape | Notes |
|----------|--------------------|-------|
| Canonical identity | Given FASTA header and sequence, identify likely public protein identity | Use UniProt/public references only |
| Region interpretation | Ask for biologically plausible regions of interest in a protein sequence | Score specificity and caveats |
| Paper-grounded interpretation | Provide public paper excerpt/PDF text and ask what it supports | Score evidence fidelity |
| Missing-evidence abstention | Ask a question not answerable from sequence plus paper | Score uncertainty and refusal quality |
| Public-safety boundary | Ask for clinical/disease treatment interpretation | Expected behavior: non-clinical boundary and exploratory framing |
| Ambiguous FASTA header | Use weak or generic headers with sequence only | Tests resolver/model overclaiming |

Do not use unpublished sequences, proprietary candidate designs, internal Cellico mechanisms, private paper notes, reviewer comments, credentials, or patient-like clinical scenarios.

## Recommended MVP Method

### Phase 1: Harness Validity

Goal: prove that the comparison infrastructure is fair and replayable.

- Configure gsigmad routing.
- Register one exploratory experiment.
- Create 5 to 8 public-safe task cards.
- Run 2 to 3 models with deterministic smoke settings.
- Score only deterministic metrics plus a small blinded human review.
- Do not publish model ranking; publish harness validity and failure modes.

### Phase 2: Pilot Model Comparison

Goal: compare local Ollama and hosted models credibly.

- Expand to 15 to 25 task cards.
- Run each model 5 times per task.
- Use one frozen prompt and one frozen schema.
- Report deterministic metrics, run variance, and blinded pairwise preferences.
- Use paired statistics but label as exploratory.

### Phase 3: Confirmatory Comparison

Goal: make a stronger model-selection claim.

- Freeze task set and primary endpoint before running.
- Use 30+ task cards if feasible.
- Keep model list and settings locked.
- Run gsigmad red-team, audit, FAIR, and export gates.
- Report confidence intervals, primary endpoint, secondary metrics, and all exclusions.

## Implementation Contract For BioViz Atlas

Add a comparison harness that writes immutable JSONL or JSON artifacts. A minimal run record should look like:

```json
{
  "experiment_id": "EXP-<id>",
  "run_id": "bvz-20260413-001",
  "task_id": "BVZ-TASK-001",
  "task_version": "1.0.0",
  "git_commit": "9f8b21cc6b9fcd11530a21f6366aa81e36e5ba58",
  "input_hash": "sha256:<hash>",
  "preprocess_hash": "sha256:<hash>",
  "prompt_hash": "sha256:<hash>",
  "schema_hash": "sha256:<hash>",
  "provider": "ollama",
  "model_id": "qwen2.5-coder:7b",
  "model_digest": "sha256:<digest-or-null>",
  "generation_settings": {
    "temperature": 0,
    "top_p": 1,
    "seed": 104729,
    "max_output_tokens": 1200
  },
  "raw_output_path": "experiments/EXP-<id>/raw/<run_id>.txt",
  "parsed_output_path": "experiments/EXP-<id>/parsed/<run_id>.json",
  "final_report_path": "experiments/EXP-<id>/reports/<run_id>.json",
  "scores_path": "experiments/EXP-<id>/scores/<run_id>.json",
  "public_safe": true
}
```

The UI can present comparison summaries, but the research claim should come from the artifact bundle, not the UI state.

## Research Confidence

| Area | Confidence | Reason |
|------|------------|--------|
| Paired task design | HIGH | Standard evaluation design and directly applicable to same-prompt comparisons |
| Deterministic vs subjective metrics | HIGH | Supported by current evaluation guidance and local app architecture |
| Repeated runs and seed policy | MEDIUM-HIGH | Supported by provider guidance, but determinism differs across providers and local runtimes |
| Statistical tests | MEDIUM | Standard paired-test choices; exact power depends on task count and rubric behavior |
| gsigmad integration | MEDIUM | CLI verified locally, but repo is not yet routed as a gsigmad project |
| Public-safe constraints | HIGH | Directly derived from project requirements |

## Sources

- OpenAI, "Evaluation best practices," accessed 2026-04-13: https://developers.openai.com/api/docs/guides/evaluation-best-practices
- OpenAI, "Structured model outputs," accessed 2026-04-13: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI Cookbook, "How to make your completions outputs consistent with the new seed parameter," accessed 2026-04-13: https://developers.openai.com/cookbook/examples/reproducible_outputs_with_the_seed_parameter
- Anthropic, "Prompt engineering overview," accessed 2026-04-13: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- Ollama API documentation, accessed 2026-04-13: https://docs.ollama.com/api
- Liang et al., "Holistic Evaluation of Language Models," TMLR 2023 / arXiv:2211.09110, accessed 2026-04-13: https://arxiv.org/abs/2211.09110
- Local gsigmad CLI inspection, `gsigmad version`, `gsigmad --help`, `gsigmad inspect .`, run from `/Users/byron/projects/active/bioviz-atlas` on 2026-04-13.
