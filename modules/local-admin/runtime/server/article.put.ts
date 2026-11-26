import { access, writeFile } from "node:fs/promises";
import { createError, defineEventHandler, readBody } from "h3";
import { assertLocalRequest, resolveArticlePath } from "./_shared";

/** 既存の記事を上書き保存する（新規作成は POST） */
export default defineEventHandler(async (event) => {
  assertLocalRequest(event);
  const body = await readBody<{ file?: unknown; content?: unknown }>(event);
  const { absolute, relative } = resolveArticlePath(body?.file);
  if (typeof body?.content !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "content is required",
    });
  }
  try {
    await access(absolute);
  } catch {
    throw createError({ statusCode: 404, statusMessage: "article not found" });
  }
  await writeFile(absolute, body.content, "utf8");
  return { file: relative, savedAt: new Date().toISOString() };
});
