import {
  createError,
  defineEventHandler,
  getRequestHeader,
  readMultipartFormData,
} from "h3";
import {
  getConverterUrl,
  getImageUploadConfig,
  imagePrefixForArticle,
  publicUrlForKey,
} from "./_images";
import { type S3Config, listObjects, objectExists, putObject } from "./_s3";
import { assertLocalRequest, resolveArticlePath } from "./_shared";

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024; // iPhone の写真でも十分な上限
const ACCEPTED = /\.(png|jpe?g|webp|heic|heif)$/i;
// ファイル名は毎回新しいので、ブラウザや Cloudflare に 1 年間キャッシュしてもらう
const CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * 連番の決定〜アップロードを 1 枚ずつ順番に行うための鎖。
 * 複数枚を同時にドロップすると、何もしなければ同じ番号を取り合って
 * 後から保存した画像で上書きしてしまうため、この部分だけは並べて実行しない。
 * （変換は時間がかかるので、そちらは同時に進めてよい）
 */
let saveQueue: Promise<unknown> = Promise.resolve();
function runInOrder<T>(task: () => Promise<T>): Promise<T> {
  const result = saveQueue.then(task);
  saveQueue = result.catch(() => {});
  return result;
}

/**
 * 画像を受け取り、hisa-compress で変換してから R2 にアップロードする。
 *   1. hisa-compress の /api/convert で、向き補正・位置情報の削除・幅 1600px の WebP 化
 *   2. 記事ごとのフォルダ（articles/<記事>/）で次の連番を決める
 *   3. 同じ名前が無いことを確かめてからアップロード（上書きしない）
 */
export default defineEventHandler(async (event) => {
  assertLocalRequest(event);
  const config = getImageUploadConfig();

  const length = Number(getRequestHeader(event, "content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: "画像が大きすぎます（30MB まで）",
    });
  }

  const parts = (await readMultipartFormData(event)) ?? [];
  const image = parts.find((p) => p.name === "image" && p.filename);
  const articleField = parts.find((p) => p.name === "file");
  if (!image?.filename || !ACCEPTED.test(image.filename)) {
    throw createError({
      statusCode: 400,
      statusMessage: "PNG / JPEG / WebP / HEIC の画像を選んでください",
    });
  }
  const { relative: articleFile } = resolveArticlePath(
    articleField?.data.toString("utf8"),
  );

  // 1. 変換（hisa-compress）
  const converted = await convert(image.data, image.filename);

  // 2〜3 は 1 枚ずつ順番に行う（同時に同じ番号を使わないように）
  const prefix = imagePrefixForArticle(articleFile);
  const key = await runInOrder(() =>
    saveWithNextNumber(config.s3, prefix, converted),
  );

  return {
    key,
    url: publicUrlForKey(config.publicBaseUrl, key),
    width: converted.width,
    height: converted.height,
    size: converted.data.byteLength,
    originalSize: image.data.byteLength,
  };
});

async function saveWithNextNumber(
  s3: S3Config,
  prefix: string,
  converted: Awaited<ReturnType<typeof convert>>,
) {
  // 2. 連番を決める（一覧の取得は Class A 操作 1 回）
  const existing = await listObjects(s3, prefix);
  let next =
    existing.reduce((max, obj) => {
      const m = obj.key.slice(prefix.length).match(/^(\d+)\.[a-z0-9]+$/i);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0) + 1;

  // 3. 念のため存在確認をしてからアップロード（上書き防止）
  let key = "";
  for (let i = 0; i < 5; i++, next++) {
    const candidate = `${prefix}${String(next).padStart(2, "0")}.${converted.extension}`;
    if (!(await objectExists(s3, candidate))) {
      key = candidate;
      break;
    }
  }
  if (!key) {
    throw createError({
      statusCode: 409,
      statusMessage: "空いているファイル名が見つかりませんでした",
    });
  }
  await putObject(
    s3,
    key,
    converted.data,
    converted.contentType,
    CACHE_CONTROL,
  );
  return key;
}

async function convert(data: Buffer, filename: string) {
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(data)]), filename);
  form.append("format", "webp");
  form.append("maxWidth", "1600");
  form.append("quality", "80");

  let res: Response;
  try {
    res = await fetch(`${getConverterUrl()}/api/convert`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage:
        "hisa-compress に接続できません。npm run dev:admin で起動しているか確認してください",
    });
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    throw createError({
      statusCode: 502,
      statusMessage: `画像の変換に失敗しました: ${body.error ?? body.message ?? res.status}`,
    });
  }
  return {
    data: new Uint8Array(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") ?? "image/webp",
    extension: res.headers.get("x-image-extension") ?? "webp",
    width: Number(res.headers.get("x-image-width") ?? 0),
    height: Number(res.headers.get("x-image-height") ?? 0),
  };
}
