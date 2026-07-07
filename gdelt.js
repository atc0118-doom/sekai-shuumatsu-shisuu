const SITE_URL = "https://sekai-shuumatsu-shisuu.vercel.app";
const fallback = {
  ok:true,
  global:35,
  updated:new Date().toISOString(),
  ranking:[
    {country:"ウクライナ",flag:"🇺🇦",score:72,reports:5,topic:"軍事展開 / 注意"},
    {country:"ロシア",flag:"🇷🇺",score:69,reports:5,topic:"軍事緊張 / 注意"},
    {country:"イラン",flag:"🇮🇷",score:62,reports:4,topic:"中東情勢 / 警戒"},
    {country:"中国",flag:"🇨🇳",score:55,reports:4,topic:"台湾海峡 / 観測"},
    {country:"台湾",flag:"🇹🇼",score:49,reports:3,topic:"周辺警戒 / 観測"},
    {country:"イスラエル",flag:"🇮🇱",score:47,reports:3,topic:"地域緊張 / 観測"},
    {country:"アメリカ",flag:"🇺🇸",score:45,reports:3,topic:"軍事展開 / 観測"},
    {country:"日本",flag:"🇯🇵",score:44,reports:2,topic:"周辺警戒 / 観測"}
  ],
  news:[
    {title:"台湾海峡周辺で軍事活動への警戒が続いています。",source:"world / observation"},
    {title:"中東地域では緊張状態が継続しています。",source:"world / observation"},
    {title:"東欧方面で安全保障上の不安定要素が観測されています。",source:"world / observation"}
  ]
};
let currentData = fallback;
function $(id){return document.getElementById(id)}
function level(score){ if(score>=90)return "Ⅴ 最悪"; if(score>=70)return "Ⅳ 重大"; if(score>=50)return "Ⅲ 警戒"; if(score>=30)return "Ⅱ 注意"; return "Ⅰ 平常"; }
function bar(score){ const blocks=Math.max(1,Math.round(score/10)); return "■".repeat(blocks)+"□".repeat(10-blocks); }
function log(msg){ const el=$("logs"); if(!el)return; const t=new Date().toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit",second:"2-digit"}); el.textContent=`[${t}] ${msg}\n`+el.textContent; }
async function load(){
  log("観測開始");
  try{
    const res=await fetch("/api/gdelt",{cache:"no-store"});
    const data=await res.json();
    if(data && Array.isArray(data.ranking) && data.ranking.length) currentData=data; else currentData=fallback;
  }catch(e){ currentData=fallback; }
  render(currentData);
}
function render(data){
  const score=Number(data.global||35);
  $("now").textContent=new Date().toLocaleString("ja-JP");
  $("status").textContent="観測継続中";
  $("globalScore").textContent=score;
  $("levelText").textContent=level(score);
  $("meterFill").style.width=Math.min(100,Math.max(0,score))+"%";
  $("ranking").innerHTML=(data.ranking||fallback.ranking).slice(0,20).map((r,i)=>`
    <div class="rank-item">
      <div class="rank-no">${String(i+1).padStart(2,"0")}</div>
      <div><div class="rank-name">${r.flag||""} ${r.country}</div><div class="rank-meta">危機報道 ${r.reports||0}件 / ${r.topic||"観測"}</div></div>
      <div class="rank-score">${r.score||0}</div>
    </div>`).join("");
  $("newsList").innerHTML=(data.news||fallback.news).slice(0,8).map(n=>`
    <article class="news-item"><h3>${n.title}</h3><p>${n.source||"world / observation"}</p></article>`).join("");
  log("世界ランキングと観測ニュースを更新");
}
function topCountries(){return (currentData.ranking||fallback.ranking).slice(0,3).map(r=>`${r.flag||""} ${r.country}`)}
window.makePost=function(type){
  const score=Number(currentData.global||35), lv=level(score), top=topCountries();
  const comments=["数字は落ち着いていても、世界は止まってはいません。","静かな一日ほど、次の変化を見落とさないことが大切です。","危機は突然ではなく、小さな兆候の積み重ねから始まります。","世界は今日も回り続けています。観測を続けます。"]; 
  const c=comments[Math.floor(Math.random()*comments.length)];
  const news=(currentData.news&&currentData.news[0]?.title)||"世界各地で不安定な動きが続いています。";
  const posts={
    "朝":`【朝の観測報告】\n\n世界終末指数\n${bar(score)} ${score} / 100\n危険度：${lv}\n\n現在の観測上位は\n${top.map(x=>`・${x}`).join("\n")}\n\n${news}\n\n【観測官コメント】\n${c}\n\n🌐終末観測盤\n${SITE_URL}\n\n#終末観測盤 #世界情勢 #国際ニュース #危機管理`,
    "昼":`【昼の観測】\n\n世界異変ランキングを更新。\n\n現在の上位地域\n① ${top[0]}\n② ${top[1]}\n③ ${top[2]}\n\n終末指数：${score}（${lv}）\n\n${news}\n\n【観測官コメント】\n${c}\n\n🌐終末観測盤\n${SITE_URL}\n\n#終末観測盤 #地政学 #世界情勢`,
    "夜":`【本日の観測まとめ】\n\n本日の世界終末指数\n${score}（${lv}）\n\n${top[0]}を中心に緊張状態が継続。\n\n${news}\n\n【観測官コメント】\n${c}\n\n明日も観測を続けます。\n\n🌐終末観測盤\n${SITE_URL}\n\n#終末観測盤 #世界情勢 #ニュース`,
    "緊急":`⚠️【緊急観測】\n\n世界終末指数に大きな変動を観測。\n\n主な観測地域\n${top.map(x=>`・${x}`).join("\n")}\n\n詳細は終末観測盤で更新中。\n\n${SITE_URL}\n\n#速報 #終末観測盤 #世界情勢`,
    "AI":`観測官より\n\n${c}\n\n現在の終末指数は ${score}（${lv}）。\n${top.join("・")} 周辺を中心に観測を継続しています。\n\n${news}\n\n観測継続中。\n\n#終末観測盤 #世界情勢`
  };
  $("postText").value=posts[type]||posts.AI;
}
window.copyPost=async function(){ const t=$("postText"); if(!t)return; try{await navigator.clipboard.writeText(t.value); alert("コピーしました");}catch(e){t.select();document.execCommand("copy");alert("コピーしました");}}
document.addEventListener("DOMContentLoaded",()=>{ if(new URLSearchParams(location.search).get("admin")==="doom") document.body.classList.add("admin-open"); load(); setInterval(load,15*60*1000); });
