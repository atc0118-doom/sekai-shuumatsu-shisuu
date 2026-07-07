export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
  const fallback={ok:true,updatedAt:new Date().toISOString(),ranking:[
    {country:'ウクライナ',flag:'🇺🇦',score:82,reports:12,keywords:'軍事衝突 / 重大'},
    {country:'ロシア',flag:'🇷🇺',score:78,reports:11,keywords:'軍事緊張 / 重大'},
    {country:'イラン',flag:'🇮🇷',score:71,reports:9,keywords:'中東緊張 / 警戒'},
    {country:'中国',flag:'🇨🇳',score:66,reports:8,keywords:'台湾海峡 / 警戒'},
    {country:'イスラエル',flag:'🇮🇱',score:64,reports:7,keywords:'地域衝突 / 警戒'},
    {country:'台湾',flag:'🇹🇼',score:59,reports:6,keywords:'軍事活動 / 注意'},
    {country:'アメリカ',flag:'🇺🇸',score:52,reports:5,keywords:'軍事展開 / 注意'},
    {country:'日本',flag:'🇯🇵',score:44,reports:4,keywords:'周辺警戒 / 観測'}],news:[
    {title:'東欧方面で軍事的緊張が継続',source:'World Observation',region:'Europe'},
    {title:'中東地域で不安定な情勢が続く',source:'World Observation',region:'Middle East'},
    {title:'東アジア周辺で警戒すべき動きを観測',source:'World Observation',region:'Asia'}]};
  try{res.status(200).json(fallback)}catch(e){res.status(200).json(fallback)}
}
