# Coding Conventions

**Analysis Date:** 2026-04-13

## Naming Patterns

**Files:**
- Use PascalCase for React component modules: `src/App.tsx`.
- Use lowercase kebab-case for library modules: `src/lib/protein-resolver.ts`.
- Use lowercase noun files for shared schemas and analysis helpers: `src/lib/schema.ts`, `src/lib/analysis.ts`.
- Use root-level runtime/config files for app orchestration: `server.ts`, `vite.config.ts`, `tsconfig.json`, `package.json`.
- Keep generated proof artifacts outside source code in ignored paths: `.playwright-cli/`, `output/playwright/`, `output/presentation/`.

**Functions:**
- Use camelCase for local helpers and exported functions: `normalizeSequence`, `extractFastaHeader`, `runLocalHeuristics`, `resolveProtein` in `src/lib/analysis.ts` and `src/lib/protein-resolver.ts`.
- Prefix boolean checks with `is`: `isOllamaReachable` in `server.ts`.
- Use action-oriented verbs for provider calls: `runOpenAIModel`, `runLocalModel` in `server.ts`.
- Keep request handlers as nested async functions only for small route-local flows; move reusable logic into `src/lib/` modules.

**Variables:**
- Use camelCase for ordinary values: `openAiApiKey`, `geminiApiKey`, `ollamaAvailable`, `paperMentions` in `server.ts`.
- Use uppercase constants for environment-derived global defaults: `OPENAI_MODEL`, `OLLAMA_URL`, `OLLAMA_MODEL` in `server.ts`.
- Use short local names only inside narrow scopes: `seq`, `res`, `i`, `aa` in `server.ts`, `src/App.tsx`, and `src/lib/analysis.ts`.
- Use `art*` prefixes for provenance artifact handles: `artInput`, `artNorm`, `artLocal`, `artBio` in `server.ts`.

**Types:**
- Use PascalCase for exported interfaces and schema-derived types: `Artifact`, `BioVizReport` in `src/lib/analysis.ts` and `src/lib/schema.ts`.
- Use Zod schema names with a `Schema` suffix: `BioVizReportSchema` in `src/lib/schema.ts`.
- Use lowercase camelCase for JSON Schema constants: `bioVizJsonSchema` in `src/lib/schema.ts`.
- Use inline object types for small route-local arrays where no shared schema exists, as in `paperMentions` in `server.ts`.

## Code Style

**Formatting:**
- No Prettier, Biome, or ESLint formatting configuration is detected. Files are manually formatted.
- Use 2-space indentation in TypeScript/TSX files, matching `server.ts`, `src/App.tsx`, and `src/lib/schema.ts`.
- Use semicolons in TypeScript/TSX files.
- Prefer double quotes in most app code: `server.ts`, `src/App.tsx`, `src/lib/schema.ts`, `src/lib/analysis.ts`.
- Existing config/entry files use single quotes and tighter named import spacing: `src/main.tsx`, `vite.config.ts`. Match the surrounding file style when editing those files.
- Keep JSX class strings inline when they are one-off Tailwind layouts, as in `src/App.tsx`.
- Keep source comments sparse and functional. Existing comments identify route sections, local logic, provenance finalization, Vite middleware, and non-obvious sequence/PDF/provenance operations in `server.ts`, `src/lib/analysis.ts`, and `vite.config.ts`.

**Linting:**
- The only scripted lint command is TypeScript checking: `npm run lint` runs `tsc --noEmit` from `package.json`.
- No ESLint config is detected: `.eslintrc*` and `eslint.config.*` are absent.
- No Prettier config is detected: `.prettierrc*` is absent.
- No Biome config is detected: `biome.json` is absent.
- `npm run lint` passes on 2026-04-13.

**TypeScript Compiler Settings:**
- `tsconfig.json` targets `ES2022`, uses `module: "ESNext"`, `moduleResolution: "bundler"`, and `jsx: "react-jsx"`.
- `tsconfig.json` enables `isolatedModules`, `moduleDetection: "force"`, `allowImportingTsExtensions`, and `noEmit`.
- `tsconfig.json` sets `allowJs: true`, so JavaScript interop is permitted.
- `tsconfig.json` does not enable `strict`, `noImplicitAny`, `strictNullChecks`, or `noUncheckedIndexedAccess`.
- Treat `tsc --noEmit` as a syntax/type compatibility gate, not a strict typing quality gate.

## Import Organization

**Order:**
1. External packages first: `express`, `vite`, `multer`, `dotenv`, `@google/genai` in `server.ts`; `react`, `lucide-react`, `clsx`, `tailwind-merge` in `src/App.tsx`.
2. Node built-ins next where needed: `node:fs/promises`, `node:os`, `node:child_process`, `node:util` in `server.ts`.
3. Local app modules after package imports: `./src/lib/analysis.js`, `./src/lib/protein-resolver.js`, `./src/lib/schema.js` in `server.ts`; `./lib/schema` in `src/App.tsx`.
4. CSS side-effect imports last in the browser entry: `./index.css` in `src/main.tsx`.

**Path Aliases:**
- `tsconfig.json` maps `@/*` to `./*`.
- `vite.config.ts` maps `@` to the repository root with `path.resolve(__dirname, ".")`.
- Existing source imports use relative paths rather than `@/` aliases. Continue using relative paths unless adding a cross-tree import where the alias improves clarity.

**ESM Details:**
- `package.json` sets `"type": "module"`.
- `server.ts` imports TypeScript source modules with `.js` extensions (`./src/lib/analysis.js`, `./src/lib/schema.js`) so `tsx` and ESM resolution work together.
- `src/main.tsx` imports `App` with an explicit `.tsx` extension, enabled by `allowImportingTsExtensions` in `tsconfig.json`.

## Schema and Typing Patterns

**Primary schema source:**
- Put shared report contracts in `src/lib/schema.ts`.
- Define the runtime Zod schema first, then export a schema-derived TypeScript type:

```typescript
export const BioVizReportSchema = z.object({
  title: z.string(),
  summary: z.string(),
  proteinLength: z.number(),
});

export type BioVizReport = z.infer<typeof BioVizReportSchema>;
```

**Model JSON schema:**
- Keep LLM structured-output JSON Schema in `src/lib/schema.ts` next to the Zod schema.
- Use `additionalProperties: false` for structured model outputs.
- Use explicit `required` arrays in `bioVizJsonSchema` for OpenAI and Ollama structured output compatibility.
- Keep Zod and JSON Schema fields aligned manually; no generator is wired into `package.json`.
- `zod-to-json-schema` is installed in `package.json` but is not used by `src/lib/schema.ts`.

**Runtime validation:**
- Parse model output at provider boundaries with `BioVizReportSchema.parse(...)` in `server.ts`.
- Hydrate parsed model output through deterministic fallback data with `hydrateReport(...)` in `server.ts`.
- The client trusts `/api/analyze` response shape after JSON parsing and stores it as `BioVizReport` in `src/App.tsx`; add client-side parsing if UI-side schema resilience becomes necessary.

**Use of `any`:**
- `any` is common at external boundaries: Express/multer request files, LLM payloads, UniProt JSON, and schema hydration in `server.ts` and `src/lib/protein-resolver.ts`.
- Keep `any` localized to unknown external payloads and immediately normalize into the `BioVizReportSchema` shape or small deterministic objects.
- Prefer `unknown` for raw unknown values when a local guard exists, following `cleanAlias(alias: unknown)` in `server.ts`.
- Define shared interfaces when a shape crosses module boundaries. `Artifact` in `src/lib/analysis.ts` is the main current example.

## Error Handling

**Patterns:**
- Validate required API inputs early and return structured JSON errors:

```typescript
if (!rawSeq || !question) {
  return res.status(400).json({ error: "Sequence and question are required." });
}
```

- Wrap `/api/analyze` in a top-level `try/catch` and return `{ error: error.message }` with HTTP 500 from `server.ts`.
- Provider failures are non-fatal in `server.ts`: OpenAI, Gemini, and Ollama failures are logged and the route falls through to the next available synthesis path or deterministic fallback.
- PDF extraction failures are non-fatal in `server.ts`; `extractPdfText(...)` cleanup uses `finally` and `fs.unlink(...).catch(() => {})`.
- Protein resolution failures are non-fatal in `src/lib/protein-resolver.ts`; failures log to console and return an organism-only fallback object.
- Client submission failures in `src/App.tsx` set the visible `error` state and log the raw error with `console.error`.

**Preferred API error shape:**
- Use JSON objects with an `error` string: `res.status(400).json({ error: "..." })`, `res.status(500).json({ error: error.message })`.
- Keep user-facing client errors short and displayable; `src/App.tsx` renders `error` directly.

**Fallback style:**
- Prefer conservative deterministic fallbacks over hard failures for exploratory output. `buildFallbackReport(...)` in `server.ts` is the canonical pattern.
- Preserve conservative/null identity fields rather than inventing biological IDs. This is encoded in the provider prompt in `server.ts` and nullable schema fields in `src/lib/schema.ts`.

## Logging

**Framework:** `console`

**Patterns:**
- Use `console.error` for degraded provider or parsing paths in `server.ts`.
- Use `console.error` for resolver failures in `src/lib/protein-resolver.ts`.
- Use `console.log` for server startup in `server.ts`.
- No structured logger, log drain, or observability library is configured in `package.json`.
- Do not log secrets or full API keys. Environment values such as `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OLLAMA_URL`, and `OLLAMA_MODEL` are read in `server.ts`; only non-secret model/path metadata should appear in logs.

## Comments

**When to Comment:**
- Comment non-obvious pipeline stages and operational constraints: PDF extraction cleanup in `server.ts`, local heuristic categories in `src/lib/analysis.ts`, and HMR behavior in `vite.config.ts`.
- Do not comment simple assignments or JSX layout that is already clear from names and Tailwind classes.
- Preserve cautionary operational comments in config files. The HMR comment in `vite.config.ts` documents an AI Studio-specific constraint.

**JSDoc/TSDoc:**
- JSDoc/TSDoc is not used in the detected source files.
- Prefer typed function signatures and small helper names over broad JSDoc blocks.
- Add TSDoc only for exported APIs whose behavior is not obvious from types, such as future shared resolver or provenance APIs in `src/lib/`.

## Function Design

**Size:** 
- Keep pure helpers small and single-purpose in `src/lib/analysis.ts` and `src/lib/protein-resolver.ts`.
- `server.ts` contains a large orchestration route; add new provider, persistence, or experiment-comparison logic as extracted helpers or modules rather than expanding the route body.
- `src/App.tsx` is a single large screen component. Add new reusable UI sections as dedicated components when new stateful or repeated UI patterns are introduced.

**Parameters:** 
- Use explicit primitive parameters for deterministic helpers: `normalizeSequence(input: string)`, `extractFastaHeader(input: string)`, `resolveProtein(sequence: string, organism = "Homo sapiens", header = null)`.
- Use optional/default parameters for fallbacks rather than overloading: `resolveProtein(...)`, `ProvenanceGraph.add(...)`.
- For new multi-field operations, prefer an object parameter once there are more than three related fields.

**Return Values:** 
- Return plain JSON-serializable objects for API and schema data: `buildFallbackReport(...)`, `runLocalHeuristics(...)`, `resolveProtein(...)`.
- Return nullable values for absent identity pieces: `extractFastaHeader(...)`, `canonicalProtein.*` fields in `src/lib/schema.ts`.
- Return conservative empty arrays for unavailable collections: aliases, links, mentions, regions.

## Module Design

**Exports:** 
- Use named exports for reusable library functionality: `generateHash`, `normalizeSequence`, `extractFastaHeader`, `runLocalHeuristics`, `ProvenanceGraph` from `src/lib/analysis.ts`; `resolveProtein` from `src/lib/protein-resolver.ts`; `BioVizReportSchema`, `BioVizReport`, `bioVizJsonSchema` from `src/lib/schema.ts`.
- Use a default export only for React screen components: `App` in `src/App.tsx`.
- Keep server-only helpers unexported inside `server.ts` unless another module needs them.

**Barrel Files:** 
- No barrel files are detected.
- Import directly from the defining module: `src/lib/schema.ts`, `src/lib/analysis.ts`, `src/lib/protein-resolver.ts`.

## UI and Styling Conventions

**React State:**
- Use local `useState` for page-level loading, report, and error state in `src/App.tsx`.
- Use typed React event parameters for handlers: `React.FormEvent<HTMLFormElement>` in `src/App.tsx`.
- Keep form submission data in `FormData` when posting multipart uploads to `/api/analyze`.

**Tailwind:**
- Tailwind CSS v4 is configured through `@tailwindcss/vite` in `vite.config.ts` and `@import "tailwindcss";` in `src/index.css`.
- Use utility classes inline in JSX for one-off layout and visual states.
- Use `clsx` + `tailwind-merge` through the local `cn(...)` helper in `src/App.tsx` when conditional class composition is needed.
- The `cn(...)` helper exists but is not used in current JSX; use it for new conditional class strings rather than manual string concatenation.

**Icons:**
- Use `lucide-react` named icon imports in `src/App.tsx`.
- Keep icons sized explicitly through `size={...}` or Tailwind width/height classes.

## Environment and Secrets Conventions

**Environment files:**
- `.env.local` and `.env.example` are present. Contents are not read or quoted.
- `.gitignore` ignores `.env*` and allows `.env.example`.
- `server.ts` loads `.env.local` first, then default dotenv resolution.

**Environment variables used by source:**
- `OPENAI_API_KEY` in `server.ts`.
- `OPENAI_MODEL` in `server.ts`.
- `GEMINI_API_KEY` in `server.ts` and `vite.config.ts`.
- `OLLAMA_URL` in `server.ts`.
- `OLLAMA_MODEL` in `server.ts`.
- `NODE_ENV` in `server.ts`.
- `DISABLE_HMR` in `vite.config.ts`.

**Secret handling:**
- Do not read or commit `.env.local`.
- Do not include secret values in `.planning/codebase/*`, logs, screenshots, or generated output artifacts.
- Keep generated runtime outputs in ignored directories: `.playwright-cli/`, `output/`, `dist/`, `coverage/`.

---

*Convention analysis: 2026-04-13*
