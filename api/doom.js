// SAT-SYS-01 / Ver3.5 GDELT enhanced doom API
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
    return { value: pseudo(seed, 56, 13), raw: { total: null, airborne: null, specialCandidate: null }, label: '航空活動を推定観測', source: '推定' };
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
    function lastClose(payload) {
      const r = payload?.chart?.result?.[0];
      const vals = (r?.indicators?.quote?.[0]?.close || []).filter(v => typeof v === 'number');
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

async function gdeltCount(query, timeoutMs = 5500) {
  const url = 'https://api.gdeltproject.org/api/v2/doc/doc?format=json&mode=artlist&maxrecords=75&timespan=24h&sort=hybridrel&query=' + encodeURIComponent(query);
  const data = await fetchJson(url, timeoutMs);
  const arts = Array.isArray(data.articles) ? data.articles : [];
  return arts.length;
}

async function worldMetric() {
  const queries = {
    '中東方面': '(Iran OR Israel OR Gaza OR Hezbollah OR "Red Sea" OR Yemen) (war OR attack OR missile OR conflict OR crisis)',
    '台湾海峡方面': '(Taiwan OR "Taiwan Strait" OR China OR PLA) (military OR drill OR incursion OR tension OR conflict)',
    '黒海方面': '(Ukraine OR Russia OR "Black Sea" OR Crimea) (war OR missile OR drone OR attack OR conflict)',
    '日本周辺': '(Japan OR "East China Sea" OR "North Korea" OR missile) (military OR alert OR launch OR tension)',
    '米国本土方面': '(United States OR America OR Pentagon) (terror OR cyberattack OR emergency OR crisis OR threat)',
    '北極圏方面': '(Arctic OR Greenland OR "Northern Sea Route") (military OR Russia OR NATO OR tension)'
  };
  try {
    const results = await Promise.allSettled(Object.entries(queries).map(async ([name, q]) => [name, await gdeltCount(q)]));
    const regionNews = {};
    for (const r of results) if (r.status === 'fulfilled') regionNews[r.value[0]] = r.value[1];
    const counts = Object.values(regionNews);
    if (!counts.length) throw new Error('no gdelt data');
    const max = Math.max(...counts, 1);
    const avg = counts.reduce((a,b)=>a+b,0)/counts.length;
    const score = clamp(24 + avg * 1.4 + max * 0.75);
    return { value: score, raw: { regionNews }, label: score >= 70 ? '世界関連報道が増幅' : '世界情勢報道を観測', source: 'GDELT' };
  } catch (e) {
    const seed = Date.now() / 4700000;
    return { value: pseudo(seed, 52, 15), raw: { regionNews: {} }, label: '世界情勢を推定観測', source: '推定' };
  }
}

function shippingMetric(air, market) {
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
  const { air, market, shipping, solar, world } = metrics;
  const news = world.raw?.regionNews || {};
  const n = name => clamp((news[name] || 0) * 1.25);
  const regions = [
    ['中東方面', air.value * .30 + shipping.value * .26 + market.value * .14 + world.value * .22 + n('中東方面') * .25],
    ['台湾海峡方面', air.value * .34 + shipping.value * .18 + solar.value * .10 + world.value * .22 + n('台湾海峡方面') * .25],
    ['黒海方面', air.value * .24 + market.value * .22 + shipping.value * .18 + world.value * .22 + n('黒海方面') * .25],
    ['日本周辺', air.value * .22 + solar.value * .26 + shipping.value * .14 + world.value * .18 + n('日本周辺') * .22],
    ['米国本土方面', market.value * .32 + air.value * .18 + solar.value * .12 + world.value * .20 + n('米国本土方面') * .20],
    ['北極圏方面', solar.value * .35 + air.value * .16 + world.value * .22 + n('北極圏方面') * .20]
  ];
  return regions.map(([name, score]) => ({ name, score: clamp(score), news: news[name] || 0 })).sort((a, b) => b.score - a.score);
}

export default async function handler(req, res) {
  try {
    const [air, market, solar, world] = await Promise.all([airMetric(), marketMetric(), solarMetric(), worldMetric()]);
    const shipping = shippingMetric(air, market);
    const doom = clamp(air.value * .28 + market.value * .22 + shipping.value * .18 + solar.value * .12 + world.value * .20);
    const lv = level(doom);
    const metrics = { air, market, shipping, solar, world };
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ ok: true, updatedAt: new Date().toISOString(), doom, level: lv.level, roman: lv.roman, metrics, regions: regional(metrics) });
  } catch (e) {
    const air = { value: 55, source: 'fallback', label: '航空活動を推定観測', raw: {} };
    const market = { value: 48, source: 'fallback', label: '市場心理を推定観測', raw: {} };
    const solar = { value: 36, source: 'fallback', label: '太陽活動を推定観測', raw: {} };
    const world = { value: 52, source: 'fallback', label: '世界情勢を推定観測', raw: { regionNews: {} } };
    const shipping = shippingMetric(air, market);
    const doom = clamp(air.value * .28 + market.value * .22 + shipping.value * .18 + solar.value * .12 + world.value * .20);
    const lv = level(doom);
    const metrics = { air, market, shipping, solar, world };
    res.status(200).json({ ok: true, updatedAt: new Date().toISOString(), doom, level: lv.level, roman: lv.roman, metrics, regions: regional(metrics), fallback: true });
  }
}
