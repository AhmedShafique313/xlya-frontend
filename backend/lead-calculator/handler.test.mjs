import assert from "node:assert/strict";
import test from "node:test";

globalThis.awslambda = {
  streamifyResponse: (handler) => handler,
  HttpResponseStream: { from: (stream) => stream },
};
globalThis.fetch = async () => ({ ok: true, json: async () => ({ UserAttributes: [{ Name: "sub", Value: "test-user" }] }) });
const { handler } = await import("./index.mjs");

async function invoke(body) {
  const chunks = [];
  const stream = { write: (chunk) => chunks.push(chunk), end: () => {} };
  await handler({ headers: { authorization: "Bearer test-token" }, body: JSON.stringify(body) }, stream);
  return chunks.join("").trim().split("\n").map(JSON.parse).at(-1);
}

const csv = { fileName: "vibe.csv", text: "Email,Company,Phone\nada@example.com,Acme,123\nada@example.com,Acme,123\ngr ace@example.com,Other," };

test("CSV analysis returns counts and no row data", async () => {
  const result = await invoke({ action: "analyze_csv", schemaVersion: 1, csv });
  assert.equal(result.statusCode, 200);
  assert.equal(result.csvAnalysis.uniqueLeads, 2);
  assert.equal(result.csvAnalysis.duplicatesRemoved, 1);
  assert.equal(JSON.stringify(result).includes("ada@example.com"), false);
});

test("CSV calculation uses deduplicated leads without changing manual calculation", async () => {
  const scenario = {
    mode: "forward", periodMonths: 3, revenue: { type: "one_time", amount: 1000 },
    stages: [{ name: "Imported", conversionRate: 0.5 }, { name: "Customer" }],
  };
  const imported = await invoke({ action: "calculate_from_csv", schemaVersion: 1, scenario, csv });
  assert.equal(imported.statusCode, 200);
  assert.equal(imported.result.leads, 2);
  assert.equal(imported.result.expectedRevenue, 1000);
  const manual = await invoke({ action: "calculate", schemaVersion: 1, scenario: { ...scenario, startingLeads: 10 } });
  assert.equal(manual.statusCode, 200);
  assert.equal(manual.result.leads, 10);
});
