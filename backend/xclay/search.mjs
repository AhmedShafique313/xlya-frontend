import { RequestError } from "./core.mjs";

export function normalizeSearchResults(items) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (!item || typeof item.title !== "string" || typeof item.url !== "string") return [];
    let url;
    try {
      url = new URL(item.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") return [];
    } catch { return []; }
    return [{
      title: item.title.slice(0, 200),
      url: url.href,
      snippet: String(item.content || item.description || "").slice(0, 900),
    }];
  }).slice(0, 5);
}

export async function searchWeb(query, fetcher = fetch) {
  if (process.env.TAVILY_API_KEY) {
    const response = await fetcher("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify({ query, search_depth: "basic", max_results: 5, include_answer: false }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new RequestError(`Web search failed (${response.status}).`, 502);
    return normalizeSearchResults((await response.json()).results);
  }
  if (process.env.BRAVE_SEARCH_API_KEY) {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", "5");
    const response = await fetcher(url, {
      headers: { accept: "application/json", "x-subscription-token": process.env.BRAVE_SEARCH_API_KEY },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new RequestError(`Web search failed (${response.status}).`, 502);
    return normalizeSearchResults((await response.json()).web?.results);
  }

  const url = new URL("https://en.wikipedia.org/w/api.php");
  Object.entries({
    action: "query", generator: "search", gsrsearch: query, gsrlimit: "5",
    prop: "extracts", exintro: "1", explaintext: "1", exsentences: "3", format: "json",
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  let response;
  try {
    response = await fetcher(url, {
      headers: { accept: "application/json", "user-agent": "Xclay/1.0 (project-scoped research client)" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch { throw new RequestError("No-key search is unavailable right now. Please retry later.", 503); }
  if (!response.ok) throw new RequestError(`No-key search failed (${response.status}).`, 502);
  const pages = Object.values((await response.json()).query?.pages || {});
  return normalizeSearchResults(pages.map((page) => ({
    title: page.title,
    url: `https://en.wikipedia.org/?curid=${page.pageid}`,
    content: page.extract,
  })));
}
