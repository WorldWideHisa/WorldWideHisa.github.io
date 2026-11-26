import { isAbsolute, relative, resolve, sep } from "node:path";
import { type H3Event, createError, getRequestHeader } from "h3";
import { useRuntimeConfig } from "#imports";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * 管理画面 API の入口で必ず呼ぶ安全チェック。
 *
 * - Host ヘッダーが localhost 以外なら拒否（DNS リバインディング対策）
 * - 書き込み系（GET 以外）は独自ヘッダー `x-local-admin: 1` を必須にする。
 *   ブラウザは他サイトから独自ヘッダー付きのリクエストを勝手に送れないので、
 *   悪意のあるサイトが localhost:3000 に記事の上書きを送りつける攻撃（CSRF）を防げる。
 */
export function assertLocalRequest(event: H3Event) {
  const host = getRequestHeader(event, "host") ?? "";
  const hostname = host.startsWith("[")
    ? host.slice(0, host.indexOf("]") + 1)
    : host.split(":")[0];
  if (!LOCAL_HOSTNAMES.has(hostname)) {
    throw createError({
      statusCode: 403,
      statusMessage: "local admin is only available on localhost",
    });
  }
  if (
    event.method !== "GET" &&
    getRequestHeader(event, "x-local-admin") !== "1"
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: "missing x-local-admin header",
    });
  }
}

export function getAdminConfig() {
  const config = useRuntimeConfig().localAdmin;
  if (!config) {
    throw createError({
      statusCode: 500,
      statusMessage: "local admin is not configured",
    });
  }
  return config;
}

/**
 * 記事ディレクトリ相対のパス（例: "2025/hello.md"）を絶対パスに変換する。
 * 記事ディレクトリの外を指すパスや .md 以外は拒否する（パストラバーサル対策）。
 */
export function resolveArticlePath(file: unknown) {
  if (typeof file !== "string" || file.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "file is required" });
  }
  const { articlesDir } = getAdminConfig();
  const root = resolve(articlesDir);
  const absolute = resolve(root, file);
  const rel = relative(root, absolute);
  const segments = rel.split(sep);
  if (
    rel === "" ||
    isAbsolute(rel) ||
    segments.some((s) => s === ".." || s.startsWith(".")) ||
    !absolute.endsWith(".md")
  ) {
    throw createError({ statusCode: 400, statusMessage: "invalid file path" });
  }
  return { absolute, relative: segments.join("/") };
}
