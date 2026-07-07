export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = encodeURIComponent('(war OR missile OR attack OR airstrike OR sanctions OR ceasefire OR conflict OR explosion OR drone OR nuclear OR blockade OR protest OR border OR military)');
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=100&sort=HybridRel&timespan=24h`;

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Doomsday-Observer/1.0'
      }
    });
    if (!r.ok) throw new Error(`GDELT status ${r.status}`);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({ ok: true, source: 'GDELT', fetchedAt: new Date().toISOString(), data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
