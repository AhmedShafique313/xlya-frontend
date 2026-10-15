"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { ArrowLeft, Download, FileSpreadsheet, Play, RotateCcw, Search, Square, UploadCloud, X } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import { useLandingTheme } from "@/components/landingPage/landingTheme";
import { streamXclayRow, XclayError, type XclayEvent } from "@/lib/api/xclayStream";

type Row = Record<string, string>;
type RowResult = { state: "queued" | "working" | "done" | "partial" | "error"; stage: string; values?: Row; sources?: { title: string; url: string }[]; error?: string };
const MAX_ROWS = 500;
const PAGE_SIZE = 50;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

async function parseSpreadsheet(file: File): Promise<{ columns: string[]; rows: Row[] }> {
  if (file.size > MAX_FILE_BYTES || file.size === 0) throw new Error("Choose a nonempty file under 10 MB.");
  if (/\.csv$/i.test(file.name)) {
    const text = await file.text();
    const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (header) => header.trim() });
    const fatalError = parsed.errors.find((error) => error.code !== "UndetectableDelimiter");
    if (fatalError) throw new Error(`CSV parse error: ${fatalError.message}`);
    return { columns: parsed.meta.fields || [], rows: parsed.data };
  }
  if (/\.xlsx$/i.test(file.name)) {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load((await file.arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("The workbook has no sheets.");
    const columns = (sheet.getRow(1).values as (string | undefined)[]).slice(1).map((value) => String(value ?? "").trim());
    const rows: Row[] = [];
    sheet.eachRow((line, index) => {
      if (index === 1) return;
      const row: Row = {};
      columns.forEach((column, i) => { row[column] = String(line.getCell(i + 1).text ?? ""); });
      if (Object.values(row).some((value) => value.trim())) rows.push(row);
    });
    return { columns, rows };
  }
  throw new Error("Choose a CSV or XLSX file.");
}

export default function XclayPage() {
  const projectId = useAppSelector((state) => state.auth.project?.project_id);
  return <XclayWorkspace key={projectId ?? "none"} />;
}

function XclayWorkspace() {
  const { t } = useLandingTheme();
  const project = useAppSelector((state) => state.auth.project);
  const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);
  const [fileName, setFileName] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [instruction, setInstruction] = useState("");
  const [newColumns, setNewColumns] = useState("Company summary, Industry, Social media");
  const [results, setResults] = useState<RowResult[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [testMode, setTestMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const outputColumns = useMemo(() => newColumns.split(",").map((value) => value.trim()).filter(Boolean), [newColumns]);
  const completed = results.filter((item) => item.state === "done").length;
  const partial = results.filter((item) => item.state === "partial").length;
  const failed = results.filter((item) => item.state === "error").length;
  const panel: React.CSSProperties = { background: t.card, border: `1px solid ${t.border}`, borderRadius: 8 };
  const input: React.CSSProperties = { color: t.fg, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6 };

  const stop = () => {
    runIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
  };
  useEffect(() => () => abortRef.current?.abort(), []);

  const onFile = async (file?: File) => {
    if (!file) return;
    stop();
    setError("");
    try {
      const parsed = await parseSpreadsheet(file);
      if (!parsed.columns.length || !parsed.rows.length) throw new Error("The sheet needs a header and at least one row.");
      if (parsed.columns.length > 40) throw new Error("The sheet can have at most 40 input columns.");
      if (parsed.columns.some((name) => !name) || new Set(parsed.columns).size !== parsed.columns.length) throw new Error("Column headers must be unique and nonempty.");
      if (parsed.rows.length > MAX_ROWS) throw new Error(`Xclay currently supports up to ${MAX_ROWS} rows per file.`);
      setFileName(file.name);
      setColumns(parsed.columns);
      setRows(parsed.rows);
      setResults(parsed.rows.map(() => ({ state: "queued", stage: "Ready" })));
      setActiveRow(null);
      setPage(0);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read this file."); }
  };

  const run = async (test: boolean, retryFailed = false) => {
    if (!accessToken || !project?.project_id || !rows.length || running) return;
    if (!instruction.trim()) { setError("Describe what Xclay should find."); return; }
    if (!outputColumns.length || outputColumns.length > 8 || new Set(outputColumns.map((value) => value.toLowerCase())).size !== outputColumns.length) {
      setError("Enter 1 to 8 unique output columns, separated by commas."); return;
    }
    if (outputColumns.some((name) => columns.some((column) => column.toLowerCase() === name.toLowerCase()))) { setError("New columns must have different names from input columns."); return; }
    setError("");
    setTestMode(test);
    const controller = new AbortController();
    abortRef.current = controller;
    const runId = ++runIdRef.current;
    setRunning(true);
    const work = rows.map((_, index) => index).filter((index) => retryFailed ? ["error", "partial"].includes(results[index]?.state) : results[index]?.state !== "done").slice(0, test ? 5 : undefined);
    let cursor = 0;
    const update = (index: number, change: Partial<RowResult>) => setResults((current) => {
      const next = current.slice();
      next[index] = { ...next[index], ...change };
      return next;
    });
    const worker = async () => {
      while (cursor < work.length && !controller.signal.aborted && runIdRef.current === runId) {
        const index = work[cursor++];
        update(index, { state: "working", stage: "Connecting", error: undefined });
        setActiveRow((current) => current ?? index);
        let writing = false;
        try {
          const response = await streamXclayRow(accessToken, { project_id: project.project_id, row: rows[index], instruction: instruction.trim(), outputColumns }, (event: XclayEvent) => {
            if (runIdRef.current !== runId) return;
            if (event.type === "step" && event.status === "started") update(index, { stage: event.label });
            if (event.type === "message_delta" && !writing) {
              writing = true;
              update(index, { stage: "Writing answers" });
            }
          }, controller.signal);
          if (runIdRef.current === runId) update(index, { state: response.incompleteColumns.length ? "partial" : "done", stage: response.incompleteColumns.length ? "Needs review" : "Complete", values: response.values, sources: response.sources, error: response.incompleteColumns.length ? `No supported answer for: ${response.incompleteColumns.join(", ")}.` : undefined });
        } catch (cause) {
          if (controller.signal.aborted || runIdRef.current !== runId) return;
          update(index, { state: "error", stage: "Failed", sources: cause instanceof XclayError ? cause.sources : undefined, error: cause instanceof Error ? cause.message : "Research failed." });
        }
      }
    };
    await Promise.all([worker(), worker()]);
    if (runIdRef.current === runId) { setRunning(false); abortRef.current = null; }
  };

  const download = () => {
    const headers = [...columns, ...outputColumns];
    const csvRows = rows.map((row, index) => headers.map((header) => row[header] ?? results[index]?.values?.[header] ?? ""));
    const csv = Papa.unparse({ fields: headers, data: csvRows });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName.replace(/\.[^.]+$/, "") || "xclay"}_enriched.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="min-h-screen px-4 pb-10 pt-24 md:px-8" style={{ color: t.fg }}>
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/dashboard/apps" className="mb-3 inline-flex items-center gap-1.5 text-xs" style={{ color: t.fgMid }}><ArrowLeft size={14} /> Apps</Link>
          <h1 className="text-3xl font-semibold">Xclay</h1>
          <p className="mt-1 text-sm" style={{ color: t.fgMid }}>Research rows for {project?.project_name || "your selected project"}.</p>
        </div>
        <button type="button" disabled={!rows.length || !(completed + partial)} onClick={download} className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium disabled:opacity-40" style={{ background: t.gold, color: t.isDark ? "#111" : "#fff" }}><Download size={16} /> Export CSV</button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="self-start p-5" style={panel}>
          <h2 className="text-sm font-semibold">Research setup</h2>
          <p className="mt-1 text-xs" style={{ color: t.fgMid }}>For the current project: {project?.project_name || "Select a project"}</p>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => { void onFile(event.target.files?.[0]); event.target.value = ""; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={running} className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-5 text-xs disabled:opacity-40" style={{ borderColor: t.gold, color: t.gold, background: t.goldDim }}><UploadCloud size={17} /> {fileName || "Import CSV or XLSX"}</button>
          {rows.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: t.fgMid }}><FileSpreadsheet size={13} /> {rows.length} rows, {columns.length} columns</p>}
          <label className="mt-6 block text-xs font-medium" htmlFor="xclay-instruction">What should Xclay find?</label>
          <textarea id="xclay-instruction" value={instruction} disabled={running} onChange={(event) => { setInstruction(event.target.value); setResults(rows.map(() => ({ state: "queued", stage: "Ready" }))); }} rows={4} maxLength={1000} placeholder="Summarize each company and identify its industry from available sources." className="mt-2 w-full resize-y p-3 text-sm outline-none focus:ring-1 disabled:opacity-60" style={input} />
          <label className="mt-5 block text-xs font-medium" htmlFor="xclay-columns">New columns</label>
          <input id="xclay-columns" value={newColumns} disabled={running} onChange={(event) => { setNewColumns(event.target.value); setResults(rows.map(() => ({ state: "queued", stage: "Ready" }))); }} placeholder="Company summary, Industry, Social media" className="mt-2 w-full px-3 py-2.5 text-sm outline-none focus:ring-1 disabled:opacity-60" style={input} />
          <p className="mt-1 text-[11px]" style={{ color: t.fgFaint }}>Separate up to 8 column names with commas.</p>
          {error && <p role="alert" className="mt-4 text-xs text-red-400">{error}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            {running ? <button type="button" onClick={stop} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium" style={{ border: `1px solid ${t.border}` }}><Square size={13} /> Stop</button> : <>
              <button type="button" disabled={!rows.length || !project || !accessToken} onClick={() => void run(true)} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium disabled:opacity-40" style={{ border: `1px solid ${t.border}` }}><Search size={14} /> Test 5 rows</button>
              <button type="button" disabled={!rows.length || !project || !accessToken} onClick={() => void run(false)} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium disabled:opacity-40" style={{ background: t.gold, color: t.isDark ? "#111" : "#fff" }}><Play size={14} /> Run all</button>
              {(failed + partial) > 0 && <button type="button" onClick={() => void run(false, true)} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium" style={{ border: `1px solid ${t.border}` }}><RotateCcw size={14} /> Retry incomplete</button>}
            </>}
          </div>
          <p className="mt-5 text-[11px] leading-5" style={{ color: t.fgFaint }}>Sources come from company websites and linked social profiles, with Wikipedia as a fallback. Results stay in this browser session. Verify answers before using them.</p>
        </aside>

        <main className="min-w-0 overflow-hidden" style={panel}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4" style={{ borderColor: t.border }}>
            <div><h2 className="text-sm font-semibold">Results</h2><p className="mt-0.5 text-xs" style={{ color: t.fgMid }}>{rows.length ? `${completed} complete, ${partial} need review, ${failed} failed, ${rows.length} total` : "Import a sheet to begin"}</p></div>
            {running && <span className="text-xs" style={{ color: t.gold }}>{testMode ? "Testing" : "Running"}</span>}
          </div>
          {rows.length ? <>
            <div className="max-h-[650px] overflow-auto">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10" style={{ background: t.cardDeep }}><tr><th className="w-16 px-3 py-3 font-medium">#</th><th className="min-w-36 px-3 py-3 font-medium">Status</th>{columns.map((column) => <th key={column} className="min-w-40 px-3 py-3 font-medium">{column}</th>)}{outputColumns.map((column) => <th key={column} className="min-w-44 px-3 py-3 font-medium" style={{ color: t.gold }}>{column}</th>)}</tr></thead>
                <tbody>{rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((row, offset) => {
                  const index = page * PAGE_SIZE + offset;
                  return <tr key={index} onClick={() => setActiveRow(index)} className="cursor-pointer border-t" style={{ borderColor: t.borderSubtle, background: activeRow === index ? t.goldDim : "transparent" }}><td className="px-3 py-3" style={{ color: t.fgFaint }}>{index + 1}</td><td className="px-3 py-3" style={{ color: results[index]?.state === "error" ? "#e38a8a" : results[index]?.state === "done" ? t.gold : results[index]?.state === "partial" ? "#e8bf73" : t.fgMid }}>{results[index]?.stage || "Ready"}</td>{columns.map((column) => <td key={column} className="max-w-64 truncate px-3 py-3" title={row[column]}>{row[column]}</td>)}{outputColumns.map((column) => <td key={column} className="max-w-64 truncate px-3 py-3" title={results[index]?.values?.[column] || ""}>{results[index]?.values?.[column] || ""}</td>)}</tr>;
                })}</tbody>
              </table>
            </div>
            {rows.length > PAGE_SIZE && <div className="flex items-center justify-between border-t px-5 py-3 text-xs" style={{ borderColor: t.border, color: t.fgMid }}>
              <span>{page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length}</span>
              <div className="flex gap-3">
                <button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)} className="disabled:opacity-40">Previous</button>
                <button type="button" disabled={(page + 1) * PAGE_SIZE >= rows.length} onClick={() => setPage((current) => current + 1)} className="disabled:opacity-40">Next</button>
              </div>
            </div>}
            {activeRow !== null && <div className="border-t p-5" style={{ borderColor: t.border }}>
              <div className="flex items-center justify-between"><h3 className="text-xs font-semibold">Row {activeRow + 1}</h3><button type="button" onClick={() => setActiveRow(null)} aria-label="Close row details" style={{ color: t.fgMid }}><X size={16} /></button></div>
              {results[activeRow]?.error && <p className="mt-2 text-xs text-red-400">{results[activeRow].error}</p>}
              {results[activeRow]?.values && <div className="mt-3 grid gap-2 sm:grid-cols-2">{outputColumns.map((column) => <div key={column}><p className="text-[11px]" style={{ color: t.fgFaint }}>{column}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5">{results[activeRow].values?.[column] || "No supported answer"}</p></div>)}</div>}
              {!!results[activeRow]?.sources?.length && <div className="mt-4"><p className="text-[11px]" style={{ color: t.fgFaint }}>Sources</p><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">{results[activeRow].sources?.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="max-w-64 truncate text-xs underline" style={{ color: t.gold }}>{source.title || source.url}</a>)}</div></div>}
            </div>}
          </> : <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center" style={{ color: t.fgMid }}><FileSpreadsheet size={28} /><p className="mt-3 text-sm">Your research sheet will appear here.</p></div>}
        </main>
      </div>
    </div>
  </div>;
}
