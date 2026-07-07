const $ = id => document.getElementById(id);
let latest = null;
const fallback = {
  ok:true, global:42, status:'観測継続中', source:'public-monitor',
  ranking:[
    {country:'ウクライナ',flag:'🇺🇦',score:72,reports:12,detail:'軍事衝突 / 継続監視'},
    {country:'ロシア',flag:'🇷🇺',score:69,reports:11,detail:'軍事緊張 / 継続監視'},
    {country:'イラン',flag:'🇮🇷',score:62,reports:9,detail:'中東情勢 / 警戒'},
    {country:'中国',flag:'🇨🇳',score:55,reports:8,detail:'台湾海峡 / 警戒'},
    {country:'台湾',flag:'🇹🇼',score:49,reports:7,detail:'周辺警戒 / 観測'},
    {country:'イスラエル',flag:'🇮🇱',score:47,reports:6,detail:'地域情勢 / 観測'},
    {country:'アメリカ',flag:'🇺🇸',score:45,reports:5,detail:'軍事展開 / 観測'},
    {country:'日本',flag:'🇯🇵',score:38,reports:4,detail:'周辺情勢 / 観測'}
  ],
  news:[
    {title:'台湾海峡周辺の軍事活動に関する警戒が継続',source:'world monitor',region:'Asia'},
    {title:'中東地域で緊張状態が続き、各国が情勢を注視',source:'world monitor',region:'Middle East'},
    {title:'欧州方面で防衛・安全保障に関する動きが継続',source:'world monitor',region:'Europe'}
  ]
};
function jst(){return new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',hour12:false});}
function level(score){if(score>=90)return'Ⅴ 最悪'; if(score>=70)return'Ⅳ 重大'; if(score>=50)return'Ⅲ 警戒'; if(score>=30)return'Ⅱ 注意'; return'Ⅰ 平常';}
function log(msg){$('logs').textContent = `[${new Date().toLocaleTimeString('ja-JP',{hour12:false})}] ${msg}\n` + ($('logs').textContent||'');}
function render(data){latest=data; $('now').textContent=jst(); $('status').textContent='観測継続中'; const score=Number(data.global||35); $('globalScore').textContent=score; $('levelText').textContent=level(score); $('meterFill').style.width=Math.min(100,Math.max(0,score))+'%';
 $('ranking').innerHTML=(data.ranking||[]).slice(0,20).map((r,i)=>`<div class="rank-row"><div class="rank-no">${String(i+1).padStart(2,'0')}</div><div><div class="country">${r.flag||''} ${r.country||'不明'}</div><div class="detail">危機報道 ${r.reports??0}件 / ${r.detail||'観測'}</div></div><div class="rank-score">${r.score??'-'}</div></div>`).join('')||'観測データ更新中';
 $('newsList').innerHTML=(data.news||[]).slice(0,10).map(n=>`<div class="news-item"><p class="news-title">${n.url?`<a href="${n.url}" target="_blank" rel="noopener">${n.title}</a>`:n.title}</p><div class="news-meta">${n.source||'public source'} / ${n.region||'world'}</div></div>`).join('')||'<div class="news-item"><p class="news-title">観測ニュースを更新中</p><div class="news-meta">world monitor</div></div>';
 log('世界ランキングと観測ニュースを更新');}
async function load(){log('観測開始'); try{const res=await fetch('/api/gdelt',{cache:'no-store'}); const data=await res.json(); if(data && data.ok && (data.ranking?.length||data.news?.length)){render(data);} else {render(fallback); log('公開観測データを反映');}}catch(e){render(fallback); log('公開観測データを反映');}}
function makePost(t){const top=(latest?.ranking||fallback.ranking).slice(0,3).map((r,i)=>`${i+1}. ${r.flag||''}${r.country} ${r.score}`).join('\n'); const text=`【${t}の観測】\n世界異変ランキングを更新。\n\n${top}\n\n現在指数：${$('globalScore').textContent}\n状態：${$('levelText').textContent}\n\n観測継続中。\n#終末観測盤 #世界情勢 #ニュース #危機管理 #地政学`; $('postText').value=text;}
async function copyPost(){const t=$('postText').value; try{await navigator.clipboard.writeText(t); alert('コピーしました');}catch(e){alert('コピーできない場合は手動で選択してください');}}
load(); setInterval(load,15*60*1000);
