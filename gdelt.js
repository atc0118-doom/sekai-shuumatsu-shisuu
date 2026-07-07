const $=id=>document.getElementById(id);
let state={score:35,delta:2,level:"Ⅱ 注意",ranking:[],news:[],trend:[28,31,32,30,34,33,35]};
const fallback={
 score:35,delta:2,level:"Ⅱ 注意",
 summary:"複数地域で緊張は継続。世界全体では急激な悪化は確認されていません。",
 ranking:[
  {country:"ウクライナ",flag:"🇺🇦",score:78},{country:"ロシア",flag:"🇷🇺",score:68},{country:"イラン",flag:"🇮🇷",score:62},{country:"イスラエル",flag:"🇮🇱",score:59},{country:"台湾",flag:"🇹🇼",score:52},{country:"中国",flag:"🇨🇳",score:50},{country:"アメリカ",flag:"🇺🇸",score:44},{country:"日本",flag:"🇯🇵",score:38},{country:"北朝鮮",flag:"🇰🇵",score:36},{country:"シリア",flag:"🇸🇾",score:34}
 ],
 news:[
  {title:"ウクライナ周辺で軍事的緊張が継続",source:"GDELT / Public News",url:"https://www.gdeltproject.org/"},
  {title:"中東地域で停戦協議と警戒が続く",source:"GDELT / Public News",url:"https://www.gdeltproject.org/"},
  {title:"台湾海峡周辺で安全保障上の警戒が続く",source:"GDELT / Public News",url:"https://www.gdeltproject.org/"}
 ],
 trend:[28,31,32,30,34,33,35]
};
async function load(){
 try{const r=await fetch('/api/gdelt',{cache:'no-store'}); const d=await r.json(); if(d && d.ok!==false){state={...fallback,...d};}else state=fallback;}catch(e){state=fallback;}
 render();
}
function levelFor(s){return s>=90?'Ⅴ 最悪':s>=70?'Ⅳ 重大':s>=50?'Ⅲ 警戒':s>=30?'Ⅱ 注意':'Ⅰ 平常'}
function render(){
 const s=Number(state.score||state.global||35); state.score=s; state.level=state.level||levelFor(s);
 $('score').textContent=s; $('level').textContent=state.level; $('delta').textContent=`24時間変動 ${state.delta>=0?'↑ +':'↓ '}${Math.abs(state.delta||0)}`; $('meterFill').style.width=Math.min(100,s)+'%';
 $('summary').textContent=state.summary||fallback.summary; $('updated').textContent='更新 '+new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'});
 $('topNews').classList.remove('skeleton'); $('topNews').innerHTML=(state.news||fallback.news).slice(0,3).map((n,i)=>`<article class="news-item"><div class="news-title">${i+1}. ${n.title}</div><div class="source">出典：<a href="${n.url||'#'}" target="_blank" rel="noopener">${n.source||'Public News'}</a></div></article>`).join('');
 $('ranking').classList.remove('skeleton'); $('ranking').innerHTML=(state.ranking||fallback.ranking).slice(0,10).map((r,i)=>`<div class="ranking-row"><div class="rank">${i+1}</div><div class="country">${r.flag||''} ${r.country}</div><div class="risk">${r.score}</div></div>`).join('');
 $('aiText').textContent=`現在もっとも注視すべき地域は ${(state.ranking||fallback.ranking)[0].country} 周辺です。終末指数は ${s}。短期的には局地的緊張の継続を観測しています。`;
 drawTrend(state.trend||fallback.trend);
 if(new URLSearchParams(location.search).get('admin')==='doom') $('adminPanel').style.display='block';
}
function drawTrend(vals){const svg=$('trend'); const w=320,h=120,p=12,max=100,min=0; const pts=vals.map((v,i)=>[p+i*(w-2*p)/(vals.length-1),h-p-(v-min)*(h-2*p)/(max-min)]); svg.innerHTML=`<path d="${pts.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' ')}"/>`+pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3"/>`).join('');}
function tags(){let t=["#終末観測盤","#世界情勢","#国際ニュース","#地政学","#危機管理","#防災","#WorldNews","#Geopolitics","#GlobalRisk"]; const txt=(state.news||[]).map(n=>n.title).join(' '); if(txt.includes('台湾'))t.push('#台湾海峡','#Taiwan'); if(txt.includes('ウクライナ'))t.push('#Ukraine','#Russia'); if(txt.includes('中東'))t.push('#MiddleEast'); return t.join(' ')}
window.makePost=function(type){const top=(state.ranking||fallback.ranking).slice(0,3).map((r,i)=>`${i+1}. ${r.flag||''}${r.country} ${r.score}`).join('\n'); const news=(state.news||fallback.news).slice(0,2).map(n=>`・${n.title}（${n.source||'Public News'}）`).join('\n'); const s=state.score; const base={
 '朝':`【朝の観測報告】\n\n世界終末指数：${s}（${state.level}）\n\n本日の重点観測地域\n${top}\n\n${news}\n\n30秒で世界情勢を確認。\nhttps://sekai-shuumatsu-shisuu.vercel.app\n\n${tags()}`,
 '昼':`【昼の観測】\n\n世界異変ランキングを更新。\n\n${top}\n\n現在の終末指数：${s}\n\n${news}\n\n観測継続中。\nhttps://sekai-shuumatsu-shisuu.vercel.app\n\n${tags()}`,
 '夜':`【本日の観測まとめ】\n\n世界終末指数：${s}\n\n${top}\n\n${news}\n\n明日も観測を継続します。\nhttps://sekai-shuumatsu-shisuu.vercel.app\n\n${tags()}`,
 '速報':`⚠️【緊急観測】\n\n世界終末指数に変動を観測。\n\n${top}\n\n${news}\n\n詳細は終末観測盤で更新中。\nhttps://sekai-shuumatsu-shisuu.vercel.app\n\n${tags()} #速報`,
 'AI':`観測官より\n\n数字は落ち着いていても、世界は止まっていません。\n\n現在の終末指数は ${s}。\n${(state.ranking||fallback.ranking)[0].country} 周辺を中心に観測を継続しています。\n\n${news}\n\nhttps://sekai-shuumatsu-shisuu.vercel.app\n\n${tags()}`
}; $('postText').value=base[type]||base.AI}
window.copyPost=function(){const t=$('postText'); t.select(); document.execCommand('copy'); alert('コピーしました')}
load();
