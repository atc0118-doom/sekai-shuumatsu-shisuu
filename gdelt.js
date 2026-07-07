const $ = id => document.getElementById(id);
const LOG = [];
let LAST = null;
const DEMO = [
  ['Ukraine','ウクライナ','🇺🇦',72],['Russia','ロシア','🇷🇺',69],['Iran','イラン','🇮🇷',62],['China','中国','🇨🇳',55],['Taiwan','台湾','🇹🇼',49],['Israel','イスラエル','🇮🇱',47],['Gaza','ガザ','🇵🇸',46],['North Korea','北朝鮮','🇰🇵',41],['Yemen','イエメン','🇾🇪',38],['Japan','日本','🇯🇵',31]
].map(x=>({en:x[0],jp:x[1],flag:x[2],score:x[3],mentions:0,severe:0,articles:[]}));
function now(){return new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',hour12:false});}
function log(t){LOG.unshift(`[${new Date().toLocaleTimeString('ja-JP',{hour12:false})}] ${t}`); if($('logs')) $('logs').textContent=LOG.slice(0,9).join('\n');}
function level(n){return n>=90?'Ⅴ 最悪':n>=70?'Ⅳ 重大':n>=50?'Ⅲ 警戒':n>=30?'Ⅱ 注意':'Ⅰ 平常';}
function escapeHtml(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function renderNews(news){
  const box=$('newsList'); if(!box) return;
  if(!news || !news.length){box.innerHTML='ニュースなし / デモ表示中';return;}
  box.innerHTML=news.slice(0,10).map(n=>`<div class="news-item"><a href="${escapeHtml(n.url)}" target="_blank" rel="noopener">${escapeHtml(n.title)}</a><small>${escapeHtml(n.domain||n.source||'GDELT')} / ${escapeHtml(n.seen||'')}</small></div>`).join('');
}
function render(payload){
  LAST = payload;
  const global = payload.global ?? 35;
  $('updated').textContent = now() + '　' + (payload.ok ? '取得成功' : '取得失敗 / デモ表示');
  $('globalScore').textContent = global;
  $('level').textContent = level(global);
  if($('meterBar')) $('meterBar').style.width = Math.max(5, Math.min(100, global)) + '%';
  const list = (payload.ranking && payload.ranking.length ? payload.ranking : DEMO);
  $('ranking').innerHTML = list.map((r,i)=>`<div class="row"><div class="rank">${String(i+1).padStart(2,'0')}</div><div class="name"><b>${r.flag||''} ${escapeHtml(r.jp)}</b><small>危機報道 ${r.mentions??0}件 / 重大語 ${r.severe??0}</small></div><div class="score">${r.score}</div></div>`).join('');
  renderNews(payload.news || list.flatMap(r=>r.articles||[]));
  makePost('昼');
}
window.makePost = function(time='昼'){
  const payload = LAST || {global:35,ranking:DEMO,news:[]};
  const list = (payload.ranking && payload.ranking.length ? payload.ranking : DEMO);
  const top = list[0] || {};
  const news = (payload.news || []).slice(0,3).map((n,i)=>`${i+1}. ${n.title}`).join('\n');
  const label = time === '朝' ? '朝の観測' : time === '夜' ? '夜のまとめ観測' : '昼の観測';
  $('postText').value = `【${label}】\n世界異変ランキングを更新。\n現在指数 ${payload.global ?? 35} / ${level(payload.global ?? 35)}\n上位は ${top.jp || '不明'}、危険度 ${top.score ?? '-'}。\n\n観測ニュース:\n${news || '取得待機中'}\n\n終末観測盤は公開情報をもとに、各国の危機報道・軍事緊張・災害兆候を半自動で観測中。\n※予測ではなく観測ログです。\n#終末観測盤 #世界情勢 #危機管理 #GDELT #WorldNews`;
};
async function load(){
  log('GDELT取得開始');
  try{
    const r = await fetch('/api/gdelt',{cache:'no-store'});
    const text = await r.text();
    const j = JSON.parse(text);
    render(j);
    log(j.ok ? '取得成功' : 'API応答あり / デモ表示');
  }catch(e){
    render({ok:false,global:35,ranking:DEMO,news:[]});
    log('取得失敗: '+e.message);
  }
}
window.copyPost = async()=>{await navigator.clipboard.writeText($('postText').value); log('投稿文コピー完了');};
window.refreshNow = load;
document.addEventListener('DOMContentLoaded',()=>{
  const params = new URLSearchParams(location.search);
  if(params.get('admin') === 'doom') document.body.classList.add('admin-open');
  load();
  setInterval(load,15*60*1000);
});
