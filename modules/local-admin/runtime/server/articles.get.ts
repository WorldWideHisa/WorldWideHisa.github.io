import { defineEventHandler } from "h3";
import { serverQueryContent } from "#content/server";
import { assertLocalRequest, getAdminConfig } from "./_shared";

/**
 * 記事一覧（下書きも含む）と、記事フォルダの場所を返す。
 * dev サーバーでは Nuxt Content が draft: true の記事も返してくれる。
 */
export default defineEventHandler(async (event) => {
  assertLocalRequest(event);
  const { articlesDir, articlesPrefix } = getAdminConfig();
  const prefixDir = `${articlesPrefix.replace(/^\/|\/$/g, "")}/`;

  const docs = await serverQueryContent(event, articlesPrefix)
    .only(["_path", "_file", "_draft", "title", "date", "description", "tags"])
    .find();

  const articles = docs
    .map((doc) => ({
      path: doc._path as string,
      // Nuxt Content の _file は "articles/xxx.md" の形なので、記事ディレクトリ相対に直す
      file: String(doc._file ?? "").startsWith(prefixDir)
        ? String(doc._file).slice(prefixDir.length)
        : String(doc._file ?? ""),
      draft: Boolean(doc._draft),
      title: String(doc.title ?? ""),
      date: doc.date ? String(doc.date) : "",
      description: doc.description ? String(doc.description) : "",
      tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    }))
    // テンプレートと README は CI のビルド時に削除されるので、一覧にも出さない
    .filter(
      (a) =>
        !a.file.startsWith("template/") && !/(^|\/)README\.md$/i.test(a.file),
    )
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  // どのフォルダを読み書きしているか画面に出すため、場所も返す
  return { articlesDir, articles };
});
