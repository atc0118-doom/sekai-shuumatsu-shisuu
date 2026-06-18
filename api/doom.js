// SAT-SYS-01 / free enhanced doom API
// Vercel Serverless Function. Uses free public endpoints where possible.

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(n) || 0)));

async function fetchJson(url, timeoutMs = 6500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'SAT-SYS-01/1.0' },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

function pseudo(seed, base = 50, amp = 20) {
  const x = Math.sin(seed) * 10000;
  return clamp(base + (x - Math.floor(x) - 0.5) * amp * 2);
}

async function airMetric() {
  try {
    const data = await fetchJson('https://opensky-network.org/api/states/all', 8000);
    const states = Array.isArray(data.states) ? data.states : [];
    const total = states.length;
    const airborne = states.filter(s => s && s[8] === false).length;
    const highAlt = states.filter(s => s && Number(s[7]) > 9000).length;
    const fast = states.filter(s => s && Number(s[9]) > 230).length;
    const specialCandidate = states.filter(s => {
      const cs = String(s?.[1] || '').trim().toUpperCase();
      return /(^RCH|^CNV|^VV|^HKY|^NATO|^ASY|^GAF|^IAM|^RRR|^CFC|^BAF|^AF|KC|TANKER|REACH|FORTE|JAKE|RAVEN)/.test(cs);
    }).length;
    const score = clamp(30 + total / 220 + airborne / 260 + highAlt / 300 + fast / 220 + specialCandidate * 1.8);
    return {
      value: score,
      raw: { total, airborne, highAlt, fast, specialCandidate },
      label: specialCandidate > 20 ? '特殊機候補を複数観測' : '航空活動を観測',
      source: 'OpenSky'
    };
  } catch (e) {
    const seed = Date.now() / 3600000;
    return {
      value: pseudo(seed, 56, 13),
      raw: { total: null, airborne: null, specialCandidate: null },
      label: '航空活動を推定観測',
      source: '推定'
    };
  }
}

async function solarMetric() {
  try {
    const [kp, flare] = await Promise.allSettled([
      fetchJson('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', 6500),
      fetchJson('https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json', 6500)
    ]);
    let kpMax = 0;
    if (kp.status === 'fulfilled' && Array.isArray(kp.value)) {
      const rows = kp.value.slice(1).slice(-16);
      kpMax = Math.max(...rows.map(r => Number(r[1]) || 0), 0);
    }
    let xrayMax = 0;
    if (flare.status === 'fulfilled' && Array.isArray(flare.value)) {
      xrayMax = Math.max(...flare.value.slice(-240).map(r => Number(r.flux) || 0), 0);
    }
    const flareScore = xrayMax > 1e-4 ? 95 : xrayMax > 1e-5 ? 78 : xrayMax > 1e-6 ? 58 : xrayMax > 1e-7 ? 38 : 22;
    const score = clamp(kpMax * 11 + flareScore * 0.35);
    return { value: score, raw: { kpMax, xrayMax }, label: kpMax >= 5 ? '磁気嵐傾向' : '太陽活動を観測', source: 'NOAA' };
  } catch (e) {
    const seed = Date.now() / 4200000;
    return { value: pseudo(seed, 42, 16), raw: {}, label: '太陽活動を推定観測', source: '推定' };
  }
}

async function marketMetric() {
  // Fully free/no-key finance APIs are unstable. This uses public Yahoo chart endpoints with fallback.
  try {
    const [vix, oil, gold] = await Promise.allSettled([
      fetchJson('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=5d&interval=1d', 6500),
      fetchJson('https://query1.finance.yahoo.com/v8/finance/chart/CL%3DF?range=5d&interval=1d', 6500),
      fetchJson('https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?range=5d&interval=1d', 6500)
    ]);
    function lastClose(payload) {
      const r = payload?.chart?.result?.[0];
      const close = r?.indicators?.quote?.[0]?.close || [];
      const vals = close.filter(v => typeof v === 'number');
      return vals[vals.length - 1];
    }
    function pct(payload) {
      const r = payload?.chart?.result?.[0];
      const close = (r?.indicators?.quote?.[0]?.close || []).filter(v => typeof v === 'number');
      if (close.length < 2) return 0;
      return ((close[close.length - 1] - close[0]) / close[0]) * 100;
    }
    const vixVal = vix.status === 'fulfilled' ? lastClose(vix.value) : null;
    const oilPct = oil.status === 'fulfilled' ? pct(oil.value) : 0;
    const goldPct = gold.status === 'fulfilled' ? pct(gold.value) : 0;
    const score = clamp((vixVal || 18) * 2.4 + Math.max(oilPct, 0) * 3 + Math.max(goldPct, 0) * 2);
    return { value: score, raw: { vix: vixVal, oilPct, goldPct }, label: score >= 70 ? '市場心理に強い怯え' : '市場心理を観測', source: 'Yahoo public chart' };
  } catch (e) {
    const seed = Date.now() / 5100000;
    return { value: pseudo(seed, 50, 18), raw: {}, label: '市場心理を推定観測', source: '推定' };
  }
}

function shippingMetric(air, market) {
  // Free AIS is not reliably available without keys. Estimate shipping stress from air/market + time waves.
  const seed = Date.now() / 6200000;
  const wave = pseudo(seed, 50, 12);
  const value = clamp(air.value * 0.22 + market.value * 0.38 + wave * 0.40);
  return { value, raw: { inferredFrom: ['air', 'market'] }, label: value >= 70 ? '海運の乱れが増幅' : '海運の乱れを推定観測', source: '推定' };
}

function level(score) {
  if (score >= 85) return { level: '異常', roman: 'Ⅴ' };
  if (score >= 70) return { level: '危険', roman: 'Ⅳ' };
  if (score >= 50) return { level: '警戒', roman: 'Ⅲ' };
  if (score >= 30) return { level: '注意', roman: 'Ⅱ' };
  return { level: '平常', roman: 'Ⅰ' };
}

function regional(metrics) {
  const { air, market, shipping, solar } = metrics;
  const regions = [
    ['中東方面', air.value * .42 + shipping.value * .34 + market.value * .18 + 10],
    ['台湾海峡方面', air.value * .46 + shipping.value * .24 + solar.value * .12 + 8],
    ['黒海方面', air.value * .34 + market.value * .30 + shipping.value * .24 + 6],
    ['日本周辺', air.value * .28 + solar.value * .34 + shipping.value * .20 + 4],
    ['米国本土方面', market.value * .42 + air.value * .24 + solar.value * .16 + 4],
    ['北極圏方面', solar.value * .45 + air.value * .20 + 8]
  ];
  return regions.map(([name, score]) => ({ name, score: clamp(score) })).sort((a, b) => b.score - a.score);
}

export default async function handler(req, res) {
  try {
    const [air, market, solar] = await Promise.all([airMetric(), marketMetric(), solarMetric()]);
    const shipping = shippingMetric(air, market);
    const doom = clamp(air.value * .34 + market.value * .26 + shipping.value * .24 + solar.value * .16);
    const lv = level(doom);
    const metrics = { air, market, shipping, solar };
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({
      ok: true,
      updatedAt: new Date().toISOString(),
      doom,
      level: lv.level,
      roman: lv.roman,
      metrics,
      regions: regional(metrics)
    });
  } catch (e) {
    const air = { value: 55, source: 'fallback', label: '航空活動を推定観測', raw: {} };
    const market = { value: 48, source: 'fallback', label: '市場心理を推定観測', raw: {} };
    const solar = { value: 36, source: 'fallback', label: '太陽活動を推定観測', raw: {} };
    const shipping = shippingMetric(air, market);
    const doom = clamp(air.value * .34 + market.value * .26 + shipping.value * .24 + solar.value * .16);
    const lv = level(doom);
    const metrics = { air, market, shipping, solar };
    res.status(200).json({ ok: true, updatedAt: new Date().toISOString(), doom, level: lv.level, roman: lv.roman, metrics, regions: regional(metrics), fallback: true });
  }
}
