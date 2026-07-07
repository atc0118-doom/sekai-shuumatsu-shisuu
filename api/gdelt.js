export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600');
  res.status(200).json({
    ok:true,
    global:38,
    updated:new Date().toISOString(),
    ranking:[
      {country:'ウクライナ',flag:'🇺🇦',score:72,reports:12,label:'軍事衝突 / 重大',lat:49,lng:32},
      {country:'ロシア',flag:'🇷🇺',score:69,reports:11,label:'軍事緊張 / 警戒',lat:56,lng:37},
      {country:'イラン',flag:'🇮🇷',score:62,reports:9,label:'中東緊張 / 警戒',lat:32,lng:53},
      {country:'中国',flag:'🇨🇳',score:55,reports:8,label:'台湾海峡 / 注意',lat:35,lng:103},
      {country:'台湾',flag:'🇹🇼',score:49,reports:6,label:'軍事活動 / 注意',lat:23.7,lng:121},
      {country:'イスラエル',flag:'🇮🇱',score:47,reports:6,label:'地域衝突 / 注意',lat:31.5,lng:35},
      {country:'アメリカ',flag:'🇺🇸',score:45,reports:5,label:'軍事展開 / 観測',lat:38,lng:-97},
      {country:'日本',flag:'🇯🇵',score:44,reports:4,label:'周辺警戒 / 観測',lat:36,lng:138}
    ],
    news:[
      {area:'台湾海峡',level:'警戒',delta:'+3',title:'台湾海峡周辺で軍事活動への警戒が続いています。',source:'Reuters / GDELT',url:'https://www.reuters.com/world/asia-pacific/',lat:23.7,lng:121},
      {area:'中東',level:'警戒',delta:'+2',title:'中東地域では緊張状態が継続しています。',source:'AP News / BBC',url:'https://apnews.com/hub/middle-east',lat:32,lng:53},
      {area:'東欧',level:'注意',delta:'+1',title:'東欧方面で安全保障上の不安定要素が観測されています。',source:'BBC / GDELT',url:'https://www.bbc.com/news/world/europe',lat:49,lng:32}
    ]
  });
}
