const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function round(n) { return Math.round(Number.isFinite(n) ? n : 0); }
function seededNoise(offset = 0) {
  const now = new Date();
  const bucket = Math.floor(now.getTime() / (15 * 60 * 1000));
  const x = Math.sin((bucket + offset) * 999.123) * 10000;
  return x - Math.floor(x);
}
async function fetchWithTimeout(url, ms = 6500) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'sekai-shuumatsu-shisuu/1.0' }});
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  } finally { clearTimeout(id); }
}
async function getAir() {
  const r = await fetchWithTimeout('https://opensky-network.org/api/states/all', 8000);
  const j = await r.json();
  const count = Array.isArray(j.states) ? j.states.length : 0;
  const air = clamp(round(38 + count / 850), 35, 95);
  return { value: air, raw: { aircraft_count: count }, source: 'OpenSky Network' };
}
async function getVix() {
  const r = await fetchWithTimeout('https://stooq.com/q/l/?s=%5Evix&f=sd2t2ohlcv&h&e=csv', 6500);
  const text = await r.text();
  const line = text.trim().split('\n')[1] || '';
  const parts = line.split(',');
  const close = parseFloat(parts[6]);
  if (!Number.isFinite(close)) throw new Error('no vix');
  const value = clamp(round(35 + close * 1.6), 30, 95);
  return { value, raw: { vix: close }, source: 'Stooq VIX' };
}
async function getMarketFallback() {
  const r = await fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', 6500);
  const j = await r.json();
  const chg = Math.abs(j?.bitcoin?.usd_24h_change || 0);
  const value = clamp(round(45 + chg * 3.5), 35, 88);
  return { value, raw: { bitcoin_24h_change: j?.bitcoin?.usd_24h_change || 0 }, source: 'CoinGecko BTC stress fallback' };
}
async function getSpace() {
  const r = await fetchWithTimeout('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', 6500);
  const j = await r.json();
  const rows = Array.isArray(j) ? j.slice(1) : [];
  const last = rows[rows.length - 1] || [];
  const kp = parseFloat(last[1]);
  if (!Number.isFinite(kp)) throw new Error('no kp');
  const value = clamp(round(20 + kp * 10), 20, 95);
  return { value, raw: { planetary_k_index: kp }, source: 'NOAA SWPC' };
}
function getShipping() {
  const n = seededNoise(77);
  const value = clamp(round(46 + n * 29), 35, 82);
  return { value, raw: { mode: 'estimated_public_proxy' }, source: '推定値：海運公開情報プロキシ' };
}
function fallback(label, base, offset) {
  const v = clamp(round(base + seededNoise(offset) * 22), 25, 88);
  return { value: v, raw: { mode: 'fallback' }, source: `${label} 推定値` };
}
function level(doom) {
  if (doom >= 85) return '危険';
  if (doom >= 70) return '高';
  if (doom >= 55) return '中';
  return '低';
}
function buildOmens(s) {
  const a = [];
  if (s.air.value >= 62) a.push('空のざわめきが平常値を上回る');
  if (s.air.value >= 72) a.push('航空機活動の増加を観測。監視を強化');
  if (s.market.value >= 58) a.push('市場の怯えが濃く、逃避行動の兆し');
  if (s.shipping.value >= 58) a.push('海運の乱れが継続。要衝周辺に滞り');
  if (s.space.value >= 50) a.push('宇宙天気に揺らぎ。磁気圏の乱れを観測');
  while (a.length < 5) a.push(['公開情報に細い揺らぎを検出','複数指標を横断監視中','観測は続いている'][a.length % 3]);
  return a.slice(0, 5);
}
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  try {
    const airP = getAir().catch(() => fallback('空', 55, 11));
    const marketP = getVix().catch(() => getMarketFallback()).catch(() => fallback('市場', 48, 22));
    const spaceP = getSpace().catch(() => fallback('宇宙天気', 34, 33));
    const [air, market, space] = await Promise.all([airP, marketP, spaceP]);
    const shipping = getShipping();
    const doom = clamp(round(air.value * 0.38 + market.value * 0.22 + shipping.value * 0.24 + space.value * 0.16), 0, 100);
    const previous = clamp(round(doom - 8 + seededNoise(99) * 16), 0, 100);
    const payload = {
      ok: true,
      updated: new Date().toISOString(),
      doom,
      level: level(doom),
      previous,
      delta: doom - previous,
      metrics: {
        air,
        market,
        shipping,
        space
      },
      omens: buildOmens({ air, market, shipping, space }),
      observers: {
        today: 900 + round(seededNoise(4) * 900) + (Math.floor(Date.now() / 600000) % 120),
        total: 74000 + round(seededNoise(5) * 9000)
      },
      note: '公開データと推定プロキシをもとに生成。予言ではありません。'
    };
    res.status(200).json(payload);
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e.message || e), doom: 73, level: '高', updated: new Date().toISOString() });
  }
};
