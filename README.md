# 終末観測盤 管理画面付き版

## 使い方
GitHubに以下を上書きしてください。

- index.html
- admin/index.html
- api/gdelt.js
- package.json

## 公開ページ
https://あなたのサイト.vercel.app/

操作パネルは表示されません。

## 管理画面
https://あなたのサイト.vercel.app/admin/

初期パスワードは `observer` です。
公開前に `admin/index.html` 内の `ADMIN_PASSWORD` を変更してください。

## 機能
- Vercel API経由でGDELT取得
- 公開ページではランキングとニュースだけ表示
- 管理画面で投稿文生成・コピー・ログ確認
