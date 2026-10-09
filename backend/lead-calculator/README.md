# Lead Calculator Lambda source

`index.mjs` and `funnel.mjs` were recovered from the local Lead Calculator package created for the existing `xlya-dev-users-lead-calculator-lambda`, then compared with the live package. `csv.mjs` adds CSV analysis. These sources were deployed to the Lambda on 2026-10-09 (deployed code SHA-256: `hKCHMVVAq26gW0H1PHoz61meR2Hksy+jOU2790shm98=`).

The existing `{ action: "calculate", schemaVersion: 1, scenario }` contract remains available. New actions:

- `analyze_csv`: `{ action, schemaVersion: 1, csv: { fileName, text } }` returns `csvAnalysis`.
- `calculate_from_csv`: the same `csv` plus a forward `scenario`; the Lambda replaces `startingLeads` with the count of unique CSV rows and returns both `csvAnalysis` and the existing funnel `result`.

CSV input is limited to 4 MiB and 50,000 rows. Headers and quoted fields are parsed in memory. Current Vibe Prospecting `prospect_*` and `contact_*` columns are recognized. Duplicate contacts are matched by email, prospect ID, profile URL, or name plus company; company-only exports may deduplicate by website or company. No CSV rows are returned or stored. Field coverage is observed from the unique rows. Downstream conversions and revenue remain assumption-based estimates.

Run `node --test backend/lead-calculator/*.test.mjs` from the repository root. Deploy only `index.mjs`, `funnel.mjs`, and `csv.mjs` in the Lambda zip.
