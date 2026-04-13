# BioViz Atlas Model Comparison Brief

## Goal

Turn BioViz Atlas into a governed experiment platform for comparing model behavior on the same biological interpretation tasks.

## What We Need

- Let the operator choose the active inference model, especially local Ollama models.
- Run the same BioViz Atlas analysis flow against multiple models on the same inputs.
- Capture outputs, metadata, and provenance for each run so results can be compared later.
- Research and implement a valid comparison method rather than relying on anecdotal output quality.
- Use `gsigmad` to structure the comparison as an experiment with explicit governance and analysis discipline.

## Core Comparison Surface

The application should support:

- selecting a model provider or model name
- choosing between multiple Ollama models
- running repeated comparisons on the same sequence and optional paper input
- storing each model result with input hash, model metadata, timestamps, and structured output
- showing side-by-side or summary comparison views for model outputs

## Inputs

- FASTA sequences
- optional PDF papers
- plain-English analysis questions

## Outputs To Capture

- canonical protein identity fields
- regions of interest
- summary text
- next-step recommendations
- paper mention extraction
- provenance root and artifact count
- model name, provider, and runtime settings
- run-level comparison records suitable for later audit

## Research Questions

- What is the best practice for comparing LLM outputs on the same task in a lightweight but valid way?
- Which measures should be deterministic vs human-judged?
- How should repeated runs, prompt stability, and temperature be handled?
- What should count as a meaningful difference between models?
- How should local-model comparisons be documented so the analysis remains credible and replayable?

## Constraints

- Keep the workflow exploratory and non-clinical.
- Do not expose proprietary Cellico or private-repo content.
- Prefer local Ollama support, but preserve the current OpenAI/Gemini paths where useful.
- Make the experiment reproducible enough for hackathon, product, and internal evaluation use.
- Use public-safe language in UI and docs.

## Desired Outcome

BioViz Atlas should become a credible comparison harness where we can inspect how different models interpret the same biological question, understand their tradeoffs, and retain governed evidence about those differences.
