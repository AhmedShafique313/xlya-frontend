import test from "node:test";
import assert from "node:assert/strict";
import { buildMessages, buildSearchQuery, fillSocialColumns, isSocialColumn, parseAnswer, parseRequest, readSseLines, RequestError } from "./core.mjs";

test("accepts one scoped enrichment request", () => {
  const request = parseRequest({ body: JSON.stringify({ action: "enrich", schemaVersion: 1, project_id: "p-1", instruction: "Find the CEO", outputColumns: ["CEO"], row: { Company: "Acme", Website: "acme.com" } }) });
  assert.equal(request.projectId, "p-1");
  assert.match(buildSearchQuery(request.row, request.instruction), /Acme.*acme.com/);
  assert.equal(buildMessages({ ...request, project: { project_name: "Xlya" }, sources: [] })[0].role, "system");
});

test("search query focuses on the company, not the person's contact fields", () => {
  const query = buildSearchQuery({ prospect_company_name: "Bibetta", prospect_company_website: "bibetta.com", prospect_full_name: "Fiona Brown", contact_professional_email: "fiona@example.com" }, "Find company summary");
  assert.equal(query, "Bibetta bibetta.com");
});

test("rejects oversized or malformed input", () => {
  assert.throws(() => parseRequest({ body: JSON.stringify({ action: "enrich", schemaVersion: 1, project_id: "p-1", instruction: "Go", outputColumns: ["A"], row: { nested: {} } }) }), RequestError);
  assert.throws(() => parseRequest({ body: "{" }), RequestError);
});

test("maps JSON answers to requested columns only", () => {
  assert.deepEqual(parseAnswer('Here: {"CEO":"Jane","extra":"ignore"}', ["CEO", "Other"]), { CEO: "Jane", Other: "" });
  assert.throws(() => parseAnswer("unknown", ["CEO"]), RequestError);
});

test("social columns use observed links, not model guesses", () => {
  assert.equal(isSocialColumn("Social media"), true);
  assert.equal(isSocialColumn("Company LinkedIn URL"), true);
  assert.equal(isSocialColumn("Company summary"), false);
  const values = fillSocialColumns({ "Social media": "invented", Instagram: "invented" }, ["Social media", "Instagram"], [{ platform: "LinkedIn", url: "https://linkedin.com/company/acme" }]);
  assert.equal(values["Social media"], "LinkedIn: https://linkedin.com/company/acme");
  assert.equal(values.Instagram, "");
});

test("retains split SSE lines between network chunks", () => {
  const first = readSseLines("", 'data: {"choices":[{"delta":{"content":"Hi"}}]}\n' + 'data: {"cho');
  assert.equal(first.lines.length, 1);
  const second = readSseLines(first.remainder, 'ices":[{"delta":{"content":"!"}}]}\n');
  assert.match(second.lines[0], /"!"/);
});
