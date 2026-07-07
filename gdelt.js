const SITE_URL="https://sekai-shuumatsu-shisuu.vercel.app";
const fallback={ok:true,global:35,updated:new Date().toISOString(),ranking:[
{country:"ウクライナ",flag:"🇺🇦",score:78,reports:12,topic:"軍事衝突 / 重大",x:53,y:34,delta:8},
{country:"ロシア",flag:"🇷🇺",score:67,reports:10,topic:"軍事展開 / 警戒",x:68,y:27,delta:6},
{country:"イラン",flag:"🇮🇷",score:79,reports:9,topic:"中東緊張 / 重大",x:61,y:51,delta:4},
{country:"中国",flag:"🇨🇳",score:55,reports:7,topic:"軍事活動 / 警戒",x:75,y:45,delta:3},
{country:"台湾",flag:"🇹🇼",score:65,reports:6,topic:"台湾海峡 / 警戒",x:83,y:49,delta:3},
{country:"イスラエル",flag:"🇮🇱",score:47,reports:5,topic:"地域衝突 / 注意",x:58,y:48,delta:2},
{country:"アメリカ",flag:"🇺🇸",score:45,reports:4,topic:"軍事展開 / 観測",x:19,y:42,delta:1},
{country:"日本",flag:"🇯🇵",score:44,reports:4,topic:"周辺警戒 / 観測",x:87,y:39,delta:1}],
news:[
{area:"台湾海峡",level:"警戒",delta:"+3",title:"台湾海峡周辺で軍事活動への警戒が続いています。",source:"GDELT / public news",url:"https://www.gdeltproject.org/"},
{area:"中東",level:"警戒",delta:"+2",title:"中東地域では緊張状態が継続しています。",source:"GDELT / public news",url:"https://www.gdeltproject.org/"},
{area:"東欧",level:"注意",delta:"+1",title:"東欧方面で安全保障上の不安定要素が観測されています。",source:"GDELT / public news",url:"https://www.gdeltproject.org/"}
]};
let currentData=fallback;const $=id=>document.getElementById(id);
function level(s){return s>=90?'Ⅴ 最悪':s>=70?'Ⅳ 重大':s>=50?'Ⅲ 警戒':s>=30?'Ⅱ 注意':'Ⅰ 平常'}
function log(m){const el=$('logs');if(el)el.textContent=`[${new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}] ${m}\n`+el.textContent}
async function load(){log('観測開始');try{const res=await fetch('/api/gdelt',{cache:'no-store'});const data=await res.json();if(data&&Array.isArray(data.ranking)&&data.ranking.length)currentData=data;else currentData=fallback}catch(e){currentData=fallback}render(currentData)}
function render(data){const score=Number(data.global||35);$('now').textContent=new Date().toLocaleString('ja-JP');$('status').textContent='観測継続中';$('globalScore').textContent=score;$('levelText').textContent=level(score);$('meterFill').style.width=Math.min(100,score)+'%';
$('focusNews').innerHTML=(data.news||fallback.news).slice(0,3).map(n=>`<div class="news-card"><div class="news-head"><span class="badge">${n.level||'観測'}</span><span class="news-title">${n.area||'world'}</span><span class="news-delta">${n.delta||''}</span></div><div class="news-desc">${n.title}</div><div class="source">出典：<a href="${n.url||'#'}" target="_blank" rel="noopener">${n.source||'Public source'}</a></div></div>`).join('');
$('trend').innerHTML=Array.from({length:24},(_,i)=>`<i class="bar" style="height:${42+Math.round(Math.sin(i/2)*18)+((i%7)*3)}%"></i>`).join('');
const ranks=data.ranking||fallback.ranking;renderMap(ranks);$('rising').innerHTML=ranks.slice(0,3).map((r,i)=>`<div class="rise-card"><strong>${i+1}. ${r.flag} ${r.country}</strong><div class="delta">+${r.delta||i+4} ↑</div><p>${r.topic}</p><p>危険度：${r.score}</p></div>`).join('');
$('ranking').innerHTML=ranks.map((r,i)=>`<div class="rank-item"><div class="rank-no">${String(i+1).padStart(2,'0')}</div><div><div class="rank-name">${r.flag} ${r.country}</div><div class="rank-meta">危険報道 ${r.reports||0}件 / ${r.topic}</div></div><div class="rank-score">${r.score}</div></div>`).join('');
$('newsList').innerHTML=(data.news||fallback.news).map(n=>`<article class="news-item"><h3>${n.title}</h3><div class="news-meta">${n.area||'world'} / 出典：<a href="${n.url||'#'}" target="_blank" rel="noopener">${n.source||'Public source'}</a></div></article>`).join('');
$('aiNote').textContent=`AI注目地域：${ranks.slice(0,3).map(r=>r.flag+' '+r.country).join('、')} 周辺を重点観測。複数地域で緊張が継続しています。`;log('世界ランキングと観測ニュースを更新')}
function sev(score){return score>=70?'sev-high':score>=50?'sev-mid':'sev-low'}
function renderMap(ranks){const map=$('worldMap');map.querySelectorAll('.map-marker').forEach(e=>e.remove());ranks.forEach(r=>{const b=document.createElement('button');b.className=`map-marker ${sev(r.score)}`;b.style.left=(r.x||50)+'%';b.style.top=(r.y||50)+'%';b.innerHTML=`<span class="pulse"></span><span class="map-label">${r.flag} ${r.country}<b>${r.score}</b></span>`;b.onclick=()=>{$('mapDetail').innerHTML=`<strong>${r.flag} ${r.country}</strong><br>危険度 ${r.score} / ${level(r.score)}<br>${r.topic}<br>危険報道 ${r.reports||0}件`};map.appendChild(b)})}
function topCountries(){return (currentData.ranking||fallback.ranking).slice(0,3).map(r=>`${r.flag} ${r.country}`).join('・')}
window.makePost=function(type){const score=Number(currentData.global||35);const news=(currentData.news||fallback.news).slice(0,2).map(n=>'・'+n.title).join('\n');const newsText=(currentData.news||fallback.news).map(n=>n.title).join(' ');const tags=['#終末観測盤','#世界情勢','#世界異変','#国際ニュース','#速報','#BreakingNews','#WorldNews','#Geopolitics','#GlobalRisk','#危機管理','#軍事','#防災','#地政学','#安全保障','#ニュース','#観測','#AI','#Ukraine','#Russia','#Iran','#Taiwan'];if(newsText.includes('台湾'))tags.push('#台湾','#台湾海峡','#中国');if(newsText.includes('ウクライナ'))tags.push('#NATO','#UkraineWar');if(newsText.includes('イスラエル'))tags.push('#Israel','#MiddleEast');if(newsText.includes('日本'))tags.push('#日本','#Japan');const tagText=tags.join(' ');const common=`\n\n主な観測地域：\n${topCountries()}\n\n${news}\n\n${SITE_URL}\n\n${tagText}`;const posts={朝:`【朝の観測報告】\n\n世界終末指数 ${score}\n危険度：${level(score)}${common}`,昼:`【昼の観測】\n\n世界異変ランキングを更新。\n終末指数：${score}${common}`,夜:`【本日の観測まとめ】\n\n本日の世界終末指数：${score}\n明日も観測を継続します。${common}`,緊急:`⚠️【緊急観測】\n\n世界終末指数に大きな変動を観測。${common}`,AI:`観測官より\n\n世界は静かに見えても、水面下では絶えず変化しています。\n現在の終末指数は ${score}。${common}`};$('postText').value=posts[type]||posts.AI}
window.copyPost=async function(){const t=$('postText');try{await navigator.clipboard.writeText(t.value);alert('コピーしました')}catch(e){t.select();document.execCommand('copy');alert('コピーしました')}}
load();setInterval(load,15*60*1000);
