// SAT-SYS-01 / Ver3.5 Crisis News API
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
    return { value: score, raw: { total, airborne, highAlt, fast, specialCandidate }, label: specialCandidate > 20 ? '特殊機候補を複数観測' : '航空活動を観測', source: 'OpenSky' };
  } catch (e) {
    const seed = Date.now() / 3600000;
    return { value: pseudo(seed, 56, 13), raw: {}, label: '航空活動を推定観測', source: '推定' };
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
  try {
    const [vix, oil, gold] = await Promise.allSettled([
      fetchJson('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=5d&interval=1d', 6500),
      fetchJson('https://query1.finance.yahoo.com/v8/finance/chart/CL%3DF?range=5d&interval=1d', 6500),
      fetchJson('https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?range=5d&interval=1d', 6500)
    ]);
    function lastClose(payload) { const r = payload?.chart?.result?.[0]; const close = r?.indicators?.quote?.[0]?.close || []; const vals = close.filter(v => typeof v === 'number'); return vals[vals.length - 1]; }
    function pct(payload) { const r = payload?.chart?.result?.[0]; const close = (r?.indicators?.quote?.[0]?.close || []).filter(v => typeof v === 'number'); if (close.length < 2) return 0; return ((close[close.length - 1] - close[0]) / close[0]) * 100; }
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

async function crisisMetric() {
  const queries = [
    { key: 'middleEast', name: '中東方面', q: '(iran OR israel OR gaza OR hamas OR lebanon OR yemen) (war OR conflict OR missile OR attack OR military OR nuclear)' },
    { key: 'taiwan', name: '台湾海峡方面', q: '(taiwan OR "taiwan strait" OR china) (military OR invasion OR missile OR war OR conflict)' },
    { key: 'blackSea', name: '黒海方面', q: '(ukraine OR russia OR "black sea") (war OR missile OR attack OR military OR invasion)' },
    { key: 'japan', name: '日本周辺', q: '(japan OR korea OR "east china sea" OR "south china sea") (missile OR military OR nuclear OR threat)' },
    { key: 'us', name: '米国本土方面', q: '(united states OR america OR usa) (terror OR cyberattack OR attack OR crisis OR nuclear)' },
    { key: 'arctic', name: '北極圏方面', q: '(arctic OR greenland OR norway OR baltic) (military OR russia OR nato OR conflict)' }
  ];
  try {
    const results = await Promise.allSettled(queries.map(async item => {
      const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + encodeURIComponent(item.q) + '&mode=ArtList&format=json&maxrecords=75&sort=HybridRel&timespan=24h';
      const data = await fetchJson(url, 7000);
      const articles = Array.isArray(data.articles) ? data.articles : [];
      return { ...item, count: articles.length, articles: articles.slice(0, 3).map(a => ({ title: a.title, source: a.sourceCountry || a.domain || '' })) };
    }));
    const regionalNews = results.map((r, i) => r.status === 'fulfilled' ? r.value : { ...queries[i], count: 0, articles: [] });
    const total = regionalNews.reduce((s, x) => s + x.count, 0);
    const max = Math.max(...regionalNews.map(x => x.count), 0);
    const score = clamp(total * 0.85 + max * 1.15 + 18);
    return { value: score, raw: { total, max, regionalNews }, label: score >= 70 ? '危機報道が増幅' : '危機報道を観測', source: 'GDELT' };
  } catch (e) {
    const seed = Date.now() / 5600000;
    return { value: pseudo(seed, 50, 17), raw: { regionalNews: [] }, label: '危機報道を推定観測', source: '推定' };
  }
}

function shippingMetric(air, market) {
  const seed = Date.now() / 6200000;
  const wave = pseudo(seed, 50, 12);
  const value = clamp(air.value * 0.22 + market.value * 0.38 + wave * 0.40);
  return { value, raw: { inferredFrom: ['air', 'market'] }, label: value >= 70 ? '海運の乱れが増幅' : '海運の乱れを推定観測', source: '推定' };
}

function level(score) { if (score >= 85) return { level: '異常', roman: 'Ⅴ' }; if (score >= 70) return { level: '危険', roman: 'Ⅳ' }; if (score >= 50) return { level: '警戒', roman: 'Ⅲ' }; if (score >= 30) return { level: '注意', roman: 'Ⅱ' }; return { level: '平常', roman: 'Ⅰ' }; }

function regional(metrics) {
  const { air, market, shipping, solar, crisis } = metrics;
  const newsMap = {};
  for (const n of crisis.raw?.regionalNews || []) newsMap[n.name] = n.count || 0;
  const newsBoost = name => Math.min(22, (newsMap[name] || 0) * 0.7);
  const regions = [
    ['中東方面', air.value * .30 + shipping.value * .26 + market.value * .14 + crisis.value * .24 + 8 + newsBoost('中東方面')],
    ['台湾海峡方面', air.value * .32 + shipping.value * .18 + solar.value * .08 + crisis.value * .28 + 7 + newsBoost('台湾海峡方面')],
    ['黒海方面', air.value * .25 + market.value * .20 + shipping.value * .16 + crisis.value * .30 + 6 + newsBoost('黒海方面')],
    ['日本周辺', air.value * .22 + solar.value * .23 + shipping.value * .14 + crisis.value * .21 + 4 + newsBoost('日本周辺')],
    ['米国本土方面', market.value * .30 + air.value * .17 + solar.value * .10 + crisis.value * .26 + 4 + newsBoost('米国本土方面')],
    ['北極圏方面', solar.value * .35 + air.value * .16 + crisis.value * .22 + 8 + newsBoost('北極圏方面')]
  ];
  return regions.map(([name, score]) => ({ name, score: clamp(score), news: newsMap[name] || 0 })).sort((a, b) => b.score - a.score);
}

export default async function handler(req, res) {
  try {
    const [air, market, solar, crisis] = await Promise.all([airMetric(), marketMetric(), solarMetric(), crisisMetric()]);
    const shipping = shippingMetric(air, market);
    const doom = clamp(air.value * .28 + market.value * .22 + shipping.value * .18 + solar.value * .12 + crisis.value * .20);
    const lv = level(doom);
    const metrics = { air, market, shipping, solar, crisis };
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ ok: true, updatedAt: new Date().toISOString(), doom, level: lv.level, roman: lv.roman, metrics, regions: regional(metrics) });
  } catch (e) {
    const air = { value: 55, source: 'fallback', label: '航空活動を推定観測', raw: {} };
    const market = { value: 48, source: 'fallback', label: '市場心理を推定観測', raw: {} };
    const solar = { value: 36, source: 'fallback', label: '太陽活動を推定観測', raw: {} };
    const crisis = { value: 52, source: 'fallback', label: '危機報道を推定観測', raw: { regionalNews: [] } };
    const shipping = shippingMetric(air, market);
    const doom = clamp(air.value * .28 + market.value * .22 + shipping.value * .18 + solar.value * .12 + crisis.value * .20);
    const lv = level(doom);
    const metrics = { air, market, shipping, solar, crisis };
    res.status(200).json({ ok: true, updatedAt: new Date().toISOString(), doom, level: lv.level, roman: lv.roman, metrics, regions: regional(metrics), fallback: true });
  }
}
