// GET /api/scan?from=71600&to=71639          scan an id range
// GET /api/scan?ids=71641,71642               refresh specific ids
// Add &live=1 for a short CDN cache (live polling); omit for a long one (backfill).

const BASE = "https://hexium.zip";
const MAX_IDS = 40;   // keeps one call well under Vercel's time limit
const WORKERS = 20;

async function fetchOne(id) {
  try {
    const r = await fetch(`${BASE}/apisite/economy/v2/assets/${id}/details`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; hexium-limiteds)" },
      signal: AbortSignal.timeout(4000),
    });
    if ([429, 500, 502, 503, 504].includes(r.status)) return { id, err: true };
    if (!r.ok) return { id, none: true };
    const d = await r.json();
    if (!d || !d.AssetId) return { id, none: true };
    return { id, d };
  } catch {
    return { id, err: true };
  }
}

function slim(d) {
  return {
    id: d.AssetId,