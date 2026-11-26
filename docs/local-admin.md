# ローカル管理画面（記事作成・プレビュー）

`npm run dev` で開発サーバーを起動しているあいだだけ使える、記事の作成・編集・プレビュー画面です。
公開サイト（`npm run generate` で作る GitHub Pages 用の HTML）には一切含まれません。

## 使い方

1. 記事リポジトリ（`wwh-blog-content`）を `content/` に置く
   （CI と同じく `content/articles/` に記事の Markdown が並ぶ形にする）
2. 開発サーバーを起動する

   ```bash
   npm run dev
   ```

3. ブラウザで <http://localhost:3000/_admin> を開く

| 画面 | できること |
| --- | --- |
| `/_admin` | 記事の一覧（`draft: true` の記事も表示）、テンプレートからの新規作成 |
| `/_admin/edit?file=...` | 左で Markdown を編集、右に本番と同じ見た目でプレビュー。`Ctrl+S`（Mac は `Cmd+S`）で保存 |

保存すると `content/articles/` の Markdown ファイルがそのまま書き換わります。
公開するときは、これまでどおり記事リポジトリで commit / push します。

## しくみ

```
ブラウザ（/_admin）
   │  入力中の Markdown を送る
   ▼
Nuxt の開発サーバー（localhost:3000）
   ├─ /api/_admin/preview … Nuxt Content と同じ変換（本番ビルドと同じ処理）で記事データにして返す
   ├─ /api/_admin/article … content/articles/*.md の読み込み・保存・新規作成
   └─ /api/_admin/articles … 記事一覧
```

- 実装は `modules/local-admin/` にまとまっています。`modules/` 直下のモジュールは Nuxt が自動で読み込むので、
  `nuxt.config.ts` には何も書いていません。
- モジュールの先頭で `nuxt.options.dev` を見て、開発サーバーのとき以外は何も登録しません。
  そのため `nuxt generate` の出力には管理画面のページも API も入りません。
- プレビューは記事ページ（`pages/[...slug].vue`）と同じクラス名で表示しています。
  記事ページのデザインを変えたら `modules/local-admin/runtime/components/ArticlePreview.vue` も合わせてください。

## 安全のための制限

開発サーバーはファイルを書き換えられるので、次の制限を入れています。

- `Host` が `localhost` / `127.0.0.1` 以外のリクエストは拒否（DNS リバインディング対策）
- 保存・作成などの書き込みは独自ヘッダー `x-local-admin: 1` が必須
  （他のサイトを開いたブラウザから、勝手に記事を書き換えられないようにするため）
- 読み書きできるのは `content/articles/` の中の `.md` だけ（`../` などで外に出られない）
- 新規作成は同名ファイルがあると失敗する（上書きしない）
- `npm run dev -- --host` で LAN に公開しても、スマホなど別の端末から開いた管理画面は Host チェックで API が使えません（意図どおりの動きです）

## 注意

- 今のビルド設定では、`draft: true` の記事があると `npm run generate` が失敗します
  （下書きはプリレンダー対象から外す対応が別途必要です）。
  そのため新規作成では `draft` を付けていません。
- `content/articles/template/` と `README.md` は CI のビルドで削除されるため、一覧にも出しません。
