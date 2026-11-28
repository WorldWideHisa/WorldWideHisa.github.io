import { createError, defineEventHandler, readBody } from "h3";
import { parseContent } from "#content/server";
import {
  assertLocalRequest,
  getAdminConfig,
  resolveArticlePath,
} from "./_shared";

/**
 * 編集中の Markdown を、本番ビルドと同じ Nuxt Content のパイプラインで変換して返す。
 * ファイルには保存しない（入力中のテキストをそのままプレビューするため）。
 */
export default defineEventHandler(async (event) => {
  assertLocalRequest(event);
  const body = await readBody<{ file?: unknown; content?: unknown }>(event);
  if (typeof body?.content !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "content is required",
    });
  }
  const { relative } = resolveArticlePath(body.file);
  const { articlesPrefix } = getAdminConfig();
  // 本番と同じ _path になるよう、Nuxt Content と同じ形式の id を組み立てる
  const id = [
    "content",
    ...articlesPrefix.split("/").filter(Boolean),
    ...relative.split("/"),
  ].join(":");
  return await parseContent(id, body.content);
});
