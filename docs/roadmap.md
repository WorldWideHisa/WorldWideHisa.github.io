# ロードマップ

このブログの「どこに向かうか」と「何から手をつけるか」をまとめたファイルです。

- **方針**（何を・なぜ・どの順で）はこのファイルに書きます
- **具体的な作業**は一つずつ GitHub Issue にして、ここからリンクします
- 作業の細かい進み具合は Issue と PR で追い、このファイルには書きません

## 目的

**速く読めて、過去記事も探しやすいブログにする**

## 今やる

| やること | Issue | メモ |
| --- | --- | --- |
| ロードマップの置き場所を作る | [#6](https://github.com/WorldWideHisa/WorldWideHisa.github.io/issues/6) | このファイルと `CLAUDE.md` |
| Pagefind で全文検索を入れる | [#7](https://github.com/WorldWideHisa/WorldWideHisa.github.io/issues/7) | GitHub Pages のままで使える |
| ローカルで記事をプレビューできる画面を作る | [#8](https://github.com/WorldWideHisa/WorldWideHisa.github.io/issues/8) | まず構成を検討してから実装 |

## 次やる

| やること | Issue | メモ |
| --- | --- | --- |
| 記事ページを見直す（目次・関連記事・OGP 画像など） | [#9](https://github.com/WorldWideHisa/WorldWideHisa.github.io/issues/9) | 欲しいものを選んで個別 Issue に分ける |
| 表示速度を測って改善する（Lighthouse） | [#10](https://github.com/WorldWideHisa/WorldWideHisa.github.io/issues/10) | まず現状を数字で測る |

## いつか

| やること | Issue | 着手のきっかけ |
| --- | --- | --- |
| Cloudflare への移行を検討する | [#11](https://github.com/WorldWideHisa/WorldWideHisa.github.io/issues/11) | 転送設定や PR プレビューが欲しくなったら |
| 問い合わせフォームなどサーバー側の機能を入れる | [#12](https://github.com/WorldWideHisa/WorldWideHisa.github.io/issues/12) | Cloudflare 移行と合わせて検討 |

## 運用ルール

- **項目を足すとき**: 先に Issue を作り、上の表のどれかの段に1行追加する
- **終わったとき**: Issue を close し、表からその行を消す（履歴は Issue に残る）
- **見直し**: 月に1回このファイルを見直し、「次やる」→「今やる」の入れ替えや、不要になった項目の整理をする
- 「今やる」は同時に3つ程度までにする

最終見直し: 2026-11-26
