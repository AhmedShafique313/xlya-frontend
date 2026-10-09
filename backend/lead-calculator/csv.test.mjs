import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCsv } from "./csv.mjs";
import { calculateFunnel, InputError } from "./funnel.mjs";

test("Vibe-style CSV counts unique leads and measures field coverage", () => {
  const text = '\uFEFFFirst Name,Last Name,Company Name,Work Email,Phone Number,Notes\r\n' +
    'Ada,Lovelace,"Analytical, Inc",ada@example.com,555-0100,"Met at\nconference"\r\n' +
    'Ada,Lovelace,"Analytical, Inc",ADA@example.com,555-0100,duplicate\r\n' +
    'Grace,Hopper,Compute Co,grace@example.com,,ready\r\n';
  const analysis = analyzeCsv({ fileName: "vibe-prospects.csv", text });
  assert.equal(analysis.importedRows, 3);
  assert.equal(analysis.uniqueLeads, 2);
  assert.equal(analysis.duplicatesRemoved, 1);
  assert.deepEqual(analysis.coverage.email, { count: 2, percent: 100 });
  assert.deepEqual(analysis.coverage.phone, { count: 1, percent: 50 });

  const result = calculateFunnel({
    mode: "forward",
    startingLeads: analysis.uniqueLeads,
    periodMonths: 3,
    revenue: { type: "one_time", amount: 2500 },
    stages: [
      { name: "Imported", conversionRate: 0.5 },
      { name: "Qualified", conversionRate: 0.4 },
      { name: "Engaged", conversionRate: 0.3 },
      { name: "Opportunity", conversionRate: 0.41 },
      { name: "Customer" },
    ],
  });
  assert.equal(result.leads, 2);
  assert.equal(result.stageResults.length, 5);
  assert.equal(result.stageResults[0].expectedVolume, 2);
  assert.ok(result.expectedRevenue > 0);
});

test("company-only exports deduplicate by website without merging different contacts", () => {
  const companies = analyzeCsv({ fileName: "companies.csv", text: "Company,Website\nAcme,acme.com\nACME,https://www.acme.com/\nOther,other.com" });
  assert.equal(companies.uniqueLeads, 2);
  const contacts = analyzeCsv({ fileName: "contacts.csv", text: "First Name,Last Name,Company\nA,One,Acme\nB,Two,Acme" });
  assert.equal(contacts.uniqueLeads, 2);
});

test("current Vibe Prospecting export columns map to lead identity and coverage", () => {
  const text = "prospect_id,prospect_full_name,prospect_company_name,prospect_company_website,prospect_linkedin,contact_professional_email,contact_mobile_phone\n" +
    "id-1,Ada Lovelace,Analytical Inc,analytical.test,linkedin.com/in/ada,ada@example.com,555-0100\n" +
    "id-1,Ada Lovelace,Analytical Inc,analytical.test,linkedin.com/in/ada,ADA@example.com,555-0100\n" +
    "id-2,Grace Hopper,Compute Co,compute.test,linkedin.com/in/grace,,\n";
  const analysis = analyzeCsv({ fileName: "vibe-export.csv", text });
  assert.equal(analysis.importedRows, 3);
  assert.equal(analysis.uniqueLeads, 2);
  assert.equal(analysis.duplicatesRemoved, 1);
  assert.deepEqual(analysis.coverage.email, { count: 1, percent: 50 });
  assert.deepEqual(analysis.coverage.company, { count: 2, percent: 100 });
  assert.deepEqual(analysis.coverage.phone, { count: 1, percent: 50 });
});

test("invalid or oversized CSV is rejected", () => {
  assert.throws(() => analyzeCsv({ fileName: "leads.csv", text: 'Email\n"unclosed' }), InputError);
  assert.throws(() => analyzeCsv({ fileName: "leads.txt", text: "Email\na@example.com" }), InputError);
  assert.throws(() => analyzeCsv({ fileName: "leads.csv", text: "Email\n" + "x".repeat(4 * 1024 * 1024) }), InputError);
});
