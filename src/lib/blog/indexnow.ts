/**
 * IndexNow ping — tells Bing/Yandex (and downstream Google via their crawl
 * collaboration) that a new URL exists.
 *
 * We use the simple GET form for a single URL since Vercel cron is a
 * one-shot per article. The host needs an `<KEY>.txt` file at the site
 * root with the same key inside, hosted via the public/ folder.
 */

const INDEXNOW_HOST = "https://api.indexnow.org/IndexNow";

export interface IndexNowResult {
  ok: boolean;
  status: number;
  reason?: string;
}

export async function pingIndexNow(articleUrl: string): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return { ok: false, status: 0, reason: "INDEXNOW_KEY missing" };

  const url = new URL(articleUrl);
  const host = url.host;
  // We host the key under /api/indexnow-key (env-driven) rather than at the
  // site root, so we pass keyLocation explicitly to IndexNow.
  const keyLocation = `${url.origin}/api/indexnow-key`;
  const params = new URLSearchParams({
    url: articleUrl,
    key,
    host,
    keyLocation,
  });
  const fullUrl = `${INDEXNOW_HOST}?${params.toString()}`;

  try {
    const res = await fetch(fullUrl, { method: "GET" });
    return {
      ok: res.ok,
      status: res.status,
      reason: res.ok ? undefined : await res.text().catch(() => undefined),
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      reason: err instanceof Error ? err.message : "fetch failed",
    };
  }
}
