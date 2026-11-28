# CLAUDE.md

このリポジトリで作業する Claude 向けの決まりごとです。作業を始める前に必ず読んでください。

## プロジェクトの概要

- 個人ブログ [worldwidehisa.net](https://worldwidehisa.net/) のソースコード
- Nuxt 3 + Nuxt Content による静的サイト生成（SSG）。GitHub Actions でビルドし、GitHub Pages に公開している（`.github/workflows/deploy.yml`）
- **記事本文はこのリポジトリには無い**。非公開リポジトリ `WorldWideHisa/wwh-blog-content` にあり、CI で `content/` に取り込んでいる。手元の `content/articles/` にはテンプレートしかない
- ロードマップは [`docs/roadmap.md`](docs/roadmap.md)。具体的な作業は GitHub Issue で管理している

## よく使うコマンド

```bash
npm ci                                   # 依存関係のインストール（Node.js 24）
npm run lint                             # Biome で lint
npm run format                           # Biome でフォーマットの確認
npm run generate                         # 静的サイトを .output/public に生成
npx http-server .output/public           # 生成したサイトをローカルで表示
```

## やりとりのルール

- 説明は日本語で、仕組みは噛み砕いて説明する

## PR のルール（必ず守る）

**PR は変更を入れるだけで出さない。** できる範囲で動作確認を行い、確度の高い状態で出す。

1. 変更に応じて、次の確認を行う
   - `npm run lint` で、変更によって新しいエラーが増えていないこと（2026-11 時点で main に既存のエラーが 8 件あるので、変更前後の件数を比べる）
   - `npm run generate` が成功すること
   - 画面に関わる変更は、生成したサイトを `npx http-server .output/public` などで表示し、ブラウザ（Playwright など）で実際の見た目と動きを確認する。スクリーンショットを撮れるなら撮る
   - 記事の表示に関わる変更は、手元に記事が無いので、確認用のサンプル記事を一時的に `content/articles/` に置いて確認する（サンプル記事はコミットしない）
   - ドキュメントだけの変更でも、リンク切れや Markdown の崩れが無いかを確認する
2. PR 本文に次の2つを必ず書く（`.github/pull_request_template.md` の形式に沿う）
   - **確認したこと**: 実際に行った確認と、その結果
   - **確認できなかったこと**: 環境の都合などで確認できなかったことと、その理由。マージ前に人が見るべき点
3. 確認で問題が見つかったら、直してから PR を出す。直せないものは「確認できなかったこと」に正直に書く
