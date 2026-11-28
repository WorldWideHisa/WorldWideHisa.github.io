import { defineEventHandler } from "h3";
import { getConverterUrl, missingImageConfig } from "./_images";
import { assertLocalRequest } from "./_shared";

/** 画像アップロードの準備ができているか（R2 の設定と hisa-compress の起動）を返す */
export default defineEventHandler(async (event) => {
  assertLocalRequest(event);
  const converterUrl = getConverterUrl();
  let converterReady = false;
  try {
    const res = await fetch(`${converterUrl}/`, {
      signal: AbortSignal.timeout(1500),
    });
    converterReady = res.ok;
  } catch {
    converterReady = false;
  }
  return {
    missingConfig: missingImageConfig(),
    converterUrl,
    converterReady,
  };
});
