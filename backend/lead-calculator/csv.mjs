import { InputError } from "./funnel.mjs";

export const MAX_CSV_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 50_000;
const MAX_COLUMNS = 200;

const ALIASES = {
  email: ["email", "emailaddress", "workemail", "businessemail", "contactemail", "personemail", "contactprofessionalemail"],
  company: ["company", "companyname", "organization", "organizationname", "account", "accountname", "businessname", "prospectcompanyname"],
  phone: ["phone", "phonenumber", "mobile", "mobilephone", "workphone", "directphone", "contactphone", "contactmobilephone"],
  profile: ["linkedin", "linkedinurl", "linkedinprofile", "linkedinprofileurl", "personlinkedinurl", "profileurl", "prospectlinkedin"],
  prospectId: ["prospectid"],
  firstName: ["firstname", "contactfirstname", "personfirstname", "prospectfirstname"],
  lastName: ["lastname", "contactlastname", "personlastname", "prospectlastname"],
  fullName: ["fullname", "contactname", "personname", "prospectfullname"],
  website: ["website", "websiteurl", "companywebsite", "domain", "companydomain", "prospectcompanywebsite"],
};

function invalid(details) {
  throw new InputError("Invalid CSV file", Array.isArray(details) ? details : [details]);
}

function parseRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];
    if (quoted) {
      if (character === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"' && field === "") {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      if (rows.length > MAX_ROWS + 1) invalid(`CSV must contain no more than ${MAX_ROWS.toLocaleString()} data rows.`);
      row = [];
      field = "";
    } else {
      field += character;
    }
    if (field.length > 32_768) invalid("A CSV field is too long.");
    if (row.length > MAX_COLUMNS) invalid(`CSV must contain no more than ${MAX_COLUMNS} columns.`);
  }
  if (quoted) invalid("CSV contains an unclosed quoted field.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function normalizedHeader(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function columnIndex(headers, kind) {
  return headers.findIndex((header) => ALIASES[kind].includes(header));
}

function field(row, index) {
  return index < 0 ? "" : String(row[index] ?? "").trim();
}

function normalizedUrl(value) {
  return value.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#]+$/, "");
}

function identityKey(row, columns, hasPersonFields) {
  const email = field(row, columns.email).toLowerCase();
  if (email) return `email:${email}`;
  const prospectId = field(row, columns.prospectId).toLowerCase();
  if (prospectId) return `prospect:${prospectId}`;
  const profile = normalizedUrl(field(row, columns.profile));
  if (profile) return `profile:${profile}`;
  const name = field(row, columns.fullName) || [field(row, columns.firstName), field(row, columns.lastName)].filter(Boolean).join(" ");
  const company = field(row, columns.company).toLowerCase();
  if (name && company) return `person:${name.toLowerCase()}|${company}`;
  if (!hasPersonFields) {
    const website = normalizedUrl(field(row, columns.website));
    if (website) return `website:${website}`;
    if (company) return `company:${company}`;
  }
  return null;
}

export function analyzeCsv(csv) {
  if (!csv || typeof csv !== "object" || Array.isArray(csv)) invalid("csv must contain a fileName and UTF-8 text.");
  if (typeof csv.fileName !== "string" || !/\.csv$/i.test(csv.fileName.trim()) || csv.fileName.length > 180) invalid("Choose a .csv file with a valid name.");
  if (typeof csv.text !== "string") invalid("CSV text is required.");
  const bytes = Buffer.byteLength(csv.text, "utf8");
  if (bytes === 0 || bytes > MAX_CSV_BYTES) invalid(`CSV must be between 1 byte and ${MAX_CSV_BYTES / (1024 * 1024)} MB.`);
  const rows = parseRows(csv.text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) invalid("CSV needs a header row and at least one lead row.");
  const header = rows[0].map((value) => value.trim());
  if (header.length > MAX_COLUMNS || header.some((value) => !value)) invalid("CSV headers must be nonempty and contain at most 200 columns.");
  const headers = header.map(normalizedHeader);
  if (new Set(headers).size !== headers.length) invalid("CSV column names must be unique.");
  const columns = Object.fromEntries(Object.keys(ALIASES).map((kind) => [kind, columnIndex(headers, kind)]));
  const hasPersonFields = columns.firstName >= 0 || columns.lastName >= 0 || columns.fullName >= 0 || columns.profile >= 0;
  const seen = new Set();
  const uniqueRows = [];
  let duplicatesRemoved = 0;
  for (const row of rows.slice(1)) {
    const key = identityKey(row, columns, hasPersonFields);
    if (key && seen.has(key)) { duplicatesRemoved += 1; continue; }
    if (key) seen.add(key);
    uniqueRows.push(row);
  }
  if (uniqueRows.length === 0) invalid("CSV does not contain any usable lead rows.");
  const coverage = Object.fromEntries(["email", "company", "phone"].map((kind) => {
    const count = uniqueRows.filter((row) => Boolean(field(row, columns[kind]))).length;
    return [kind, { count, percent: Math.round(count / uniqueRows.length * 100) }];
  }));
  return {
    fileName: csv.fileName.trim(),
    importedRows: rows.length - 1,
    uniqueLeads: uniqueRows.length,
    duplicatesRemoved,
    coverage,
    detectedColumns: Object.fromEntries(["email", "company", "phone"].map((kind) => [kind, columns[kind] >= 0 ? header[columns[kind]] : null])),
  };
}
