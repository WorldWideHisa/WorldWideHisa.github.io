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

## 画像のアップロード（Cloudflare R2）

エディタに画像をドラッグ＆ドロップ（または貼り付け・「画像を追加」ボタン）すると、
次の流れで記事に画像を入れられます。iPhone の HEIC もそのまま入れて大丈夫です。

```text
画像をドロップ
   ▼
hisa-compress（Docker）で変換 … 向きを直す・位置情報などのメタ情報を消す・幅 1600px 以下の WebP にする
   ▼
Cloudflare R2 にアップロード … https://images.worldwidehisa.net/articles/<記事のファイル名>/01.webp
   ▼
説明（alt）を入力して「記事に挿入」 … カーソル位置に ![説明](URL) が入る
```

### 準備（最初の 1 回だけ）

1. hisa-compress のリポジトリで Docker イメージを作る

   ```bash
   cd ../hisa-compress
   docker build -t hisa-compress .
   ```

2. Cloudflare のダッシュボードで R2 の API トークンを作る
   - 「R2 → API トークンを管理 → API トークンを作成」
   - 権限は **オブジェクトの読み取りと書き込み**、対象は **画像のバケットだけ** に絞る（管理者権限のトークンは使わない）
3. `.env` に書く（`.env.example` に同じ項目があります。`.env` は Git に入りません）

   ```bash
   R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   R2_BUCKET=バケット名
   R2_ACCESS_KEY_ID=xxxxxxxx
   R2_SECRET_ACCESS_KEY=xxxxxxxx
   R2_PUBLIC_URL=https://images.worldwidehisa.net
   ```

### 起動

```bash
npm run dev:admin
```

`npm run dev:admin` は、hisa-compress のコンテナを起動してから（すでに動いていれば何もしない）`nuxt dev` を起動します。
画像を使わないときは、これまでどおり `npm run dev` でも構いません（その場合、画像の欄に「hisa-compress が起動していません」と出ます）。

| 状況 | 動き |
| --- | --- |
| `hisa-compress` という名前のコンテナがある | `docker start hisa-compress` で起動 |
| コンテナが無い | `docker run -d --name hisa-compress -p 127.0.0.1:8000:8000 hisa-compress` で作って起動 |
| Docker が無い・イメージが無い | 案内を表示して、管理画面だけ起動 |

hisa-compress を別のポートで動かすときは、`.env` に `HISA_COMPRESS_URL=http://localhost:8001` のように書きます。

### 画像の URL のルール

- `articles/<記事のファイル名>/01.webp`、`02.webp` … と、記事ごとのフォルダに連番で置きます
  （例: `content/articles/2025/trip.md` の画像は `articles/2025/trip/01.webp`）
- どの記事の画像かが URL を見るだけで分かり、R2 の画面でもフォルダで整理されます
- これまでの画像（`https://images.worldwidehisa.net/20260215-01.jpg` など）はそのまま使えます。移動はしません

### 無料枠と安全のための決まり

- **上書きしない**: アップロード前に同じ名前の画像が無いかを確認し、あれば次の番号にします。公開済みの画像が別の画像に変わることはありません
- **削除機能は付けない**: 間違えて消す事故を防ぐため。消したいときは Cloudflare のダッシュボードから消します
- **長いキャッシュ**: `Cache-Control: public, max-age=31536000, immutable` を付けます。URL ごとに中身が変わらない前提なので、ブラウザや CDN が 1 年キャッシュできます
- **無料枠の消費**: 1 枚アップロードするごとに、一覧の取得 1 回と書き込み 1 回（Class A 操作。無料枠は月 100 万回）、存在確認 1 回（Class B 操作。無料枠は月 1,000 万回）を使います。個人ブログの使い方なら無料枠を超えることはまずありません
- **鍵はブラウザに渡さない**: R2 の鍵は開発サーバー（Node.js）の中だけで使います。ブラウザは開発サーバーに画像を送るだけです
- アップロードできるのは PNG / JPEG / WebP / HEIC / HEIF の 30MB までです

## しくみ

```
ブラウザ（/_admin）
   │  入力中の Markdown を送る
   ▼
Nuxt の開発サーバー（localhost:3000）
   ├─ /api/_admin/preview … Nuxt Content と同じ変換（本番ビルドと同じ処理）で記事データにして返す
   ├─ /api/_admin/article … 記事リポジトリの articles/*.md の読み込み・保存・新規作成
   ├─ /api/_admin/articles … 記事一覧
   └─ /api/_admin/images … 画像を hisa-compress で変換して R2 にアップロード
          │
          ├─▶ hisa-compress（localhost:8000、Docker）
          └─▶ Cloudflare R2（S3 互換 API）
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
