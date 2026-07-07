const $=id=>document.getElementById(id);
const LOG=[];
const DEMO=[['Ukraine','ウクライナ','🇺🇦',72],['Russia','ロシア','🇷🇺',69],['Iran','イラン','🇮🇷',62],['China','中国','🇨🇳',55],['Taiwan','台湾','🇹🇼',49],['Israel','イスラエル','🇮🇱',47],['Gaza','ガザ','🇵🇸',46],['North Korea','北朝鮮','🇰🇵',41],['Yemen','イエメン','🇾🇪',38],['Japan','日本','🇯🇵',31]].map(x=>({en:x[0],jp:x[1],flag:x[2],score:x[3],mentions:0,severe:0,articles:[]}));
function now(){return new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',hour12:false});}
function log(t){LOG.unshift(`[${new Date().toLocaleTimeString('ja-JP',{hour12:false})}] ${t}`);$('logs').textContent=LOG.slice(0,7).join('\n');}
function level(n){return n>=90?'Ⅴ 最悪':n>=70?'Ⅳ 重大':n>=50?'Ⅲ 警戒':n>=30?'Ⅱ 注意':'Ⅰ 平常'}
function render(payload){
  $('updated').textContent=now()+'　'+(payload.ok?'取得成功':'取得失敗 / デモ表示');
  $('globalScore').textContent=payload.global??35; $('level').textContent=level(payload.global??35);
  const list=(payload.ranking&&payload.ranking.length?payload.ranking:DEMO);
  $('ranking').innerHTML=list.map((r,i)=>`<div class="row"><div class="rank">${String(i+1).padStart(2,'0')}</div><div class="name"><b>${r.flag||''} ${r.jp}</b><small>危機報道 ${r.mentions??0}件 / 重大語 ${r.severe??0}</small></div><div class="score">${r.score}</div></div>`).join('');
  const top=list[0];
  $('postText').value=`【昼の観測】\n世界異変ランキングを更新。\n現在の上位は ${top?.jp||'不明'}、危険度 ${top?.score??'-'}。\n終末観測盤は公開情報をもとに、各国の危機報道・軍事緊張・災害兆候を半自動で観測中。\n※予測ではなく観測ログです。\n#終末観測盤 #世界情勢 #危機管理 #GDELT #WorldNews`;
}
async function load(){
  log('GDELT取得開始');
  try{const r=await fetch('/api/gdelt',{cache:'no-store'}); const j=await r.json(); render(j); log(j.ok?'取得成功':'API応答あり / デモ表示');}
  catch(e){render({ok:false,global:35,ranking:DEMO}); log('取得失敗: '+e.message);}
}
window.copyPost=async()=>{await navigator.clipboard.writeText($('postText').value); log('投稿文コピー完了');};
window.refreshNow=load;
load(); setInterval(load,15*60*1000);
