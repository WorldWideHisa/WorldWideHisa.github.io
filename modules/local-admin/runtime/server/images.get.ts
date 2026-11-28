import { defineEventHandler, getQuery } from "h3";
import {
  getImageUploadConfig,
  imagePrefixForArticle,
  publicUrlForKey,
} from "./_images";
import { listObjects } from "./_s3";
import { assertLocalRequest, resolveArticlePath } from "./_shared";

const IMAGE_KEY = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

/**
 * 記事のフォルダ（articles/<記事>/）にある画像の一覧を返す。
 * R2 の一覧取得（Class A 操作）を 1,000 件ごとに 1 回使うので、
 * 画面を開いたときに毎回ではなく、「この記事の画像」を開いたときだけ呼ぶ。
 */
export default defineEventHandler(async (event) => {
  assertLocalRequest(event);
  const config = getImageUploadConfig();
  const { relative: articleFile } = resolveArticlePath(getQuery(event).file);

  const prefix = imagePrefixForArticle(articleFile);
  const objects = await listObjects(config.s3, prefix);
  return {
    prefix,
    images: objects
      // 記事フォルダの直下にある画像だけ（さらに下のフォルダは別の記事のもの）
      .filter(
        (obj) =>
          IMAGE_KEY.test(obj.key) &&
          !obj.key.slice(prefix.length).includes("/"),
      )
      .sort((a, b) => a.key.localeCompare(b.key, "en", { numeric: true }))
      .map((obj) => ({
        key: obj.key,
        name: obj.key.slice(prefix.length),
        url: publicUrlForKey(config.publicBaseUrl, obj.key),
        size: obj.size,
        lastModified: obj.lastModified,
      })),
  };
});
