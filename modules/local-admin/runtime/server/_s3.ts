import { createHash, createHmac } from "node:crypto";

/**
 * Cloudflare R2 を S3 互換 API で読み書きするための最小限のクライアント。
 *
 * AWS SDK を入れるとブログの依存が大きく増えるので、必要な 3 つの操作
 * （アップロード・存在確認・一覧）だけを、S3 の署名方式（Signature Version 4）で自前実装している。
 * 鍵はサーバー側（npm run dev のサーバー）だけで使い、ブラウザには渡さない。
 */
export interface S3Config {
  /** 例: https://<アカウントID>.r2.cloudflarestorage.com */
  endpoint: string;
  /** R2 は "auto" */
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: string;
}

const sha256Hex = (data: string | Uint8Array) =>
  createHash("sha256").update(data).digest("hex");
const hmac = (key: string | Buffer, data: string) =>
  createHmac("sha256", key).update(data).digest();

/** RFC 3986 のルールで URI エンコードする（S3 の署名で求められる形） */
function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

async function signedFetch(
  config: S3Config,
  method: "GET" | "PUT" | "HEAD",
  key: string,
  options: {
    query?: Record<string, string>;
    body?: Uint8Array;
    headers?: Record<string, string>;
  } = {},
) {
  const endpoint = new URL(config.endpoint);
  // パス形式（https://endpoint/bucket/key）でアクセスする
  const path = `/${[config.bucket, ...key.split("/").filter((s) => s !== "")]
    .map(encodeRfc3986)
    .join("/")}`;
  const query = Object.entries(options.query ?? {})
    .map(([k, v]) => [encodeRfc3986(k), encodeRfc3986(v)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // 20261128T084500Z
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(options.body ?? "");

  const headers: Record<string, string> = {
    host: endpoint.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...Object.fromEntries(
      Object.entries(options.headers ?? {}).map(([k, v]) => [
        k.toLowerCase(),
        v,
      ]),
    ),
  };
  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames
    .map((name) => `${name}:${headers[name].trim()}\n`)
    .join("");
  const signedHeaders = signedHeaderNames.join(";");

  const canonicalRequest = [
    method,
    path,
    query,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = hmac(
    hmac(
      hmac(hmac(`AWS4${config.secretAccessKey}`, dateStamp), config.region),
      "s3",
    ),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  const { host: _host, ...sendHeaders } = headers;
  return fetch(`${endpoint.origin}${path}${query ? `?${query}` : ""}`, {
    method,
    headers: {
      ...sendHeaders,
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: options.body,
  });
}

async function assertOk(res: Response, action: string) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const code = text.match(/<Code>([^<]+)<\/Code>/)?.[1];
    throw new Error(
      `R2 への${action}に失敗しました（HTTP ${res.status}${code ? ` ${code}` : ""}）`,
    );
  }
}

/** オブジェクトがすでにあるか（Class B 操作を 1 回使う） */
export async function objectExists(config: S3Config, key: string) {
  const res = await signedFetch(config, "HEAD", key);
  if (res.status === 404) return false;
  await assertOk(res, "存在確認");
  return true;
}

/** アップロード（Class A 操作を 1 回使う） */
export async function putObject(
  config: S3Config,
  key: string,
  body: Uint8Array,
  contentType: string,
  cacheControl: string,
) {
  const res = await signedFetch(config, "PUT", key, {
    body,
    headers: { "content-type": contentType, "cache-control": cacheControl },
  });
  await assertOk(res, "アップロード");
}

/** prefix で始まるオブジェクトの一覧（1,000 件ごとに Class A 操作を 1 回使う） */
export async function listObjects(config: S3Config, prefix: string) {
  const objects: S3Object[] = [];
  let token: string | undefined;
  do {
    const res = await signedFetch(config, "GET", "", {
      query: {
        "list-type": "2",
        prefix,
        ...(token ? { "continuation-token": token } : {}),
      },
    });
    await assertOk(res, "一覧の取得");
    const xml = await res.text();
    for (const [, block] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const pick = (tag: string) =>
        block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? "";
      objects.push({
        key: decodeXml(pick("Key")),
        size: Number(pick("Size")),
        lastModified: pick("LastModified"),
      });
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml)
      ? decodeXml(
          xml.match(
            /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/,
          )?.[1] ?? "",
        ) || undefined
      : undefined;
  } while (token);
  return objects;
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
