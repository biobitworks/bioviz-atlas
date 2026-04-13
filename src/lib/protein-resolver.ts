const KNOWN_PUBLIC_PROTEINS = [
  {
    uniprotAccession: "P01275",
    approvedSymbol: "GCG",
    proteinName: "Pro-glucagon",
    aliases: [
      "GLP-1",
      "GLP1",
      "GLP-1 (7-37)",
      "GLP-1(7-37)",
      "Glucagon-like peptide 1",
      "Glucagon-like peptide 1(7-37)",
      "GCG",
      "Pro-glucagon",
      "Proglucagon"
    ],
    sequence: "HAEGTFTSDVSSYLEGQAAKEFIAWLVKGRG"
  }
];

function normalizeAliasKey(value: string) {
  return value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function mergeAliases(...groups: Array<Array<string | undefined> | undefined>) {
  return Array.from(
    new Set(
      groups
        .flat()
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
}

function parseHeaderForIdentity(header: string | null, organism: string) {
  if (!header) return null;

  const cleanHeader = header.replace(/^>\s*/, "").trim();
  const swissProtMatch = cleanHeader.match(/\b(?:sp|tr)\|([A-Z0-9]+)\|([A-Z0-9_]+)/i);
  const swissProtDisplayName = cleanHeader.match(
    /^(?:sp|tr)\|[A-Z0-9]+\|[A-Z0-9_]+\s+(.+?)(?:\s+OS=|\s+OX=|\s+GN=|\s+PE=|\s+SV=|$)/i
  )?.[1];
  const uniprotAccession = swissProtMatch?.[1];
  const entryName = swissProtMatch?.[2];
  const accessionDerivedSymbol = entryName?.split("_")[0];
  const baseName = swissProtDisplayName?.trim() || cleanHeader;
  const simplifiedName = baseName
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(Human|Homo sapiens)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const normalizedAlias = simplifiedName.replace(/\s+/g, " ").trim();
  const headerDerivedSymbol = normalizedAlias
    .split(/[\s(]/)[0]
    ?.replace(/[,:;]+$/, "")
    .trim();
  const approvedSymbol = accessionDerivedSymbol || headerDerivedSymbol;
  const aliasCandidates = mergeAliases([
    approvedSymbol,
    normalizedAlias,
    normalizedAlias.replace(/-/g, ""),
    normalizedAlias.replace(/\s+/g, ""),
    swissProtMatch ? undefined : cleanHeader
  ]);

  return {
    uniprotAccession,
    approvedSymbol,
    proteinName: swissProtDisplayName?.trim() || cleanHeader,
    organism,
    aliases: aliasCandidates,
    links: uniprotAccession
      ? [
          {
            source: "UniProt",
            id: uniprotAccession,
            url: `https://www.uniprot.org/uniprotkb/${uniprotAccession}`
          }
        ]
      : []
  };
}

function findKnownPublicProtein(header: string | null, aliases: string[], sequence: string) {
  const normalizedCandidates = new Set(
    [header || "", ...aliases]
      .map((value) => normalizeAliasKey(value))
      .filter(Boolean)
  );
  const normalizedSequence = sequence.toUpperCase();

  return KNOWN_PUBLIC_PROTEINS.find((entry) => {
    if (entry.sequence === normalizedSequence) return true;
    return entry.aliases.some((alias) => normalizedCandidates.has(normalizeAliasKey(alias)));
  });
}

function extractCrossReference(entry: any, database: string) {
  return entry.uniProtKBCrossReferences?.find((ref: any) => ref.database === database);
}

function buildResolvedProtein(entry: any, fallback: any = {}) {
  const hgnc = extractCrossReference(entry, "HGNC");
  const geneId = extractCrossReference(entry, "GeneID");
  const ensembl = extractCrossReference(entry, "Ensembl");
  const containedAliases =
    entry.proteinDescription?.contains?.flatMap((item: any) => [
      item.recommendedName?.fullName?.value,
      ...(item.recommendedName?.shortNames?.map((shortName: any) => shortName.value) || []),
      ...(item.alternativeNames?.map((altName: any) => altName.fullName?.value) || [])
    ]) || [];

  return {
    uniprotAccession: entry.primaryAccession || fallback.uniprotAccession,
    proteinName:
      entry.proteinDescription?.recommendedName?.fullName?.value || fallback.proteinName,
    approvedSymbol: entry.genes?.[0]?.geneName?.value || fallback.approvedSymbol,
    organism: entry.organism?.scientificName || fallback.organism,
    taxonId: entry.organism?.taxonId || fallback.taxonId,
    hgncId: hgnc?.id || fallback.hgncId,
    ncbiGeneId: geneId?.id || fallback.ncbiGeneId,
    ensemblGeneId:
      ensembl?.properties?.find((property: any) => property.key === "GeneId")?.value ||
      fallback.ensemblGeneId,
    aliases: mergeAliases(
      entry.genes?.[0]?.synonyms?.map((synonym: any) => synonym.value) || [],
      containedAliases,
      fallback.aliases || []
    ),
    links: mergeAliases(
      (fallback.links || []).map((link: any) => `${link.source}|${link.id}|${link.url || ""}`),
      [
        `UniProt|${entry.primaryAccession || fallback.uniprotAccession}|https://www.uniprot.org/uniprotkb/${entry.primaryAccession || fallback.uniprotAccession}`,
        hgnc?.id ? `HGNC|${hgnc.id}|https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/${hgnc.id}` : undefined,
        geneId?.id ? `NCBI Gene|${geneId.id}|https://www.ncbi.nlm.nih.gov/gene/${geneId.id}` : undefined
      ]
    ).map((value) => {
      const [source, id, url] = value.split("|");
      return { source, id, url };
    })
  };
}

async function fetchUniProtEntry(accession: string, fallback: any) {
  const res = await fetch(`https://rest.uniprot.org/uniprotkb/${accession}.json`);
  if (!res.ok) {
    return null;
  }

  const entry = await res.json();
  return buildResolvedProtein(entry, fallback);
}

export async function resolveProtein(sequence: string, organism: string = "Homo sapiens", header: string | null = null) {
  try {
    const parsed = parseHeaderForIdentity(header, organism);
    const knownPublicProtein = findKnownPublicProtein(header, parsed?.aliases || [], sequence);

    if (parsed?.uniprotAccession) {
      const resolved = await fetchUniProtEntry(parsed.uniprotAccession, parsed);
      if (resolved) {
        return resolved;
      }
      return parsed;
    }

    if (knownPublicProtein) {
      const seeded = {
        ...parsed,
        ...knownPublicProtein,
        organism: parsed?.organism || organism,
        aliases: mergeAliases(parsed?.aliases || [], knownPublicProtein.aliases),
        links: [
          {
            source: "UniProt",
            id: knownPublicProtein.uniprotAccession,
            url: `https://www.uniprot.org/uniprotkb/${knownPublicProtein.uniprotAccession}`
          }
        ]
      };
      const resolved = await fetchUniProtEntry(knownPublicProtein.uniprotAccession, seeded);
      return resolved || seeded;
    }

    return parsed || {
      organism,
      aliases: [],
      links: []
    };
  } catch (e) {
    console.error("Protein resolution failed:", e);
    return {
      organism,
      aliases: [],
      links: []
    };
  }
}
