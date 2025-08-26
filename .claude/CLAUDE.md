Nuxt3 SSGブログ開発ガイド
プロジェクト概要
このプロジェクトは、Nuxt3の静的サイト生成（SSG）機能を使用したブログです。TypeScriptとTailwindCSSを採用し、GitHub ActionsでGitHub Pagesにデプロイされます。

技術スタック

フレームワーク: Nuxt3 (SSGモード)
言語: TypeScript
スタイリング: TailwindCSS
デプロイ: GitHub Actions → GitHub Pages
パッケージマネージャー: npm

プロジェクト構造
├── components/         # Vue コンポーネント
├── content/            # ブログコンテンツ（Markdown）
├── layouts/            # レイアウトコンポーネント
├── pages/              # ページコンポーネント
├── public/             # 静的ファイル
├── .github/workflows/  # GitHub Actionsワークフロー
└── nuxt.config.ts      # Nuxt設定ファイル

開発ルール

コーディング規約
ファイル名: kebab-case (blog-post.vue)
コンポーネント名: PascalCase (BlogPost)
変数名: camelCase (blogTitle)
インデント: 2スペース
引用符: シングルクォート
セミコロン: 必須

コンポーネント設計

components/ ディレクトリは機能別に整理
Composition APIを使用
<script setup> 構文を採用
プロップスには適切な型定義を付与

スタイリング

TailwindCSSのユーティリティクラスを優先使用
カスタムCSSが必要な場合は assets/css/ に配置
レスポンシブデザインを考慮（sm:, md:, lg: プレフィックス使用）

コンポーネントの作成

components/ ディレクトリに適切なサブディレクトリを作成
PascalCaseでファイル名を設定
TypeScriptの型定義を適切に行う

デプロイメント
ローカル開発
bashnpm run dev      # 開発サーバー起動
npm run build        # 本番ビルド
npm run generate     # 静的サイト生成
npm run preview      # 生成されたサイトのプレビュー

デプロイメントフロー
main ブランチへのpush/merge
GitHub Actionsが自動実行
npm run generate でサイト生成
GitHub Pagesへデプロイ

トラブルシューティング
よくある問題
ビルドエラー

TypeScriptの型エラーを確認
存在しないファイルへのインポートをチェック
Nuxtの設定項目を見直し

スタイルが適用されない

TailwindCSSの設定を確認
PurgeCSS（TailwindCSS JIT）の対象ファイルをチェック
カスタムCSSの読み込み順序を確認

デプロイ

デプロイはオーナーが手動で行うため気にしなくて良い

コンテンツ管理
このプロジェクトでは、記事コンテンツを別のprivateリポジトリ「hisaro/wwh-blog-content」で管理しています。
GitHub Actionsでのデプロイ時に自動的にprivateリポジトリからコンテンツを取得します。

ローカル開発
ローカル開発時は content/articles/template/ 配下のテンプレートファイルを使用してください。

動作確認方法
rm -rf .nuxt dist .output && \
npm run generate && npx http-server .output/public
権限の足りないコマンドは適宜確認して

デプロイメント設定
GitHub Actionsでの自動デプロイには以下の設定が必要です：

Repository Secretsに以下を追加
PRIVATE_REPO_TOKEN: privateリポジトリにアクセス可能なPersonal Access Token

Personal Access Tokenの作成方法
1. GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token (classic)
3. 権限: 「repo」（Full control of private repositories）を選択
4. トークンをコピーしてRepository Secretsに設定

参考リンク

Nuxt3公式ドキュメント https://nuxt.com/
TailwindCSS公式ドキュメント https://tailwindcss.com/
GitHub Actions公式ドキュメント https://docs.github.com/actions
GitHub Pages公式ドキュメント https://pages.github.com/
