export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const query = encodeURIComponent('(war OR conflict OR missile OR drone OR attack OR sanctions OR crisis OR coup OR blockade OR nuclear)');
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=75&sort=HybridRel&timespan=24h`;
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'doomsday-observer/1.0' } });
    if (!r.ok) throw new Error(`GDELT ${r.status}`);
    const data = await r.json();
    res.status(200).json({ ok: true, source: 'GDELT', fetchedAt: new Date().toISOString(), articles: data.articles || [] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e), articles: [] });
  }
}
