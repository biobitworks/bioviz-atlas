export async function resolveProtein(sequence: string, organism: string = "Homo sapiens") {
  try {
    // Attempting a simple UniProt search by sequence fragment
    // We use a fragment to find potential matches in the public database
    const fragment = sequence.slice(0, 20);
    const res = await fetch(`https://rest.uniprot.org/uniprotkb/search?query=organism_id:9606+AND+${fragment}&format=json&size=1`);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const entry = data.results?.[0];
    if (!entry) return null;

    return {
      uniprotAccession: entry.primaryAccession,
      proteinName: entry.proteinDescription?.recommendedName?.fullName?.value,
      approvedSymbol: entry.genes?.[0]?.geneName?.value,
      organism: entry.organism?.scientificName,
      taxonId: entry.organism?.taxonId,
      aliases: entry.genes?.[0]?.synonyms?.map((s: any) => s.value) || [],
      links: [
        { 
          source: "UniProt", 
          id: entry.primaryAccession, 
          url: `https://uniprot.org/uniprot/${entry.primaryAccession}` 
        }
      ]
    };
  } catch (e) {
    console.error("Protein resolution failed:", e);
    return null;
  }
}
