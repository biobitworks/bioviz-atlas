---
name: gsigmad-audit-output
description: "Audit AI-generated output for trust tier compliance. Use when reviewing any AI agent output before promotion to the KG. Checks JSON integrity, sha256 hashes, reproducibility, and PROVISIONAL artifact promotion rules."
allowed-tools:
  - Read
  - Bash
  - Grep
---

# Audit Output

Audit the latest experiment output in the specified project directory.

## Trust Tier Compliance Note (EC-03)

PROVISIONAL outputs cannot be promoted to the Knowledge Graph without human countersignature. If this audit identifies a PROVISIONAL artifact being promoted without countersignature, halt with:

```
TRUST_TIER_ERROR: PROVISIONAL artifact requires human countersignature before KG promotion.
Artifact: [path]
Required action: Governing-lane agent (Claude Code) or human PI must review and countersign.
Reference: EXTREF quarantine-to-promote policy, CANON-CORE Invariant 9
```

## Output Audit

1. Find the most recent results file(s) in `results/` (by timestamp in filename).
2. Verify required JSON fields:
   - experiment_id, run_id, timestamp_utc, status
   - validation.success (boolean) + failure reason if false
   - outputs with sha256 hashes
3. Cross-check against experiment note in `experiments/EXP_###_*.md`:
   - Do results match what the note claims?
   - Are all output files referenced actually present?
   - Are sha256 hashes correct?
4. Check for invented/fabricated data patterns:
   - Suspiciously round numbers
   - Values that match defaults or placeholders
   - Results that appear without a script execution

## Reproducibility Audit

1. Verify run-id-specific outputs exist (no overwrite-prone fixed filenames).
2. Verify sha256 hashes match actual file contents.
3. Check that the script can be replayed:
   - `python scripts/exp###_name.py` — does it exist and have correct imports?
   - Are all input data files referenced in the script actually present?
4. Check for immutable artifact index — generate one if missing:
   - List all results files for this EXP with: filename, sha256, size, timestamp

## Report Back

- Audit status: PASS/FAIL
- Issues found (list)
- Missing files or broken references
- Reproducibility score (all inputs present / script runnable / hashes valid)
- Immutable artifact index (if generated)
- Trust tier compliance: PROVISIONAL artifacts requiring countersignature (if any)
