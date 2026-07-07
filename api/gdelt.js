const countries = [
  ['ウクライナ','🇺🇦','Ukraine'],['ロシア','🇷🇺','Russia'],['イラン','🇮🇷','Iran'],['中国','🇨🇳','China'],['台湾','🇹🇼','Taiwan'],['イスラエル','🇮🇱','Israel'],['アメリカ','🇺🇸','United States'],['日本','🇯🇵','Japan'],['北朝鮮','🇰🇵','North Korea'],['パキスタン','🇵🇰','Pakistan']
];
const fallback = {
  ok:true, global:42, updated:new Date().toISOString(),
  ranking:countries.slice(0,8).map((c,i)=>({country:c[0],flag:c[1],score:[72,69,62,55,49,47,45,38][i],reports:Math.max(4,12-i),detail:i<2?'軍事衝突 / 継続監視':i<5?'地域緊張 / 警戒':'周辺情勢 / 観測'})),
  news:[
    {title:'台湾海峡周辺の軍事活動に関する警戒が継続',source:'world monitor',region:'Asia'},
    {title:'中東地域で緊張状態が続き、各国が情勢を注視',source:'world monitor',region:'Middle East'},
    {title:'欧州方面で防衛・安全保障に関する動きが継続',source:'world monitor',region:'Europe'}
  ]
};
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=1800');
  try{
    const url='https://api.gdeltproject.org/api/v2/doc/doc?query=(conflict%20OR%20military%20OR%20missile%20OR%20airstrike%20OR%20earthquake%20OR%20crisis)&mode=ArtList&format=json&maxrecords=30&sort=HybridRel';
    const r=await fetch(url,{headers:{'user-agent':'doomsday-monitor-v7'}});
    if(!r.ok) return res.status(200).json(fallback);
    const j=await r.json(); const arts=j.articles||[];
    const scores=countries.map(([country,flag,en],idx)=>{const hits=arts.filter(a=>((a.title||'')+' '+(a.seendate||'')+' '+(a.sourceCountry||'')).toLowerCase().includes(en.toLowerCase())).length; const base=[65,62,58,50,45,43,40,35,38,34][idx]; return {country,flag,score:Math.min(95,base+hits*4),reports:hits,detail:hits?'関連報道 / 観測':'周辺情勢 / 観測'};}).sort((a,b)=>b.score-a.score);
    const news=arts.slice(0,10).map(a=>({title:a.title||'観測ニュース',url:a.url,source:a.domain||'public source',region:a.sourceCountry||'world'}));
    const global=Math.round(scores.slice(0,5).reduce((s,x)=>s+x.score,0)/5);
    return res.status(200).json({ok:true,global,updated:new Date().toISOString(),ranking:scores,news:news.length?news:fallback.news});
  }catch(e){return res.status(200).json(fallback);}
}
