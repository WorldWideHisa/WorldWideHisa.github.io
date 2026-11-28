import { resolve as resolvePath, sep } from "node:path";
import {
  addServerHandler,
  addVitePlugin,
  createResolver,
  defineNuxtModule,
  extendPages,
} from "@nuxt/kit";

/**
 * ローカル管理画面（記事一覧・エディタ・ライブプレビュー）
 *
 * `nuxt dev`（npm run dev）のときだけ有効になる。
 * `nuxt generate` / `nuxt build` では何も登録しないので、
 * 公開サイト（GitHub Pages）には管理画面のページも API も一切含まれない。
 *
 * modules/ 直下に置いたモジュールは Nuxt が自動で読み込むため、
 * nuxt.config.ts への追記は不要。
 */
export default defineNuxtModule({
  meta: {
    name: "local-admin",
  },
  setup(_options, nuxt) {
    // 本番ビルド（generate / build / prepare）では何もしない
    if (!nuxt.options.dev) {
      return;
    }

    const { resolve } = createResolver(import.meta.url);

    // 記事 Markdown の置き場所。nuxt.config.ts の content.sources.content.base に合わせる
    // biome-ignore lint/suspicious/noExplicitAny: Nuxt Content v2 の設定型は module 側で拡張されるため any で受ける
    const contentOptions = (nuxt.options as any).content;
    const articlesDir: string =
      contentOptions?.sources?.content?.base ??
      resolvePath(nuxt.options.rootDir, "content", "articles");

    // サーバー側だけで使う設定（ブラウザには渡らない）
    nuxt.options.runtimeConfig.localAdmin = {
      articlesDir,
      articlesPrefix: contentOptions?.sources?.content?.prefix ?? "/articles",
    };

    // 管理画面のページ（/_admin, /_admin/edit）
    extendPages((pages) => {
      pages.push(
        {
          name: "local-admin",
          path: "/_admin",
          file: resolve("./runtime/pages/index.vue"),
        },
        {
          name: "local-admin-edit",
          path: "/_admin/edit",
          file: resolve("./runtime/pages/edit.vue"),
        },
      );
    });

    // 管理画面用の API（dev サーバーの中だけで動く）
    const handlers = [
      ["/api/_admin/articles", "get", "articles.get.ts"],
      ["/api/_admin/article", "get", "article.get.ts"],
      ["/api/_admin/article", "put", "article.put.ts"],
      ["/api/_admin/article", "post", "article.post.ts"],
      ["/api/_admin/preview", "post", "preview.post.ts"],
      ["/api/_admin/images", "get", "images.get.ts"],
      ["/api/_admin/images", "post", "images.post.ts"],
      ["/api/_admin/images/status", "get", "images-status.get.ts"],
    ] as const;
    for (const [route, method, file] of handlers) {
      addServerHandler({
        route,
        method,
        handler: resolve("./runtime/server", file),
      });
    }

    // 記事の .md を保存したときに Vite がページ全体をリロードしないようにする。
    // tailwind.config.js が content/**/*.md を監視しているため、何もしないと
    // 保存のたびにエディタ画面ごと再読み込みされ、カーソル位置や保存直後の入力が失われる。
    // CSS の更新だけは残し、記事データの更新は Nuxt Content 自身の仕組み（WebSocket）に任せる。
    const articlesRoot = `${resolvePath(articlesDir)}${sep}`;
    addVitePlugin({
      name: "local-admin:no-full-reload-on-article-save",
      handleHotUpdate({ file, modules }) {
        if (
          !resolvePath(file).startsWith(articlesRoot) ||
          !file.endsWith(".md")
        ) {
          return;
        }
        return modules
          .flatMap((mod) => [...mod.importers])
          .filter((mod) => mod.file?.endsWith(".css"));
      },
    });

    // 管理画面の .vue でも Tailwind のクラスを使えるように、走査対象に追加する（dev のときだけ）
    // biome-ignore lint/suspicious/noExplicitAny: @nuxtjs/tailwindcss のフック型を読み込まずに使うため
    (nuxt.hook as any)("tailwindcss:config", (config: any) => {
      const glob = resolve("./runtime/**/*.vue");
      if (Array.isArray(config.content)) {
        config.content.push(glob);
      } else if (config.content && Array.isArray(config.content.files)) {
        config.content.files.push(glob);
      } else {
        config.content = [glob];
      }
    });
  },
});

declare module "@nuxt/schema" {
  interface RuntimeConfig {
    localAdmin?: {
      articlesDir: string;
      articlesPrefix: string;
    };
  }
}
