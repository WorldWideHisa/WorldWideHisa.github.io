import { readFile } from "node:fs/promises";
import { createError, defineEventHandler, getQuery } from "h3";
import { assertLocalRequest, resolveArticlePath } from "./_shared";

/** 記事の Markdown（frontmatter 込みの生テキスト）を返す */
export default defineEventHandler(async (event) => {
  assertLocalRequest(event);
  const { absolute, relative } = resolveArticlePath(getQuery(event).file);
  try {
    const content = await readFile(absolute, "utf8");
    return { file: relative, content };
  } catch {
    throw createError({ statusCode: 404, statusMessage: "article not found" });
  }
});
