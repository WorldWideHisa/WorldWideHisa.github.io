import { resolve } from "path";
import { globSync } from "glob";

export default defineEventHandler(async (event) => {
  const contentPath = resolve("content/**/*.md");
  const files = globSync(contentPath);

  const routes = files
    .filter((file) => !file.includes("template")) // templateフォルダを除外
    .map((file) => {
      // パスを整形
      const pattern = /.*\/content/;
      const route = file.replace(pattern, "").replace(".md", "");
      return {
        loc: `/articles${route}`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.8,
      };
    });

  return routes;
});
