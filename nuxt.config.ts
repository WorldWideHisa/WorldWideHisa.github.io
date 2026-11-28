import { resolve } from "path";
import { globSync } from "glob";

// 記事リポジトリ（wwh-blog-content）の場所。
// CI ではこのリポジトリの ./content にチェックアウトされる。
// ローカルで別の場所に clone している場合は .env の BLOG_CONTENT_DIR で指定する（例: ../wwh-blog-content）
const contentDir = resolve(
  __dirname,
  process.env.BLOG_CONTENT_DIR || "content",
);

const getContentRoutes = (): string[] => {
  // contentDir からの相対パスをそのままルートにする（例: articles/foo.md → /articles/foo）
  const routeNames = globSync("**/*.md", { cwd: contentDir }).map((f) => {
    return `/${f.split("\\").join("/").replace(/\.md$/, "")}`;
  });

  return [...routeNames];
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: getContentRoutes(),
    },
    logLevel: "debug",
  },

  devtools: { enabled: true },

  app: {
    baseURL: "/",
    cdnURL:
      process.env.NODE_ENV === "test" ? "/" : "https://worldwidehisa.net/",
    head: {
      htmlAttrs: {
        lang: "ja",
      },
      link: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/icons/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "48x48",
          href: "/icons/favicon-48x48.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "64x64",
          href: "/icons/favicon-64x64.png",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/icons/apple-touch-icon.png",
        },
        { rel: "manifest", href: "/icons/site.webmanifest" },
      ],
      meta: [
        { name: "theme-color", content: "#ffffff" },
        { property: "og:site_name", content: "World Wide Hisa" },
        {
          property: "og:image",
          content: "https://worldwidehisa.net/images/ogp-default.png",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:image",
          content: "https://worldwidehisa.net/images/ogp-default.png",
        },
      ],
    },
  },

  modules: ["@nuxt/content", "@nuxtjs/tailwindcss", "@nuxtjs/sitemap", "@zadigetvoltaire/nuxt-gtm"],

  gtm: {
    id: "GTM-PLRSZJ6B",
    defer: false,
    compatibility: false,
    enabled: true,
    debug: process.env.NODE_ENV === "development",
    loadScript: true,
    enableRouterSync: true,
    trackOnNextTick: false,
  },

  typescript: {
    shim: false, // VScodeの拡張機能を使うためにfalse
    strict: true, // 型チェックの厳格化
    typeCheck: false, // 開発、build時の型チェックを有効に。vue-tscとtypescriptのインストールが必要
  },

  tailwindcss: {
    cssPath: ["~/assets/css/tailwind.css", { injectPosition: "first" }],
    configPath: "tailwind.config",
  },

  content: {
    sources: {
      content: {
        driver: "fs",
        prefix: "/articles",
        base: resolve(contentDir, "articles"),
        exclude: ["README.md", "template/**"],
      },
    },
  },

  compatibilityDate: "2025-04-27",

  // Sitemap設定
  site: {
    url: "https://worldwidehisa.net",
  },
});
