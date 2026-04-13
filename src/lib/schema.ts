import { z } from "zod";

export const BioVizReportSchema = z.object({
  title: z.string(),
  summary: z.string(),
  proteinLength: z.number(),
  canonicalProtein: z.object({
    uniprotAccession: z.string().nullable().optional(),
    approvedSymbol: z.string().nullable().optional(),
    proteinName: z.string().nullable().optional(),
    organism: z.string().nullable().optional(),
    taxonId: z.number().nullable().optional(),
    hgncId: z.string().nullable().optional(),
    ncbiGeneId: z.string().nullable().optional(),
    ensemblGeneId: z.string().nullable().optional(),
  }),
  aliases: z.array(z.string()),
  databaseLinks: z.array(z.object({
    source: z.string(),
    id: z.string(),
    url: z.string().nullable().optional()
  })),
  paperMentions: z.array(z.object({
    page: z.number().nullable().optional(),
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
  }).optional()
});

export type BioVizReport = z.infer<typeof BioVizReportSchema>;
export const bioVizJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    proteinLength: { type: "number" },
    canonicalProtein: {
      type: "object",
      additionalProperties: false,
      properties: {
        uniprotAccession: { type: ["string", "null"] },
        approvedSymbol: { type: ["string", "null"] },
        proteinName: { type: ["string", "null"] },
        organism: { type: ["string", "null"] },
        taxonId: { type: ["number", "null"] },
        hgncId: { type: ["string", "null"] },
        ncbiGeneId: { type: ["string", "null"] },
        ensemblGeneId: { type: ["string", "null"] }
      },
      required: [
        "uniprotAccession",
        "approvedSymbol",
        "proteinName",
        "organism",
        "taxonId",
        "hgncId",
        "ncbiGeneId",
        "ensemblGeneId"
      ]
    },
    aliases: {
      type: "array",
      items: { type: "string" }
    },
    databaseLinks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          source: { type: "string" },
          id: { type: "string" },
          url: { type: ["string", "null"] }
        },
        required: ["source", "id", "url"]
      }
    },
    paperMentions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          page: { type: ["number", "null"] },
          snippet: { type: "string" },
          matchedAlias: { type: "string" },
          confidence: { type: "number" }
        },
        required: ["page", "snippet", "matchedAlias", "confidence"]
      }
    },
    regions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          start: { type: "number" },
          end: { type: "number" },
          label: { type: "string" },
          reason: { type: "string" },
          confidence: { type: "number" }
        },
        required: ["start", "end", "label", "reason", "confidence"]
      }
    },
    nextSteps: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "title",
    "summary",
    "proteinLength",
    "canonicalProtein",
    "aliases",
    "databaseLinks",
    "paperMentions",
    "regions",
    "nextSteps"
  ]
} as const;
