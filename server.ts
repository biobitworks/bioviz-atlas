import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fs from "node:fs/promises";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ProvenanceGraph, extractFastaHeader, normalizeSequence, runLocalHeuristics } from "./src/lib/analysis.js";
import { resolveProtein } from "./src/lib/protein-resolver.js";
import { BioVizReportSchema, bioVizJsonSchema } from "./src/lib/schema.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

const upload = multer({ storage: multer.memoryStorage() });

async function extractPdfText(buffer: Buffer, originalName: string) {
  const tempPdfPath = path.join(os.tmpdir(), `${Date.now()}-${originalName}`);
  const tempTxtPath = `${tempPdfPath}.txt`;

  await fs.writeFile(tempPdfPath, buffer);
  try {
    await execFileAsync("pdftotext", [tempPdfPath, tempTxtPath]);
    return await fs.readFile(tempTxtPath, "utf8");
  } finally {
    await fs.unlink(tempPdfPath).catch(() => {});
    await fs.unlink(tempTxtPath).catch(() => {});
  }
}

function collectPaperMentions(text: string, aliases: string[]) {
  if (!text || aliases.length === 0) return [];

  const snippets: Array<{ snippet: string; matchedAlias: string; confidence: number }> = [];
  const normalizedText = text.replace(/\s+/g, " ");

  for (const alias of aliases.filter(Boolean)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "ig");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(normalizedText)) && snippets.length < 8) {
      const start = Math.max(0, match.index - 120);
      const end = Math.min(normalizedText.length, match.index + alias.length + 120);
      snippets.push({
        snippet: normalizedText.slice(start, end).trim(),
        matchedAlias: alias,
        confidence: 0.85
      });
     }
  }

  return snippets;
}

function buildFallbackReport(sequence: string, question: string, organism: string, localScan: any, bioData: any, paperMentions: any[]) {
  const displaySymbol =
    bioData?.approvedSymbol ||
    bioData?.aliases?.find((alias: string) => /^[A-Z0-9-]{2,15}$/.test(alias));

  return {
    title: displaySymbol
      ? `Exploratory Atlas Report for ${displaySymbol}`
      : "Exploratory Atlas Report",
    summary: `This report uses a deterministic local heuristic scan to highlight candidate regions of interest for the question: "${question}". The output is exploratory and non-clinical.`,
    proteinLength: sequence.length,
    canonicalProtein: {
      uniprotAccession: bioData?.uniprotAccession,
      approvedSymbol: displaySymbol,
      proteinName: bioData?.proteinName || displaySymbol,
      organism: bioData?.organism || organism,
      taxonId: bioData?.taxonId,
      hgncId: bioData?.hgncId,
      ncbiGeneId: bioData?.ncbiGeneId,
      ensemblGeneId: bioData?.ensemblGeneId
    },
    aliases: bioData?.aliases || [],
    databaseLinks: bioData?.links || [],
    paperMentions,
    regions: localScan.suggestedRegions,
    nextSteps: [
      "Review the highlighted regions against known functional annotations.",
      "Compare these candidate regions against any available structure or domain references.",
      "Use the PDF context to decide which region to inspect first in follow-up analysis."
    ]
  };
}

function mergeUniqueByKey<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function cleanAlias(alias: unknown) {
  const value = String(alias || "").trim();
  if (!value) {
    return null;
  }
  if (/\b(?:sp|tr)\|/i.test(value) || /\b(?:OS|OX|GN|PE|SV)=/i.test(value)) {
    return null;
  }
  return value;
}

function hydrateReport(report: any, fallback: any) {
  const mergedAliases = [...(report?.aliases || []), ...(fallback.aliases || [])]
    .map(cleanAlias)
    .filter(Boolean) as string[];

  return {
    ...fallback,
    ...report,
    canonicalProtein: {
      ...fallback.canonicalProtein,
      ...(report?.canonicalProtein || {})
    },
    aliases: mergeUniqueByKey(
      mergedAliases,
      (alias) => String(alias).trim().toUpperCase()
    ),
    databaseLinks: mergeUniqueByKey(
      [...(report?.databaseLinks || []), ...(fallback.databaseLinks || [])],
      (link) => `${link?.source || ""}|${link?.id || ""}|${link?.url || ""}`
    ),
    paperMentions: mergeUniqueByKey<{ page?: number | null; snippet: string; matchedAlias: string; confidence: number }>(
      report?.paperMentions?.length ? report.paperMentions : fallback.paperMentions || [],
      (mention) => `${mention?.matchedAlias || ""}|${mention?.snippet || ""}`
    ),
    regions: report?.regions?.length ? report.regions : fallback.regions,
    nextSteps: report?.nextSteps?.length ? report.nextSteps : fallback.nextSteps
  };
}

function safeJsonParse(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) {
      return JSON.parse(fenced.trim());
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Unable to parse model JSON response");
  }
}

async function isOllamaReachable() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
}

async function runLocalModel(prompt: string) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: bioVizJsonSchema,
      options: {
        temperature: 0.2
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed with status ${res.status}`);
  }

  const data = await res.json();
  return safeJsonParse(data.response || "");
}

function extractOpenAIText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  return (payload?.output || [])
    .flatMap((item: any) => item?.content || [])
    .map((content: any) => {
      if (content?.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
      if (typeof content?.text === "string") {
        return content.text;
      }
      return "";
    })
    .join("")
    .trim();
}

async function runOpenAIModel(prompt: string, apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "BioVizReport",
          schema: bioVizJsonSchema,
          strict: true
        }
      }
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI request failed with status ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const responseText = extractOpenAIText(data);
  if (!responseText) {
    throw new Error("OpenAI response did not include output text");
  }

  return safeJsonParse(responseText);
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const openAiApiKey = process.env.OPENAI_API_KEY || "";
  const geminiApiKey = process.env.GEMINI_API_KEY || "";
  const genAI = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
  const ollamaAvailable = await isOllamaReachable();

  app.use(express.json());

  // API Route
  app.post("/api/analyze", upload.single("file"), async (req, res) => {
    try {
      const { sequence: rawSeq, question, organism = "Homo sapiens" } = req.body;
      const file = (req as any).file;

      if (!rawSeq || !question) {
        return res.status(400).json({ error: "Sequence and question are required." });
      }

      const graph = new ProvenanceGraph();
      const artInput = graph.add("raw_sequence_input", rawSeq);
      const fastaHeader = extractFastaHeader(rawSeq);
      const seq = normalizeSequence(rawSeq);
      const artNorm = graph.add("normalized_sequence", seq, [artInput.sha256]);

      // Local Logic
      const localScan = runLocalHeuristics(seq);
      const artLocal = graph.add("local_region_scan", JSON.stringify(localScan), [artNorm.sha256]);

      // External DB resolution
      const bioData: any = await resolveProtein(seq, organism, fastaHeader);
      const artBio = graph.add("protein_resolution", JSON.stringify(bioData || {}), [artNorm.sha256]);
      const aliasBundle = Array.from(
        new Set(
          [
            bioData?.approvedSymbol,
            bioData?.proteinName,
            ...(bioData?.aliases || []),
            fastaHeader
          ].filter(Boolean)
        )
      );
      let paperMentions: Array<{ page?: number; snippet: string; matchedAlias: string; confidence: number }> = [];

      let prompt = `
        You are an exploratory protein interpretation system for BioViz Tech.
        User Question: "${question}"
        
        Protein Data:
        - Sequence: ${seq}
        - Local Heuristics: ${JSON.stringify(localScan)}
        - Canonical Info: ${JSON.stringify(bioData)}
        - Aliases: ${JSON.stringify(aliasBundle)}
        - Paper Mentions: ${JSON.stringify(paperMentions.slice(0, 6))}
        
        Constraint: Return ONLY strict JSON matching this schema:
        ${JSON.stringify(bioVizJsonSchema)}
        
        Instructions:
        1. Identify the protein if possible using the canonical info.
        2. Highlight interesting regions based on the user question and local heuristics.
        3. If a PDF is provided, extract relevant mentions and snippets.
        4. Be exploratory and non-clinical.
        5. If canonical identity is weak, preserve conservative fields rather than inventing IDs.
      `;

      graph.add("gemini_prompt", prompt, [artNorm.sha256, artLocal.sha256, artBio.sha256]);

      if (file) {
        graph.add("raw_pdf", file.buffer);
        try {
          const extractedText = await extractPdfText(file.buffer, file.originalname);
          graph.add("pdf_extracted_text", extractedText, []);
          paperMentions = collectPaperMentions(extractedText, aliasBundle);
        } catch (pdfError) {
          console.error("Local PDF extraction failed:", pdfError);
        }
      }

      let parsed: any = buildFallbackReport(seq, question, organism, localScan, bioData, paperMentions);
      const fallbackReport = parsed;
      let synthesisSucceeded = false;

      if (openAiApiKey) {
        try {
          const candidate = await runOpenAIModel(prompt, openAiApiKey);
          parsed = BioVizReportSchema.parse(candidate);
          parsed = hydrateReport(parsed, fallbackReport);
          graph.add("openai_response", JSON.stringify(parsed), []);
          synthesisSucceeded = true;
        } catch (openAiError) {
          console.error("OpenAI request failed, trying next path:", openAiError);
        }
      }

      if (!synthesisSucceeded && genAI) {
        const contents: any[] = [prompt];
        let uploadedPdf: any = null;

        if (file) {
          const tempPath = path.join(os.tmpdir(), `${Date.now()}-${file.originalname}`);
          await fs.writeFile(tempPath, file.buffer);
          try {
            uploadedPdf = await genAI.files.upload({
              file: tempPath,
              config: { mimeType: file.mimetype || "application/pdf" }
            });
            graph.add("pdf_upload_ref", JSON.stringify({ mimeType: file.mimetype, name: uploadedPdf.name }), []);
            contents.push(uploadedPdf);
          } finally {
            await fs.unlink(tempPath).catch(() => {});
          }
        }

        try {
          const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
              responseMimeType: "application/json"
            }
          });
          const responseText = result.text;
          graph.add("gemini_response", responseText, []);
          parsed = BioVizReportSchema.parse(JSON.parse(responseText));
          parsed = hydrateReport(parsed, fallbackReport);
          synthesisSucceeded = true;
        } catch (geminiError) {
          console.error("Gemini request failed, using local fallback:", geminiError);
        }
      }

      if (!synthesisSucceeded && ollamaAvailable) {
        try {
          const candidate = await runLocalModel(prompt);
          parsed = BioVizReportSchema.parse(candidate);
          parsed = hydrateReport(parsed, fallbackReport);
          graph.add("local_model_response", JSON.stringify(parsed), []);
          synthesisSucceeded = true;
        } catch (ollamaError) {
          console.error("Local model request failed, using fallback:", ollamaError);
        }
      }

      // Finalize Provenance
      parsed.provenance = {
        rootHash: graph.getRootHash(),
        artifactCount: graph.artifacts.length,
      };

      res.json(parsed);
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
