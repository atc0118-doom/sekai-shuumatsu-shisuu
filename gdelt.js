const $ = (id) => document.getElementById(id);
let latest = { global: 35, ranking: [], news: [] };
const log = (m) => { const t = new Date().toLocaleTimeString('ja-JP'); $('logs').textContent = `[${t}] ${m}\n` + ($('logs').textContent || ''); };
function level(score){ if(score>=90)return 'Ⅴ 最悪'; if(score>=70)return 'Ⅳ 重大'; if(score>=50)return 'Ⅲ 警戒'; if(score>=30)return 'Ⅱ 注意'; return 'Ⅰ 平常'; }
function render(data){
  latest = data;
  const now = new Date(data.updated || Date.now()).toLocaleString('ja-JP');
  $('now').textContent = now;
  $('status').textContent = data.fallback ? `安定表示 / ${data.source || 'fallback'}` : (data.ok ? `取得成功 / ${data.source || 'multi-source'}` : `取得失敗 / ${data.source || 'fallback表示'}`);
  $('globalScore').textContent = data.global ?? 35;
  $('levelText').textContent = level(data.global ?? 35);
  $('meterBar').style.width = `${Math.min(100, Math.max(0, data.global ?? 35))}%`;
  $('ranking').innerHTML = (data.ranking || []).slice(0,20).map((r,i)=>`<div class="rank"><div class="rank-no">${String(i+1).padStart(2,'0')}</div><div><div class="country">${r.flag||''} ${r.country}</div><div class="meta">危機報道 ${r.reports||0}件 / ${r.keywords||'観測'}</div></div><div class="score">${r.score}</div></div>`).join('') || 'ランキングなし';
  $('newsList').innerHTML = (data.news || []).slice(0,12).map(n=>`<div class="news"><div class="news-title">${n.title||'Untitled'}</div><div class="news-meta">${n.source||'source'} / ${n.country||'world'}</div>${n.url?`<a href="${n.url}" target="_blank" rel="noopener">元記事を開く</a>`:''}</div>`).join('') || 'ニュースなし';
}
async function load(){
  log('観測開始');
  try{
    const res = await fetch('/api/gdelt?ts=' + Date.now(), { cache:'no-store' });
    const data = await res.json();
    render(data);
    if(data.fallback) log(`外部取得制限のため安定データに切替: ${data.error || 'fallback'}`); else if(data.ok) log('取得成功'); else log(`取得失敗。${data.error || 'fallback'} に切替`);
  }catch(e){
    log('通信失敗。ローカルfallbackに切替: ' + e.message);
    render({ok:false, source:'local-fallback', updated:new Date().toISOString(), global:35, ranking:[], news:[]});
  }
}
function makePost(slot){
  const top = (latest.ranking || []).slice(0,3).map((r,i)=>`${i+1}. ${r.country} ${r.score}`).join('\n');
  const news = (latest.news || [])[0]?.title || '主要ニュース観測中';
  $('postText').value = `【${slot}の観測】\n現在指数：${latest.global ?? 35} / ${level(latest.global ?? 35)}\n\n世界異変ランキングを更新。\n${top}\n\n注目ニュース：${news}\n\n公開情報をもとにした独自観測です。\n#終末観測盤 #世界情勢 #地政学 #ニュース #危機管理`;
}
async function copyPost(){ await navigator.clipboard.writeText($('postText').value); log('投稿文をコピー'); }
load(); setInterval(load, 15*60*1000);
