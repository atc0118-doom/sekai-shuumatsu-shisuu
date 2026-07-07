export default async function handler(req,res){
  res.setHeader("Cache-Control","s-maxage=300, stale-while-revalidate=600");
  res.status(200).json({
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
  });
}
