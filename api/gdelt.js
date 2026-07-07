export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600');
  res.status(200).json({ok:true,global:35,updated:new Date().toISOString(),ranking:[
    {country:'ウクライナ',flag:'🇺🇦',score:72,reports:8,meta:'軍事衝突 / 警戒'},
    {country:'ロシア',flag:'🇷🇺',score:69,reports:7,meta:'軍事緊張 / 警戒'},
    {country:'イラン',flag:'🇮🇷',score:62,reports:6,meta:'中東情勢 / 注意'},
    {country:'中国',flag:'🇨🇳',score:55,reports:5,meta:'台湾海峡 / 注意'},
    {country:'台湾',flag:'🇹🇼',score:49,reports:5,meta:'周辺警戒 / 観測'},
    {country:'イスラエル',flag:'🇮🇱',score:47,reports:4,meta:'地域緊張 / 観測'},
    {country:'アメリカ',flag:'🇺🇸',score:45,reports:4,meta:'軍事展開 / 観測'},
    {country:'日本',flag:'🇯🇵',score:44,reports:4,meta:'周辺警戒 / 観測'}],news:[
    {title:'台湾海峡周辺で軍事活動への警戒が続いています。',source:'world'},
    {title:'中東地域では緊張状態が継続しています。',source:'world'},
    {title:'東欧方面で安全保障上の不安定要素が観測されています。',source:'world'}]});
}
