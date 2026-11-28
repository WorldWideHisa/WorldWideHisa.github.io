import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createError, defineEventHandler, readBody } from "h3";
import {
  assertLocalRequest,
  getAdminConfig,
  resolveArticlePath,
} from "./_shared";

const FALLBACK_TEMPLATE = `---
title: "記事タイトル"
date: "YYYY-MM-DD"
description: "説明文"
thumbnail: ""
tags: []
---

ここに本文を書きます。
`;

// 使える文字は英数字・ハイフン・アンダースコア・スラッシュ（サブフォルダ）だけにする
const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*(\/[a-z0-9][a-z0-9_-]*)*$/;

/**
 * テンプレートから新しい記事ファイルを作る。
 * テンプレートは content/articles/template/template.md を使い、日付は今日に置き換える。
 *
 * 注意: 今のビルド設定では `draft: true` の記事があると nuxt generate が失敗するため、
 * ここでは draft を付けない。下書き対応はビルド側の対応とセットで別途入れる。
 */
export default defineEventHandler(async (event) => {
  assertLocalRequest(event);
  const body = await readBody<{ slug?: unknown }>(event);
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  if (!SLUG_PATTERN.test(slug)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "slug は半角英小文字・数字・ハイフン・アンダースコア（サブフォルダは /）で入力してください",
    });
  }
  const { absolute, relative } = resolveArticlePath(`${slug}.md`);
  if (relative.startsWith("template/")) {
    throw createError({
      statusCode: 400,
      statusMessage: "template フォルダには作成できません",
    });
  }

  const { articlesDir } = getAdminConfig();
  let template = FALLBACK_TEMPLATE;
  try {
    template = await readFile(
      join(articlesDir, "template", "template.md"),
      "utf8",
    );
  } catch {
    // テンプレートが無い環境では組み込みのものを使う
  }

  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Tokyo",
  }); // YYYY-MM-DD
  const content = template.replace(/^date:.*$/m, `date: "${today}"`);

  await mkdir(dirname(absolute), { recursive: true });
  try {
    // flag "wx": 同名ファイルがあるときは失敗させて、既存記事を上書きしない
    await writeFile(absolute, content, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw createError({
        statusCode: 409,
        statusMessage: "同じ名前の記事がすでにあります",
      });
    }
    throw error;
  }
  return { file: relative };
});
