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
  return input.replace(/>.*?\n/g, "").replace(/\s/g, "").toUpperCase();
}

export function runLocalHeuristics(sequence: string) {
  const regions: any[] = [];
  const len = sequence.length;

  // 1. Sliding window for complexity/charge
  const windowSize = 20;
  for (let i = 0; i <= len - windowSize; i += 10) {
    const window = sequence.slice(i, i + windowSize);
    
    // Glycine/Proline density (flexibility)
    const gCount = (window.match(/G/g) || []).length;
    const pCount = (window.match(/P/g) || []).length;
    
    if ((gCount + pCount) / windowSize > 0.4) {
      regions.push({
        start: i, 
        end: i + windowSize,
        label: "Flexible Loop / Low Complexity",
        reason: "High Glycine/Proline density detected by local heuristic scan",
        confidence: 0.75
      });
    }

    // Charged stretches
    const chargedCount = (window.match(/[RKDE]/g) || []).length;
    if (chargedCount / windowSize > 0.5) {
      regions.push({
        start: i,
        end: i + windowSize,
        label: "Highly Charged Region",
        reason: "Concentrated electrostatic potential detected",
        confidence: 0.7
      });
    }

    // Hydrophobic stretches
    const hydrophobicCount = (window.match(/[VILMFW]/g) || []).length;
    if (hydrophobicCount / windowSize > 0.6) {
      regions.push({
        start: i,
        end: i + windowSize,
        label: "Hydrophobic Cluster",
        reason: "Potential core or membrane-associating segment",
        confidence: 0.8
      });
    }
  }

  return {
    length: len,
    composition: [...new Set(sequence)].map(aa => ({ 
      aa, 
      count: (sequence.match(new RegExp(aa, 'g')) || []).length 
    })),
    suggestedRegions: regions.slice(0, 5)
  };
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
