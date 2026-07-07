const COUNTRIES = [
  ['Ukraine','ウクライナ','🇺🇦',['ukraine','kyiv','zelensky','russia ukraine','donetsk','kharkiv']],
  ['Russia','ロシア','🇷🇺',['russia','moscow','kremlin','putin','ukraine russia']],
  ['Iran','イラン','🇮🇷',['iran','tehran','israel iran','nuclear iran']],
  ['China','中国','🇨🇳',['china','beijing','taiwan strait','south china sea']],
  ['Taiwan','台湾','🇹🇼',['taiwan','taipei','taiwan strait']],
  ['Israel','イスラエル','🇮🇱',['israel','gaza','hezbollah','iran israel']],
  ['Gaza','ガザ','🇵🇸',['gaza','hamas','rafah','palestinian']],
  ['United States','アメリカ','🇺🇸',['united states','washington','pentagon','trump','biden']],
  ['North Korea','北朝鮮','🇰🇵',['north korea','pyongyang','kim jong un','missile north korea']],
  ['South Korea','韓国','🇰🇷',['south korea','seoul','dmz']],
  ['Japan','日本','🇯🇵',['japan','tokyo','okinawa','earthquake japan']],
  ['India','インド','🇮🇳',['india','new delhi','pakistan india']],
  ['Pakistan','パキスタン','🇵🇰',['pakistan','islamabad','india pakistan']],
  ['Syria','シリア','🇸🇾',['syria','damascus']],
  ['Lebanon','レバノン','🇱🇧',['lebanon','hezbollah','beirut']],
  ['Yemen','イエメン','🇾🇪',['yemen','houthi','red sea']],
  ['Venezuela','ベネズエラ','🇻🇪',['venezuela','caracas']],
  ['Bolivia','ボリビア','🇧🇴',['bolivia','la paz']],
  ['Sudan','スーダン','🇸🇩',['sudan','khartoum']],
  ['Myanmar','ミャンマー','🇲🇲',['myanmar','burma']]
];
const BAD = ['war','attack','missile','strike','drone','invasion','conflict','explosion','nuclear','sanction','protest','coup','military','evacuation','dead','killed','crisis','emergency','earthquake','flood','wildfire','border','threat'];
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
const safeFetch=async(url)=>{const r=await fetch(url,{headers:{'user-agent':'SAT-SYS-01/5.0'},cache:'no-store'}); if(!r.ok) throw new Error('upstream '+r.status); return r.json();};
function scoreArticles(arts, keys){
  let mentions=0, severe=0, latest=[];
  for(const a of arts){
    const text=((a.title||'')+' '+(a.seendate||'')).toLowerCase();
    if(keys.some(k=>text.includes(k))){
      mentions++;
      const hit=BAD.filter(w=>text.includes(w)).length;
      severe+=hit;
      if(latest.length<3) latest.push({title:a.title||'No title', url:a.url||'', source:a.sourcecountry||'', seen:a.seendate||''});
    }
  }
  return {mentions,severe,latest};
}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','s-maxage=120, stale-while-revalidate=600');
  const url='https://api.gdeltproject.org/api/v2/doc/doc?query=(war%20OR%20attack%20OR%20missile%20OR%20military%20OR%20crisis%20OR%20earthquake%20OR%20flood%20OR%20protest%20OR%20nuclear)&mode=artlist&format=json&maxrecords=250&sort=hybridrel';
  try{
    const data=await safeFetch(url);
    const arts=Array.isArray(data.articles)?data.articles:[];
    const ranking=COUNTRIES.map(([en,jp,flag,keys])=>{
      const s=scoreArticles(arts,keys);
      const score=clamp(Math.round(8 + s.mentions*8 + s.severe*5));
      return {en,jp,flag,score,mentions:s.mentions,severe:s.severe,articles:s.latest};
    }).sort((a,b)=>b.score-a.score).slice(0,20);
    const global=clamp(Math.round(ranking.slice(0,8).reduce((a,c)=>a+c.score,0)/8));
    res.status(200).json({ok:true,source:'GDELT',updated:new Date().toISOString(),global,ranking});
  }catch(e){
    res.status(200).json({ok:false,error:String(e.message||e),updated:new Date().toISOString(),global:35,ranking:[]});
  }
}
