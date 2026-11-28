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
| 管理画面から画像を R2 に投稿できるようにする | [#18](https://github.com/WorldWideHisa/WorldWideHisa.github.io/issues/18) | 変換は hisa-compress を通す。位置情報は必ず消す |

## 次やる

| やること | Issue | メモ |
| --- | --- | --- |
| 下書き（`draft: true`）に対応する | [#19](https://github.com/WorldWideHisa/WorldWideHisa.github.io/issues/19) | 今は下書きがあるとビルドが失敗する |
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
- **大きな作業を始めるとき**: すぐに手を動かさず、先にこのファイルと Issue の更新案（何を・どの順で・どう PR を分けるか）を作って提示し、OK をもらってから着手する

最終見直し: 2026-11-28
