import { createHash } from "crypto";

export interface Artifact {
  id: string;
  type: string;
  sha256: string;
  parents: string[];
  createdAt: number;
  metadata: any;
}

export function generateHash(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export function normalizeSequence(input: string): string {
  // Remove FASTA headers and whitespace
  return input
    .replace(/>.*?(?:\r?\n|$)/g, "")
    .replace(/\s/g, "")
    .toUpperCase()
    .replace(/[^ACDEFGHIKLMNPQRSTVWYBXZJUO]/g, "");
}

export function extractFastaHeader(input: string): string | null {
  const firstLine = input.split(/\r?\n/, 1)[0]?.trim();
  return firstLine?.startsWith(">") ? firstLine.slice(1).trim() : null;
}

export function runLocalHeuristics(sequence: string) {
  const regions: any[] = [];
  const len = sequence.length;
  const scoredWindows: Array<{ start: number; end: number; score: number; label: string; reason: string; confidence: number }> = [];

  // 1. Sliding window for complexity/charge
  const windowSize = 20;
  for (let i = 0; i <= len - windowSize; i += 10) {
    const window = sequence.slice(i, i + windowSize);
    
    // Glycine/Proline density (flexibility)
    const gCount = (window.match(/G/g) || []).length;
    const pCount = (window.match(/P/g) || []).length;
    
    if ((gCount + pCount) / windowSize > 0.4) {
      const region = {
        start: i + 1,
        end: i + windowSize,
        label: "Flexible Loop / Low Complexity",
        reason: "High Glycine/Proline density detected by local heuristic scan",
        confidence: 0.75
      };
      regions.push(region);
      scoredWindows.push({ ...region, score: (gCount + pCount) / windowSize });
    }

    // Charged stretches
    const chargedCount = (window.match(/[RKDE]/g) || []).length;
    if (chargedCount / windowSize > 0.5) {
      const region = {
        start: i + 1,
        end: i + windowSize,
        label: "Highly Charged Region",
        reason: "Concentrated electrostatic potential detected",
        confidence: 0.7
      };
      regions.push(region);
      scoredWindows.push({ ...region, score: chargedCount / windowSize });
    }

    // Hydrophobic stretches
    const hydrophobicCount = (window.match(/[VILMFW]/g) || []).length;
    if (hydrophobicCount / windowSize > 0.6) {
      const region = {
        start: i + 1,
        end: i + windowSize,
        label: "Hydrophobic Cluster",
        reason: "Potential core or membrane-associating segment",
        confidence: 0.8
      };
      regions.push(region);
      scoredWindows.push({ ...region, score: hydrophobicCount / windowSize });
    }

    const fallbackScore = ((gCount + pCount) * 0.9 + chargedCount * 0.8 + hydrophobicCount) / windowSize;
    scoredWindows.push({
      start: i + 1,
      end: i + windowSize,
      score: fallbackScore,
      label: "Candidate Region of Interest",
      reason: "Top-ranked local window from a composition-based exploratory scan",
      confidence: Math.min(0.85, Math.max(0.45, fallbackScore)),
    });
  }

  const uniqueRegions = dedupeRegions(regions);
  if (uniqueRegions.length === 0) {
    uniqueRegions.push(
      ...scoredWindows
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(3, scoredWindows.length))
        .map(({ score, ...region }) => region)
    );
  }

  return {
    length: len,
    composition: [...new Set(sequence)].map(aa => ({ 
      aa, 
      count: (sequence.match(new RegExp(aa, 'g')) || []).length 
    })),
    suggestedRegions: dedupeRegions(uniqueRegions).slice(0, 5)
  };
}

function dedupeRegions(regions: any[]) {
  const seen = new Set<string>();
  return regions.filter((region) => {
    const key = `${region.start}-${region.end}-${region.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class ProvenanceGraph {
  artifacts: Artifact[] = [];

  add(type: string, content: string | Buffer, parents: string[] = [], metadata: any = {}): Artifact {
    const sha256 = generateHash(content);
    const artifact: Artifact = {
      id: `art_${Math.random().toString(36).substr(2, 9)}`,
      type, 
      sha256, 
      parents, 
      createdAt: Date.now(), 
      metadata
    };
    this.artifacts.push(artifact);
    return artifact;
  }

  getRootHash(): string {
    // Sort hashes to ensure deterministic root hash
    const allHashes = this.artifacts.map(a => a.sha256).sort().join("|");
    return generateHash(allHashes);
  }
}
