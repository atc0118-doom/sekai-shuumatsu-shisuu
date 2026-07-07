# 終末観測盤 本番仕様（Vercel API版）

## 変更点
- ブラウザから直接GDELTへアクセスせず、`/api/gdelt` 経由で取得します。
- `Failed to fetch` / CORS失敗を回避します。
- 関連ニュースの日本語要約を表示します。
- 半自動投稿文にニュース要約を混ぜます。
- ウクライナ・ロシアが100に張り付きにくいスコア設計です。

## GitHubへの反映
1. ZIPを解凍
2. GitHubのリポジトリに以下をアップロード
   - `index.html`
   - `api/gdelt.js`
   - `package.json`
3. Vercelが自動デプロイ
4. サイトを開いて観測ログに「GDELT取得成功」と出ればOK

## 注意
Vercel以外の静的ホスティングでは `/api/gdelt` が動きません。
GitHub Pagesではなく、Vercel公開で使用してください。
