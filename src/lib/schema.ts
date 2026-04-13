import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const BioVizReportSchema = z.object({
  title: z.string(),
  summary: z.string(),
  proteinLength: z.number(),
  canonicalProtein: z.object({
    uniprotAccession: z.string().optional(),
    approvedSymbol: z.string().optional(),
    proteinName: z.string().optional(),
    organism: z.string().optional(),
    taxonId: z.number().optional(),
    hgncId: z.string().optional(),
    ncbiGeneId: z.string().optional(),
    ensemblGeneId: z.string().optional(),
  }),
  aliases: z.array(z.string()),
  databaseLinks: z.array(z.object({
    source: z.string(),
    id: z.string(),
    url: z.string().optional()
  })),
  paperMentions: z.array(z.object({
    page: z.number().optional(),
    snippet: z.string(),
    matchedAlias: z.string(),
    confidence: z.number()
  })),
  regions: z.array(z.object({
    start: z.number(),
    end: z.number(),
    label: z.string(),
    reason: z.string(),
    confidence: z.number()
  })),
  nextSteps: z.array(z.string()),
  provenance: z.object({
    rootHash: z.string(),
    artifactCount: z.number()
  })
});

export type BioVizReport = z.infer<typeof BioVizReportSchema>;
export const bioVizJsonSchema = zodToJsonSchema(BioVizReportSchema as any, { name: "BioVizReport" });
