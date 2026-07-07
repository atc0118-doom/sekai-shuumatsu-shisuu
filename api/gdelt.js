const FALLBACK = {
  ok: false,
  source: 'stable-fallback',
  global: 35,
  ranking: [
    { country:'ウクライナ', flag:'🇺🇦', score:82, reports:12, keywords:'軍事衝突 / 重大' },
    { country:'ロシア', flag:'🇷🇺', score:78, reports:11, keywords:'軍事緊張 / 重大' },
    { country:'イラン', flag:'🇮🇷', score:71, reports:9, keywords:'中東緊張 / 警戒' },
    { country:'中国', flag:'🇨🇳', score:66, reports:8, keywords:'台湾海峡 / 警戒' },
    { country:'イスラエル', flag:'🇮🇱', score:64, reports:7, keywords:'地域衝突 / 警戒' },
    { country:'台湾', flag:'🇹🇼', score:59, reports:6, keywords:'軍事活動 / 注意' },
    { country:'アメリカ', flag:'🇺🇸', score:52, reports:5, keywords:'軍事展開 / 注意' },
    { country:'日本', flag:'🇯🇵', score:44, reports:4, keywords:'周辺警戒 / 観測' }
  ],
  news: [
    { title:'複数ソース取得制限時の安定表示に切替中', source:'system', country:'world', url:'' },
    { title:'GDELT等が429を返した場合はfallbackを使用', source:'system', country:'world', url:'' }
  ]
};
const countries = [
  ['Ukraine','ウクライナ','🇺🇦'],['Russia','ロシア','🇷🇺'],['Iran','イラン','🇮🇷'],['China','中国','🇨🇳'],['Israel','イスラエル','🇮🇱'],['Taiwan','台湾','🇹🇼'],['United States','アメリカ','🇺🇸'],['Japan','日本','🇯🇵'],['North Korea','北朝鮮','🇰🇵'],['Syria','シリア','🇸🇾'],['Yemen','イエメン','🇾🇪'],['India','インド','🇮🇳'],['Pakistan','パキスタン','🇵🇰'],['Turkey','トルコ','🇹🇷'],['Bolivia','ボリビア','🇧🇴']
];
function scoreFor(name, count){
  const base = {Ukraine:72,Russia:70,Iran:64,China:58,Israel:60,Taiwan:52,'United States':45,Japan:38,'North Korea':48,Syria:46,Yemen:44,India:38,Pakistan:38,Turkey:36,Bolivia:34}[name] || 30;
  return Math.min(95, Math.round(base + Math.min(18, count * 2)));
}
async function gdeltQuery(){
  const query = encodeURIComponent('(war OR missile OR military OR crisis OR attack OR conflict OR earthquake OR flood OR coup)');
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=40&sort=HybridRel`;
  const r = await fetch(url, { headers:{'user-agent':'doomsday-observer-v6'}, cache:'no-store' });
  if(!r.ok) throw new Error('upstream ' + r.status);
  return await r.json();
}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=1800');
  try{
    const json = await gdeltQuery();
    const articles = Array.isArray(json.articles) ? json.articles : [];
    const counts = Object.fromEntries(countries.map(([en])=>[en,0]));
    const news = [];
    for(const a of articles){
      const text = `${a.title||''} ${a.seendate||''}`;
      const hit = countries.find(([en]) => text.toLowerCase().includes(en.toLowerCase()));
      if(hit) counts[hit[0]]++;
      if(news.length < 12) news.push({ title:a.title || 'Untitled', source:a.domain || 'GDELT', country:hit ? hit[1] : 'world', url:a.url || '' });
    }
    const ranking = countries.map(([en,ja,flag])=>({country:ja,flag,reports:counts[en],score:scoreFor(en,counts[en]),keywords:counts[en]?'危機報道 / 観測':'基礎観測'})).sort((a,b)=>b.score-a.score).slice(0,20);
    const global = Math.round(ranking.slice(0,5).reduce((s,r)=>s+r.score,0)/5);
    res.status(200).json({ok:true, source:'GDELT', updated:new Date().toISOString(), global, ranking, news});
  }catch(e){
    res.status(200).json({...FALLBACK, updated:new Date().toISOString(), error:e.message});
  }
}
