# Testing Patterns

**Analysis Date:** 2026-04-13

## Test Framework

**Runner:**
- Automated test runner: Not detected.
- No `jest.config.*`, `vitest.config.*`, or `playwright.config.*` files are detected.
- No `*.test.*` or `*.spec.*` files are detected under the repository.
- `package.json` has no `test` script.

**Assertion Library:**
- Not detected.
- `package.json` does not include Jest, Vitest, Testing Library, Playwright Test, Cypress, or assertion-library dependencies.

**Run Commands:**
```bash
npm run lint          # TypeScript compatibility check via tsc --noEmit
npm run build         # Production Vite build
npm run dev           # Local Express + Vite middleware server on port 3000
npm run preview       # Vite preview for built assets
```

**Observed verification on 2026-04-13:**
```bash
npm run lint          # Passes
npm run build         # Passes
```

## Test File Organization

**Location:**
- No automated test files are detected.
- Keep future unit tests close to implementation files in `src/lib/` for pure helpers.
- Keep future route/integration tests in a dedicated server/API test path because `/api/analyze` is implemented in root `server.ts`.
- Keep browser flow tests separate from generated `.playwright-cli/` captures; use committed test specs rather than generated proof artifacts.

**Naming:**
- Use `*.test.ts` for pure TypeScript unit tests near `src/lib/*.ts`.
- Use `*.test.tsx` for React component tests near `src/*.tsx` if component testing is added.
- Use `*.spec.ts` for browser or API flow tests if Playwright Test is added.

**Structure:**
```text
src/
├── lib/
│   ├── analysis.ts
│   ├── analysis.test.ts          # Future unit tests for sequence/provenance helpers
│   ├── protein-resolver.ts
│   ├── protein-resolver.test.ts  # Future resolver tests with mocked fetch
│   ├── schema.ts
│   └── schema.test.ts            # Future schema parse/contract tests
├── App.tsx
└── App.test.tsx                  # Future component tests, if component testing is added
```

## Test Structure

**Suite Organization:**
No committed suite pattern exists. Use this structure for future tests because it matches the module boundaries in `src/lib/`:

```typescript
import { describe, expect, it } from "vitest";
import { normalizeSequence, runLocalHeuristics } from "./analysis";

describe("normalizeSequence", () => {
  it("removes FASTA headers and non-amino-acid characters", () => {
    expect(normalizeSequence(">P01308\nabc123")).toBe("ABC");
  });
});
```

**Patterns:**
- Test pure deterministic functions first: `normalizeSequence`, `extractFastaHeader`, `generateHash`, `runLocalHeuristics`, `ProvenanceGraph.getRootHash` in `src/lib/analysis.ts`.
- Test schema behavior with explicit valid and invalid payloads against `BioVizReportSchema` in `src/lib/schema.ts`.
- Test resolver behavior with mocked `fetch` for UniProt responses in `src/lib/protein-resolver.ts`.
- Test `/api/analyze` as an integration path after provider calls are injectable or mockable in `server.ts`.
- Treat generated Playwright CLI captures in `.playwright-cli/` and `output/playwright/` as evidence artifacts, not source-controlled automated tests.

## Mocking

**Framework:** Not detected.

**Patterns:**
No committed mocking pattern exists. For future tests, mock only external systems and preserve deterministic local logic:

```typescript
vi.stubGlobal("fetch", vi.fn(async () => ({
  ok: true,
  json: async () => ({
    primaryAccession: "P01275",
    organism: { scientificName: "Homo sapiens", taxonId: 9606 },
  }),
})));
```

**What to Mock:**
- Network calls to UniProt in `src/lib/protein-resolver.ts`.
- Network calls to OpenAI Responses API in `runOpenAIModel(...)` in `server.ts`.
- Network calls to Gemini in the `GoogleGenAI` path in `server.ts`.
- Network calls to Ollama in `isOllamaReachable(...)` and `runLocalModel(...)` in `server.ts`.
- `pdftotext` subprocess behavior from `extractPdfText(...)` in `server.ts`.
- Multipart uploaded files for `/api/analyze` in `server.ts`.

**What NOT to Mock:**
- `normalizeSequence(...)` and `extractFastaHeader(...)` in `src/lib/analysis.ts`.
- `generateHash(...)` and `ProvenanceGraph.getRootHash(...)` in `src/lib/analysis.ts`.
- `BioVizReportSchema.parse(...)` in `src/lib/schema.ts`.
- `buildFallbackReport(...)`, `hydrateReport(...)`, and `safeJsonParse(...)` behavior in `server.ts` once those helpers are extracted or made testable.

## Fixtures and Factories

**Test Data:**
No committed fixture directory is detected. Use small inline fixtures for unit tests and move larger biological inputs into a fixture path only when reused.

```typescript
const glp1Sequence = "HAEGTFTSDVSSYLEGQAAKEFIAWLVKGRG";

const minimalReport = {
  title: "Exploratory Atlas Report for GCG",
  summary: "Exploratory non-clinical summary.",
  proteinLength: glp1Sequence.length,
  canonicalProtein: {
    uniprotAccession: "P01275",
    approvedSymbol: "GCG",
    proteinName: "Pro-glucagon",
    organism: "Homo sapiens",
    taxonId: 9606,
    hgncId: null,
    ncbiGeneId: null,
    ensemblGeneId: null,
  },
  aliases: ["GLP-1", "GCG"],
  databaseLinks: [{ source: "UniProt", id: "P01275", url: "https://www.uniprot.org/uniprotkb/P01275" }],
  paperMentions: [],
  regions: [{ start: 1, end: 20, label: "Candidate Region", reason: "Fixture", confidence: 0.5 }],
  nextSteps: ["Review the highlighted regions."],
};
```

**Location:**
- No fixture path is detected.
- Use `src/lib/*.test.ts` inline data for compact sequence and schema cases.
- Use `tests/fixtures/` only if larger PDF, JSON, or FASTA fixtures are introduced.
- Keep generated demo artifacts in ignored paths: `output/`, `.playwright-cli/`.

## Coverage

**Requirements:** None enforced.

**View Coverage:**
```bash
# Not available: no coverage command is configured in package.json
```

**Coverage Configuration:**
- No coverage directory is tracked; `.gitignore` ignores `coverage/`.
- No coverage provider is configured.
- No threshold is configured.

## Test Types

**Unit Tests:**
- Not implemented.
- Highest-value unit targets:
  - `normalizeSequence(...)` in `src/lib/analysis.ts`.
  - `extractFastaHeader(...)` in `src/lib/analysis.ts`.
  - `runLocalHeuristics(...)` in `src/lib/analysis.ts`.
  - `ProvenanceGraph.add(...)` and `ProvenanceGraph.getRootHash(...)` in `src/lib/analysis.ts`.
  - `BioVizReportSchema.parse(...)` in `src/lib/schema.ts`.
  - alias parsing and known public protein fallback in `src/lib/protein-resolver.ts`.

**Integration Tests:**
- Not implemented.
- Highest-value integration target is `POST /api/analyze` in `server.ts`.
- Integration tests need provider injection or fetch/subprocess mocks because `server.ts` directly reaches OpenAI, Gemini, Ollama, UniProt, and `pdftotext`.
- Verify the fallback path with no model API keys and a deterministic sequence.
- Verify malformed input returns `400` with `{ error: "Sequence and question are required." }`.
- Verify provider failures produce a fallback report rather than a failed request when local deterministic data is available.

**E2E Tests:**
- No Playwright Test or Cypress suite is configured.
- `playwright-cli.json` configures manual/agent browser sessions with viewport `1440x1100` and `headless: false`.
- Generated browser artifacts exist in `.playwright-cli/` and `output/playwright/`, and both directories are ignored by `.gitignore`.
- E2E verification is manual/artifact-based rather than a committed CI gate.

## Verification Workflow

**Current scripted gate:**
```bash
npm install
npm run lint
npm run build
```

**Local runtime check:**
```bash
npm run dev
# Open http://localhost:3000
# Submit a protein sequence, optional PDF, biological question, and organism.
```

**Manual browser proof path:**
- Use `playwright-cli.json` for agent-driven browser sessions.
- Capture screenshots and console artifacts under `.playwright-cli/`.
- Store generated presentation/demo outputs under `output/`.
- Keep `.playwright-cli/` and `output/` uncommitted because `.gitignore` excludes both.

**Runtime prerequisites for full manual verification:**
- Node.js and npm, as indicated by `README.md` and `package.json`.
- `.env.local` for local secret configuration; do not commit or quote contents.
- `GEMINI_API_KEY` for Gemini synthesis in `server.ts`.
- `OPENAI_API_KEY` for OpenAI synthesis in `server.ts`.
- Local Ollama at `OLLAMA_URL` with `OLLAMA_MODEL` for local synthesis fallback in `server.ts`.
- `pdftotext` available on the host for PDF text extraction in `server.ts`.
- Network access to UniProt for canonical enrichment in `src/lib/protein-resolver.ts`.

**Build outputs:**
- `npm run build` writes Vite production assets to `dist/`.
- `dist/` is ignored by `.gitignore`.

## Common Patterns

**Async Testing:**
Use `async/await` with explicit mocked responses for network-dependent helpers:

```typescript
it("returns parsed fallback data when UniProt resolves", async () => {
  const result = await resolveProtein("HAEGTFTSDVSSYLEGQAAKEFIAWLVKGRG", "Homo sapiens", null);
  expect(result.organism).toBe("Homo sapiens");
});
```

**Error Testing:**
Test both thrown errors and degraded fallback behavior:

```typescript
it("extracts JSON from fenced model output", () => {
  expect(safeJsonParse("```json\n{\"title\":\"x\"}\n```")).toEqual({ title: "x" });
});
```

`safeJsonParse(...)` is private in `server.ts`; extract it before adding direct unit tests.

**Schema Testing:**
Use the Zod schema as the report boundary:

```typescript
it("rejects report payloads without required arrays", () => {
  expect(() => BioVizReportSchema.parse({ title: "x" })).toThrow();
});
```

**UI Testing:**
For `src/App.tsx`, verify behavior rather than Tailwind classes:
- Initial empty state renders.
- Required form fields block browser submission.
- Successful `/api/analyze` response renders report title, provenance root hash, regions, database links, and next steps.
- Failed response renders the error panel.
- Loading state disables the submit button.

## Lint and Type Strategy

**TypeScript gate:**
- `npm run lint` runs `tsc --noEmit`.
- This catches type and module-resolution errors across `server.ts`, `vite.config.ts`, and `src/**/*`.
- This does not enforce formatting, import order, React hook rules, accessibility rules, or unused Tailwind classes.

**Schema gate:**
- `BioVizReportSchema.parse(...)` in `server.ts` is the runtime contract for LLM outputs.
- `bioVizJsonSchema` in `src/lib/schema.ts` is supplied to OpenAI and Ollama structured-output paths.
- Gemini output is parsed from JSON text and then validated with `BioVizReportSchema.parse(...)`.

**Manual acceptance gate:**
- Browser acceptance is manual. Use `npm run dev` and submit a known sequence through `src/App.tsx` to exercise `/api/analyze`.
- The GLP-1 fixture sequence in `src/lib/protein-resolver.ts` is suitable for deterministic identity checks:

```text
HAEGTFTSDVSSYLEGQAAKEFIAWLVKGRG
```

---

*Testing analysis: 2026-04-13*
