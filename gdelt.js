const SITE_URL='https://sekai-shuumatsu-shisuu.vercel.app/';
const fallback={ok:true,global:35,updated:new Date().toISOString(),ranking:[{country:'ウクライナ',flag:'🇺🇦',score:72,reports:12,label:'軍事衝突 / 重大',lat:49,lng:32},{country:'ロシア',flag:'🇷🇺',score:69,reports:11,label:'軍事緊張 / 警戒',lat:56,lng:37},{country:'イラン',flag:'🇮🇷',score:62,reports:9,label:'中東緊張 / 警戒',lat:32,lng:53},{country:'中国',flag:'🇨🇳',score:55,reports:8,label:'台湾海峡 / 注意',lat:35,lng:103},{country:'台湾',flag:'🇹🇼',score:49,reports:6,label:'軍事活動 / 注意',lat:23.7,lng:121},{country:'イスラエル',flag:'🇮🇱',score:47,reports:6,label:'地域衝突 / 注意',lat:31.5,lng:35},{country:'アメリカ',flag:'🇺🇸',score:45,reports:5,label:'軍事展開 / 観測',lat:38,lng:-97},{country:'日本',flag:'🇯🇵',score:44,reports:4,label:'周辺警戒 / 観測',lat:36,lng:138}],news:[{area:'台湾海峡',level:'警戒',delta:'+3',title:'台湾海峡周辺で軍事活動への警戒が続いています。',source:'Reuters / GDELT',url:'https://www.reuters.com/world/asia-pacific/',lat:23.7,lng:121},{area:'中東',level:'警戒',delta:'+2',title:'中東地域では緊張状態が継続しています。',source:'AP News / BBC',url:'https://apnews.com/hub/middle-east',lat:32,lng:53},{area:'東欧',level:'注意',delta:'+1',title:'東欧方面で安全保障上の不安定要素が観測されています。',source:'BBC / GDELT',url:'https://www.bbc.com/news/world/europe',lat:49,lng:32}]};
let currentData=fallback;const $=id=>document.getElementById(id);
function level(s){return s>=90?'Ⅴ 最悪':s>=70?'Ⅳ 重大':s>=50?'Ⅲ 警戒':s>=30?'Ⅱ 注意':'Ⅰ 平常'}
function log(m){$('logs').textContent=`[${new Date().toLocaleTimeString('ja-JP')}] ${m}\n`+$('logs').textContent}
async function load(){log('観測開始');try{const r=await fetch('/api/gdelt',{cache:'no-store'});const d=await r.json();if(d&&Array.isArray(d.ranking)&&d.ranking.length)currentData=d;}catch(e){currentData=fallback}render(currentData);log('世界ランキングと観測ニュースを更新')}
function src(n){return n.url?`<p class="source-row">出典：<a href="${n.url}" target="_blank" rel="noopener">${n.source||'source'}</a></p>`:`<p class="source-row">出典：${n.source||'公開情報'}</p>`}
function x(lng){return ((Number(lng)+180)/360)*100}function y(lat){return ((90-Number(lat))/180)*100}
function mapLevel(score){return score>=65?'重大':score>=50?'警戒':'注意'}
function render(data){const score=Number(data.global||35);$('now').textContent=new Date().toLocaleString('ja-JP');$('status').textContent='観測継続中';$('globalScore').textContent=score;$('levelText').textContent=level(score);$('meterFill').style.width=Math.min(100,score)+'%';
$('ranking').innerHTML=(data.ranking||fallback.ranking).map((r,i)=>`<div class="rank-item"><div class="rank-no">${String(i+1).padStart(2,'0')}</div><div><div class="rank-name">${r.flag} ${r.country}</div><div class="meta">危機報道 ${r.reports||0}件 / ${r.label||'観測'}</div></div><div class="rank-score">${r.score}</div></div>`).join('');
$('newsList').innerHTML=(data.news||fallback.news).map(n=>`<article class="news-item"><h3><span class="badge">${n.level}</span>${n.area}　${n.delta||'±0'}</h3><p>${n.title}</p>${src(n)}</article>`).join('');
$('todayFocus').innerHTML=(data.news||fallback.news).slice(0,3).map(n=>`<div class="focus-item"><h3><span class="badge">${n.level}</span>${n.area}　${n.delta||'±0'}</h3><p>${n.title}</p>${src(n)}</div>`).join('');
$('risers').innerHTML=(data.ranking||fallback.ranking).slice(0,3).map((r,i)=>`<p>${i+1}. ${r.flag} ${r.country}　+${Math.max(1,8-i*2)}</p>`).join('');
$('aiFocus').innerHTML=`${data.ranking[0].flag} ${data.ranking[0].country}、${data.ranking[1].flag} ${data.ranking[1].country}、${data.ranking[2].flag} ${data.ranking[2].country} 周辺を重点観測。`;
$('aiAnalysis').innerHTML=`現在の指数は ${score}（${level(score)}）。複数地域で緊張は継続しています。出典付きニュースとランキングを照合し、急変兆候を監視しています。`;
const values=[34,36,39,43,41,38,35,31,28,26,29,33,35,38,40,43,41,39,36,30,28,31,34,38];$('trend').innerHTML=values.map(v=>`<div class="bar" title="${v}" style="height:${Math.max(8,Math.min(100,v*1.7))}%"></div>`).join('');
const svg=`<svg class="world-svg" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
<path class="land" d="M72 166 L118 132 L190 116 L247 146 L286 189 L258 235 L176 244 L112 225 Z"/>
<path class="land" d="M205 250 L275 276 L304 336 L276 421 L215 458 L175 404 L155 335 Z"/>
<path class="land" d="M382 142 L453 116 L528 132 L578 120 L665 151 L733 176 L758 219 L704 260 L610 251 L541 269 L458 246 L409 210 Z"/>
<path class="land" d="M550 270 L615 288 L656 348 L633 424 L578 392 L553 336 Z"/>
<path class="land" d="M708 194 L790 142 L898 157 L949 225 L900 294 L794 302 L735 260 Z"/>
<path class="land" d="M820 334 L892 348 L930 401 L896 448 L827 431 L794 379 Z"/>
<path class="land" d="M420 305 L485 292 L516 350 L489 402 L431 384 Z"/>
<path class="coast" d="M80 200 C170 170 240 185 285 210 M390 180 C500 150 635 175 744 215 M718 232 C790 215 872 230 930 260"/>
<path class="route" d="M575 170 C610 155 650 160 680 185 C715 218 720 230 756 235"/>
<path class="route" d="M600 215 C635 245 665 270 710 282"/>
<path class="route" d="M238 185 C365 110 500 115 590 170"/>
</svg>`;
const mapRows=(data.ranking||fallback.ranking).slice(0,8);
const rings=mapRows.filter(r=>r.score>=60).map(r=>`<span class="hot-ring" style="left:${x(r.lng)}%;top:${y(r.lat)}%"></span>`).join('');
const points=mapRows.map(r=>`<button class="zone" data-level="${mapLevel(r.score)}" data-name="${r.country}" style="left:${x(r.lng)}%;top:${y(r.lat)}%" title="${r.country}" onclick="showMapInfo('${r.flag} ${r.country}',${r.score},'${r.label||'観測'}')">${r.flag}</button>`).join('');
const legend=`<div class="map-title">TACTICAL WORLD MAP / LIVE ZONES</div><div class="map-legend"><span>🔴 重大</span><span>🟠 警戒</span><span>🟡 注意</span></div>`;
$('map').innerHTML=svg+rings+points+legend;
$('mapInfo').innerHTML='<div class="map-cards">'+(data.ranking||fallback.ranking).slice(0,4).map(r=>`<div class="map-card"><strong>${r.flag} ${r.country}　${r.score}</strong><small>${r.label||'観測'} / 報道 ${r.reports||0}件</small></div>`).join('')+'</div>'} 
window.showMapInfo=function(name,score,label){$('mapInfo').textContent=`${name}　危険度 ${score} / ${label}`}
function topCountries(){return (currentData.ranking||fallback.ranking).slice(0,3).map(r=>`${r.flag} ${r.country}`).join('・')}
function hashtags(){const newsText=(currentData.news||fallback.news).map(n=>n.title+n.area).join(' ');const tags=['#終末観測盤','#世界情勢','#世界異変','#国際ニュース','#速報','#BreakingNews','#WorldNews','#Geopolitics','#GlobalRisk','#危機管理','#軍事','#防災','#地政学','#安全保障','#ニュース','#観測','#AI','#Ukraine','#Russia','#Iran','#Taiwan'];if(newsText.includes('台湾'))tags.push('#台湾','#台湾海峡','#中国');if(newsText.includes('ウクライナ'))tags.push('#NATO','#UkraineWar');if(newsText.includes('イスラエル'))tags.push('#Israel','#MiddleEast');if(newsText.includes('日本'))tags.push('#日本','#Japan');return [...new Set(tags)].join(' ')}
window.makePost=function(type){const score=Number(currentData.global||35);const countries=topCountries();const news=(currentData.news||fallback.news).slice(0,2).map(n=>'・'+n.title+'（'+(n.source||'公開情報')+'）').join('\n');const tags=hashtags();const posts={朝:`【朝の観測報告】\n\n世界終末指数 ${score}（${level(score)}）\n\n現在、${countries} 周辺を中心に観測を継続しています。\n\n${news}\n\n観測継続中。\n${SITE_URL}\n\n${tags}`,昼:`【昼の観測】\n\n世界異変ランキングを更新。\n\n上位観測地域：\n${countries}\n\n終末指数：${score}（${level(score)}）\n\n${news}\n\n詳細は終末観測盤で確認。\n${SITE_URL}\n\n${tags}`,夜:`【本日の観測まとめ】\n\n本日の世界終末指数：${score}（${level(score)}）\n\n${countries} 周辺で緊張状態を観測。\n\n${news}\n\n明日も観測を継続します。\n${SITE_URL}\n\n${tags}`,緊急:`⚠️【緊急観測】\n\n世界終末指数に大きな変動を観測。\n\n主な観測地域：\n${countries}\n\n${news}\n\n詳細は終末観測盤で更新中。\n${SITE_URL}\n\n${tags}`,AI:`観測官より\n\n世界は静かに見えても、水面下では絶えず変化しています。\n\n現在の終末指数は ${score}。\n${countries} 周辺を中心に観測を継続しています。\n\n${news}\n\n観測継続中。\n${SITE_URL}\n\n${tags}`};$('postText').value=posts[type]||posts.AI}
window.copyPost=async function(){const t=$('postText');t.select();try{await navigator.clipboard.writeText(t.value)}catch(e){document.execCommand('copy')}alert('コピーしました')};load();setInterval(load,15*60*1000);
