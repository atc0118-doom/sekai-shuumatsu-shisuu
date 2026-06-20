// SAT-SYS-01 / Ver4.1 World Anomaly Ranking API
// Fixes: country ranking now requires crisis-related terms, excludes sports/entertainment noise,
// dampens over-reported countries, and uses 72h GDELT windows to reduce rapid rank swapping.

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(n) || 0)));

async function fetchJson(url, timeoutMs = 6500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'SAT-SYS-01/4.1' },
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
    return { value: pseudo(Date.now() / 3600000, 56, 13), raw: {}, label: '航空活動を推定観測', source: '推定' };
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
    return { value: pseudo(Date.now() / 4200000, 42, 16), raw: {}, label: '太陽活動を推定観測', source: '推定' };
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
    return { value: pseudo(Date.now() / 5100000, 50, 18), raw: {}, label: '市場心理を推定観測', source: '推定' };
  }
}

function shippingMetric(air, market) {
  const wave = pseudo(Date.now() / 6200000, 50, 12);
  const value = clamp(air.value * .22 + market.value * .38 + wave * .40);
  return { value, raw: { inferredFrom: ['air', 'market'] }, label: value >= 70 ? '海運の乱れが増幅' : '海運の乱れを推定観測', source: '推定' };
}

// Crisis ranking: the important part is NOT country-name volume.
// Each article must contain crisis terms, and obvious sports/entertainment/tourism noise is filtered out.
const crisisQuery = 'war OR conflict OR missile OR nuclear OR attack OR military OR invasion OR coup OR protest OR sanctions OR terror OR terrorism OR riot OR unrest OR violence OR crackdown OR emergency OR earthquake OR disaster OR cyberattack OR drone OR airstrike OR ceasefire OR strike';
const highTerms = ['war','missile','nuclear','invasion','airstrike','drone','attack','terror','terrorism','coup','ceasefire','military'];
const midTerms = ['conflict','sanction','sanctions','protest','riot','unrest','violence','crackdown','emergency','earthquake','disaster','cyberattack','strike'];
const excludeTerms = ['soccer','football','world cup','baseball','basketball','tennis','olympic','olympics','movie','film','anime','manga','celebrity','music','concert','tourism','travel','fashion','recipe','gaming','video game'];

const targets = [
  {name:'イスラエル周辺', flag:'🇮🇱', q:'israel OR gaza OR palestine OR hamas OR lebanon', dampen:1.00, base:18},
  {name:'イラン', flag:'🇮🇷', q:'iran OR tehran', dampen:1.00, base:17},
  {name:'ウクライナ', flag:'🇺🇦', q:'ukraine OR kyiv OR kiev', dampen:0.95, base:18},
  {name:'台湾海峡', flag:'🇹🇼', q:'taiwan OR "taiwan strait"', dampen:0.95, base:16},
  {name:'ロシア', flag:'🇷🇺', q:'russia OR moscow', dampen:0.72, base:15},
  {name:'中国', flag:'🇨🇳', q:'china OR beijing OR "south china sea"', dampen:0.62, base:14},
  {name:'黒海周辺', flag:'🌊', q:'"black sea" OR crimea OR sevastopol', dampen:1.05, base:15},
  {name:'北朝鮮', flag:'🇰🇵', q:'"north korea" OR pyongyang', dampen:1.05, base:15},
  {name:'パキスタン', flag:'🇵🇰', q:'pakistan OR islamabad OR kashmir', dampen:0.90, base:13},
  {name:'インド', flag:'🇮🇳', q:'india OR kashmir', dampen:0.56, base:10},
  {name:'コンゴ民主共和国', flag:'🇨🇩', q:'"democratic republic of congo" OR "dr congo" OR congo OR goma', dampen:1.18, base:15},
  {name:'ボリビア', flag:'🇧🇴', q:'bolivia OR "la paz"', dampen:1.20, base:11},
  {name:'ベネズエラ', flag:'🇻🇪', q:'venezuela OR caracas', dampen:1.05, base:11},
  {name:'セルビア', flag:'🇷🇸', q:'serbia OR belgrade OR kosovo', dampen:1.02, base:11},
  {name:'紅海周辺', flag:'🌊', q:'"red sea" OR houthi OR yemen', dampen:1.10, base:16},
  {name:'スーダン', flag:'🇸🇩', q:'sudan OR khartoum OR darfur', dampen:1.15, base:16},
  {name:'ミャンマー', flag:'🇲🇲', q:'myanmar OR burma OR naypyidaw', dampen:1.12, base:15},
  {name:'ハイチ', flag:'🇭🇹', q:'haiti OR "port-au-prince"', dampen:1.12, base:13},
  {name:'米国本土', flag:'🇺🇸', q:'"united states" OR washington OR pentagon', dampen:0.42, base:8},
  {name:'日本周辺', flag:'🇯🇵', q:'japan OR okinawa OR "east china sea" OR senkaku', dampen:0.48, base:8}
];

function hasAny(text, terms) { return terms.some(t => text.includes(t)); }
function scoreArticle(article) {
  const text = `${article.title || ''} ${article.url || ''} ${article.domain || ''}`.toLowerCase();
  const high = highTerms.filter(t => text.includes(t)).length;
  const mid = midTerms.filter(t => text.includes(t)).length;
  const excluded = hasAny(text, excludeTerms);
  if (high === 0 && mid === 0) return 0;
  if (excluded && high === 0) return 0;
  return high * 4 + mid * 2;
}

async function gdeltSignal(target) {
  const q = `(${target.q}) (${crisisQuery})`;
  const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + encodeURIComponent(q) + '&mode=artlist&format=json&maxrecords=150&timespan=72h&sort=datedesc';
  try {
    const data = await fetchJson(url, 7500);
    const articles = Array.isArray(data.articles) ? data.articles : [];
    const seen = new Set();
    let crisisArticles = 0;
    let weighted = 0;
    let severe = 0;
    for (const a of articles) {
      const key = a.url || a.title;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const s = scoreArticle(a);
      if (s <= 0) continue;
      crisisArticles += 1;
      weighted += s;
      if (s >= 4) severe += 1;
    }
    const adjusted = weighted * target.dampen;
    const score = clamp(target.base + Math.sqrt(adjusted) * 7.5 + Math.min(crisisArticles, 80) * 0.25 + severe * 1.3);
    return { score, count: crisisArticles, weighted: Math.round(weighted), severe };
  } catch (e) {
    return null;
  }
}

async function crisisMetricAndRanking() {
  const results = await Promise.allSettled(targets.map(t => gdeltSignal(t)));
  const ranked = targets.map((t, i) => {
    const sig = results[i].status === 'fulfilled' ? results[i].value : null;
    if (!sig) {
      const fallback = pseudo((Date.now()/86400000) + i * 3.11, t.base + 16, 7);
      return { name: t.name, flag: t.flag, score: fallback, count: null, reason: '危機報道を推定観測' };
    }
    return {
      name: t.name,
      flag: t.flag,
      score: sig.score,
      count: sig.count,
      reason: `危機関連 ${sig.count}件 / 重大語 ${sig.severe}`
    };
  }).sort((a, b) => b.score - a.score);

  // Top 10 average, not one noisy country, controls the global crisis metric.
  const avg = ranked.slice(0, 10).reduce((s, r) => s + r.score, 0) / 10;
  return {
    metric: {
      value: clamp(avg),
      raw: { top: ranked.slice(0, 5) },
      label: avg >= 60 ? '危機報道が増加' : '危機報道を観測',
      source: 'GDELT filtered'
    },
    ranking: ranked.slice(0, 20)
  };
}

function level(score) {
  if (score >= 85) return { level: '異常', roman: 'Ⅴ' };
  if (score >= 70) return { level: '危険', roman: 'Ⅳ' };
  if (score >= 50) return { level: '警戒', roman: 'Ⅲ' };
  if (score >= 30) return { level: '注意', roman: 'Ⅱ' };
  return { level: '平常', roman: 'Ⅰ' };
}

function regional(metrics) {
  const { air, market, shipping, solar, crisis } = metrics;
  const regions = [
    ['中東方面', air.value*.35 + shipping.value*.23 + market.value*.14 + crisis.value*.28 + 10],
    ['台湾海峡方面', air.value*.37 + shipping.value*.17 + solar.value*.10 + crisis.value*.28 + 8],
    ['黒海方面', air.value*.28 + market.value*.18 + shipping.value*.16 + crisis.value*.34 + 6],
    ['日本周辺', air.value*.24 + solar.value*.25 + shipping.value*.14 + crisis.value*.18 + 4],
    ['米国本土方面', market.value*.30 + air.value*.16 + solar.value*.12 + crisis.value*.28 + 4],
    ['極域観測圏', solar.value*.42 + air.value*.18 + crisis.value*.12 + 8]
  ];
  return regions.map(([name, score]) => ({ name, score: clamp(score) })).sort((a, b) => b.score - a.score);
}

export default async function handler(req, res) {
  try {
    const [air, market, solar, crisisPack] = await Promise.all([airMetric(), marketMetric(), solarMetric(), crisisMetricAndRanking()]);
    const shipping = shippingMetric(air, market);
    const crisis = crisisPack.metric;
    const metrics = { air, market, shipping, solar, crisis };
    const doom = clamp(air.value*.28 + market.value*.22 + shipping.value*.18 + solar.value*.12 + crisis.value*.20);
    const lv = level(doom);
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    res.status(200).json({ ok:true, updatedAt:new Date().toISOString(), doom, level:lv.level, roman:lv.roman, metrics, regions:regional(metrics), worldRanking:crisisPack.ranking, rankingNote:'危機ワード必須・スポーツ/芸能/観光除外・報道量補正済み' });
  } catch (e) {
    const air = { value:55, source:'fallback', label:'航空活動を推定観測', raw:{} };
    const market = { value:48, source:'fallback', label:'市場心理を推定観測', raw:{} };
    const solar = { value:36, source:'fallback', label:'太陽活動を推定観測', raw:{} };
    const crisis = { value:34, source:'fallback', label:'危機報道を推定観測', raw:{} };
    const shipping = shippingMetric(air, market);
    const metrics = { air, market, shipping, solar, crisis };
    const doom = clamp(air.value*.28 + market.value*.22 + shipping.value*.18 + solar.value*.12 + crisis.value*.20);
    const lv = level(doom);
    res.status(200).json({ ok:true, updatedAt:new Date().toISOString(), doom, level:lv.level, roman:lv.roman, metrics, regions:regional(metrics), worldRanking:[], fallback:true });
  }
}
