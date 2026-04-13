import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProvenanceGraph, normalizeSequence, runLocalHeuristics } from "./src/lib/analysis.js";
import { resolveProtein } from "./src/lib/protein-resolver.js";
import { bioVizJsonSchema } from "./src/lib/schema.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
      
      const seq = normalizeSequence(rawSeq);
      const artNorm = graph.add("normalized_sequence", seq, [artInput.sha256]);

      // Local Logic
      const localScan = runLocalHeuristics(seq);
      const artLocal = graph.add("local_region_scan", JSON.stringify(localScan), [artNorm.sha256]);

      // External DB resolution
      const bioData = await resolveProtein(seq, organism);
      const artBio = graph.add("protein_resolution", JSON.stringify(bioData || {}), [artNorm.sha256]);

      // Prepare Gemini
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      let prompt = `
        You are an exploratory protein interpretation system for BioViz Tech.
        User Question: "${question}"
        
        Protein Data:
        - Sequence: ${seq}
        - Local Heuristics: ${JSON.stringify(localScan)}
        - Canonical Info: ${JSON.stringify(bioData)}
        
        Constraint: Return ONLY strict JSON matching this schema:
        ${JSON.stringify(bioVizJsonSchema)}
        
        Instructions:
        1. Identify the protein if possible using the canonical info.
        2. Highlight interesting regions based on the user question and local heuristics.
        3. If a PDF is provided, extract relevant mentions and snippets.
        4. Be exploratory and non-clinical.
      `;

      const contents: any[] = [{ role: "user", parts: [{ text: prompt }] }];

      if (file) {
        contents[0].parts.push({
          inlineData: { 
            data: file.buffer.toString("base64"), 
            mimeType: file.mimetype 
          }
        });
        graph.add("raw_pdf", file.buffer);
      }

      const result = await model.generateContent({ contents });
      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      // Finalize Provenance
      parsed.provenance = {
        rootHash: graph.getRootHash(),
        artifactCount: graph.artifacts.length,
        trace: graph.artifacts
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
