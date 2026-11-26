# ローカル管理画面（記事作成・プレビュー）

`npm run dev` で開発サーバーを起動しているあいだだけ使える、記事の作成・編集・プレビュー画面です。
公開サイト（`npm run generate` で作る GitHub Pages 用の HTML）には一切含まれません。

## 使い方

記事は別の非公開リポジトリ（`wwh-blog-content`）にあるので、まず「その記事リポジトリがどこにあるか」をブログ側に教えます。

1. 記事リポジトリを、ブログのリポジトリと**並べて** clone する（中に入れない）

   ```text
   ~/dev/
   ├── worldwidehisa.github.io/   ← このリポジトリ（ブログ本体）
   └── wwh-blog-content/          ← 記事リポジトリ（articles/ の中に .md）
   ```

2. ブログ側に `.env` を作り、記事リポジトリの場所を書く（`.env` は Git に入りません）

   ```bash
   # worldwidehisa.github.io/.env
   BLOG_CONTENT_DIR=../wwh-blog-content
   ```

   書かなかった場合は、CI と同じくこのリポジトリの `./content` を見ます。

3. 開発サーバーを起動する

   ```bash
   npm run dev
   ```

4. ブラウザで <http://localhost:3000/_admin> を開く（一覧の上に、実際に読み書きしているフォルダが表示されます）

| 画面 | できること |
| --- | --- |
| `/_admin` | 記事の一覧（`draft: true` の記事も表示）、テンプレートからの新規作成 |
| `/_admin/edit?file=...` | 左で Markdown を編集、右に本番と同じ見た目でプレビュー。`Ctrl+S`（Mac は `Cmd+S`）で保存 |

保存すると、記事リポジトリの `articles/` にある Markdown ファイルがそのまま書き換わります。
公開するときは、これまでどおり記事リポジトリで commit / push します
（ブログの `deploy.yml` は `repository_dispatch: content-updated` でも動くので、記事リポジトリからこのイベントが送られる設定ならそのまま公開されます）。

```text
管理画面で書く・保存 ─▶ wwh-blog-content の .md が変わる ─▶ 記事リポジトリで commit / push ─▶ 自動で公開
```

## しくみ

```
ブラウザ（/_admin）
   │  入力中の Markdown を送る
   ▼
Nuxt の開発サーバー（localhost:3000）
   ├─ /api/_admin/preview … Nuxt Content と同じ変換（本番ビルドと同じ処理）で記事データにして返す
   ├─ /api/_admin/article … 記事リポジトリの articles/*.md の読み込み・保存・新規作成
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
- 読み書きできるのは記事リポジトリの `articles/` の中の `.md` だけ（`../` などで外に出られない）
- 新規作成は同名ファイルがあると失敗する（上書きしない）
- `npm run dev -- --host` で LAN に公開しても、スマホなど別の端末から開いた管理画面は Host チェックで API が使えません（意図どおりの動きです）

## 注意

- 今のビルド設定では、`draft: true` の記事があると `npm run generate` が失敗します
  （下書きはプリレンダー対象から外す対応が別途必要です）。
  そのため新規作成では `draft` を付けていません。
- 記事リポジトリの `articles/template/` と `README.md` は CI のビルドで削除されるため、一覧にも出しません。
