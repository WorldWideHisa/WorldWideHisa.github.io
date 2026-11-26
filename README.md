# WorldWideHisa Blog
[![Deploy Nuxt site to Pages](https://github.com/WorldWideHisa/WorldWideHisa.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/WorldWideHisa/WorldWideHisa.github.io/actions/workflows/deploy.yml)

![Nuxt](https://img.shields.io/badge/Nuxt-3.11-00DC82?style=flat-square&logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3.4-4FC08D?style=flat-square&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css)

 [worldwidehisa.net](https://worldwidehisa.net/)  
WorldWideにHisaを馳せる個人ブログ



## セットアップ
Node.js 24 を準備してください
```bash
$ node -v
v24.5.0
```
依存関係のインストール
```bash
npm install
```
記事を書いてローカルで確認
```bash
npm run generate && npx http-server .output/public
```
`npm run generate` は Nuxt の静的書き出しのあと、続けて Pagefind で検索インデックスを作ります。
`npm run dev` では検索インデックスがないため、検索ページ（`/search`）は動きません。

## 設計

### コンテンツ分離
- **メインリポジトリ**: ブログシステム本体
- **プライベートリポジトリ**: 記事コンテンツ管理
- **自動連携**: 記事更新 → 自動ビルド → デプロイ

といった形でコンテンツは別のprivateで管理しています。

### 全体設計
- Nuxt3, Nuxt Content による静的サイト生成（SSG）
- Markdown + frontmatter
- GHAによるCI/CD自動化, GitHubPagesへデプロイ
- [Pagefind](https://pagefind.app/) による全文検索

### 全文検索（Pagefind）
- ビルド後の HTML を Pagefind が読み、検索インデックスを `.output/public/pagefind/` に出力します（設定は `pagefind.yml`）
- 索引の対象は記事ページの `data-pagefind-body` を付けた範囲（タイトル・説明・タグ・本文）だけです
- 検索はブラウザ内で完結し、サーバーは不要です（`pages/search.vue` と `composables/usePagefind.ts`）

## フォントについて

このプロジェクトでは「Zen Maru Gothic（ZEN丸ゴシック）」フォントを使用しています。
このフォントは[SIL Open Font License (OFL) 1.1](https://scripts.sil.org/OFL)の下で提供されています。

- デザイン: Yoshimichi Ohira
- 提供: 株式会社ゼンフォント / Google Fonts
