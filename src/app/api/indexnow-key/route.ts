/**
 * IndexNow key verification endpoint.
 *
 * IndexNow checks that the host owns the key by fetching a URL containing
 * the key. We host it under `/api/indexnow-key` and pass that URL via the
 * `keyLocation` parameter when pinging IndexNow — this avoids putting a
 * catch-all route at the site root.
 */
export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return new Response("not configured", { status: 404 });
  }
  return new Response(key, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
