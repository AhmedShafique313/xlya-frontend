import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import { load } from "cheerio";
import ipaddr from "ipaddr.js";

const MAX_HTML_BYTES = 2_000_000;
const SOCIAL_HOSTS = new Map([
  ["instagram.com", "Instagram"], ["facebook.com", "Facebook"],
  ["linkedin.com", "LinkedIn"], ["tiktok.com", "TikTok"],
  ["youtube.com", "YouTube"], ["x.com", "X"],
  ["twitter.com", "X"], ["pinterest.com", "Pinterest"],
]);

export function companyWebsite(row) {
  const entry = Object.entries(row).find(([key, value]) =>
    /company.*(website|domain)|^(website|domain|url)$/i.test(key) && typeof value === "string" && value.trim());
  if (!entry) return null;
  const input = entry[1].trim();
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (![/^https:$/, /^http:$/].some((pattern) => pattern.test(url.protocol)) ||
        url.username || url.password || url.port || isIP(url.hostname) || !url.hostname.includes(".")) return null;
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url.href;
  } catch { return null; }
}

export function isPublicIp(address) {
  try { return ipaddr.process(address).range() === "unicast"; }
  catch { return false; }
}

export async function fetchPublicHtml(input, redirects = 0) {
  if (redirects > 3) throw new Error("Too many website redirects.");
  const url = new URL(input);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
      (url.port && url.port !== '443' && url.port !== '80') || isIP(url.hostname) || !url.hostname.includes('.')) {
    throw new Error("Unsafe website URL.");
  }
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address))) throw new Error("Website resolves to a non-public address.");
  const target = addresses.find(({ family }) => family === 4) || addresses[0];
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.get(url, {
      headers: { "user-agent": "Xclay/1.0 (company website research)", accept: "text/html", "accept-encoding": "identity" },
      lookup: (_host, options, callback) => options.all
        ? callback(null, [target])
        : callback(null, target.address, target.family),
      timeout: 9_000,
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        resolve(fetchPublicHtml(new URL(response.headers.location, url), redirects + 1));
        return;
      }
      if (response.statusCode !== 200 || !String(response.headers["content-type"] || "").includes("text/html")) {
        response.resume();
        reject(new Error(`Website returned ${response.statusCode}.`));
        return;
      }
      const chunks = [];
      let bytes = 0;
      response.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_HTML_BYTES) request.destroy(new Error("Website page is too large."));
        else chunks.push(chunk);
      });
      response.on("end", () => resolve({ url: url.href, html: Buffer.concat(chunks).toString("utf8") }));
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("Website timed out.")));
    request.on("error", reject);
  });
}

export function socialPlatform(input) {
  let url;
  try { url = new URL(input); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const platform = [...SOCIAL_HOSTS].find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1];
  const path = url.pathname.replace(/^\/+|\/+$/g, "");
  if (!platform || !path || /^(share|sharer|intent|login|home|p|reel|posts|watch|embed)(\/|$)/i.test(path)) return null;
  if (platform === "LinkedIn" && !/^company\/[^/]+/i.test(path)) return null;
  return platform;
}

export function parseCompanyPage(html, pageUrl) {
  const $ = load(html);
  const title = $("title").first().text().trim().slice(0, 180);
  const description = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";
  const headings = $("h1, h2").slice(0, 5).map((_, element) => $(element).text().trim()).get().filter(Boolean).join(" | ");
  const socialLinks = new Map();
  const addSocial = (href) => {
    try {
      const url = new URL(href, pageUrl);
      const platform = socialPlatform(url.href);
      if (platform && !socialLinks.has(url.href)) socialLinks.set(url.href, { platform, url: url.href });
    } catch { /* Ignore malformed links in third-party HTML. */ }
  };
  $("a[href]").each((_, element) => addSocial($(element).attr("href")));
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).html() || "null");
      const visit = (value, depth = 0) => {
        if (depth > 4 || !value || typeof value !== "object") return;
        if (Array.isArray(value)) return value.forEach((item) => visit(item, depth + 1));
        if (Array.isArray(value.sameAs)) value.sameAs.forEach(addSocial);
        Object.values(value).forEach((item) => visit(item, depth + 1));
      };
      visit(data);
    } catch { /* Ignore invalid structured data. */ }
  });
  const about = $("a[href]").filter((_, element) => /about|our story|who we are/i.test($(element).text() || $(element).attr("href") || ""))
    .map((_, element) => {
      try {
        const url = new URL($(element).attr("href"), pageUrl);
        return url.hostname.replace(/^www\./, "") === new URL(pageUrl).hostname.replace(/^www\./, "") ? url.href : null;
      } catch { return null; }
    }).get()[0];
  $("script, style, noscript, svg, nav, footer, header, form").remove();
  const body = ($("main").first().text() || $("body").text()).replace(/\s+/g, " ").trim().slice(0, 2_500);
  return { title, snippet: [description, headings, body].filter(Boolean).join(" ").slice(0, 3_000), socialLinks: [...socialLinks.values()].slice(0, 12), about };
}

export async function companyWebsiteEvidence(row, fetchHtml = fetchPublicHtml) {
  const providedLinkedIn = Object.entries(row).find(([key, value]) =>
    /company.*linkedin/i.test(key) && typeof value === "string" && value.trim());
  let provided = null;
  if (providedLinkedIn) {
    try {
      const raw = providedLinkedIn[1].trim();
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (socialPlatform(url.href) === "LinkedIn") provided = { platform: "LinkedIn", url: url.href, verified: false };
    } catch { /* Ignore malformed spreadsheet links. */ }
  }
  const website = companyWebsite(row);
  const providedSources = provided ? [{ title: "Company LinkedIn (from sheet)", url: provided.url, snippet: "Company profile URL supplied in the uploaded sheet; not independently verified." }] : [];
  if (!website) return { sources: providedSources, socialLinks: provided ? [provided] : [] };
  try {
    const home = await fetchHtml(website);
    const first = parseCompanyPage(home.html, home.url);
    const sources = [{ title: first.title || "Company website", url: home.url, snippet: first.snippet }];
    const links = [...first.socialLinks];
    if (first.about && first.about !== home.url && (first.snippet.length < 600 || links.length === 0)) {
      try {
        const aboutPage = await fetchHtml(first.about);
        const second = parseCompanyPage(aboutPage.html, aboutPage.url);
        sources.push({ title: second.title || "About the company", url: aboutPage.url, snippet: second.snippet });
        links.push(...second.socialLinks);
      } catch { /* The homepage remains usable evidence. */ }
    }
    const byPlatform = new Map();
    for (const item of links) if (!byPlatform.has(item.platform)) byPlatform.set(item.platform, { ...item, verified: true });
    if (provided && !byPlatform.has("LinkedIn")) byPlatform.set("LinkedIn", provided);
    const socialLinks = [...byPlatform.values()].slice(0, 8);
    sources.push(...socialLinks.map(({ platform, url }) => ({ title: `Official ${platform}`, url, snippet: "Linked from the company website." })));
    if (provided && !links.some((item) => item.url === provided.url)) {
      const source = sources.find((item) => item.url === provided.url);
      if (source) { source.title = "Company LinkedIn (from sheet)"; source.snippet = "Company profile URL supplied in the uploaded sheet; not independently verified."; }
    }
    return { sources, socialLinks };
  } catch { return { sources: providedSources, socialLinks: provided ? [provided] : [] }; }
}
