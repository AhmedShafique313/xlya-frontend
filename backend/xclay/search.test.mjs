import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSearchResults, searchWeb } from "./search.mjs";

test("filters unsafe links and caps search evidence", () => {
  const items = [
    { title: "unsafe", url: "javascript:alert(1)" },
    ...Array.from({ length: 7 }, (_, index) => ({ title: `Result ${index}`, url: `https://example.com/${index}`, content: "evidence" })),
  ];
  const results = normalizeSearchResults(items);
  assert.equal(results.length, 5);
  assert.equal(results[0].url, "https://example.com/0");
});

test("no-key search reads Wikimedia results", async () => {
  const results = await searchWeb("OpenAI", async (url) => {
    assert.equal(url.host, "en.wikipedia.org");
    assert.equal(url.searchParams.get("gsrsearch"), "OpenAI");
    return { ok: true, json: async () => ({ query: { pages: { 1: { pageid: 1, title: "OpenAI", extract: "AI research" } } } }) };
  });
  assert.equal(results[0].title, "OpenAI");
  assert.equal(results[0].url, "https://en.wikipedia.org/?curid=1");
});

test("no-key search fails clearly when Wikimedia is unavailable", async () => {
  await assert.rejects(searchWeb("OpenAI", async () => { throw new Error("offline"); }), /No-key search is unavailable/);
});
