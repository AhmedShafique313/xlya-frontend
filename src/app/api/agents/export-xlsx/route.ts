import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

// Converts a Vibe Prospecting export's CSV (a presigned xlya-dev-s3 URL) into
// an .xlsx download, entirely inside this Next.js route — the lambda that
// produces the export only ever writes CSV (see
// project_agents_screen_2026_08_30.md / project_vibe_prospecting_agent_lambda_2026_08_30.md),
// and the S3 bucket has no CORS configuration, so the browser can't fetch the
// presigned URL itself to convert it client-side. A same-origin server route
// sidesteps both: the fetch below is server-to-server (no CORS involved) and
// the response streams back as a real file download via Content-Disposition.
export const runtime = "nodejs";

// Only ever proxies xlya-dev-s3's own presigned URLs — never an arbitrary
// caller-supplied host — to avoid this becoming an open SSRF proxy.
function isAllowedExportUrl(url: URL) {
  const host = url.hostname.toLowerCase();
  return host === "xlya-dev-s3.s3.amazonaws.com" || (host.startsWith("xlya-dev-s3.s3.") && host.endsWith(".amazonaws.com"));
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  const filename = (req.nextUrl.searchParams.get("filename") || "vibe-prospecting-export").replace(/[\r\n"/\\]/g, "");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (!isAllowedExportUrl(parsedUrl)) {
    return NextResponse.json({ error: "That URL isn't a recognized export link." }, { status: 400 });
  }

  let csvText: string;
  try {
    const csvRes = await fetch(parsedUrl.toString());
    if (!csvRes.ok) {
      return NextResponse.json({ error: `Couldn't fetch the export (${csvRes.status}).` }, { status: 502 });
    }
    csvText = await csvRes.text();
  } catch (err) {
    console.error("Failed to fetch CSV export for xlsx conversion:", err);
    return NextResponse.json({ error: "Couldn't fetch the export." }, { status: 502 });
  }

  const rows = parseCsv(csvText);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");
  if (rows.length > 0) {
    sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
    sheet.addRows(rows);
  }
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}
