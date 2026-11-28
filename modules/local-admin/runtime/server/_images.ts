import { createError } from "h3";
import type { S3Config } from "./_s3";

/**
 * 画像アップロードの設定を .env（process.env）から読む。
 * 鍵はサーバー側だけで使い、ブラウザには返さない。
 */
export interface ImageUploadConfig {
  s3: S3Config;
  publicBaseUrl: string;
}

const REQUIRED = [
  "R2_BUCKET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_URL",
] as const;

/** 足りない設定の名前を返す（画面に「何を .env に書けばよいか」を出すため） */
export function missingImageConfig() {
  const missing: string[] = REQUIRED.filter((name) => !process.env[name]);
  if (!process.env.R2_ACCOUNT_ID && !process.env.R2_ENDPOINT) {
    missing.unshift("R2_ACCOUNT_ID");
  }
  return missing;
}

export function getImageUploadConfig(): ImageUploadConfig {
  const missing = missingImageConfig();
  if (missing.length > 0) {
    throw createError({
      statusCode: 503,
      statusMessage: `.env に ${missing.join(", ")} を設定してください`,
    });
  }
  const env = process.env;
  return {
    s3: {
      // R2_ENDPOINT は R2 以外の S3 互換ストレージで試すとき用
      endpoint:
        env.R2_ENDPOINT ||
        `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: env.R2_REGION || "auto",
      bucket: env.R2_BUCKET as string,
      accessKeyId: env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY as string,
    },
    publicBaseUrl: (env.R2_PUBLIC_URL as string).replace(/\/+$/, ""),
  };
}

export function getConverterUrl() {
  return (process.env.HISA_COMPRESS_URL || "http://localhost:8000").replace(
    /\/+$/,
    "",
  );
}

/** 記事ファイル（例: 2025/nuxt-tips.md）から、画像を置くフォルダ（例: articles/2025/nuxt-tips/）を決める */
export function imagePrefixForArticle(articleFile: string) {
  return `articles/${articleFile.replace(/\.md$/, "")}/`;
}

/** R2 のキーから公開 URL を作る（日本語や空白はエンコードする） */
export function publicUrlForKey(publicBaseUrl: string, key: string) {
  return `${publicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
