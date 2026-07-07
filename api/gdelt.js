export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
  const fallback={ok:true,score:35,delta:2,level:'Ⅱ 注意',summary:'複数地域で緊張は継続。世界全体では急激な悪化は確認されていません。',ranking:[{country:'ウクライナ',flag:'🇺🇦',score:78},{country:'ロシア',flag:'🇷🇺',score:68},{country:'イラン',flag:'🇮🇷',score:62},{country:'イスラエル',flag:'🇮🇱',score:59},{country:'台湾',flag:'🇹🇼',score:52},{country:'中国',flag:'🇨🇳',score:50},{country:'アメリカ',flag:'🇺🇸',score:44},{country:'日本',flag:'🇯🇵',score:38},{country:'北朝鮮',flag:'🇰🇵',score:36},{country:'シリア',flag:'🇸🇾',score:34}],news:[{title:'ウクライナ周辺で軍事的緊張が継続',source:'GDELT / Public News',url:'https://www.gdeltproject.org/'},{title:'中東地域で停戦協議と警戒が続く',source:'GDELT / Public News',url:'https://www.gdeltproject.org/'},{title:'台湾海峡周辺で安全保障上の警戒が続く',source:'GDELT / Public News',url:'https://www.gdeltproject.org/'}],trend:[28,31,32,30,34,33,35]};
  res.status(200).json(fallback);
}
