// npm run dev:admin
// 画像の変換に使う hisa-compress（Docker）を起動してから、Nuxt の開発サーバーを起動する。
//
// 1. HISA_COMPRESS_URL（既定 http://localhost:8000）に繋がれば、そのまま使う
// 2. 繋がらなければ、hisa-compress という名前のコンテナを docker start する
// 3. コンテナが無ければ、hisa-compress イメージから docker run -d で作る
//    （このPCからだけ使えるよう 127.0.0.1 にだけ公開する）
// どれもうまくいかなくても、記事の編集はできるので開発サーバーは起動する。
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// .env の HISA_COMPRESS_URL も見る（Nuxt より先に動くため、自前で読む）
if (existsSync(".env") && !process.env.HISA_COMPRESS_URL) {
  const line = readFileSync(".env", "utf8")
    .split("\n")
    .find((l) => l.startsWith("HISA_COMPRESS_URL="));
  if (line)
    process.env.HISA_COMPRESS_URL = line.slice(line.indexOf("=") + 1).trim();
}
const converterUrl = (
  process.env.HISA_COMPRESS_URL || "http://localhost:8000"
).replace(/\/+$/, "");
const port = new URL(converterUrl).port || "8000";
const CONTAINER = "hisa-compress";

async function isUp() {
  try {
    const res = await fetch(`${converterUrl}/`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitUp(seconds) {
  for (let i = 0; i < seconds; i++) {
    if (await isUp()) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function docker(args) {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  return {
    ok: result.status === 0,
    out: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

async function ensureConverter() {
  if (await isUp()) {
    console.log(`[dev:admin] hisa-compress は起動済みです（${converterUrl}）`);
    return;
  }
  if (!docker(["version"]).ok) {
    console.warn(
      "[dev:admin] Docker が動いていないため、hisa-compress を起動できませんでした。画像アップロード以外は使えます。",
    );
    return;
  }
  const started = docker(["start", CONTAINER]);
  if (!started.ok) {
    const run = docker([
      "run",
      "-d",
      "--name",
      CONTAINER,
      "-p",
      `127.0.0.1:${port}:8000`,
      CONTAINER,
    ]);
    if (!run.ok) {
      console.warn(
        `[dev:admin] hisa-compress のコンテナを作れませんでした: ${run.out}`,
      );
      console.warn(
        "[dev:admin] hisa-compress のリポジトリで `docker build -t hisa-compress .` を先に実行してください。",
      );
      return;
    }
  }
  console.log("[dev:admin] hisa-compress を起動しています…");
  if (await waitUp(30)) {
    console.log(
      `[dev:admin] hisa-compress が起動しました（${converterUrl}）。止めるときは docker stop ${CONTAINER}`,
    );
  } else {
    console.warn(
      "[dev:admin] hisa-compress の起動を確認できませんでした。docker logs hisa-compress で状況を見てください。",
    );
  }
}

await ensureConverter();
const nuxt = spawn("npx", ["nuxt", "dev"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
nuxt.on("exit", (code) => process.exit(code ?? 0));
