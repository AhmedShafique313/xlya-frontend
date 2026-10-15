import test from "node:test";
import assert from "node:assert/strict";
import { companyWebsite, companyWebsiteEvidence, isPublicIp, parseCompanyPage } from "./website.mjs";

test("uses the company website and rejects unsafe hosts", () => {
  assert.equal(companyWebsite({ prospect_company_website: "bibetta.com/products" }), "https://bibetta.com/");
  assert.equal(companyWebsite({ website: "http://127.0.0.1/admin" }), null);
  assert.equal(isPublicIp("127.0.0.1"), false);
  assert.equal(isPublicIp("169.254.169.254"), false);
  assert.equal(isPublicIp("8.8.8.8"), true);
});

test("extracts first-party description and official social links", async () => {
  const html = `<html><head><title>Bibetta</title><meta name="description" content="Waterproof bibs for families"></head><body><nav><a href="/about">About us</a></nav><main><h1>Baby feeding products</h1></main><footer><a href="https://www.instagram.com/bibetta/">Instagram</a><a href="https://www.facebook.com/bibetta/">Facebook</a></footer></body></html>`;
  const parsed = parseCompanyPage(html, "https://bibetta.com/");
  assert.match(parsed.snippet, /Waterproof bibs/);
  assert.equal(parsed.about, "https://bibetta.com/about");
  assert.equal(parsed.socialLinks.length, 2);
  const evidence = await companyWebsiteEvidence({ prospect_company_website: "bibetta.com" }, async (url) => ({ url, html }));
  assert.equal(evidence.sources.filter((source) => source.title.startsWith("Official ")).length, 2);
  assert.equal(evidence.socialLinks[0].platform, "Instagram");
});

test("keeps a supplied company LinkedIn distinct from verified website links", async () => {
  const evidence = await companyWebsiteEvidence({ prospect_company_website: "example.com", prospect_company_linkedin: "linkedin.com/company/acme" }, async (url) => ({ url, html: "<html><title>Acme</title><body>Acme products</body></html>" }));
  assert.equal(evidence.socialLinks[0].verified, false);
  assert.match(evidence.sources[1].title, /from sheet/);
});
